import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByPlayer = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("playerPreferences")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .first();
  },
});

export const upsert = mutation({
  args: {
    playerId: v.id("players"),
    defaultPartners: v.array(v.id("players")),
    defaultAvoid: v.array(v.id("players")),
    defaultEarliest: v.optional(v.string()),
    defaultLatest: v.optional(v.string()),
    preferredContact: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("playerPreferences")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        defaultPartners: args.defaultPartners,
        defaultAvoid: args.defaultAvoid,
        defaultEarliest: args.defaultEarliest,
        defaultLatest: args.defaultLatest,
        preferredContact: args.preferredContact,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("playerPreferences", args);
    }
  },
});
