import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import {
  getBackfillableAvatarSourceUrl,
  getBackfillableImageSourceUrl,
} from "./chatMediaHelpers";

function sliceWithOffset<T>(items: T[], offset: number, limit: number) {
  return items.slice(offset, offset + limit);
}

export const listLegacyAvatarCandidates = internalQuery({
  args: {
    offset: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    total: v.number(),
    items: v.array(
      v.object({
        profileId: v.id("profiles"),
        userId: v.id("users"),
        sourceUrl: v.union(v.string(), v.null()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("profiles").collect();
    const candidateRows = await Promise.all(
      rows.map(async (profile) => ({
        profile,
        sourceUrl: getBackfillableAvatarSourceUrl({
          objectKey: profile.avatarObjectKey,
          resolvedStorageUrl: profile.avatarStorageId
            ? await ctx.storage.getUrl(profile.avatarStorageId)
            : null,
          legacyUrl: profile.avatarUrl,
        }),
      })),
    );
    const candidates = candidateRows.filter((item) => item.sourceUrl);

    const offset = Math.max(0, args.offset ?? 0);
    const limit = Math.max(1, (args.limit ?? candidates.length) || 1);
    const items = sliceWithOffset(candidates, offset, limit).map(({ profile, sourceUrl }) => ({
      profileId: profile._id,
      userId: profile.userId,
      sourceUrl,
    }));

    return {
      total: candidates.length,
      items,
    };
  },
});

export const listLegacyImageCandidates = internalQuery({
  args: {
    offset: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    total: v.number(),
    items: v.array(
      v.object({
        messageId: v.id("messages"),
        conversationId: v.id("conversations"),
        sourceUrl: v.union(v.string(), v.null()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("messages").collect();
    const candidateRows = await Promise.all(
      rows.map(async (message) => ({
        message,
        sourceUrl: getBackfillableImageSourceUrl({
          objectKey: message.imageObjectKey,
          resolvedStorageUrl: message.imageStorageId
            ? await ctx.storage.getUrl(message.imageStorageId)
            : null,
          legacyContent: message.content,
        }),
      })),
    );
    const candidates = candidateRows.filter((item) => item.sourceUrl);

    const offset = Math.max(0, args.offset ?? 0);
    const limit = Math.max(1, (args.limit ?? candidates.length) || 1);
    const items = sliceWithOffset(candidates, offset, limit).map(({ message, sourceUrl }) => ({
      messageId: message._id,
      conversationId: message.conversationId,
      sourceUrl,
    }));

    return {
      total: candidates.length,
      items,
    };
  },
});

export const setAvatarObjectKey = internalMutation({
  args: {
    profileId: v.id("profiles"),
    objectKey: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.profileId, {
      avatarObjectKey: args.objectKey,
    });
    return null;
  },
});

export const setImageObjectKey = internalMutation({
  args: {
    messageId: v.id("messages"),
    objectKey: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      imageObjectKey: args.objectKey,
    });
    return null;
  },
});
