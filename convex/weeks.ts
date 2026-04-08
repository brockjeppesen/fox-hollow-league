import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const weeks = await ctx.db.query("weeks").collect();
    return weeks.sort((a, b) => b.playDate - a.playDate);
  },
});

export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Prefer open weeks — pick the nearest future one
    const openWeeks = await ctx.db
      .query("weeks")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    if (openWeeks.length > 0) {
      const futureOpen = openWeeks
        .filter((w) => w.playDate >= now)
        .sort((a, b) => a.playDate - b.playDate);
      if (futureOpen.length > 0) return futureOpen[0];
      // If all open weeks are in the past, show the most recent
      return openWeeks.sort((a, b) => b.playDate - a.playDate)[0];
    }

    // Fall back to drafts — pick the nearest future one
    const draftWeeks = await ctx.db
      .query("weeks")
      .withIndex("by_status", (q) => q.eq("status", "draft"))
      .collect();

    if (draftWeeks.length > 0) {
      const futureDraft = draftWeeks
        .filter((w) => w.playDate >= now)
        .sort((a, b) => a.playDate - b.playDate);
      if (futureDraft.length > 0) return futureDraft[0];
      return draftWeeks.sort((a, b) => b.playDate - a.playDate)[0];
    }

    return null;
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("weeks").collect();
  },
});

export const get = query({
  args: { id: v.id("weeks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    playDate: v.number(),
    deadline: v.number(),
    format: v.optional(v.string()),
    golfGeniusEventId: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("weeks", args);
    return id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("weeks"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const updateSlotCapacity = mutation({
  args: {
    id: v.id("weeks"),
    slotCapacity: v.optional(v.object({
      early: v.number(),
      mid: v.number(),
      late: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { slotCapacity: args.slotCapacity });
  },
});

export const listCompleted = query({
  args: {},
  handler: async (ctx) => {
    const weeks = await ctx.db.query("weeks").collect();
    // Return all weeks sorted by date descending (past first)
    return weeks.sort((a, b) => b.playDate - a.playDate);
  },
});
