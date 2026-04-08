import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByWeek = query({
  args: { weekId: v.id("weeks") },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("weeklyRequests")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .collect();

    const enriched = await Promise.all(
      requests.map(async (req) => {
        const player = await ctx.db.get(req.playerId);
        const wantsWithPlayers = await Promise.all(
          req.wantsWith.map((id) => ctx.db.get(id))
        );
        const avoidPlayers = await Promise.all(
          req.avoid.map((id) => ctx.db.get(id))
        );
        return {
          ...req,
          playerName: player?.name ?? "Unknown",
          playerHandicap: player?.handicapIndex,
          wantsWithNames: wantsWithPlayers
            .filter(Boolean)
            .map((p) => p!.name),
          avoidNames: avoidPlayers.filter(Boolean).map((p) => p!.name),
        };
      })
    );

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

    if (!tokenDoc) return null;

    const player = await ctx.db.get(tokenDoc.playerId);
    if (!player) return null;

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
        .withIndex("by_week_player", (q) =>
          q.eq("weekId", tokenDoc.weekId!).eq("playerId", tokenDoc.playerId)
        )
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
    const requestByPlayer = new Map(requests.map((r) => [r.playerId, r]));

    const playerStatuses = activePlayers.map((p) => {
      const req = requestByPlayer.get(p._id);
      return {
        _id: p._id,
        name: p.name,
        handicapIndex: p.handicapIndex,
        submitted: submittedPlayerIds.has(p._id),
        playing: req?.playing ?? false,
        timeSlot: req?.timeSlot,
      };
    });

    return {
      submitted: requests.length,
      total: activePlayers.length,
      playing: requests.filter((r) => r.playing).length,
      notPlaying: requests.filter((r) => !r.playing).length,
      playerStatuses: playerStatuses.sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
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
    timeSlot: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("weeklyRequests")
      .withIndex("by_week_player", (q) =>
        q.eq("weekId", args.weekId).eq("playerId", args.playerId)
      )
      .first();

    // Check slot capacity for waitlist
    let waitlisted = false;
    if (args.playing && args.timeSlot && args.timeSlot !== "no_preference") {
      const week = await ctx.db.get(args.weekId);
      if (week?.slotCapacity) {
        const slotKey = args.timeSlot as "early" | "mid" | "late";
        const capacity = week.slotCapacity[slotKey];
        if (capacity !== undefined) {
          const allRequests = await ctx.db
            .query("weeklyRequests")
            .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
            .collect();
          const slotCount = allRequests.filter(
            (r) => r.playing && r.timeSlot === args.timeSlot && !r.waitlisted && r.playerId !== args.playerId
          ).length;
          if (slotCount >= capacity) {
            waitlisted = true;
          }
        }
      }
    }

    const data = {
      weekId: args.weekId,
      playerId: args.playerId,
      playing: args.playing,
      wantsWith: args.wantsWith,
      avoid: args.avoid,
      timeSlot: args.timeSlot,
      notes: args.notes,
      submittedAt: Date.now(),
      waitlisted: args.playing ? waitlisted : undefined,
    };

    let id;
    if (existing) {
      await ctx.db.patch(existing._id, data);
      id = existing._id;
    } else {
      id = await ctx.db.insert("weeklyRequests", data);
    }

    return { id, waitlisted };
  },
});

export const getSubmissionCounts = query({
  args: { weekIds: v.array(v.id("weeks")) },
  handler: async (ctx, args) => {
    const counts: Record<string, { submitted: number; playing: number }> = {};
    for (const weekId of args.weekIds) {
      const requests = await ctx.db
        .query("weeklyRequests")
        .withIndex("by_week", (q) => q.eq("weekId", weekId))
        .collect();
      counts[weekId] = {
        submitted: requests.length,
        playing: requests.filter((r) => r.playing).length,
      };
    }
    return counts;
  },
});

export const slotCounts = query({
  args: { weekId: v.id("weeks") },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("weeklyRequests")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .collect();

    const playing = requests.filter((r) => r.playing);
    const counts: Record<string, number> = {
      early: 0,
      mid: 0,
      late: 0,
      no_preference: 0,
    };

    for (const req of playing) {
      if (req.waitlisted) continue;
      const slot = req.timeSlot ?? "no_preference";
      if (slot in counts) {
        counts[slot]++;
      }
    }

    return counts;
  },
});

export const getWaitlist = query({
  args: { weekId: v.id("weeks") },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("weeklyRequests")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .collect();

    const waitlisted = requests.filter((r) => r.waitlisted);
    const enriched = await Promise.all(
      waitlisted.map(async (req) => {
        const player = await ctx.db.get(req.playerId);
        return {
          ...req,
          playerName: player?.name ?? "Unknown",
          playerHandicap: player?.handicapIndex,
        };
      })
    );
    return enriched.sort((a, b) => a.submittedAt - b.submittedAt);
  },
});

export const promoteFromWaitlist = mutation({
  args: { requestId: v.id("weeklyRequests") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requestId, { waitlisted: false });
  },
});

export const slotCapacityInfo = query({
  args: { weekId: v.id("weeks") },
  handler: async (ctx, args) => {
    const week = await ctx.db.get(args.weekId);
    if (!week?.slotCapacity) return null;

    const requests = await ctx.db
      .query("weeklyRequests")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .collect();

    const playing = requests.filter((r) => r.playing && !r.waitlisted);
    const counts: Record<string, number> = { early: 0, mid: 0, late: 0 };
    for (const req of playing) {
      const slot = req.timeSlot;
      if (slot && slot in counts) {
        counts[slot]++;
      }
    }

    return {
      capacity: week.slotCapacity,
      counts,
      remaining: {
        early: Math.max(0, week.slotCapacity.early - counts.early),
        mid: Math.max(0, week.slotCapacity.mid - counts.mid),
        late: Math.max(0, week.slotCapacity.late - counts.late),
      },
    };
  },
});
