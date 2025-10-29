import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run uptime checks every minute
crons.interval(
  "uptime checks",
  { minutes: 1 },
  internal.monitoring.checkAllMonitors,
  {}
);

export default crons;
