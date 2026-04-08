import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  players: defineTable({
    name: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    handicapIndex: v.optional(v.number()),
    golfGeniusId: v.optional(v.string()),
    active: v.boolean(),
  }).index("by_active", ["active"]),

  playerPreferences: defineTable({
    playerId: v.id("players"),
    defaultPartners: v.array(v.id("players")),
    defaultAvoid: v.array(v.id("players")),
    defaultTimeSlot: v.optional(v.string()),
    preferredContact: v.string(),
  }).index("by_player", ["playerId"]),

  weeks: defineTable({
    playDate: v.number(),
    deadline: v.number(),
    format: v.optional(v.string()),
    golfGeniusEventId: v.optional(v.string()),
    status: v.string(),
  }).index("by_status", ["status"]),

  weeklyRequests: defineTable({
    weekId: v.id("weeks"),
    playerId: v.id("players"),
    playing: v.boolean(),
    wantsWith: v.array(v.id("players")),
    avoid: v.array(v.id("players")),
    timeSlot: v.optional(v.string()),
    notes: v.optional(v.string()),
    submittedAt: v.number(),
  })
    .index("by_week", ["weekId"])
    .index("by_week_player", ["weekId", "playerId"]),

  playerTokens: defineTable({
    playerId: v.id("players"),
    token: v.string(),
    weekId: v.optional(v.id("weeks")),
    expiresAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_player_week", ["playerId", "weekId"]),
});
