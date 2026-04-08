import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
export const list = query({
    args: {},
    handler: async (ctx) => {
        const players = await ctx.db
            .query("players")
            .withIndex("by_active", (q) => q.eq("active", true))
            .collect();
        return players.sort((a, b) => a.name.localeCompare(b.name));
    },
});
export const listAll = query({
    args: {},
    handler: async (ctx) => {
        const players = await ctx.db.query("players").collect();
        return players.sort((a, b) => a.name.localeCompare(b.name));
    },
});
export const get = query({
    args: { id: v.id("players") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});
export const create = mutation({
    args: {
        name: v.string(),
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
        handicapIndex: v.optional(v.number()),
        golfGeniusId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("players", {
            ...args,
            active: true,
        });
        return id;
    },
});
export const update = mutation({
    args: {
        id: v.id("players"),
        name: v.optional(v.string()),
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
        handicapIndex: v.optional(v.number()),
        golfGeniusId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...fields } = args;
        const updates = {};
        for (const [key, val] of Object.entries(fields)) {
            if (val !== undefined)
                updates[key] = val;
        }
        await ctx.db.patch(id, updates);
    },
});
export const toggleActive = mutation({
    args: { id: v.id("players") },
    handler: async (ctx, args) => {
        const player = await ctx.db.get(args.id);
        if (!player)
            throw new Error("Player not found");
        await ctx.db.patch(args.id, { active: !player.active });
    },
});
