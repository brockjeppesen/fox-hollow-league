"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { Search, Loader2, Calendar, ChevronRight, Clock } from "lucide-react";

export default function PlayPage() {
  const router = useRouter();
  const currentWeek = useQuery(api.weeks.getCurrent);
  const players = useQuery(api.players.list);
  const getOrCreate = useMutation(api.tokens.getOrCreateForPlayer);

  const [search, setSearch] = useState("");
  const [selecting, setSelecting] = useState<Id<"players"> | null>(null);
  const [redirecting, setRedirecting] = useState<string | null>(null);

  const filteredPlayers = useMemo(() => {
    if (!players || !search.trim()) return [];
    const q = search.toLowerCase().trim();
    return players.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 12);
  }, [players, search]);

  const handleSelect = useCallback(
    async (playerId: Id<"players">, playerName: string) => {
      if (!currentWeek || selecting) return;
      setSelecting(playerId);
      setRedirecting(playerName);
      try {
        const token = await getOrCreate({
          playerId,
          weekId: currentWeek._id,
        });
        // Brief pause to show confirmation
        await new Promise((r) => setTimeout(r, 600));
        router.push(`/request/${token}`);
      } catch {
        setSelecting(null);
        setRedirecting(null);
      }
    },
    [currentWeek, selecting, getOrCreate, router]
  );

  // Loading state
  if (currentWeek === undefined || players === undefined) {
    return (
      <div className="min-h-screen bg-green-800 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="w-8 h-8 text-brass animate-spin mx-auto mb-4" />
          <p className="text-cream/60">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirecting confirmation
  if (redirecting) {
    return (
      <div className="min-h-screen bg-green-800 flex items-center justify-center px-6">
        <div className="text-center animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-brass/20 flex items-center justify-center mx-auto mb-6">
            <ChevronRight className="w-10 h-10 text-brass animate-pulse" />
          </div>
          <h2 className="font-heading text-3xl text-cream mb-2">
            Hey, {redirecting}!
          </h2>
          <p className="text-cream/60 text-lg">
            Taking you to your submission form...
          </p>
        </div>
      </div>
    );
  }

  // No week open
  if (!currentWeek || currentWeek.status === "closed" || currentWeek.status === "finalized") {
    return (
      <div className="min-h-screen bg-green-800 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-green-700 flex items-center justify-center mx-auto mb-8">
            <Clock className="w-10 h-10 text-brass" />
          </div>
          <h1 className="font-heading text-3xl text-cream mb-4">
            No Submissions Open
          </h1>
          <p className="text-cream/60 text-lg mb-2">
            There&apos;s no active week accepting submissions right now.
          </p>
          <p className="text-cream/40">
            Check back when your league manager opens the next round.
          </p>
          <div className="w-16 h-px bg-brass/30 mx-auto mt-10 mb-4" />
          <p className="text-cream/30 text-xs">Fox Hollow Men&apos;s League</p>
        </div>
      </div>
    );
  }

  const playDate = new Date(currentWeek.playDate);
  const deadline = new Date(currentWeek.deadline);

  return (
    <div className="min-h-screen bg-green-800 text-cream relative overflow-hidden">
      {/* Background blurs */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 right-0 w-[min(500px,80vw)] h-[min(500px,80vw)] rounded-full bg-brass blur-[200px]" />
        <div className="absolute bottom-0 left-0 w-[min(300px,60vw)] h-[min(300px,60vw)] rounded-full bg-green-600 blur-[150px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="px-6 pt-8 pb-4 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-brass flex items-center justify-center">
              <span className="text-green-900 font-heading text-xs font-bold">FH</span>
            </div>
            <span className="text-sm tracking-widest uppercase text-cream/60">
              Fox Hollow League
            </span>
          </div>
        </header>

        {/* Week info */}
        <div className="px-6 text-center animate-fade-in-delay">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brass/10 border border-brass/20 mb-6">
            <Calendar className="w-4 h-4 text-brass" />
            <span className="text-sm text-brass">
              {playDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
            {currentWeek.format && (
              <>
                <span className="text-cream/20">·</span>
                <span className="text-sm text-cream/60">{currentWeek.format}</span>
              </>
            )}
          </div>
          <p className="text-cream/40 text-xs mb-1">
            Submissions due by{" "}
            {deadline.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}{" "}
            at{" "}
            {deadline.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Main search area */}
        <main className="flex-1 flex flex-col items-center px-6 pt-8">
          <div className="w-full max-w-lg animate-fade-in-delay-2">
            <h1 className="font-heading text-3xl md:text-4xl text-center mb-2 leading-tight">
              Find Your Name
            </h1>
            <p className="text-cream/50 text-center mb-8">
              Type your name to get your personal submission link
            </p>

            {/* Search input */}
            <div className="relative mb-4">
              <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-cream/40" />
              <input
                type="text"
                placeholder="Type your name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full h-16 pl-14 pr-6 rounded-2xl bg-green-700/60 border border-cream/15 text-cream text-lg placeholder:text-cream/30 focus:outline-none focus:border-brass/50 focus:ring-2 focus:ring-brass/20 transition-all"
              />
            </div>

            {/* Results */}
            {search.trim() && (
              <div className="space-y-2 animate-fade-in">
                {filteredPlayers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-cream/40">
                      No players found matching &ldquo;{search}&rdquo;
                    </p>
                  </div>
                ) : (
                  filteredPlayers.map((player) => (
                    <button
                      key={player._id}
                      onClick={() => handleSelect(player._id, player.name)}
                      disabled={selecting !== null}
                      className="w-full flex items-center justify-between px-6 py-5 rounded-xl bg-green-700/40 border border-cream/10 hover:border-brass/30 hover:bg-green-700/60 active:scale-[0.98] transition-all text-left group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-brass/15 flex items-center justify-center shrink-0">
                          <span className="text-brass font-heading text-lg">
                            {player.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-cream text-lg font-medium block leading-tight">
                            {player.name}
                          </span>
                          {player.handicapIndex !== undefined && (
                            <span className="text-cream/40 text-xs">
                              HCP {player.handicapIndex.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      {selecting === player._id ? (
                        <Loader2 className="w-5 h-5 text-brass animate-spin" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-cream/30 group-hover:text-brass transition-colors" />
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Hint when empty */}
            {!search.trim() && players && (
              <div className="text-center mt-8">
                <p className="text-cream/25 text-sm">
                  {players.length} active players in the league
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-6 text-center">
          <p className="text-cream/20 text-xs">
            Fox Hollow Men&apos;s League · American Fork, UT
          </p>
        </footer>
      </div>
    </div>
  );
}
