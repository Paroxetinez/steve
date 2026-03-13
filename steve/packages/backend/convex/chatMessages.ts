import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { requireUserBySession } from "./authUtils";
import { shouldSyncConversationToEverMem } from "./evermemSync";
import { hasCompleteChatImageMetadata } from "./chatMediaContract";
import { buildReadStatePatch, findLatestReadableMessageId } from "./chatReadState";
import {
  buildFailedImageMessagePatch,
  buildPendingImageMessageFields,
  buildReadyImageMessagePatch,
} from "./messageImageLifecycle";
import { normalizeStoredMessageSemantics } from "./messageSemantics";
import {
  buildDirectTranscript,
  DIRECT_CONTEXT_SIZE,
  DIRECT_REGENERATE_HISTORY_SIZE,
  serializeDirectPayload,
} from "./chatStevePayloads";
const DIRECT_AUTO_DEBOUNCE_MS = 10000;
const IMAGE_MESSAGE_PREVIEW = "[image]";

function createSteveTraceId() {
  return `steve-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const evermemSyncInternal = (internal as Record<string, any>).evermemSync;

export const listMessages = query({
  args: {
    sessionToken: v.string(),
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserBySession(ctx, args.sessionToken);
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId_userId", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", user._id),
      )
      .unique();
    if (!membership) {
      // Conversation may have been removed or membership changed.
      // Return empty list to avoid hard-crashing the chat page.
      return [];
    }

    const rows = await ctx.db
      .query("messages")
      .withIndex("by_conversationId_createdAt", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    const limit = args.limit && args.limit > 0 ? args.limit : 200;
    const messages = rows.slice(-limit);
    return Promise.all(
      messages.map(async (message) => {
        const semantics = normalizeStoredMessageSemantics({
          content: message.content,
          contentType: message.contentType,
          objectKey: message.imageObjectKey,
          resolvedStorageUrl: message.imageStorageId
            ? await ctx.storage.getUrl(message.imageStorageId)
            : null,
        });

        return {
          id: message._id,
          senderType: message.senderType,
          content: message.content,
          contentType: semantics.normalizedContentType,
          imageUrl: semantics.imageUrl,
          imageUploadStatus: message.imageUploadStatus,
          imageUploadError: message.imageUploadError,
          createdAt: message.createdAt,
          senderUserId: message.senderUserId,
        };
      }),
    );
  },
});

export const sendMessage = mutation({
  args: {
    sessionToken: v.string(),
    conversationId: v.id("conversations"),
    content: v.optional(v.string()),
    contentType: v.optional(v.union(v.literal("text"), v.literal("image"))),
    imageObjectKey: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    clientMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const pipelineStartAt = Date.now();
    const traceId = createSteveTraceId();
    const authStartAt = Date.now();
    const { user } = await requireUserBySession(ctx, args.sessionToken);
    const authMs = Date.now() - authStartAt;
    const membershipStartAt = Date.now();
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId_userId", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", user._id),
      )
      .unique();
    const membershipMs = Date.now() - membershipStartAt;
    if (!membership) {
      throw new Error("Forbidden");
    }

    const contentType =
      args.contentType ?? (args.imageObjectKey || args.imageStorageId ? "image" : "text");
    const rawContent = args.content?.trim() ?? "";
    const content = contentType === "image" ? rawContent || IMAGE_MESSAGE_PREVIEW : rawContent;
    if (contentType === "text" && !content) {
      throw new Error("Message content cannot be empty");
    }
    if (contentType === "image" && !args.imageObjectKey && !args.imageStorageId) {
      throw new Error("Image object key is required");
    }

    const isCallSteve = content === "__CALL_STEVE__";

    if (isCallSteve) {
      const callStartAt = Date.now();
      const conversationFetchStartAt = Date.now();
      const conversation = await ctx.db.get(args.conversationId);
      const conversationFetchMs = Date.now() - conversationFetchStartAt;
      if (conversation?.type === "direct") {
        const fetchStartAt = Date.now();
        const rows = await ctx.db
          .query("messages")
          .withIndex("by_conversationId_createdAt", (q) =>
            q.eq("conversationId", args.conversationId),
          )
          .collect();
        const fetchMs = Date.now() - fetchStartAt;

        const transcriptStartAt = Date.now();
        const directRows = rows.filter((message) => message.senderType !== "system");
        const latestAnchor = directRows[directRows.length - 1];
        const recentMessages = directRows.slice(-DIRECT_CONTEXT_SIZE).map((message) => ({
          senderType: message.senderType,
          senderUserId: message.senderUserId,
          createdAt: message.createdAt,
          content: message.content,
        }));

        const transcript = buildDirectTranscript(recentMessages);
        const payload = {
          latestMessage: "A user explicitly called Steve to step in.",
          transcript,
          forceSuggestion: true,
          traceId,
          pipelineStartAt,
          triggerType: "manual_call",
          anchorMessageId: latestAnchor?._id,
          anchorCreatedAt: latestAnchor?.createdAt,
        };

        const transcriptMs = Date.now() - transcriptStartAt;
        const scheduleStartAt = Date.now();
        await ctx.scheduler.runAfter(0, internal.chatAssistantNode.reply, {
          conversationId: args.conversationId,
          userMessage: serializeDirectPayload(payload),
        });
        const scheduleMs = Date.now() - scheduleStartAt;
        console.log("[steve_timing] direct_pipeline_enqueue", {
          traceId,
          triggerType: "manual_call",
          conversationId: String(args.conversationId),
          authMs,
          membershipMs,
          conversationFetchMs,
          fetchMs,
          transcriptMs,
          scheduleMs,
          totalMs: Date.now() - callStartAt,
          pipelineTotalMs: Date.now() - pipelineStartAt,
        });
      }
      return { id: null };
    }

    const persistStartAt = Date.now();
    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderUserId: user._id,
      senderType: "user",
      content,
      contentType,
      imageObjectKey: args.imageObjectKey,
      imageStorageId: args.imageStorageId,
      clientMessageId: args.clientMessageId,
      createdAt: now,
    });

    await ctx.db.patch(args.conversationId, {
      lastMessagePreview:
        contentType === "image" ? "Sent an image" : content.slice(0, 120),
      lastMessageAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(
      membership._id,
      buildReadStatePatch({
        lastReadAt: now,
        lastReadMessageId: messageId,
      }),
    );
    const persistMs = Date.now() - persistStartAt;

    const conversationFetchStartAt = Date.now();
    const conversation = await ctx.db.get(args.conversationId);
    const conversationFetchMs = Date.now() - conversationFetchStartAt;

    if (conversation?.type === "assistant") {
      const scheduleStartAt = Date.now();
      await ctx.scheduler.runAfter(0, internal.chatAssistantNode.reply, {
        conversationId: args.conversationId,
        userMessage: content,
      });
      console.log("[steve_timing] assistant_pipeline_enqueue", {
        traceId,
        conversationId: String(args.conversationId),
        authMs,
        membershipMs,
        persistMs,
        conversationFetchMs,
        scheduleMs: Date.now() - scheduleStartAt,
        totalMs: Date.now() - pipelineStartAt,
      });
    } else if (conversation?.type === "direct") {
      if (
        shouldSyncConversationToEverMem({
          conversationType: conversation.type,
          senderType: "user",
        })
      ) {
        await ctx.scheduler.runAfter(0, evermemSyncInternal.syncMessageToEverMem, {
          conversationId: String(args.conversationId),
          conversationName: conversation.title ?? "Direct Conversation",
          messageId: String(messageId),
          senderId: String(user._id),
          senderName: user.phone,
          senderType: "user",
          content,
          createdAt: now,
          referList: [],
        });
      }

      const fetchStartAt = Date.now();
      const rows = await ctx.db
        .query("messages")
        .withIndex("by_conversationId_createdAt", (q) =>
          q.eq("conversationId", args.conversationId),
        )
        .collect();
      const fetchMs = Date.now() - fetchStartAt;

      const transcriptStartAt = Date.now();
      const directRows = rows.filter((message) => message.senderType !== "system");
      const recentMessages = directRows.slice(-DIRECT_CONTEXT_SIZE).map((message) => ({
        senderType: message.senderType,
        senderUserId: message.senderUserId,
        createdAt: message.createdAt,
        content: message.content,
      }));

      const transcript = buildDirectTranscript(recentMessages);
      const payload = {
        latestMessage: content,
        transcript,
        traceId,
        pipelineStartAt,
        triggerType: "auto_after_user_message",
        anchorMessageId: messageId,
        anchorCreatedAt: now,
      };

      const transcriptMs = Date.now() - transcriptStartAt;
      const scheduleStartAt = Date.now();
      await ctx.scheduler.runAfter(DIRECT_AUTO_DEBOUNCE_MS, internal.chatAssistantNode.reply, {
        conversationId: args.conversationId,
        userMessage: serializeDirectPayload(payload),
      });
      const scheduleMs = Date.now() - scheduleStartAt;
      console.log("[steve_timing] direct_pipeline_enqueue", {
        traceId,
        triggerType: "auto_after_user_message",
        conversationId: String(args.conversationId),
        authMs,
        membershipMs,
        persistMs,
        conversationFetchMs,
        fetchMs,
        transcriptMs,
        scheduleMs,
        debounceMs: DIRECT_AUTO_DEBOUNCE_MS,
        totalMs: Date.now() - pipelineStartAt,
      });
    }

    return { id: messageId };
  },
});

export const getConversationImageUploadContext = query({
  args: {
    sessionToken: v.string(),
    conversationId: v.id("conversations"),
  },
  returns: v.object({
    conversationId: v.id("conversations"),
  }),
  handler: async (ctx, args) => {
    const { user } = await requireUserBySession(ctx, args.sessionToken);
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId_userId", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", user._id),
      )
      .unique();

    if (!membership) {
      throw new Error("Forbidden");
    }

    return {
      conversationId: args.conversationId,
    };
  },
});

export const createPendingImageMessage = mutation({
  args: {
    sessionToken: v.string(),
    conversationId: v.id("conversations"),
    clientMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserBySession(ctx, args.sessionToken);
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId_userId", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", user._id),
      )
      .unique();

    if (!membership) {
      throw new Error("Forbidden");
    }

    const now = Date.now();
    const messageId = await ctx.db.insert(
      "messages",
      buildPendingImageMessageFields({
        conversationId: args.conversationId,
        senderUserId: user._id,
        createdAt: now,
        clientMessageId: args.clientMessageId,
      }),
    );

    await ctx.db.patch(args.conversationId, {
      lastMessagePreview: "Sent an image",
      lastMessageAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(
      membership._id,
      buildReadStatePatch({
        lastReadAt: now,
        lastReadMessageId: messageId,
      }),
    );

    return { id: messageId };
  },
});

export const finalizePendingImageMessage = mutation({
  args: {
    sessionToken: v.string(),
    conversationId: v.id("conversations"),
    messageId: v.id("messages"),
    imageObjectKey: v.string(),
    imageMimeType: v.optional(v.string()),
    imageSizeBytes: v.optional(v.number()),
    imageWidth: v.optional(v.number()),
    imageHeight: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserBySession(ctx, args.sessionToken);
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId_userId", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", user._id),
      )
      .unique();

    if (!membership) {
      throw new Error("Forbidden");
    }

    const message = await ctx.db.get(args.messageId);
    if (
      !message ||
      message.conversationId !== args.conversationId ||
      message.senderUserId !== user._id ||
      message.senderType !== "user" ||
      message.contentType !== "image"
    ) {
      throw new Error("Image message not found");
    }

    const metadataCandidate = {
      mimeType: args.imageMimeType,
      sizeBytes: args.imageSizeBytes,
      width: args.imageWidth,
      height: args.imageHeight,
    };

    await ctx.db.patch(
      args.messageId,
      buildReadyImageMessagePatch({
        objectKey: args.imageObjectKey,
        metadata: hasCompleteChatImageMetadata(metadataCandidate)
          ? metadataCandidate
          : undefined,
      }),
    );
    return { success: true };
  },
});

export const markPendingImageMessageFailed = mutation({
  args: {
    sessionToken: v.string(),
    conversationId: v.id("conversations"),
    messageId: v.id("messages"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserBySession(ctx, args.sessionToken);
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId_userId", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", user._id),
      )
      .unique();

    if (!membership) {
      throw new Error("Forbidden");
    }

    const message = await ctx.db.get(args.messageId);
    if (
      !message ||
      message.conversationId !== args.conversationId ||
      message.senderUserId !== user._id ||
      message.senderType !== "user" ||
      message.contentType !== "image"
    ) {
      throw new Error("Image message not found");
    }

    await ctx.db.patch(args.messageId, buildFailedImageMessagePatch({ error: args.error }));
    return { success: true };
  },
});

export const markRead = mutation({
  args: {
    sessionToken: v.string(),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserBySession(ctx, args.sessionToken);
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId_userId", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", user._id),
      )
      .unique();

    if (!membership) {
      throw new Error("Forbidden");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId_createdAt", (q) => q.eq("conversationId", args.conversationId))
      .collect();
    const lastReadAt = Date.now();
    const lastReadMessageId = findLatestReadableMessageId(messages);

    await ctx.db.patch(
      membership._id,
      buildReadStatePatch({
        lastReadAt,
        lastReadMessageId,
      }),
    );

    return { success: true };
  },
});

export const regenerateSteveSuggestion = mutation({
  args: {
    sessionToken: v.string(),
    conversationId: v.id("conversations"),
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const pipelineStartAt = Date.now();
    const traceId = createSteveTraceId();
    const authStartAt = Date.now();
    const { user } = await requireUserBySession(ctx, args.sessionToken);
    const authMs = Date.now() - authStartAt;
    const membershipStartAt = Date.now();
    const membership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId_userId", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", user._id),
      )
      .unique();
    const membershipMs = Date.now() - membershipStartAt;

    if (!membership) {
      throw new Error("Forbidden");
    }

    const conversationFetchStartAt = Date.now();
    const conversation = await ctx.db.get(args.conversationId);
    const conversationFetchMs = Date.now() - conversationFetchStartAt;
    if (!conversation || conversation.type !== "direct") {
      throw new Error("Steve suggestion can only be regenerated for direct chats");
    }

    const targetMessageFetchStartAt = Date.now();
    const targetMessage = await ctx.db.get(args.messageId);
    const targetMessageFetchMs = Date.now() - targetMessageFetchStartAt;
    if (
      !targetMessage ||
      targetMessage.conversationId !== args.conversationId ||
      targetMessage.senderType !== "assistant"
    ) {
      throw new Error("Target Steve message not found");
    }

    const fetchStartAt = Date.now();
    const rows = await ctx.db
      .query("messages")
      .withIndex("by_conversationId_createdAt", (q) => q.eq("conversationId", args.conversationId))
      .collect();
    const fetchMs = Date.now() - fetchStartAt;

    if (rows.length === 0) {
      throw new Error("No messages in this conversation");
    }

    const transcriptStartAt = Date.now();
    const directRows = rows.filter((message) => message.senderType !== "system");
    const historyMessages = directRows.slice(-DIRECT_REGENERATE_HISTORY_SIZE).map((message) => ({
      id: message._id,
      senderType: message.senderType,
      senderUserId: message.senderUserId,
      createdAt: message.createdAt,
      content: message.content,
    }));

    const recentMessages = historyMessages.slice(-DIRECT_CONTEXT_SIZE);
    const latestNonAssistant =
      [...historyMessages].reverse().find((item) => item.senderType === "user") ??
      historyMessages[historyMessages.length - 1];

    const earlierMessages = historyMessages.slice(
      0,
      Math.max(0, historyMessages.length - recentMessages.length),
    );

    const transcriptParts: string[] = [];
    transcriptParts.push("Recent transcript (priority):");
    transcriptParts.push(buildDirectTranscript(recentMessages));

    if (earlierMessages.length > 0) {
      transcriptParts.push("");
      transcriptParts.push("Earlier context:");
      transcriptParts.push(buildDirectTranscript(earlierMessages));
    }

    const payload = {
      latestMessage: latestNonAssistant.content,
      transcript: transcriptParts.join("\n"),
      forceSuggestion: true,
      currentSuggestion: targetMessage.content,
      traceId,
      pipelineStartAt,
      triggerType: "regenerate",
      anchorMessageId: latestNonAssistant.id,
      anchorCreatedAt: latestNonAssistant.createdAt,
    };
    const transcriptMs = Date.now() - transcriptStartAt;

    const scheduleStartAt = Date.now();
    await ctx.scheduler.runAfter(0, internal.chatAssistantNode.reply, {
      conversationId: args.conversationId,
      userMessage: serializeDirectPayload(payload),
      targetMessageId: args.messageId,
    });
    console.log("[steve_timing] direct_pipeline_enqueue", {
      traceId,
      triggerType: "regenerate",
      conversationId: String(args.conversationId),
      authMs,
      membershipMs,
      conversationFetchMs,
      targetMessageFetchMs,
      fetchMs,
      transcriptMs,
      scheduleMs: Date.now() - scheduleStartAt,
      totalMs: Date.now() - pipelineStartAt,
    });

    return { success: true };
  },
});
