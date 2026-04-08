import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
export const getByWeek = query({
    args: { weekId: v.id("weeks") },
    handler: async (ctx, args) => {
        const requests = await ctx.db
            .query("weeklyRequests")
            .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
            .collect();
        const enriched = await Promise.all(requests.map(async (req) => {
            const player = await ctx.db.get(req.playerId);
            const wantsWithPlayers = await Promise.all(req.wantsWith.map((id) => ctx.db.get(id)));
            const avoidPlayers = await Promise.all(req.avoid.map((id) => ctx.db.get(id)));
            return {
                ...req,
                playerName: player?.name ?? "Unknown",
                playerHandicap: player?.handicapIndex,
                wantsWithNames: wantsWithPlayers
                    .filter(Boolean)
                    .map((p) => p.name),
                avoidNames: avoidPlayers.filter(Boolean).map((p) => p.name),
            };
        }));
        return enriched.sort((a, b) => a.playerName.localeCompare(b.playerName));
    },
});
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
        if (!player)
            return null;
        let week = null;
        if (tokenDoc.weekId) {
            week = await ctx.db.get(tokenDoc.weekId);
        }
        const preferences = await ctx.db
            .query("playerPreferences")
            .withIndex("by_player", (q) => q.eq("playerId", tokenDoc.playerId))
            .first();
        let existingRequest = null;
        if (tokenDoc.weekId) {
            existingRequest = await ctx.db
                .query("weeklyRequests")
                .withIndex("by_week_player", (q) => q.eq("weekId", tokenDoc.weekId).eq("playerId", tokenDoc.playerId))
                .first();
        }
        return {
            player,
            week,
            preferences,
            existingRequest,
            tokenDoc,
        };
    },
});
export const getStats = query({
    args: { weekId: v.id("weeks") },
    handler: async (ctx, args) => {
        const requests = await ctx.db
            .query("weeklyRequests")
            .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
            .collect();
        const activePlayers = await ctx.db
            .query("players")
            .withIndex("by_active", (q) => q.eq("active", true))
            .collect();
        const submittedPlayerIds = new Set(requests.map((r) => r.playerId));
        const playerStatuses = activePlayers.map((p) => ({
            _id: p._id,
            name: p.name,
            submitted: submittedPlayerIds.has(p._id),
        }));
        return {
            submitted: requests.length,
            total: activePlayers.length,
            playing: requests.filter((r) => r.playing).length,
            notPlaying: requests.filter((r) => !r.playing).length,
            playerStatuses: playerStatuses.sort((a, b) => a.name.localeCompare(b.name)),
        };
    },
});
export const upsert = mutation({
    args: {
        weekId: v.id("weeks"),
        playerId: v.id("players"),
        playing: v.boolean(),
        wantsWith: v.array(v.id("players")),
        avoid: v.array(v.id("players")),
        earliestTime: v.optional(v.string()),
        latestTime: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("weeklyRequests")
            .withIndex("by_week_player", (q) => q.eq("weekId", args.weekId).eq("playerId", args.playerId))
            .first();
        const data = {
            weekId: args.weekId,
            playerId: args.playerId,
            playing: args.playing,
            wantsWith: args.wantsWith,
            avoid: args.avoid,
            earliestTime: args.earliestTime,
            latestTime: args.latestTime,
            notes: args.notes,
            submittedAt: Date.now(),
        };
        if (existing) {
            await ctx.db.patch(existing._id, data);
            return existing._id;
        }
        else {
            return await ctx.db.insert("weeklyRequests", data);
        }
    },
});
