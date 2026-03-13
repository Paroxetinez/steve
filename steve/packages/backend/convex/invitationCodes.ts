import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { requireUserBySession } from "./authUtils";

const JOE_PHONE = "18106289189";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const generateInvitationCodes = mutation({
  args: {
    sessionToken: v.string(),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserBySession(ctx, args.sessionToken);

    const userData = await ctx.db.get(user._id);
    const isJoe = userData?.phone === JOE_PHONE;
    const requestedCount = Math.max(1, Math.min(args.count ?? 5, 20));

    const existingCodes = await ctx.db
      .query("invitationCodes")
      .withIndex("by_createdByUserId", (q) => q.eq("createdByUserId", user._id))
      .collect();

    // Joe can always generate a new batch.
    // Other users can keep at most `requestedCount` codes in total (default 5).
    const codesToGenerate = isJoe ? requestedCount : Math.max(0, requestedCount - existingCodes.length);
    const now = Date.now();
    const codes = existingCodes.map((item) => item.code);

    for (let i = 0; i < codesToGenerate; i++) {
      let code = generateCode();

      for (let retry = 0; retry < 10; retry++) {
        const existing = await ctx.db
          .query("invitationCodes")
          .withIndex("by_code", (q) => q.eq("code", code))
          .unique();

        if (!existing) {
          break;
        }

        code = generateCode();
      }

      await ctx.db.insert("invitationCodes", {
        code,
        createdByUserId: user._id,
        createdAt: now,
      });
      codes.push(code);
    }

    return codes;
  },
});

export const getMyInvitationCodes = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserBySession(ctx, args.sessionToken);

    return await ctx.db
      .query("invitationCodes")
      .withIndex("by_createdByUserId", (q) => q.eq("createdByUserId", user._id))
      .collect();
  },
});

export const validateInvitationCode = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const code = args.code.toUpperCase();

    const invitation = await ctx.db
      .query("invitationCodes")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();

    if (!invitation) {
      return { valid: false, error: "Invitation code does not exist" };
    }

    if (invitation.usedAt) {
      return { valid: false, error: "Invitation code has been used" };
    }

    return { valid: true, invitation };
  },
});

export const useInvitationCode = mutation({
  args: {
    sessionToken: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserBySession(ctx, args.sessionToken);
    const code = args.code.toUpperCase();
    const now = Date.now();

    const invitation = await ctx.db
      .query("invitationCodes")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();

    if (!invitation) {
      throw new ConvexError("Invitation code does not exist");
    }

    if (invitation.usedAt) {
      throw new ConvexError("Invitation code has been used");
    }

    await ctx.db.patch(invitation._id, {
      usedByUserId: user._id,
      usedAt: now,
    });

    return { success: true };
  },
});
