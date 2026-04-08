"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Clock,
  ChevronDown,
  ChevronRight,
  Users,
  CalendarDays,
} from "lucide-react";

function WeekTeeSheet({ weekId }: { weekId: Id<"weeks"> }) {
  const teeSheet = useQuery(api.teeSheet.getByWeek, { weekId });
  const allPlayers = useQuery(api.players.listAll);

  const playerMap = new Map<
    string,
    { name: string; handicapIndex?: number }
  >();
  if (allPlayers) {
    for (const p of allPlayers) {
      playerMap.set(p._id, p);
    }
  }

  if (teeSheet === undefined) {
    return (
      <div className="py-4 flex justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-green-800" />
      </div>
    );
  }

  if (!teeSheet) {
    return (
      <p className="text-muted-foreground text-sm py-3 pl-4">
        No tee sheet was generated for this week.
      </p>
    );
  }

  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 px-1">
        <Badge
          variant={teeSheet.status === "published" ? "default" : "secondary"}
          className={
            teeSheet.status === "published"
              ? "bg-green-800 text-cream text-[10px]"
              : "text-[10px]"
          }
        >
          {teeSheet.status === "published" ? "Published" : "Draft"}
        </Badge>
        <span>
          <Users className="w-3 h-3 inline mr-1" />
          {teeSheet.groups.reduce(
            (sum: number, g: any) => sum + g.players.length,
            0
          )}{" "}
          players in {teeSheet.groups.length} groups
        </span>
      </div>
      {teeSheet.groups.map((group: any, idx: number) => (
        <div
          key={idx}
          className="flex items-start gap-3 px-4 py-2.5 bg-white/60 rounded-xl"
        >
          <span className="font-medium text-sm text-green-900 whitespace-nowrap min-w-[70px]">
            {group.teeTime}
          </span>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
            {group.players.map((pid: string, pIdx: number) => {
              const player = playerMap.get(pid);
              return (
                <span key={pIdx}>
                  {player?.name ?? "Unknown"}
                  {player?.handicapIndex !== undefined && (
                    <span className="text-xs text-muted-foreground/60 ml-0.5">
                      ({player.handicapIndex.toFixed(1)})
                    </span>
                  )}
                  {pIdx < group.players.length - 1 && ","}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function WeekSubmissionStats({ weekId }: { weekId: Id<"weeks"> }) {
  const stats = useQuery(api.requests.getStats, { weekId });

  if (!stats) return null;

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span>
        <strong className="text-green-900">{stats.playing}</strong> played
      </span>
      <span>
        <strong className="text-green-900">{stats.submitted}</strong> submitted
      </span>
    </div>
  );
}

export default function HistoryPage() {
  const weeks = useQuery(api.weeks.listCompleted);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  if (weeks === undefined) {
    return (
      <div className="p-6 md:p-10">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-green-800" />
        </div>
      </div>
    );
  }

  const pastWeeks = weeks.filter(
    (w) => w.playDate < Date.now() || w.status === "closed"
  );

  return (
    <div className="p-6 md:p-10">
      <div className="mb-6 animate-fade-in">
        <h1 className="font-heading text-2xl md:text-3xl text-green-900">
          History
        </h1>
        <p className="text-muted-foreground mt-1">
          Past weeks and published tee sheets
        </p>
      </div>

      {pastWeeks.length === 0 ? (
        <Card className="border-0 ring-1 ring-green-800/10 max-w-lg">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-green-800/10 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-green-800" />
            </div>
            <h2 className="font-heading text-xl mb-2">No History Yet</h2>
            <p className="text-muted-foreground">
              Completed weeks will appear here after they&apos;ve been played.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 animate-stagger-slow">
          {pastWeeks.map((week) => {
            const isExpanded = expandedWeek === week._id;
            const dateStr = new Date(week.playDate).toLocaleDateString(
              "en-US",
              {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              }
            );

            return (
              <Card
                key={week._id}
                className="border-0 ring-1 ring-green-800/10 overflow-hidden"
              >
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-green-800/[0.02] transition-colors"
                  onClick={() =>
                    setExpandedWeek(isExpanded ? null : week._id)
                  }
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-800/10 flex items-center justify-center shrink-0">
                      <CalendarDays className="w-5 h-5 text-green-800" />
                    </div>
                    <div>
                      <p className="font-medium text-green-900">{dateStr}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {week.format && (
                          <span className="text-xs text-muted-foreground">
                            {week.format}
                          </span>
                        )}
                        <WeekSubmissionStats weekId={week._id} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={
                        week.status === "closed"
                          ? "bg-red-50 text-red-700 text-[10px]"
                          : week.status === "open"
                            ? "bg-green-50 text-green-700 text-[10px]"
                            : "text-[10px]"
                      }
                    >
                      {week.status}
                    </Badge>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-cream-dark/50 animate-fade-in">
                    <WeekTeeSheet weekId={week._id} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
