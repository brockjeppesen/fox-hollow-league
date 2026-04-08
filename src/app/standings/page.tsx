"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Loader2, Trophy, Search, ArrowLeft } from "lucide-react";

const RANK_STYLES: Record<number, string> = {
  1: "bg-yellow-50 ring-2 ring-yellow-400/40",
  2: "bg-gray-50 ring-2 ring-gray-300/40",
  3: "bg-orange-50 ring-2 ring-orange-300/40",
};

const RANK_BADGES: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export default function StandingsPage() {
  const season = new Date().getFullYear().toString();
  const standings = useQuery(api.standings.getSeason, { season });
  const [search, setSearch] = useState("");

  const filtered = standings?.filter((s) =>
    search
      ? s.playerName.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-green-800 text-cream py-8 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-cream/60 hover:text-cream text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-brass" />
            <h1 className="font-heading text-3xl md:text-4xl">Standings</h1>
          </div>
          <p className="text-cream/60">
            {season} Season Leaderboard — Fox Hollow Men&apos;s League
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-12 py-8">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input h-10 pl-9 pr-3 rounded-lg border border-cream-dark bg-white text-sm w-full sm:w-72 focus:outline-none"
          />
        </div>

        {standings === undefined ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-green-800" />
          </div>
        ) : !filtered || filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-green-800/10 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-green-800" />
            </div>
            <h2 className="font-heading text-xl mb-2">
              {search ? "No Results" : "No Standings Yet"}
            </h2>
            <p className="text-muted-foreground">
              {search
                ? "No players match your search."
                : "Standings will appear once scores are entered."}
            </p>
          </div>
        ) : (
          <div className="space-y-2 animate-stagger">
            {/* Table header */}
            <div className="grid grid-cols-[50px_1fr_80px_80px_80px] gap-2 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <span>Rank</span>
              <span>Player</span>
              <span className="text-center">Rounds</span>
              <span className="text-center">Points</span>
              <span className="text-center">Avg</span>
            </div>

            {filtered.map((entry) => (
              <Link
                key={entry._id}
                href={`/player/${entry.playerId}`}
                className={`grid grid-cols-[50px_1fr_80px_80px_80px] gap-2 items-center px-4 py-3 rounded-xl transition-all hover:shadow-md cursor-pointer ${
                  RANK_STYLES[entry.rank] ??
                  "bg-white ring-1 ring-green-800/5 hover:ring-green-800/10"
                }`}
              >
                <span className="text-lg font-heading font-bold text-green-900">
                  {RANK_BADGES[entry.rank] ?? entry.rank}
                </span>
                <div>
                  <span className="font-medium text-sm text-green-900">
                    {entry.playerName}
                  </span>
                  {entry.playerHandicap !== undefined && (
                    <span className="text-xs text-muted-foreground ml-1.5">
                      ({entry.playerHandicap.toFixed(1)})
                    </span>
                  )}
                </div>
                <span className="text-center text-sm tabular-nums">
                  {entry.roundsPlayed}
                </span>
                <span className="text-center text-sm font-semibold text-green-900 tabular-nums">
                  {entry.totalPoints}
                </span>
                <span className="text-center text-sm text-muted-foreground tabular-nums">
                  {entry.avgScore?.toFixed(1) ?? "—"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
