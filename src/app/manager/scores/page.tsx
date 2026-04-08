"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Trophy,
  Save,
  CheckCircle,
} from "lucide-react";

interface ScoreRow {
  playerId: Id<"players">;
  playerName: string;
  playerHandicap?: number;
  grossScore: string;
  netScore: string;
  points: string;
}

export default function ScoresPage() {
  const allWeeks = useQuery(api.weeks.listAll);
  const allPlayers = useQuery(api.players.listAll);
  const [selectedWeekId, setSelectedWeekId] = useState<Id<"weeks"> | "">("");
  const [scoreRows, setScoreRows] = useState<ScoreRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const existingScores = useQuery(
    api.scores.getByWeek,
    selectedWeekId ? { weekId: selectedWeekId as Id<"weeks"> } : "skip"
  );

  const teeSheet = useQuery(
    api.teeSheet.getByWeek,
    selectedWeekId ? { weekId: selectedWeekId as Id<"weeks"> } : "skip"
  );

  const enterBatch = useMutation(api.scores.enterBatch);
  const recalculate = useMutation(api.standings.recalculate);

  // Sort weeks by date for selector
  const sortedWeeks = allWeeks
    ? [...allWeeks].sort((a, b) => b.playDate - a.playDate)
    : [];

  // Build player list from tee sheet groups
  useEffect(() => {
    if (!selectedWeekId || !allPlayers) return;

    // Get players who played this week from tee sheet
    const playedPlayerIds = new Set<string>();
    if (teeSheet) {
      for (const group of teeSheet.groups) {
        for (const pid of group.players) {
          playedPlayerIds.add(pid);
        }
      }
    }

    // Build score rows for players in the tee sheet
    const players = allPlayers.filter((p) => playedPlayerIds.has(p._id));

    const rows: ScoreRow[] = players.map((p) => {
      const existing = existingScores?.find((s) => s.playerId === p._id);
      return {
        playerId: p._id,
        playerName: p.name,
        playerHandicap: p.handicapIndex,
        grossScore: existing?.grossScore?.toString() ?? "",
        netScore: existing?.netScore?.toString() ?? "",
        points: existing?.points?.toString() ?? "",
      };
    });

    rows.sort((a, b) => a.playerName.localeCompare(b.playerName));
    setScoreRows(rows);
    setSaved(false);
  }, [selectedWeekId, teeSheet, existingScores, allPlayers]);

  const updateRow = (
    idx: number,
    field: "grossScore" | "netScore" | "points",
    value: string
  ) => {
    setScoreRows((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selectedWeekId) return;
    setSaving(true);
    try {
      const scores = scoreRows
        .filter((r) => r.grossScore || r.netScore || r.points)
        .map((r) => ({
          weekId: selectedWeekId as Id<"weeks">,
          playerId: r.playerId,
          grossScore: r.grossScore ? parseFloat(r.grossScore) : undefined,
          netScore: r.netScore ? parseFloat(r.netScore) : undefined,
          points: r.points ? parseFloat(r.points) : undefined,
        }));

      await enterBatch({ scores });
      await recalculate({});
      setSaved(true);
    } catch (error) {
      console.error("Failed to save scores:", error);
    } finally {
      setSaving(false);
    }
  };

  if (allWeeks === undefined) {
    return (
      <div className="p-6 md:p-10">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-green-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 animate-fade-in">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl text-green-900">
            Scores
          </h1>
          <p className="text-muted-foreground mt-1">
            Enter scores for each week
          </p>
        </div>
      </div>

      {/* Week Selector */}
      <div className="mb-6 animate-fade-in-delay">
        <Select
          value={selectedWeekId || undefined}
          onValueChange={(val) => setSelectedWeekId(val as Id<"weeks">)}
        >
          <SelectTrigger className="w-full sm:w-[360px] h-10">
            <SelectValue placeholder="Select a week..." />
          </SelectTrigger>
          <SelectContent>
            {sortedWeeks.map((w) => {
              const date = new Date(w.playDate).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              return (
                <SelectItem key={w._id} value={w._id}>
                  {date}
                  {w.format ? ` — ${w.format.substring(0, 40)}` : ""}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {!selectedWeekId ? (
        <Card className="border-0 ring-1 ring-green-800/10 max-w-lg">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-green-800/10 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-green-800" />
            </div>
            <h2 className="font-heading text-xl mb-2">Select a Week</h2>
            <p className="text-muted-foreground">
              Choose a week above to enter or view scores.
            </p>
          </CardContent>
        </Card>
      ) : scoreRows.length === 0 ? (
        <Card className="border-0 ring-1 ring-green-800/10 max-w-lg">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No tee sheet found for this week. Generate a tee sheet first.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 ring-1 ring-green-800/10">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <Trophy className="w-5 h-5 text-brass" />
                {scoreRows.length} Players
              </CardTitle>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-800 text-cream hover:bg-green-700"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : saved ? (
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                ) : (
                  <Save className="w-4 h-4 mr-1.5" />
                )}
                {saved ? "Saved!" : "Save All"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* ═══ Desktop Table ═══ */}
            <div className="hidden sm:block">
              <div className="grid grid-cols-[1fr_80px_80px_80px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-cream-dark/80 mb-1">
                <span>Player</span>
                <span className="text-center">Gross</span>
                <span className="text-center">Net</span>
                <span className="text-center">Points</span>
              </div>

              <div className="space-y-1 animate-stagger">
                {scoreRows.map((row, idx) => (
                  <div
                    key={row.playerId}
                    className="grid grid-cols-[1fr_80px_80px_80px] gap-2 items-center px-3 py-2 rounded-xl hover:bg-green-800/[0.02] transition-colors"
                  >
                    <div>
                      <span className="font-medium text-sm text-green-900">
                        {row.playerName}
                      </span>
                      {row.playerHandicap !== undefined && (
                        <span className="text-xs text-muted-foreground ml-1.5">
                          ({row.playerHandicap.toFixed(1)})
                        </span>
                      )}
                    </div>
                    <Input
                      type="number"
                      value={row.grossScore}
                      onChange={(e) =>
                        updateRow(idx, "grossScore", e.target.value)
                      }
                      className="h-8 text-center text-sm"
                      placeholder="—"
                    />
                    <Input
                      type="number"
                      value={row.netScore}
                      onChange={(e) =>
                        updateRow(idx, "netScore", e.target.value)
                      }
                      className="h-8 text-center text-sm"
                      placeholder="—"
                    />
                    <Input
                      type="number"
                      value={row.points}
                      onChange={(e) =>
                        updateRow(idx, "points", e.target.value)
                      }
                      className="h-8 text-center text-sm"
                      placeholder="—"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ Mobile Cards ═══ */}
            <div className="sm:hidden space-y-3 animate-stagger-slow">
              {scoreRows.map((row, idx) => (
                <div
                  key={row.playerId}
                  className="rounded-xl bg-white/60 ring-1 ring-green-800/5 p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium text-sm text-green-900">
                        {row.playerName}
                      </span>
                      {row.playerHandicap !== undefined && (
                        <span className="text-xs text-muted-foreground ml-1.5">
                          ({row.playerHandicap.toFixed(1)})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Gross</label>
                      <Input
                        type="number"
                        value={row.grossScore}
                        onChange={(e) =>
                          updateRow(idx, "grossScore", e.target.value)
                        }
                        className="h-10 text-center text-sm"
                        placeholder="—"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Net</label>
                      <Input
                        type="number"
                        value={row.netScore}
                        onChange={(e) =>
                          updateRow(idx, "netScore", e.target.value)
                        }
                        className="h-10 text-center text-sm"
                        placeholder="—"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Points</label>
                      <Input
                        type="number"
                        value={row.points}
                        onChange={(e) =>
                          updateRow(idx, "points", e.target.value)
                        }
                        className="h-10 text-center text-sm"
                        placeholder="—"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
