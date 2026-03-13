import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { requireUserBySession } from "./authUtils";
import { resolveStoredAvatarUrl } from "./chatMediaHelpers";

async function resolveAvatarUrl(
  ctx: QueryCtx,
  profile: Doc<"profiles"> | null,
) {
  return resolveStoredAvatarUrl({
    objectKey: profile?.avatarObjectKey,
    resolvedStorageUrl: profile?.avatarStorageId
      ? await ctx.storage.getUrl(profile.avatarStorageId)
      : null,
    legacyUrl: profile?.avatarUrl,
  });
}

export const getMyProfile = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserBySession(ctx, args.sessionToken);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!profile) {
      return null;
    }

    return {
      ...profile,
      avatarUrl: await resolveAvatarUrl(ctx, profile),
    };
  },
});

export const upsertMyProfile = mutation({
  args: {
    sessionToken: v.string(),
    nickname: v.string(),
    gender: v.string(),
    birthday: v.string(),
    city: v.string(),
    avatarObjectKey: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserBySession(ctx, args.sessionToken);
    const now = Date.now();

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    const profileData = {
      nickname: args.nickname.trim(),
      gender: args.gender,
      birthday: args.birthday,
      city: args.city,
      avatarObjectKey: args.avatarObjectKey,
      avatarStorageId: args.avatarStorageId,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, profileData);
      const profile = await ctx.db.get(existing._id);
      return profile
        ? {
            ...profile,
            avatarUrl: await resolveAvatarUrl(ctx, profile),
          }
        : null;
    }

    const profileId = await ctx.db.insert("profiles", {
      userId: user._id,
      ...profileData,
    });

    const profile = await ctx.db.get(profileId);
    return profile
      ? {
          ...profile,
          avatarUrl: await resolveAvatarUrl(ctx, profile),
        }
      : null;
  },
});

export const getProfileForViewer = query({
  args: {
    sessionToken: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireUserBySession(ctx, args.sessionToken);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) {
      return null;
    }

    return {
      ...profile,
      avatarUrl: await resolveAvatarUrl(ctx, profile),
    };
  },
});
