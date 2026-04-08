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
        const openWeeks = await ctx.db
            .query("weeks")
            .withIndex("by_status", (q) => q.eq("status", "open"))
            .collect();
        if (openWeeks.length > 0) {
            return openWeeks.sort((a, b) => b.playDate - a.playDate)[0];
        }
        const draftWeeks = await ctx.db
            .query("weeks")
            .withIndex("by_status", (q) => q.eq("status", "draft"))
            .collect();
        if (draftWeeks.length > 0) {
            return draftWeeks.sort((a, b) => b.playDate - a.playDate)[0];
        }
        return null;
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
