import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const enter = mutation({
  args: {
    weekId: v.id("weeks"),
    playerId: v.id("players"),
    grossScore: v.optional(v.number()),
    netScore: v.optional(v.number()),
    points: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if score already exists for this player/week
    const existing = await ctx.db
      .query("scores")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .collect();

    const existingScore = existing.find((s) => s.playerId === args.playerId);

    if (existingScore) {
      await ctx.db.patch(existingScore._id, {
        grossScore: args.grossScore,
        netScore: args.netScore,
        points: args.points,
        enteredAt: Date.now(),
      });
      return existingScore._id;
    } else {
      return await ctx.db.insert("scores", {
        weekId: args.weekId,
        playerId: args.playerId,
        grossScore: args.grossScore,
        netScore: args.netScore,
        points: args.points,
        enteredAt: Date.now(),
      });
    }
  },
});

export const enterBatch = mutation({
  args: {
    scores: v.array(v.object({
      weekId: v.id("weeks"),
      playerId: v.id("players"),
      grossScore: v.optional(v.number()),
      netScore: v.optional(v.number()),
      points: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    for (const score of args.scores) {
      const existing = await ctx.db
        .query("scores")
        .withIndex("by_week", (q) => q.eq("weekId", score.weekId))
        .collect();

      const existingScore = existing.find((s) => s.playerId === score.playerId);

      if (existingScore) {
        await ctx.db.patch(existingScore._id, {
          grossScore: score.grossScore,
          netScore: score.netScore,
          points: score.points,
          enteredAt: Date.now(),
        });
      } else {
        await ctx.db.insert("scores", {
          ...score,
          enteredAt: Date.now(),
        });
      }
    }
  },
});

export const getByWeek = query({
  args: { weekId: v.id("weeks") },
  handler: async (ctx, args) => {
    const scores = await ctx.db
      .query("scores")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .collect();

    const enriched = await Promise.all(
      scores.map(async (s) => {
        const player = await ctx.db.get(s.playerId);
        return {
          ...s,
          playerName: player?.name ?? "Unknown",
          playerHandicap: player?.handicapIndex,
        };
      })
    );

    return enriched.sort((a, b) => a.playerName.localeCompare(b.playerName));
  },
});

export const getByPlayer = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    const scores = await ctx.db
      .query("scores")
      .withIndex("by_player", (q) => q.eq("playerId", args.playerId))
      .collect();

    const enriched = await Promise.all(
      scores.map(async (s) => {
        const week = await ctx.db.get(s.weekId);
        return {
          ...s,
          playDate: week?.playDate,
          format: week?.format,
        };
      })
    );

    return enriched.sort((a, b) => (b.playDate ?? 0) - (a.playDate ?? 0));
  },
});
