"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  ArrowLeft,
  User,
  Trophy,
  Calendar,
  Users,
  TrendingUp,
} from "lucide-react";

export default function PlayerProfilePage() {
  const params = useParams();
  const playerId = params.id as Id<"players">;

  const profile = useQuery(api.players.getProfile, { id: playerId });

  if (profile === undefined) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-green-800" />
      </div>
    );
  }

  if (profile === null) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-heading text-2xl text-green-900 mb-2">
            Player Not Found
          </h1>
          <p className="text-muted-foreground mb-4">
            This player profile doesn&apos;t exist.
          </p>
          <Link
            href="/"
            className="text-green-800 hover:text-green-700 text-sm underline"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const { player, recentRounds, attendance, standing, partnerHistory, handicapTrend } =
    profile;

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-green-800 text-cream py-8 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/standings"
            className="inline-flex items-center gap-1.5 text-cream/60 hover:text-cream text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Standings
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-700 flex items-center justify-center">
              <User className="w-7 h-7 text-brass" />
            </div>
            <div>
              <h1 className="font-heading text-3xl md:text-4xl">
                {player.name}
              </h1>
              {player.handicapIndex !== undefined && (
                <Badge className="bg-brass text-green-900 mt-1 text-sm">
                  {player.handicapIndex.toFixed(1)} HCP
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 md:px-12 py-8 space-y-6">
        {/* Season Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in">
          <Card className="border-0 ring-1 ring-green-800/10">
            <CardContent className="py-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Rounds
              </p>
              <p className="text-2xl font-heading font-bold text-green-900">
                {standing?.roundsPlayed ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 ring-1 ring-green-800/10">
            <CardContent className="py-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Points
              </p>
              <p className="text-2xl font-heading font-bold text-green-900">
                {standing?.totalPoints ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 ring-1 ring-green-800/10">
            <CardContent className="py-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Avg Score
              </p>
              <p className="text-2xl font-heading font-bold text-green-900">
                {standing?.avgScore?.toFixed(1) ?? "—"}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 ring-1 ring-green-800/10">
            <CardContent className="py-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Attendance
              </p>
              <p className="text-2xl font-heading font-bold text-green-900">
                {attendance.rate}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Rounds */}
        <Card className="border-0 ring-1 ring-green-800/10 animate-fade-in-delay">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brass" />
              Recent Rounds
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentRounds.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No rounds recorded yet.
              </p>
            ) : (
              <div className="space-y-2">
                {recentRounds.slice(0, 10).map((round, idx) => {
                  const dateStr = round.playDate
                    ? new Date(round.playDate).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })
                    : "Unknown";

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-4 py-3 bg-white/60 rounded-xl gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-green-900 truncate">
                          {dateStr}
                        </p>
                        {round.format && (
                          <p className="text-xs text-muted-foreground truncate">
                            {round.format}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 text-sm shrink-0">
                        {round.grossScore !== undefined && (
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">
                              Gross
                            </p>
                            <p className="font-semibold tabular-nums">
                              {round.grossScore}
                            </p>
                          </div>
                        )}
                        {round.netScore !== undefined && (
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">
                              Net
                            </p>
                            <p className="font-semibold tabular-nums">
                              {round.netScore}
                            </p>
                          </div>
                        )}
                        {round.points !== undefined && (
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">
                              Pts
                            </p>
                            <p className="font-semibold text-brass tabular-nums">
                              {round.points}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Partner History */}
        {partnerHistory.length > 0 && (
          <Card className="border-0 ring-1 ring-green-800/10 animate-fade-in-delay-2">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="w-5 h-5 text-brass" />
                Partner History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {partnerHistory.map((partner, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-4 py-2.5 bg-white/60 rounded-xl"
                  >
                    <span className="font-medium text-sm text-green-900">
                      {partner.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {partner.count} round{partner.count !== 1 ? "s" : ""}{" "}
                      together
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Handicap / Score Trend */}
        {handicapTrend.length > 0 && (
          <Card className="border-0 ring-1 ring-green-800/10">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brass" />
                Score Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {handicapTrend.map((entry, idx) => {
                  const dateStr = entry.date
                    ? new Date(entry.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "—";
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-1.5 text-sm"
                    >
                      <span className="text-muted-foreground">{dateStr}</span>
                      <span className="font-medium tabular-nums">
                        {entry.grossScore ?? "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
