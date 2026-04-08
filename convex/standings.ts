import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getSeason = query({
  args: { season: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const season = args.season ?? new Date().getFullYear().toString();

    const standings = await ctx.db
      .query("standings")
      .withIndex("by_season_points", (q) => q.eq("season", season))
      .collect();

    // Sort by totalPoints desc
    standings.sort((a, b) => b.totalPoints - a.totalPoints);

    const enriched = await Promise.all(
      standings.map(async (s, idx) => {
        const player = await ctx.db.get(s.playerId);
        return {
          ...s,
          rank: idx + 1,
          playerName: player?.name ?? "Unknown",
          playerHandicap: player?.handicapIndex,
        };
      })
    );

    return enriched;
  },
});

export const recalculate = mutation({
  args: { season: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const season = args.season ?? new Date().getFullYear().toString();
    const seasonYear = parseInt(season);

    // Get all scores
    const allScores = await ctx.db.query("scores").collect();

    // Filter scores to current season by looking up week play dates
    const weekCache = new Map<string, { playDate: number; format?: string }>();
    const seasonScores = [];
    for (const score of allScores) {
      let week = weekCache.get(score.weekId);
      if (!week) {
        const weekDoc = await ctx.db.get(score.weekId);
        if (weekDoc) {
          week = { playDate: weekDoc.playDate, format: weekDoc.format };
          weekCache.set(score.weekId, week);
        }
      }
      if (week) {
        const scoreYear = new Date(week.playDate).getFullYear();
        if (scoreYear === seasonYear) {
          seasonScores.push(score);
        }
      }
    }

    // Group by player
    const playerStats = new Map<string, {
      totalPoints: number;
      roundsPlayed: number;
      totalGross: number;
      grossCount: number;
      bestFinish: number | undefined;
    }>();

    for (const score of seasonScores) {
      const pid = score.playerId;
      const stats = playerStats.get(pid) ?? {
        totalPoints: 0,
        roundsPlayed: 0,
        totalGross: 0,
        grossCount: 0,
        bestFinish: undefined,
      };

      stats.roundsPlayed++;
      stats.totalPoints += score.points ?? 0;
      if (score.grossScore !== undefined) {
        stats.totalGross += score.grossScore;
        stats.grossCount++;
      }
      if (score.points !== undefined) {
        if (stats.bestFinish === undefined || score.points > stats.bestFinish) {
          stats.bestFinish = score.points;
        }
      }

      playerStats.set(pid, stats);
    }

    // Delete existing standings for this season
    const existingStandings = await ctx.db
      .query("standings")
      .withIndex("by_season_points", (q) => q.eq("season", season))
      .collect();
    for (const s of existingStandings) {
      await ctx.db.delete(s._id);
    }

    // Insert new standings
    for (const [playerId, stats] of playerStats) {
      await ctx.db.insert("standings", {
        playerId: playerId as any,
        season,
        totalPoints: stats.totalPoints,
        roundsPlayed: stats.roundsPlayed,
        avgScore: stats.grossCount > 0
          ? Math.round((stats.totalGross / stats.grossCount) * 10) / 10
          : undefined,
        bestFinish: stats.bestFinish,
      });
    }
  },
});
