import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const getByKey = internalQuery({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("systemPrompts")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .collect();

    if (rows.length === 0) {
      return null;
    }

    const latest = rows.reduce((best, current) =>
      current.updatedAt > best.updatedAt ? current : best,
    );
    return latest.content;
  },
});

export const upsertByKey = internalMutation({
  args: {
    key: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const rows = await ctx.db
      .query("systemPrompts")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .collect();

    if (rows.length === 0) {
      return await ctx.db.insert("systemPrompts", {
        key: args.key,
        content: args.content,
        createdAt: now,
        updatedAt: now,
      });
    }

    const latest = rows.reduce((best, current) =>
      current.updatedAt > best.updatedAt ? current : best,
    );
    await ctx.db.patch(latest._id, {
      content: args.content,
      updatedAt: now,
    });
    return latest._id;
  },
});
