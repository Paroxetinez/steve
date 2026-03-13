import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUserBySession } from "./authUtils";

export const generateAvatarUploadUrl = mutation({
  args: {
    sessionToken: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    await requireUserBySession(ctx, args.sessionToken);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getAvatarUrl = mutation({
  args: {
    sessionToken: v.string(),
    storageId: v.id("_storage"),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    await requireUserBySession(ctx, args.sessionToken);
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const getAvatarUploadContext = query({
  args: {
    sessionToken: v.string(),
  },
  returns: v.object({
    userId: v.id("users"),
  }),
  handler: async (ctx, args) => {
    const { user } = await requireUserBySession(ctx, args.sessionToken);
    return {
      userId: user._id,
    };
  },
});
