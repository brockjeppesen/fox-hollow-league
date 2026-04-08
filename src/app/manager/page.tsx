"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { WeekOverview } from "@/components/manager/WeekOverview";
import { CreateWeekDialog } from "@/components/manager/CreateWeekDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  CheckCircle,
  Circle,
  Play,
  Pause,
  CalendarPlus,
  Grid3X3,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUpDown,
  Filter,
  AlertTriangle,
  ArrowUp,
} from "lucide-react";
import Link from "next/link";

type SortMode = "alpha" | "status" | "handicap";
type FilterMode = "all" | "submitted" | "pending";

export default function ManagerOverviewPage() {
  const allWeeks = useQuery(api.weeks.listAll);
  const autoWeek = useQuery(api.weeks.getCurrent);
  const [selectedWeekId, setSelectedWeekId] = useState<Id<"weeks"> | null>(null);

  // Player grid state
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("status");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  // Sort weeks by date for the selector
  const sortedWeeks = allWeeks
    ? [...allWeeks].sort((a, b) => a.playDate - b.playDate)
    : [];

  // Use selected week, or fall back to auto-detected current week
  const currentWeek = selectedWeekId
    ? sortedWeeks.find((w) => w._id === selectedWeekId) ?? autoWeek
    : autoWeek;

  const currentIndex = currentWeek
    ? sortedWeeks.findIndex((w) => w._id === currentWeek._id)
    : -1;

  const stats = useQuery(
    api.requests.getStats,
    currentWeek ? { weekId: currentWeek._id } : "skip"
  );
  const slotCounts = useQuery(
    api.requests.slotCounts,
    currentWeek ? { weekId: currentWeek._id } : "skip"
  );
  const teeSheet = useQuery(
    api.teeSheet.getByWeek,
    currentWeek ? { weekId: currentWeek._id } : "skip"
  );
  const waitlist = useQuery(
    api.requests.getWaitlist,
    currentWeek ? { weekId: currentWeek._id } : "skip"
  );
  const promoteFromWaitlist = useMutation(api.requests.promoteFromWaitlist);
  const updateStatus = useMutation(api.weeks.updateStatus);

  // Processed player list with search, filter, and sort
  const processedPlayers = useMemo(() => {
    if (!stats?.playerStatuses) return [];

    let players = [...stats.playerStatuses];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      players = players.filter((p) => p.name.toLowerCase().includes(q));
    }

    // Filter
    if (filterMode === "submitted") {
      players = players.filter((p) => p.submitted);
    } else if (filterMode === "pending") {
      players = players.filter((p) => !p.submitted);
    }

    // Sort
    if (sortMode === "alpha") {
      players.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortMode === "status") {
      players.sort((a, b) => {
        if (a.submitted !== b.submitted) return a.submitted ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    } else if (sortMode === "handicap") {
      players.sort((a, b) => {
        const hA = a.handicapIndex ?? 999;
        const hB = b.handicapIndex ?? 999;
        if (hA !== hB) return hA - hB;
        return a.name.localeCompare(b.name);
      });
    }

    return players;
  }, [stats?.playerStatuses, search, sortMode, filterMode]);

  const goToPrev = () => {
    if (currentIndex > 0) setSelectedWeekId(sortedWeeks[currentIndex - 1]._id);
  };
  const goToNext = () => {
    if (currentIndex < sortedWeeks.length - 1) setSelectedWeekId(sortedWeeks[currentIndex + 1]._id);
  };

  const getSlotDotClass = (timeSlot?: string) => {
    switch (timeSlot) {
      case "early": return "slot-dot slot-dot-early";
      case "mid": return "slot-dot slot-dot-mid";
      case "late": return "slot-dot slot-dot-late";
      default: return "slot-dot slot-dot-none";
    }
  };

  // Loading
  if (currentWeek === undefined) {
    return (
      <div className="p-6 md:p-10">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-green-800" />
        </div>
      </div>
    );
  }

  // No week created yet
  if (currentWeek === null) {
    return (
      <div className="p-6 md:p-10">
        <div className="mb-8">
          <h1 className="font-heading text-2xl md:text-3xl text-green-900">
            Overview
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your weekly league schedule
          </p>
        </div>

        <Card className="border-0 ring-1 ring-green-800/10 max-w-lg animate-scale-in">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-green-800/10 flex items-center justify-center mx-auto mb-4">
              <CalendarPlus className="w-8 h-8 text-green-800" />
            </div>
            <h2 className="font-heading text-xl mb-2">No Week Scheduled</h2>
            <p className="text-muted-foreground mb-6">
              Create a new week to get started with player submissions.
            </p>
            <CreateWeekDialog />
          </CardContent>
        </Card>
      </div>
    );
  }

  const openNextWeeks = useMutation(api.weeks.openNextWeeks);

  const handleToggleStatus = async () => {
    if (currentWeek.status === "open") {
      // Close current week — auto-opens next one
      await updateStatus({ id: currentWeek._id, status: "closed", autoOpenNext: true });
    } else if (currentWeek.status === "closed" || currentWeek.status === "draft") {
      await updateStatus({ id: currentWeek._id, status: "open" });
    }
  };

  const handleOpenNext3 = async () => {
    await openNextWeeks({ count: 3 });
  };

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl text-green-900">
            Overview
          </h1>
          {/* Week Selector */}
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={goToPrev}
              disabled={currentIndex <= 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Select
              value={currentWeek?._id}
              onValueChange={(val) => setSelectedWeekId(val as Id<"weeks">)}
            >
              <SelectTrigger className="w-full max-w-[320px] h-9 text-sm">
                {currentWeek ? (
                  <span className="truncate">
                    {new Date(currentWeek.playDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                    {" — "}
                    {(currentWeek.format || "TBD").substring(0, 25)}
                    {currentWeek.status === "open" ? " 🟢" : currentWeek.status === "closed" ? " 🔴" : ""}
                  </span>
                ) : (
                  <SelectValue placeholder="Select week..." />
                )}
              </SelectTrigger>
              <SelectContent>
                {sortedWeeks.map((w) => {
                  const date = new Date(w.playDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  });
                  const statusBadge = w.status === "open" ? " 🟢" : w.status === "closed" ? " 🔴" : "";
                  return (
                    <SelectItem key={w._id} value={w._id}>
                      {date} — {(w.format || "TBD").substring(0, 30)}{statusBadge}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={goToNext}
              disabled={currentIndex >= sortedWeeks.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleToggleStatus}
            variant={currentWeek.status === "open" ? "outline" : "default"}
            className={
              currentWeek.status === "open"
                ? "border-amber-600 text-amber-700 hover:bg-amber-600 hover:text-white"
                : "bg-green-800 text-cream hover:bg-green-700"
            }
          >
            {currentWeek.status === "open" ? (
              <>
                <Pause className="w-4 h-4 mr-1.5" />
                Close & Open Next
              </>
            ) : currentWeek.status === "closed" ? (
              <>
                <Play className="w-4 h-4 mr-1.5" />
                Reopen
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1.5" />
                Open Week
              </>
            )}
          </Button>
          <Button
            onClick={handleOpenNext3}
            variant="outline"
            className="border-green-800/30 text-green-800 hover:bg-green-800 hover:text-cream"
          >
            Open Next 3 Weeks
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Week Overview Card */}
        {stats && (
          <div className="animate-fade-in-delay">
            <WeekOverview
              playDate={currentWeek.playDate}
              deadline={currentWeek.deadline}
              status={currentWeek.status}
              submitted={stats.submitted}
              total={stats.total}
              playing={stats.playing}
            />
          </div>
        )}

        {/* Slot Distribution + Tee Sheet Status */}
        <div className="space-y-6 animate-fade-in-delay-2">
          {/* Slot Counts */}
          {slotCounts && (
            <Card className="border-0 ring-1 ring-green-800/10">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brass" />
                  Time Slot Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 animate-stagger">
                  {[
                    {
                      label: "Early",
                      desc: "3:00–3:30",
                      count: slotCounts.early,
                      color: "bg-green-700/20 text-green-900",
                      dot: "slot-dot-early",
                    },
                    {
                      label: "Mid",
                      desc: "3:30–4:15",
                      count: slotCounts.mid,
                      color: "bg-blue-700/10 text-blue-900",
                      dot: "slot-dot-mid",
                    },
                    {
                      label: "Late",
                      desc: "4:15–5:00",
                      count: slotCounts.late,
                      color: "bg-amber-700/10 text-amber-900",
                      dot: "slot-dot-late",
                    },
                    {
                      label: "No Pref",
                      desc: "Any time",
                      count: slotCounts.no_preference,
                      color: "bg-cream-dark/50 text-muted-foreground",
                      dot: "slot-dot-none",
                    },
                  ].map((slot) => (
                    <div
                      key={slot.label}
                      className={`rounded-xl p-4 ${slot.color} premium-card`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`slot-dot ${slot.dot}`} />
                        <span className="text-sm font-medium">{slot.label}</span>
                      </div>
                      <div className="text-3xl font-heading font-bold leading-none mt-1">
                        {slot.count}
                      </div>
                      <div className="text-xs opacity-50 mt-1">{slot.desc}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tee Sheet Quick Status */}
          <Card className="border-0 ring-1 ring-green-800/10 premium-card">
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-800/10 flex items-center justify-center">
                    <Grid3X3 className="w-5 h-5 text-green-800" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Tee Sheet</p>
                    <p className="text-xs text-muted-foreground">
                      {teeSheet
                        ? `${teeSheet.status === "published" ? "Published" : "Draft"} — ${teeSheet.groups.length} groups`
                        : "Not generated yet"}
                    </p>
                  </div>
                </div>
                <Link href="/manager/tee-sheet">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-800/20 text-green-800"
                  >
                    {teeSheet ? "View" : "Generate"}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Waitlist */}
          {waitlist && waitlist.length > 0 && (
            <Card className="border-0 ring-1 ring-orange-300/30 bg-orange-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Waitlist ({waitlist.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {waitlist.map((req) => (
                    <div
                      key={req._id}
                      className="flex items-center justify-between px-3 py-2 bg-white rounded-lg"
                    >
                      <div>
                        <span className="font-medium text-sm text-green-900">
                          {req.playerName}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {req.timeSlot ?? "No pref"}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 min-w-[44px] text-xs border-green-800/20 text-green-800 hover:bg-green-800 hover:text-cream"
                        onClick={() => promoteFromWaitlist({ requestId: req._id })}
                      >
                        <ArrowUp className="w-3 h-3 mr-1" />
                        Promote
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ═══════════════════════════════════════
            PLAYER STATUS GRID — Premium overhaul
            ═══════════════════════════════════════ */}
        {stats && (
          <Card className="border-0 ring-1 ring-green-800/10 lg:col-span-2">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Player Status</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-semibold text-green-800">{stats.playing}</span> playing
                    {" · "}
                    <span className="font-semibold text-green-800">{stats.notPlaying}</span> not playing
                    {" · "}
                    <span className="font-semibold text-brass">{stats.total - stats.submitted}</span> pending
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                  {/* Search */}
                  <div className="relative w-full sm:w-auto">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search players..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="search-input h-9 pl-9 pr-3 rounded-lg border border-cream-dark bg-white text-sm w-full sm:w-48 focus:outline-none"
                    />
                  </div>

                  {/* Filter */}
                  <Select value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)}>
                    <SelectTrigger className="h-9 w-[calc(50%-4px)] sm:w-[120px] text-sm">
                      <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort */}
                  <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                    <SelectTrigger className="h-9 w-[calc(50%-4px)] sm:w-[140px] text-sm">
                      <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="status">By Status</SelectItem>
                      <SelectItem value="alpha">Alphabetical</SelectItem>
                      <SelectItem value="handicap">By Handicap</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {processedPlayers.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">
                  {search ? "No players match your search." : "No active players in the roster yet."}
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 animate-stagger">
                  {processedPlayers.map((player) => (
                    <div
                      key={player._id}
                      className={`player-tile flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm cursor-default ${
                        player.submitted
                          ? player.playing
                            ? "bg-green-800/5 ring-1 ring-green-800/10 text-green-900"
                            : "bg-red-50 ring-1 ring-red-200/50 text-red-900/70"
                          : "bg-cream-dark/40 text-muted-foreground"
                      }`}
                    >
                      {/* Status icon */}
                      {player.submitted ? (
                        player.playing ? (
                          <CheckCircle className="w-4 h-4 text-green-700 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-red-400 shrink-0" />
                        )
                      ) : (
                        <Circle className="w-4 h-4 text-cream-dark shrink-0" />
                      )}

                      {/* Name + handicap */}
                      <div className="flex-1 min-w-0">
                        <span className="truncate block leading-tight">{player.name}</span>
                        {player.handicapIndex !== undefined && (
                          <span className="text-[10px] text-muted-foreground leading-none">
                            {player.handicapIndex.toFixed(1)}
                          </span>
                        )}
                      </div>

                      {/* Time slot dot for submitted+playing players */}
                      {player.submitted && player.playing && (
                        <span className={getSlotDotClass(player.timeSlot)} title={player.timeSlot || "No preference"} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-cream-dark/80 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="slot-dot slot-dot-early" /> Early
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="slot-dot slot-dot-mid" /> Mid
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="slot-dot slot-dot-late" /> Late
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="slot-dot slot-dot-none" /> No Pref
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
