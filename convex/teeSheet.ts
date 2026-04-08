import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

interface SlotPlayer {
  playerId: Id<"players">;
  handicap: number;
  wantsWith: Id<"players">[];
  notes?: string;
}

// Generate tee sheet from requests
export const generate = mutation({
  args: { weekId: v.id("weeks") },
  handler: async (ctx, args) => {
    // Get all playing requests for this week
    const requests = await ctx.db
      .query("weeklyRequests")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .collect();

    const playingRequests = requests.filter((r) => r.playing);

    // Get all player data
    const players = await Promise.all(
      playingRequests.map((r) => ctx.db.get(r.playerId))
    );

    // Build player map
    const playerMap = new Map<Id<"players">, { handicapIndex?: number }>();
    players.forEach((p) => {
      if (p) playerMap.set(p._id, p);
    });

    // Group by slot preference
    const slots: Record<string, SlotPlayer[]> = {
      early: [],
      mid: [],
      late: [],
      no_preference: [],
    };

    for (const req of playingRequests) {
      const slot = req.timeSlot || "no_preference";
      if (slot in slots) {
        slots[slot].push({
          playerId: req.playerId,
          handicap: playerMap.get(req.playerId)?.handicapIndex ?? 20,
          wantsWith: req.wantsWith || [],
          notes: req.notes,
        });
      } else {
        slots["no_preference"].push({
          playerId: req.playerId,
          handicap: playerMap.get(req.playerId)?.handicapIndex ?? 20,
          wantsWith: req.wantsWith || [],
          notes: req.notes,
        });
      }
    }

    // Define tee time windows (8-min intervals)
    const slotTimes: Record<string, string[]> = {
      early: ["3:00 PM", "3:08 PM", "3:16 PM", "3:24 PM"],
      mid: [
        "3:32 PM",
        "3:40 PM",
        "3:48 PM",
        "3:56 PM",
        "4:04 PM",
        "4:12 PM",
      ],
      late: [
        "4:20 PM",
        "4:28 PM",
        "4:36 PM",
        "4:44 PM",
        "4:52 PM",
        "5:00 PM",
      ],
    };

    // Build groups
    const groups: { teeTime: string; players: Id<"players">[] }[] = [];

    // For each slot, create foursomes
    for (const slotName of ["early", "mid", "late"]) {
      const slotPlayers = slots[slotName];
      if (!slotPlayers || slotPlayers.length === 0) continue;

      const times = slotTimes[slotName];
      const remaining = [...slotPlayers];

      // First pass: honor partner requests
      const used = new Set<string>();
      const partnerGroups: SlotPlayer[][] = [];

      for (const player of remaining) {
        if (used.has(player.playerId)) continue;
        const group: SlotPlayer[] = [player];
        used.add(player.playerId);

        for (const partnerId of player.wantsWith) {
          if (group.length >= 4) break;
          const partner = remaining.find(
            (p) => p.playerId === partnerId && !used.has(p.playerId)
          );
          if (partner) {
            group.push(partner);
            used.add(partner.playerId);
          }
        }
        partnerGroups.push(group);
      }

      // Merge small groups into foursomes, sort by handicap for balance
      const ungrouped: SlotPlayer[] = [];
      const fullGroups: SlotPlayer[][] = [];

      for (const g of partnerGroups) {
        if (g.length >= 3) {
          fullGroups.push(g);
        } else {
          ungrouped.push(...g);
        }
      }

      // Sort ungrouped by handicap
      ungrouped.sort((a, b) => a.handicap - b.handicap);

      // Fill into foursomes
      while (ungrouped.length >= 4) {
        fullGroups.push(ungrouped.splice(0, 4));
      }

      // Remaining go into existing groups or form a partial group
      if (ungrouped.length > 0) {
        for (const p of ungrouped) {
          const smallGroup = fullGroups.find((g) => g.length < 4);
          if (smallGroup) {
            smallGroup.push(p);
          } else {
            fullGroups.push([p]);
          }
        }
      }

      // Assign tee times
      for (let i = 0; i < fullGroups.length; i++) {
        const time = times[i % times.length];
        groups.push({
          teeTime: time,
          players: fullGroups[i].map((p) => p.playerId),
        });
      }
    }

    // Distribute "no_preference" players into slots that need filling
    const noPref = [...slots.no_preference];
    noPref.sort((a, b) => a.handicap - b.handicap);

    // Fill existing groups that have < 4 players first
    for (const player of [...noPref]) {
      const smallGroup = groups.find((g) => g.players.length < 4);
      if (smallGroup) {
        smallGroup.players.push(player.playerId);
        const idx = noPref.indexOf(player);
        if (idx > -1) noPref.splice(idx, 1);
      }
    }

    // Create new groups for remaining no-pref players
    const allTimes = [
      ...slotTimes.early,
      ...slotTimes.mid,
      ...slotTimes.late,
    ];
    let timeIdx = groups.length;
    while (noPref.length >= 4) {
      const group = noPref.splice(0, 4);
      groups.push({
        teeTime: allTimes[timeIdx % allTimes.length] || "TBD",
        players: group.map((p) => p.playerId),
      });
      timeIdx++;
    }

    // Stragglers
    if (noPref.length > 0) {
      const smallGroup = groups.find((g) => g.players.length < 4);
      if (smallGroup) {
        for (const p of noPref) smallGroup.players.push(p.playerId);
      } else {
        groups.push({
          teeTime: allTimes[timeIdx % allTimes.length] || "TBD",
          players: noPref.map((p) => p.playerId),
        });
      }
    }

    // Sort groups by tee time
    const parseTime = (t: string): number => {
      const parts = t.split(" ");
      const period = parts[1];
      const timeParts = parts[0].split(":").map(Number);
      let h = timeParts[0];
      const m = timeParts[1];
      if (period === "PM" && h !== 12) h += 12;
      if (period === "AM" && h === 12) h = 0;
      return h * 60 + m;
    };

    groups.sort((a, b) => parseTime(a.teeTime) - parseTime(b.teeTime));

    // Delete existing draft tee sheet for this week
    const existing = await ctx.db
      .query("teeSheets")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .collect();
    for (const sheet of existing) {
      if (sheet.status === "draft") await ctx.db.delete(sheet._id);
    }

    // Save new tee sheet
    return await ctx.db.insert("teeSheets", {
      weekId: args.weekId,
      generatedAt: Date.now(),
      groups,
      status: "draft",
    });
  },
});

export const getByWeek = query({
  args: { weekId: v.id("weeks") },
  handler: async (ctx, args) => {
    const sheets = await ctx.db
      .query("teeSheets")
      .withIndex("by_week", (q) => q.eq("weekId", args.weekId))
      .collect();
    return sheets.sort((a, b) => b.generatedAt - a.generatedAt)[0] ?? null;
  },
});

export const publish = mutation({
  args: { id: v.id("teeSheets") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "published" });
  },
});

export const updateGroup = mutation({
  args: {
    id: v.id("teeSheets"),
    groupIndex: v.number(),
    players: v.array(v.id("players")),
  },
  handler: async (ctx, args) => {
    const sheet = await ctx.db.get(args.id);
    if (!sheet) throw new Error("Tee sheet not found");
    const groups = [...sheet.groups];
    groups[args.groupIndex] = {
      ...groups[args.groupIndex],
      players: args.players,
    };
    await ctx.db.patch(args.id, { groups });
  },
});
