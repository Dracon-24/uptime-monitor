import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // Monitoring targets (websites/APIs to monitor)
  monitors: defineTable({
    name: v.string(),
    url: v.string(),
    userId: v.id("users"),
    isActive: v.boolean(),
    checkInterval: v.number(), // seconds
    createdAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_active", ["isActive"]),

  // Uptime check results
  uptimeChecks: defineTable({
    monitorId: v.id("monitors"),
    status: v.union(v.literal("UP"), v.literal("DOWN"), v.literal("ERROR")),
    responseTime: v.optional(v.number()), // milliseconds
    statusCode: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_monitor", ["monitorId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_monitor_and_timestamp", ["monitorId", "timestamp"]),

  // Aggregated statistics for quick dashboard display
  monitorStats: defineTable({
    monitorId: v.id("monitors"),
    uptimePercentage: v.number(),
    avgResponseTime: v.number(),
    totalChecks: v.number(),
    successfulChecks: v.number(),
    lastStatus: v.union(v.literal("UP"), v.literal("DOWN"), v.literal("ERROR")),
    lastCheckTime: v.number(),
    lastResponseTime: v.optional(v.number()),
  }).index("by_monitor", ["monitorId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
