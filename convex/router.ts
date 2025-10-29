import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Health check endpoint
http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    return new Response(JSON.stringify({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }),
});

// Metrics endpoint for Prometheus integration
http.route({
  path: "/metrics",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const monitors = await ctx.runQuery(internal.monitors.getActiveMonitors, {});
      
      let metrics = "# HELP uptime_monitor_status Monitor status (1=UP, 0=DOWN)\n";
      metrics += "# TYPE uptime_monitor_status gauge\n";
      
      for (const monitor of monitors) {
        const sanitizedName = monitor.name.replace(/[^a-zA-Z0-9_]/g, '_');
        // Note: In a real implementation, you'd fetch the latest stats here
        metrics += `uptime_monitor_status{name="${sanitizedName}",url="${monitor.url}"} 1\n`;
      }
      
      return new Response(metrics, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    } catch (error) {
      return new Response("Error generating metrics", { status: 500 });
    }
  }),
});

// Webhook endpoint for external integrations
http.route({
  path: "/webhook/status-change",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      
      // Example webhook payload:
      // {
      //   "monitorId": "...",
      //   "status": "DOWN",
      //   "url": "https://example.com",
      //   "responseTime": 5000
      // }
      
      console.log("Status change webhook received:", body);
      
      // Here you could integrate with external services:
      // - Send Slack notifications
      // - Create PagerDuty incidents
      // - Update external monitoring systems
      
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      return new Response("Invalid webhook payload", { status: 400 });
    }
  }),
});

export default http;
