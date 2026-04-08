import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
function generateToken() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
export const getByToken = query({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const tokenDoc = await ctx.db
            .query("playerTokens")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .first();
        if (!tokenDoc)
            return null;
        const player = await ctx.db.get(tokenDoc.playerId);
        return { ...tokenDoc, player };
    },
});
export const listByWeek = query({
    args: { weekId: v.id("weeks") },
    handler: async (ctx, args) => {
        const allTokens = await ctx.db.query("playerTokens").collect();
        const weekTokens = allTokens.filter((t) => t.weekId === args.weekId);
        const enriched = await Promise.all(weekTokens.map(async (t) => {
            const player = await ctx.db.get(t.playerId);
            const request = await ctx.db
                .query("weeklyRequests")
                .withIndex("by_week_player", (q) => q.eq("weekId", args.weekId).eq("playerId", t.playerId))
                .first();
            return {
                ...t,
                playerName: player?.name ?? "Unknown",
                submitted: !!request,
            };
        }));
        return enriched.sort((a, b) => a.playerName.localeCompare(b.playerName));
    },
});
export const generate = mutation({
    args: {
        playerId: v.id("players"),
        weekId: v.id("weeks"),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("playerTokens")
            .withIndex("by_player_week", (q) => q.eq("playerId", args.playerId).eq("weekId", args.weekId))
            .first();
        if (existing) {
            return existing;
        }
        const token = generateToken();
        const id = await ctx.db.insert("playerTokens", {
            playerId: args.playerId,
            token,
            weekId: args.weekId,
        });
        return await ctx.db.get(id);
    },
});
export const getOrCreateForPlayer = mutation({
    args: { playerId: v.id("players"), weekId: v.id("weeks") },
    handler: async (ctx, args) => {
        // Check for existing token
        const existing = await ctx.db
            .query("playerTokens")
            .withIndex("by_player_week", (q) => q.eq("playerId", args.playerId).eq("weekId", args.weekId))
            .first();
        if (existing)
            return existing.token;
        // Generate new token
        const token = generateToken();
        await ctx.db.insert("playerTokens", {
            playerId: args.playerId,
            token,
            weekId: args.weekId,
        });
        return token;
    },
});
export const generateAll = mutation({
    args: { weekId: v.id("weeks") },
    handler: async (ctx, args) => {
        const activePlayers = await ctx.db
            .query("players")
            .withIndex("by_active", (q) => q.eq("active", true))
            .collect();
        const results = [];
        for (const player of activePlayers) {
            const existing = await ctx.db
                .query("playerTokens")
                .withIndex("by_player_week", (q) => q.eq("playerId", player._id).eq("weekId", args.weekId))
                .first();
            if (existing) {
                results.push(existing);
            }
            else {
                const token = generateToken();
                const id = await ctx.db.insert("playerTokens", {
                    playerId: player._id,
                    token,
                    weekId: args.weekId,
                });
                const doc = await ctx.db.get(id);
                results.push(doc);
            }
        }
        return results;
    },
});
