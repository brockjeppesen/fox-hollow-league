"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CreateWeekDialog } from "@/components/manager/CreateWeekDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Calendar,
  CalendarPlus,
  Play,
  Lock,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Users,
  Clock,
  Filter,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

type WeekDoc = {
  _id: Id<"weeks">;
  playDate: number;
  deadline: number;
  format?: string;
  status: string;
};

type FilterMode = "upcoming" | "past" | "all";

function statusBadge(status: string) {
  switch (status) {
    case "open":
      return (
        <Badge className="bg-green-800 text-cream text-xs">
          <Play className="w-3 h-3 mr-1" />
          Open
        </Badge>
      );
    case "closed":
      return (
        <Badge variant="outline" className="border-amber-600 text-amber-700 text-xs">
          <Lock className="w-3 h-3 mr-1" />
          Closed
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-brass/20 text-brass border border-brass/30 text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    case "draft":
    default:
      return (
        <Badge
          variant="secondary"
          className="bg-cream-dark text-muted-foreground text-xs"
        >
          Draft
        </Badge>
      );
  }
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}`;
}

// Group weeks by month
function groupByMonth(weeks: WeekDoc[]): Map<string, { label: string; weeks: WeekDoc[] }> {
  const groups = new Map<string, { label: string; weeks: WeekDoc[] }>();
  for (const week of weeks) {
    const d = new Date(week.playDate);
    const key = getMonthKey(d);
    if (!groups.has(key)) {
      groups.set(key, { label: formatMonthYear(d), weeks: [] });
    }
    groups.get(key)!.weeks.push(week);
  }
  return groups;
}

export default function SchedulePage() {
  const weeks = useQuery(api.weeks.listAll);
  const currentWeek = useQuery(api.weeks.getCurrent);
  const updateStatus = useMutation(api.weeks.updateStatus);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>("upcoming");
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const currentWeekRef = useRef<HTMLDivElement>(null);
  const [hasScrolled, setHasScrolled] = useState(false);

  const now = Date.now();
  const currentMonthKey = getMonthKey(new Date());

  // Sort weeks by playDate ascending
  const sortedWeeks = useMemo(() => {
    if (!weeks) return [];
    return [...weeks].sort((a, b) => a.playDate - b.playDate);
  }, [weeks]);

  // Get all week IDs for submission counts query
  const weekIds = useMemo(
    () => sortedWeeks.map((w) => w._id),
    [sortedWeeks]
  );

  const submissionCounts = useQuery(
    api.requests.getSubmissionCounts,
    weekIds.length > 0 ? { weekIds } : "skip"
  );

  // Filter weeks based on current filter mode
  const filteredWeeks = useMemo(() => {
    if (filter === "all") return sortedWeeks;
    if (filter === "upcoming") {
      // Show current week + future weeks, plus any open/draft weeks
      return sortedWeeks.filter(
        (w) => w.playDate >= now || w.status === "open" || w.status === "draft"
      );
    }
    // past: completed or past-date weeks
    return sortedWeeks.filter(
      (w) => w.playDate < now || w.status === "completed"
    );
  }, [sortedWeeks, filter, now]);

  // Group into months
  const monthGroups = useMemo(() => groupByMonth(filteredWeeks), [filteredWeeks]);

  // Season progress stats
  const seasonStats = useMemo(() => {
    const total = sortedWeeks.length;
    const completed = sortedWeeks.filter((w) => w.status === "completed").length;
    const open = sortedWeeks.filter((w) => w.status === "open").length;
    const closed = sortedWeeks.filter((w) => w.status === "closed").length;
    const draft = sortedWeeks.filter((w) => w.status === "draft").length;
    const progress = total > 0 ? ((completed + closed) / total) * 100 : 0;
    // Find current week number (index of current/open week)
    const currentIdx = sortedWeeks.findIndex(
      (w) => currentWeek && w._id === currentWeek._id
    );
    return {
      total,
      completed,
      open,
      closed,
      draft,
      progress,
      currentWeekNum: currentIdx >= 0 ? currentIdx + 1 : null,
    };
  }, [sortedWeeks, currentWeek]);

  // Initialize collapsed months: past months collapsed, current/future expanded
  useEffect(() => {
    if (!weeks || weeks.length === 0) return;
    const pastMonths = new Set<string>();
    const sorted = [...weeks].sort((a, b) => a.playDate - b.playDate);
    for (const week of sorted) {
      const key = getMonthKey(new Date(week.playDate));
      if (key < currentMonthKey) {
        pastMonths.add(key);
      }
    }
    setCollapsedMonths(pastMonths);
  }, [weeks, currentMonthKey]);

  // Auto-scroll to current week
  useEffect(() => {
    if (!hasScrolled && currentWeekRef.current && currentWeek) {
      // Wait a tick for DOM rendering
      const timer = setTimeout(() => {
        currentWeekRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        setHasScrolled(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentWeek, hasScrolled, filteredWeeks]);

  if (weeks === undefined) {
    return (
      <div className="p-6 md:p-10">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-green-800" />
        </div>
      </div>
    );
  }

  const handleStatusChange = async (
    weekId: Id<"weeks">,
    newStatus: string
  ) => {
    setUpdatingId(weekId);
    try {
      await updateStatus({ id: weekId, status: newStatus });
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleMonth = (monthKey: string) => {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(monthKey)) {
        next.delete(monthKey);
      } else {
        next.add(monthKey);
      }
      return next;
    });
  };

  // Find next draft week to open
  const nextDraft = sortedWeeks.find(
    (w) => w.status === "draft" && w.playDate >= now
  );
  const currentOpen = sortedWeeks.find((w) => w.status === "open");

  return (
    <div className="p-4 md:p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl text-green-900">
            Season Schedule
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {sortedWeeks.length} week{sortedWeeks.length !== 1 ? "s" : ""}{" "}
            scheduled
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {currentOpen && (
            <Button
              variant="outline"
              size="sm"
              className="border-amber-600 text-amber-700 hover:bg-amber-50"
              onClick={() => handleStatusChange(currentOpen._id, "closed")}
              disabled={updatingId === currentOpen._id}
            >
              {updatingId === currentOpen._id ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <Lock className="w-4 h-4 mr-1.5" />
              )}
              Close Week
            </Button>
          )}
          {nextDraft && (
            <Button
              size="sm"
              className="bg-green-800 text-cream hover:bg-green-700"
              onClick={() => handleStatusChange(nextDraft._id, "open")}
              disabled={updatingId === nextDraft._id}
            >
              {updatingId === nextDraft._id ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <Play className="w-4 h-4 mr-1.5" />
              )}
              Open Next
            </Button>
          )}
          <CreateWeekDialog />
        </div>
      </div>

      {/* Season Progress Bar */}
      {sortedWeeks.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-white ring-1 ring-green-800/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <span className="text-sm font-medium text-green-900">
              {seasonStats.currentWeekNum
                ? `Week ${seasonStats.currentWeekNum} of ${seasonStats.total}`
                : `${seasonStats.total} weeks`}
              <span className="text-muted-foreground ml-1">
                • {Math.round(seasonStats.progress)}% complete
              </span>
            </span>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-800 inline-block" />
                {seasonStats.completed} done
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                {seasonStats.open + seasonStats.closed} active
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cream-dark inline-block" />
                {seasonStats.draft} upcoming
              </span>
            </div>
          </div>
          <div className="w-full h-2.5 bg-cream-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-green-800 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${seasonStats.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      {sortedWeeks.length > 0 && (
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {(["upcoming", "all", "past"] as FilterMode[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === f
                  ? "bg-green-800 text-cream"
                  : "bg-cream-dark text-muted-foreground hover:bg-cream-dark/80"
              }`}
            >
              {f === "upcoming" ? "Upcoming" : f === "past" ? "Past" : "All"}
            </button>
          ))}
        </div>
      )}

      {/* Week list */}
      {sortedWeeks.length === 0 ? (
        <div className="border-0 ring-1 ring-green-800/10 rounded-xl max-w-lg">
          <div className="py-12 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-green-800/10 flex items-center justify-center mx-auto mb-4">
              <CalendarPlus className="w-8 h-8 text-green-800" />
            </div>
            <h2 className="font-heading text-xl mb-2">No Weeks Scheduled</h2>
            <p className="text-muted-foreground mb-6">
              Create weeks to build out the season schedule.
            </p>
            <CreateWeekDialog />
          </div>
        </div>
      ) : filteredWeeks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No weeks match the current filter.</p>
          <button
            onClick={() => setFilter("all")}
            className="text-green-800 underline mt-2 text-sm"
          >
            Show all weeks
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(monthGroups.entries()).map(([monthKey, { label, weeks: monthWeeks }]) => {
            const isCollapsed = collapsedMonths.has(monthKey);
            const isPastMonth = monthKey < currentMonthKey;
            const monthSubmitted = monthWeeks.reduce((acc, w) => {
              const counts = submissionCounts?.[w._id];
              return acc + (counts?.submitted ?? 0);
            }, 0);

            return (
              <div key={monthKey}>
                {/* Month Header */}
                <button
                  onClick={() => toggleMonth(monthKey)}
                  className={`flex items-center gap-2 w-full text-left mb-3 group ${
                    isPastMonth ? "opacity-60" : ""
                  }`}
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-green-800 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-green-800 shrink-0" />
                  )}
                  <h2 className="font-heading text-lg text-green-900 group-hover:text-green-700 transition-colors">
                    {label}
                  </h2>
                  <span className="text-xs text-muted-foreground ml-1">
                    {monthWeeks.length} week{monthWeeks.length !== 1 ? "s" : ""}
                    {monthSubmitted > 0 && ` • ${monthSubmitted} submissions`}
                  </span>
                  <div className="flex-1 border-b border-cream-dark ml-3" />
                </button>

                {/* Week Cards with Timeline */}
                {!isCollapsed && (
                  <div className="relative pl-7 md:pl-9">
                    {/* Vertical timeline line */}
                    <div className="absolute left-[11px] md:left-[15px] top-3 bottom-3 w-0.5 bg-cream-dark" />

                    <div className="space-y-2">
                      {monthWeeks.map((week, idx) => {
                        const isCurrent = currentWeek?._id === week._id;
                        const playDate = new Date(week.playDate);
                        const isPast = week.playDate < now && week.status !== "open";
                        const counts = submissionCounts?.[week._id];

                        const dayStr = playDate.toLocaleDateString("en-US", {
                          weekday: "short",
                        });
                        const dateStr = playDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });

                        const deadlineDate = new Date(week.deadline);
                        const deadlineStr = deadlineDate.toLocaleDateString(
                          "en-US",
                          {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          }
                        );

                        return (
                          <div
                            key={week._id}
                            ref={isCurrent ? currentWeekRef : undefined}
                            className="relative"
                          >
                            {/* Timeline dot */}
                            <div
                              className={`absolute z-10 rounded-full border-2 border-white ${
                                isCurrent
                                  ? "w-4 h-4 bg-green-800 -left-[23px] md:-left-[27px] top-5 ring-4 ring-green-800/20"
                                  : isPast
                                    ? "w-2.5 h-2.5 bg-cream-dark -left-[20px] md:-left-[24px] top-[22px]"
                                    : "w-3 h-3 bg-green-800/40 -left-[21px] md:-left-[25px] top-[21px]"
                              }`}
                            />

                            {/* Week Card */}
                            <div
                              className={`rounded-xl p-4 transition-all ${
                                isCurrent
                                  ? "bg-green-800/5 ring-2 ring-green-800/20 shadow-sm"
                                  : isPast
                                    ? "bg-cream-dark/20 opacity-70"
                                    : "bg-white ring-1 ring-green-800/5 hover:ring-green-800/15 hover:shadow-sm"
                              }`}
                            >
                              {/* Mobile: stacked layout */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                {/* Date block */}
                                <div className="flex items-center gap-3 sm:min-w-[140px]">
                                  <div
                                    className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 ${
                                      isCurrent
                                        ? "bg-green-800 text-cream"
                                        : isPast
                                          ? "bg-cream-dark text-muted-foreground"
                                          : "bg-green-800/10 text-green-800"
                                    }`}
                                  >
                                    <span className="text-[10px] font-medium uppercase leading-none">
                                      {dayStr}
                                    </span>
                                    <span className="text-lg font-bold leading-tight">
                                      {playDate.getDate()}
                                    </span>
                                  </div>
                                  <div className="sm:hidden">
                                    <div className="flex items-center gap-2">
                                      {week.format && (
                                        <span className="font-medium text-sm text-green-900">
                                          {week.format}
                                        </span>
                                      )}
                                      {isCurrent && (
                                        <span className="text-[10px] bg-green-800 text-cream px-1.5 py-0.5 rounded-full font-medium">
                                          Current
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {dateStr}
                                    </span>
                                  </div>
                                </div>

                                {/* Details - desktop */}
                                <div className="hidden sm:flex flex-col flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    {week.format ? (
                                      <span
                                        className={`font-medium text-sm ${isPast ? "text-muted-foreground" : "text-green-900"}`}
                                      >
                                        {week.format}
                                      </span>
                                    ) : (
                                      <span
                                        className={`text-sm ${isPast ? "text-muted-foreground" : "text-green-900"}`}
                                      >
                                        {dateStr}
                                      </span>
                                    )}
                                    {isCurrent && (
                                      <span className="text-[10px] bg-green-800 text-cream px-2 py-0.5 rounded-full font-medium">
                                        Current
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {deadlineStr}
                                    </span>
                                    {counts && (week.status === "open" || week.status === "closed" || week.status === "completed") && (
                                      <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {counts.playing} playing • {counts.submitted} submitted
                                      </span>
                                    )}
                                    {week.status === "draft" && counts && counts.submitted > 0 && (
                                      <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {counts.submitted} early submissions
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Mobile: details row */}
                                <div className="sm:hidden flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {deadlineStr}
                                  </span>
                                  {counts && (week.status === "open" || week.status === "closed" || week.status === "completed") && (
                                    <span className="flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      {counts.playing}/{counts.submitted}
                                    </span>
                                  )}
                                </div>

                                {/* Right side: status + actions */}
                                <div className="flex items-center gap-2 sm:ml-auto shrink-0">
                                  {statusBadge(week.status)}

                                  {week.status === "draft" && !isPast && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleStatusChange(week._id, "open")
                                      }
                                      disabled={updatingId === week._id}
                                      className="text-xs text-green-800 hover:text-green-900 hover:bg-green-800/5 h-7 px-2"
                                    >
                                      {updatingId === week._id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <>
                                          <Play className="w-3 h-3 mr-1" />
                                          Open
                                        </>
                                      )}
                                    </Button>
                                  )}
                                  {week.status === "open" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleStatusChange(week._id, "closed")
                                      }
                                      disabled={updatingId === week._id}
                                      className="text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50 h-7 px-2"
                                    >
                                      {updatingId === week._id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <>
                                          <Lock className="w-3 h-3 mr-1" />
                                          Close
                                        </>
                                      )}
                                    </Button>
                                  )}
                                  {week.status === "closed" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleStatusChange(
                                          week._id,
                                          "completed"
                                        )
                                      }
                                      disabled={updatingId === week._id}
                                      className="text-xs text-brass hover:text-brass-light hover:bg-brass/5 h-7 px-2"
                                    >
                                      {updatingId === week._id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <>
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Complete
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
