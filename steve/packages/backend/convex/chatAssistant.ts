import type { Id } from "./_generated/dataModel";
import {
  internalQuery,
  internalMutation,
  type MutationCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { requireUserBySession } from "./authUtils";
import { buildDirectTranscript, DIRECT_CONTEXT_SIZE } from "./chatStevePayloads";
import { shouldSyncConversationToEverMem } from "./evermemSync";
import { internal } from "./_generated/api";

const evermemSyncInternal = (internal as Record<string, any>).evermemSync;

async function saveAssistantMessage(
  ctx: MutationCtx,
  conversationId: Id<"conversations">,
  content: string,
  targetMessageId?: Id<"messages">,
) {
  const now = Date.now();
  let savedMessageId: Id<"messages"> | null = null;
  if (targetMessageId) {
    const existing = await ctx.db.get(targetMessageId);
    if (
      existing &&
      existing.conversationId === conversationId &&
      existing.senderType === "assistant"
    ) {
      await ctx.db.patch(targetMessageId, { content });
      savedMessageId = targetMessageId;
    } else {
      savedMessageId = await ctx.db.insert("messages", {
        conversationId,
        senderType: "assistant",
        content,
        contentType: "text",
        createdAt: now,
      });
    }
  } else {
    savedMessageId = await ctx.db.insert("messages", {
      conversationId,
      senderType: "assistant",
      content,
      contentType: "text",
      createdAt: now,
    });
  }

  await ctx.db.patch(conversationId, {
    lastMessagePreview: content.slice(0, 120),
    lastMessageAt: now,
    updatedAt: now,
  });

  const conversation = await ctx.db.get(conversationId);
  if (
    conversation &&
    savedMessageId &&
    shouldSyncConversationToEverMem({
      conversationType: conversation.type,
      senderType: "assistant",
    })
  ) {
    await ctx.scheduler.runAfter(0, evermemSyncInternal.syncMessageToEverMem, {
      conversationId: String(conversationId),
      conversationName: conversation.title ?? "Direct Conversation",
      messageId: String(savedMessageId),
      senderId: "steve",
      senderName: "Steve",
      senderType: "assistant",
      content,
      createdAt: now,
      referList: [],
    });
  }
}

export const saveAssistantReply = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    targetMessageId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    await saveAssistantMessage(
      ctx,
      args.conversationId,
      args.content,
      args.targetMessageId,
    );
  },
});

export const saveSystemNotice = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderType: "system",
      content: args.content,
      contentType: "text",
      createdAt: now,
    });

    await ctx.db.patch(args.conversationId, {
      lastMessagePreview: args.content.slice(0, 120),
      lastMessageAt: now,
      updatedAt: now,
    });
  },
});

export const getDirectFreshness = internalQuery({
  args: {
    conversationId: v.id("conversations"),
    anchorMessageId: v.optional(v.id("messages")),
    anchorCreatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("messages")
      .withIndex("by_conversationId_createdAt", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    const directRows = rows.filter((message) => message.senderType !== "system");
    const latestMessage = directRows[directRows.length - 1] ?? null;

    let latestUserMessage: (typeof directRows)[number] | null = null;
    let lastAssistantMessage: (typeof directRows)[number] | null = null;
    for (let i = directRows.length - 1; i >= 0; i -= 1) {
      const item = directRows[i];
      if (!latestUserMessage && item.senderType === "user") {
        latestUserMessage = item;
      }
      if (!lastAssistantMessage && item.senderType === "assistant") {
        lastAssistantMessage = item;
      }
      if (latestUserMessage && lastAssistantMessage) break;
    }

    let newerUserCount = 0;
    if (args.anchorMessageId) {
      const anchorIndex = directRows.findIndex((item) => item._id === args.anchorMessageId);
      if (anchorIndex >= 0) {
        for (let i = anchorIndex + 1; i < directRows.length; i += 1) {
          if (directRows[i].senderType === "user") {
            newerUserCount += 1;
          }
        }
      } else if (typeof args.anchorCreatedAt === "number") {
        for (const item of directRows) {
          if (item.senderType === "user" && item.createdAt > args.anchorCreatedAt) {
            newerUserCount += 1;
          }
        }
      }
    } else if (typeof args.anchorCreatedAt === "number") {
      for (const item of directRows) {
        if (item.senderType === "user" && item.createdAt > args.anchorCreatedAt) {
          newerUserCount += 1;
        }
      }
    }

    return {
      latestMessageId: latestMessage?._id ?? null,
      latestMessageAt: latestMessage?.createdAt ?? null,
      latestUserMessageId: latestUserMessage?._id ?? null,
      latestUserMessageAt: latestUserMessage?.createdAt ?? null,
      lastAssistantMessageId: lastAssistantMessage?._id ?? null,
      lastAssistantAt: lastAssistantMessage?.createdAt ?? null,
      newerUserCount,
      directMessageCount: directRows.length,
    };
  },
});

export const getManualDirectPayload = internalQuery({
  args: {
    sessionToken: v.string(),
    conversationId: v.id("conversations"),
    traceId: v.string(),
    pipelineStartAt: v.number(),
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

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.type !== "direct") {
      throw new Error("Steve can only be called manually in direct chats");
    }

    const rows = await ctx.db
      .query("messages")
      .withIndex("by_conversationId_createdAt", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    const directRows = rows.filter((message) => message.senderType !== "system");
    const latestAnchor = directRows[directRows.length - 1];
    const recentMessages = directRows.slice(-DIRECT_CONTEXT_SIZE).map((message) => ({
      senderType: message.senderType,
      senderUserId: message.senderUserId,
      content: message.content,
    }));

    return {
      latestMessage: "A user explicitly called Steve to step in.",
      transcript: buildDirectTranscript(recentMessages),
      forceSuggestion: true,
      traceId: args.traceId,
      pipelineStartAt: args.pipelineStartAt,
      triggerType: "manual_call",
      anchorMessageId: latestAnchor?._id,
      anchorCreatedAt: latestAnchor?.createdAt,
    };
  },
});
