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
export const getProfile = query({
    args: { id: v.id("players") },
    handler: async (ctx, args) => {
        const player = await ctx.db.get(args.id);
        if (!player)
            return null;
        // Get all scores for this player
        const scores = await ctx.db
            .query("scores")
            .withIndex("by_player", (q) => q.eq("playerId", args.id))
            .collect();
        // Get week info for each score
        const recentRounds = await Promise.all(scores.map(async (s) => {
            const week = await ctx.db.get(s.weekId);
            return {
                weekId: s.weekId,
                playDate: week?.playDate,
                format: week?.format,
                grossScore: s.grossScore,
                netScore: s.netScore,
                points: s.points,
            };
        }));
        recentRounds.sort((a, b) => (b.playDate ?? 0) - (a.playDate ?? 0));
        // Get all requests for this player (attendance)
        const allWeeks = await ctx.db.query("weeks").collect();
        const allRequests = await ctx.db.query("weeklyRequests").collect();
        const playerRequests = allRequests.filter((r) => r.playerId === args.id && r.playing);
        const totalWeeks = allWeeks.length;
        const attendedWeeks = playerRequests.length;
        // Standings for current season
        const season = new Date().getFullYear().toString();
        const standings = await ctx.db
            .query("standings")
            .withIndex("by_season_points", (q) => q.eq("season", season))
            .collect();
        const playerStanding = standings.find((s) => s.playerId === args.id);
        // Partner history — find who this player has been grouped with most
        const teeSheets = await ctx.db.query("teeSheets").collect();
        const partnerCounts = new Map();
        for (const sheet of teeSheets) {
            for (const group of sheet.groups) {
                if (group.players.includes(args.id)) {
                    for (const pid of group.players) {
                        if (pid !== args.id) {
                            partnerCounts.set(pid, (partnerCounts.get(pid) ?? 0) + 1);
                        }
                    }
                }
            }
        }
        const topPartners = [...partnerCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        const partnerHistory = await Promise.all(topPartners.map(async ([pid, count]) => {
            const p = await ctx.db.get(pid);
            return { name: p?.name ?? "Unknown", count };
        }));
        // Handicap trend (last several scores)
        const handicapTrend = recentRounds
            .slice(0, 10)
            .map((r) => ({
            date: r.playDate,
            grossScore: r.grossScore,
        }));
        return {
            player,
            recentRounds,
            attendance: {
                totalWeeks,
                attended: attendedWeeks,
                rate: totalWeeks > 0 ? Math.round((attendedWeeks / totalWeeks) * 100) : 0,
            },
            standing: playerStanding
                ? {
                    totalPoints: playerStanding.totalPoints,
                    roundsPlayed: playerStanding.roundsPlayed,
                    avgScore: playerStanding.avgScore,
                }
                : null,
            partnerHistory,
            handicapTrend,
        };
    },
});
