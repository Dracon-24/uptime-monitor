"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Perform uptime check for a single monitor
export const performUptimeCheck = internalAction({
  args: {
    monitorId: v.id("monitors"),
    url: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    
    try {
      console.log(`Checking ${args.name} (${args.url})`);
      
      const response = await fetch(args.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'UptimeMonitor/1.0',
        },
        // 30 second timeout
        signal: AbortSignal.timeout(30000),
      });

      const responseTime = Date.now() - startTime;
      const isUp = response.ok; // 200-299 status codes

      await ctx.runMutation(internal.monitors.recordUptimeCheck, {
        monitorId: args.monitorId,
        status: isUp ? "UP" : "DOWN",
        responseTime,
        statusCode: response.status,
      });

      // Send metrics to Graphite if configured
      await sendMetricsToGraphite(args.name, {
        status: isUp ? 1 : 0,
        responseTime,
        statusCode: response.status,
      });

      console.log(`✓ ${args.name}: ${isUp ? 'UP' : 'DOWN'} (${responseTime}ms, ${response.status})`);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await ctx.runMutation(internal.monitors.recordUptimeCheck, {
        monitorId: args.monitorId,
        status: "DOWN",
        responseTime,
        errorMessage,
      });

      // Send error metrics to Graphite
      await sendMetricsToGraphite(args.name, {
        status: 0,
        responseTime,
        error: 1,
      });

      console.log(`✗ ${args.name}: ERROR (${errorMessage})`);
    }
  },
});

// Check all active monitors
export const checkAllMonitors = internalAction({
  args: {},
  handler: async (ctx) => {
    const monitors = await ctx.runQuery(internal.monitors.getActiveMonitors, {});
    
    console.log(`Starting uptime checks for ${monitors.length} monitors`);
    
    // Run all checks in parallel
    const checkPromises = monitors.map((monitor: any) =>
      ctx.runAction(internal.monitoring.performUptimeCheck, {
        monitorId: monitor._id,
        url: monitor.url,
        name: monitor.name,
      })
    );

    await Promise.allSettled(checkPromises);
    console.log(`Completed uptime checks for ${monitors.length} monitors`);
  },
});

// Helper function to send metrics to Graphite
async function sendMetricsToGraphite(monitorName: string, metrics: Record<string, number>) {
  const graphiteHost = process.env.GRAPHITE_HOST;
  const graphitePort = process.env.GRAPHITE_PORT || '2003';
  
  if (!graphiteHost) {
    // Graphite not configured, skip
    return;
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const sanitizedName = monitorName.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    const metricLines = Object.entries(metrics).map(([key, value]) => 
      `uptime.${sanitizedName}.${key} ${value} ${timestamp}`
    ).join('\n');

    // Send to Graphite via TCP (plaintext protocol)
    const response = await fetch(`http://${graphiteHost}:${graphitePort}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: metricLines + '\n',
    });

    if (!response.ok) {
      console.warn(`Failed to send metrics to Graphite: ${response.status}`);
    }
  } catch (error) {
    console.warn('Error sending metrics to Graphite:', error);
  }
}
