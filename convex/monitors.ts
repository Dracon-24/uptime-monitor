import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// Get all monitors for the current user
export const getUserMonitors = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const monitors = await ctx.db
      .query("monitors")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get stats for each monitor
    const monitorsWithStats = await Promise.all(
      monitors.map(async (monitor) => {
        const stats = await ctx.db
          .query("monitorStats")
          .withIndex("by_monitor", (q) => q.eq("monitorId", monitor._id))
          .unique();

        const recentChecks = await ctx.db
          .query("uptimeChecks")
          .withIndex("by_monitor_and_timestamp", (q) => 
            q.eq("monitorId", monitor._id)
          )
          .order("desc")
          .take(10);

        return {
          ...monitor,
          stats: stats || {
            uptimePercentage: 0,
            avgResponseTime: 0,
            totalChecks: 0,
            successfulChecks: 0,
            lastStatus: "DOWN" as const,
            lastCheckTime: 0,
            lastResponseTime: 0,
          },
          recentChecks,
        };
      })
    );

    return monitorsWithStats;
  },
});

// Add a new monitor
export const addMonitor = mutation({
  args: {
    name: v.string(),
    url: v.string(),
    checkInterval: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to add monitors");
    }

    // Validate URL format
    try {
      new URL(args.url);
    } catch {
      throw new Error("Invalid URL format");
    }

    const monitorId = await ctx.db.insert("monitors", {
      name: args.name,
      url: args.url,
      userId,
      isActive: true,
      checkInterval: args.checkInterval || 60, // default 60 seconds
      createdAt: Date.now(),
    });

    // Initialize stats
    await ctx.db.insert("monitorStats", {
      monitorId,
      uptimePercentage: 0,
      avgResponseTime: 0,
      totalChecks: 0,
      successfulChecks: 0,
      lastStatus: "DOWN",
      lastCheckTime: 0,
    });

    return monitorId;
  },
});

// Delete a monitor
export const deleteMonitor = mutation({
  args: {
    monitorId: v.id("monitors"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const monitor = await ctx.db.get(args.monitorId);
    if (!monitor || monitor.userId !== userId) {
      throw new Error("Monitor not found or access denied");
    }

    // Delete monitor and related data
    await ctx.db.delete(args.monitorId);
    
    // Delete stats
    const stats = await ctx.db
      .query("monitorStats")
      .withIndex("by_monitor", (q) => q.eq("monitorId", args.monitorId))
      .unique();
    if (stats) {
      await ctx.db.delete(stats._id);
    }

    // Note: We keep historical uptime checks for data integrity
    return true;
  },
});

// Toggle monitor active status
export const toggleMonitor = mutation({
  args: {
    monitorId: v.id("monitors"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const monitor = await ctx.db.get(args.monitorId);
    if (!monitor || monitor.userId !== userId) {
      throw new Error("Monitor not found or access denied");
    }

    await ctx.db.patch(args.monitorId, {
      isActive: !monitor.isActive,
    });

    return !monitor.isActive;
  },
});

// Internal function to record uptime check results
export const recordUptimeCheck = internalMutation({
  args: {
    monitorId: v.id("monitors"),
    status: v.union(v.literal("UP"), v.literal("DOWN"), v.literal("ERROR")),
    responseTime: v.optional(v.number()),
    statusCode: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    // Record the check
    await ctx.db.insert("uptimeChecks", {
      monitorId: args.monitorId,
      status: args.status,
      responseTime: args.responseTime,
      statusCode: args.statusCode,
      errorMessage: args.errorMessage,
      timestamp,
    });

    // Update or create stats
    const existingStats = await ctx.db
      .query("monitorStats")
      .withIndex("by_monitor", (q) => q.eq("monitorId", args.monitorId))
      .unique();

    if (existingStats) {
      const newTotalChecks = existingStats.totalChecks + 1;
      const newSuccessfulChecks = existingStats.successfulChecks + (args.status === "UP" ? 1 : 0);
      const newUptimePercentage = (newSuccessfulChecks / newTotalChecks) * 100;
      
      // Calculate new average response time
      let newAvgResponseTime = existingStats.avgResponseTime;
      if (args.responseTime !== undefined) {
        newAvgResponseTime = ((existingStats.avgResponseTime * existingStats.totalChecks) + args.responseTime) / newTotalChecks;
      }

      await ctx.db.patch(existingStats._id, {
        uptimePercentage: newUptimePercentage,
        avgResponseTime: newAvgResponseTime,
        totalChecks: newTotalChecks,
        successfulChecks: newSuccessfulChecks,
        lastStatus: args.status,
        lastCheckTime: timestamp,
        lastResponseTime: args.responseTime,
      });
    } else {
      // Create initial stats
      await ctx.db.insert("monitorStats", {
        monitorId: args.monitorId,
        uptimePercentage: args.status === "UP" ? 100 : 0,
        avgResponseTime: args.responseTime || 0,
        totalChecks: 1,
        successfulChecks: args.status === "UP" ? 1 : 0,
        lastStatus: args.status,
        lastCheckTime: timestamp,
        lastResponseTime: args.responseTime,
      });
    }
  },
});

// Trigger instant check for a specific monitor
export const triggerInstantCheck = mutation({
  args: {
    monitorId: v.id("monitors"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const monitor = await ctx.db.get(args.monitorId);
    if (!monitor || monitor.userId !== userId) {
      throw new Error("Monitor not found or access denied");
    }

    if (!monitor.isActive) {
      throw new Error("Cannot check paused monitor");
    }

    // Schedule immediate check
    await ctx.scheduler.runAfter(0, internal.monitoring.performUptimeCheck, {
      monitorId: monitor._id,
      url: monitor.url,
      name: monitor.name,
    });

    return true;
  },
});
export const getActiveMonitors = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("monitors")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});
