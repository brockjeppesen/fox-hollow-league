"use client";

import { useState } from "react";
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
} from "lucide-react";
import Link from "next/link";

export default function ManagerOverviewPage() {
  const allWeeks = useQuery(api.weeks.listAll);
  const autoWeek = useQuery(api.weeks.getCurrent);
  const [selectedWeekId, setSelectedWeekId] = useState<Id<"weeks"> | null>(null);

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
  const updateStatus = useMutation(api.weeks.updateStatus);

  const goToPrev = () => {
    if (currentIndex > 0) setSelectedWeekId(sortedWeeks[currentIndex - 1]._id);
  };
  const goToNext = () => {
    if (currentIndex < sortedWeeks.length - 1) setSelectedWeekId(sortedWeeks[currentIndex + 1]._id);
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

        <Card className="border-0 ring-1 ring-green-800/10 max-w-lg">
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

  const handleToggleStatus = async () => {
    const newStatus = currentWeek.status === "open" ? "closed" : "open";
    await updateStatus({ id: currentWeek._id, status: newStatus });
  };

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
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
              <SelectTrigger className="w-[280px] h-9 text-sm">
                <SelectValue placeholder="Select week..." />
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
        <div className="flex items-center gap-3">
          <Button
            onClick={handleToggleStatus}
            variant={currentWeek.status === "open" ? "outline" : "default"}
            className={
              currentWeek.status === "open"
                ? "border-green-800 text-green-800 hover:bg-green-800 hover:text-cream"
                : "bg-green-800 text-cream hover:bg-green-700"
            }
          >
            {currentWeek.status === "open" ? (
              <>
                <Pause className="w-4 h-4 mr-1.5" />
                Close Submissions
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1.5" />
                Open Submissions
              </>
            )}
          </Button>
          <CreateWeekDialog />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Week Overview Card */}
        {stats && (
          <WeekOverview
            playDate={currentWeek.playDate}
            deadline={currentWeek.deadline}
            status={currentWeek.status}
            submitted={stats.submitted}
            total={stats.total}
            playing={stats.playing}
          />
        )}

        {/* Slot Distribution + Tee Sheet Status */}
        <div className="space-y-6">
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
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Early",
                      desc: "3:00–3:30",
                      count: slotCounts.early,
                      color: "bg-green-700/20 text-green-900",
                    },
                    {
                      label: "Mid",
                      desc: "3:30–4:15",
                      count: slotCounts.mid,
                      color: "bg-blue-700/10 text-blue-900",
                    },
                    {
                      label: "Late",
                      desc: "4:15–5:00",
                      count: slotCounts.late,
                      color: "bg-amber-700/10 text-amber-900",
                    },
                    {
                      label: "No Pref",
                      desc: "Any time",
                      count: slotCounts.no_preference,
                      color: "bg-cream-dark/50 text-muted-foreground",
                    },
                  ].map((slot) => (
                    <div
                      key={slot.label}
                      className={`rounded-lg p-3 ${slot.color}`}
                    >
                      <div className="text-2xl font-heading font-bold">
                        {slot.count}
                      </div>
                      <div className="text-sm font-medium">{slot.label}</div>
                      <div className="text-xs opacity-60">{slot.desc}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tee Sheet Quick Status */}
          <Card className="border-0 ring-1 ring-green-800/10">
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
        </div>

        {/* Player Grid */}
        {stats && (
          <Card className="border-0 ring-1 ring-green-800/10 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">Player Status</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.playerStatuses.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">
                  No active players in the roster yet.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {stats.playerStatuses.map((player) => (
                    <div
                      key={player._id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                        player.submitted
                          ? "bg-green-800/5 text-green-900"
                          : "bg-cream-dark/50 text-muted-foreground"
                      }`}
                    >
                      {player.submitted ? (
                        <CheckCircle className="w-4 h-4 text-green-700 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-cream-dark shrink-0" />
                      )}
                      <span className="truncate">{player.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
