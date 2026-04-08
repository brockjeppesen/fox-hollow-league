import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Auto-close open weeks past their deadline and auto-open next week
crons.interval(
  "auto-close-weeks",
  { minutes: 15 },
  internal.weeks.autoCloseExpired,
);

export default crons;
