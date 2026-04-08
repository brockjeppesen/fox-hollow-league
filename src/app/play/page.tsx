"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import {
  Search,
  Loader2,
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle2,
  Timer,
  ArrowRight,
  LogOut,
  Send,
} from "lucide-react";
import { PlayerCombobox } from "@/components/PlayerCombobox";

interface StoredPlayer {
  playerId: string;
  playerName: string;
}

function getStoredPlayer(): StoredPlayer | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("fh-player");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.playerId && parsed.playerName) return parsed;
    return null;
  } catch {
    return null;
  }
}

function setStoredPlayer(playerId: string, playerName: string) {
  localStorage.setItem("fh-player", JSON.stringify({ playerId, playerName }));
}

function clearStoredPlayer() {
  localStorage.removeItem("fh-player");
}

/* ─────────── Dashboard Component ─────────── */
function PlayerDashboard({
  playerId,
  playerName,
  onSwitchPlayer,
}: {
  playerId: Id<"players">;
  playerName: string;
  onSwitchPlayer: () => void;
}) {
  const router = useRouter();
  const submissions = useQuery(api.requests.getPlayerSubmissions, { playerId });
  const getOrCreate = useMutation(api.tokens.getOrCreateForPlayer);
  const bulkUpsert = useMutation(api.requests.bulkUpsert);
  const lastSubmission = useQuery(api.requests.getLastSubmission, { playerId });

  const [navigating, setNavigating] = useState<string | null>(null);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkDone, setBulkDone] = useState(false);

  const unsubmittedWeeks = useMemo(
    () => (submissions ?? []).filter((s) => !s.submitted),
    [submissions]
  );

  const handleNavigateToWeek = useCallback(
    async (weekId: Id<"weeks">) => {
      setNavigating(weekId);
      try {
        const token = await getOrCreate({ playerId, weekId });
        router.push(`/request/${token}`);
      } catch {
        setNavigating(null);
      }
    },
    [playerId, getOrCreate, router]
  );

  const handleBulkSubmit = useCallback(
    async (playing: boolean, wantsWith: Id<"players">[], timeSlot?: string, notes?: string) => {
      if (unsubmittedWeeks.length === 0) return;
      setBulkSubmitting(true);
      try {
        await bulkUpsert({
          weekIds: unsubmittedWeeks.map((w) => w.weekId),
          playerId,
          playing,
          wantsWith: playing ? wantsWith : [],
          avoid: [],
          timeSlot: playing ? timeSlot : undefined,
          notes: playing ? notes : undefined,
        });
        setBulkDone(true);
        setShowBulkForm(false);
      } catch (e) {
        console.error("Bulk submit failed:", e);
      } finally {
        setBulkSubmitting(false);
      }
    },
    [unsubmittedWeeks, bulkUpsert, playerId]
  );

  if (submissions === undefined) {
    return (
      <div className="min-h-screen bg-green-800 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="w-8 h-8 text-brass animate-spin mx-auto mb-4" />
          <p className="text-cream/60">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
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
            Hey {playerName} — there aren&apos;t any open weeks right now.
          </p>
          <p className="text-cream/40">
            Check back when your league manager opens the next round.
          </p>
          <button
            onClick={onSwitchPlayer}
            className="mt-8 text-brass/60 hover:text-brass text-sm transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 inline mr-1" />
            Not you? Switch player
          </button>
          <div className="w-16 h-px bg-brass/30 mx-auto mt-10 mb-4" />
          <p className="text-cream/30 text-xs">Fox Hollow Men&apos;s League</p>
        </div>
      </div>
    );
  }

  if (showBulkForm) {
    return (
      <BulkSubmitForm
        playerName={playerName}
        weekCount={unsubmittedWeeks.length}
        lastSubmission={lastSubmission}
        submitting={bulkSubmitting}
        onSubmit={handleBulkSubmit}
        onCancel={() => setShowBulkForm(false)}
        playerId={playerId}
      />
    );
  }

  return (
    <div className="min-h-screen bg-green-800 text-cream relative overflow-hidden">
      {/* Background blurs */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 right-0 w-[min(500px,80vw)] h-[min(500px,80vw)] rounded-full bg-brass blur-[200px]" />
        <div className="absolute bottom-0 left-0 w-[min(300px,60vw)] h-[min(300px,60vw)] rounded-full bg-green-600 blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-brass flex items-center justify-center">
              <span className="text-green-900 font-heading text-xs font-bold">FH</span>
            </div>
            <span className="text-sm tracking-widest uppercase text-cream/60">
              Fox Hollow League
            </span>
          </div>
          <h1 className="font-heading text-3xl text-cream mb-1">
            Hey, {playerName}!
          </h1>
          <p className="text-cream/50 text-sm">
            {submissions.length === 1
              ? "1 open week"
              : `${submissions.length} open weeks`}
            {" · "}
            {unsubmittedWeeks.length === 0
              ? "all submitted ✅"
              : `${unsubmittedWeeks.length} need${unsubmittedWeeks.length === 1 ? "s" : ""} your response`}
          </p>
          <button
            onClick={onSwitchPlayer}
            className="mt-2 text-brass/50 hover:text-brass text-xs transition-colors"
          >
            <LogOut className="w-3 h-3 inline mr-1" />
            Not you? Switch player
          </button>
        </div>

        {/* Bulk done banner */}
        {bulkDone && (
          <div className="mb-6 p-4 rounded-xl bg-green-600/30 border border-green-500/30 text-center animate-fade-in">
            <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-cream font-medium">All weeks submitted!</p>
            <p className="text-cream/50 text-sm mt-1">
              Tap any week below to review or update.
            </p>
          </div>
        )}

        {/* Week Cards */}
        <div className="space-y-3 mb-8">
          {submissions.map((sub, i) => {
            const playDate = new Date(sub.playDate);
            const deadline = new Date(sub.deadline);
            const isNavigating = navigating === sub.weekId;

            return (
              <button
                key={sub.weekId}
                onClick={() => handleNavigateToWeek(sub.weekId as Id<"weeks">)}
                disabled={navigating !== null}
                className="w-full text-left rounded-xl bg-green-700/40 border border-cream/10 hover:border-brass/30 hover:bg-green-700/60 active:scale-[0.98] transition-all p-5 disabled:opacity-50 group"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Calendar className="w-4 h-4 text-brass shrink-0" />
                      <span className="text-cream font-heading text-lg leading-tight">
                        {playDate.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      {sub.format && (
                        <span className="text-cream/40 text-xs bg-green-700/60 px-2 py-0.5 rounded-full">
                          {sub.format}
                        </span>
                      )}
                    </div>

                    {/* Status */}
                    {sub.submitted ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-green-400 text-sm font-medium">
                            Submitted
                          </span>
                          {sub.playing === false && (
                            <span className="text-cream/40 text-xs ml-1">· Not playing</span>
                          )}
                        </div>
                        {sub.playing && (
                          <div className="text-cream/40 text-xs space-x-2">
                            {sub.timeSlot && sub.timeSlot !== "no_preference" && (
                              <span className="capitalize">{sub.timeSlot} tee time</span>
                            )}
                            {sub.partnerNames.length > 0 && (
                              <span>
                                w/ {sub.partnerNames.slice(0, 2).join(", ")}
                                {sub.partnerNames.length > 2 && ` +${sub.partnerNames.length - 2}`}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Timer className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-amber-400 text-sm font-medium">
                          Not submitted
                        </span>
                        <span className="text-cream/30 text-xs ml-1">
                          · Due{" "}
                          {deadline.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 pt-1">
                    {isNavigating ? (
                      <Loader2 className="w-5 h-5 text-brass animate-spin" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-cream/30 group-hover:text-brass transition-colors" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Submit for All button */}
        {unsubmittedWeeks.length > 0 && !bulkDone && (
          <div className="animate-fade-in-delay">
            <button
              onClick={() => setShowBulkForm(true)}
              className="w-full min-h-[56px] bg-brass text-green-900 hover:bg-brass-light font-semibold text-lg rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Send className="w-5 h-5" />
              Submit for All {unsubmittedWeeks.length > 1 ? `${unsubmittedWeeks.length} ` : ""}Open Week{unsubmittedWeeks.length !== 1 ? "s" : ""}
            </button>
            <p className="text-cream/30 text-xs text-center mt-2">
              Same preferences for every unsubmitted week
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="w-16 h-px bg-brass/30 mx-auto mb-4" />
          <p className="text-cream/20 text-xs">
            Fox Hollow Men&apos;s League · American Fork, UT
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Bulk Submit Mini-Form ─────────── */
function BulkSubmitForm({
  playerName,
  weekCount,
  lastSubmission,
  submitting,
  onSubmit,
  onCancel,
  playerId,
}: {
  playerName: string;
  weekCount: number;
  lastSubmission: {
    playing: boolean;
    wantsWith: Id<"players">[];
    avoid: Id<"players">[];
    timeSlot?: string;
    notes?: string;
    partnerNames: string[];
  } | null | undefined;
  submitting: boolean;
  onSubmit: (playing: boolean, wantsWith: Id<"players">[], timeSlot?: string, notes?: string) => void;
  onCancel: () => void;
  playerId: Id<"players">;
}) {
  const players = useQuery(api.players.list) ?? [];

  const [playing, setPlaying] = useState<boolean | null>(null);
  const [wantsWith, setWantsWith] = useState<Id<"players">[]>([]);
  const [timeSlot, setTimeSlot] = useState<string>("no_preference");
  const [notes, setNotes] = useState<string>("");
  const [usedLastWeek, setUsedLastWeek] = useState(false);

  const otherPlayers = players.filter((p: { _id: Id<"players"> }) => p._id !== playerId);

  const SLOTS = [
    { value: "early", label: "Early", desc: "3:00 – 3:30" },
    { value: "mid", label: "Mid", desc: "3:30 – 4:15" },
    { value: "late", label: "Late", desc: "4:15 – 5:00" },
    { value: "no_preference", label: "No Preference", desc: "Any time" },
  ];

  const handleUseLastWeek = () => {
    if (!lastSubmission) return;
    setPlaying(lastSubmission.playing);
    setWantsWith(lastSubmission.wantsWith);
    setTimeSlot(lastSubmission.timeSlot ?? "no_preference");
    setNotes(lastSubmission.notes ?? "");
    setUsedLastWeek(true);
  };

  return (
    <div className="min-h-screen bg-green-800">
      <div className="max-w-lg mx-auto px-4 py-8 sm:px-6">
        <div className="text-center mb-8 animate-fade-in">
          <p className="text-brass text-xs font-medium tracking-widest uppercase mb-2">
            Submit for all open weeks
          </p>
          <h1 className="font-heading text-3xl text-cream mb-2">
            Hey, {playerName}!
          </h1>
          <p className="text-cream/60">
            These preferences will apply to{" "}
            <span className="text-brass font-medium">{weekCount} week{weekCount !== 1 ? "s" : ""}</span>
          </p>
        </div>

        {/* Same as last week chip */}
        {lastSubmission && !usedLastWeek && (
          <div className="mb-6 animate-fade-in">
            <button
              onClick={handleUseLastWeek}
              className="w-full px-4 py-3 rounded-xl bg-brass/10 border border-brass/25 hover:bg-brass/20 transition-all text-left flex items-center gap-3"
            >
              <ArrowRight className="w-5 h-5 text-brass shrink-0" />
              <div>
                <span className="text-cream font-medium text-sm">Same as last week</span>
                <span className="text-cream/40 text-xs block mt-0.5">
                  {lastSubmission.playing ? "Playing" : "Not playing"}
                  {lastSubmission.partnerNames.length > 0 &&
                    ` · w/ ${lastSubmission.partnerNames.slice(0, 2).join(", ")}`}
                  {lastSubmission.timeSlot && lastSubmission.timeSlot !== "no_preference" &&
                    ` · ${lastSubmission.timeSlot}`}
                </span>
              </div>
            </button>
          </div>
        )}

        <div className="space-y-6 animate-fade-in-delay">
          {/* Playing? */}
          <div className="space-y-3">
            <label className="text-cream text-base font-heading block">
              Playing this week?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPlaying(true)}
                className={`min-h-[56px] rounded-lg font-semibold text-lg transition-all ${
                  playing === true
                    ? "bg-brass text-green-900 ring-2 ring-brass-light"
                    : "bg-green-700 text-cream/70 hover:bg-green-700/80"
                }`}
              >
                YES
              </button>
              <button
                type="button"
                onClick={() => setPlaying(false)}
                className={`min-h-[56px] rounded-lg font-semibold text-lg transition-all ${
                  playing === false
                    ? "bg-brass text-green-900 ring-2 ring-brass-light"
                    : "bg-green-700 text-cream/70 hover:bg-green-700/80"
                }`}
              >
                NO
              </button>
            </div>
          </div>

          {playing === true && (
            <div className="space-y-6 animate-fade-in">
              {/* Partners */}
              <div className="space-y-2">
                <label className="text-cream text-base font-heading block">
                  Want to play with
                </label>
                <p className="text-cream/40 text-xs">
                  Select up to 3 players you&apos;d like to be paired with
                </p>
                <PlayerCombobox
                  players={otherPlayers}
                  selected={wantsWith}
                  onChange={setWantsWith}
                  max={3}
                  placeholder="Search for a player..."
                />
              </div>

              {/* Time Slot */}
              <div className="space-y-2">
                <label className="text-cream text-base font-heading block">
                  Preferred tee time
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {SLOTS.map((slot) => (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => setTimeSlot(slot.value)}
                      className={`min-h-[64px] rounded-lg font-semibold transition-all flex flex-col items-center justify-center ${
                        timeSlot === slot.value
                          ? "bg-brass text-green-900 ring-2 ring-brass-light"
                          : "bg-green-700 text-cream/70 hover:bg-green-700/80"
                      }`}
                    >
                      <span className="text-base">{slot.label}</span>
                      <span className={`text-xs mt-0.5 ${
                        timeSlot === slot.value ? "text-green-900/60" : "text-cream/40"
                      }`}>
                        {slot.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-cream text-base font-heading block">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => {
                    if (e.target.value.length <= 200) setNotes(e.target.value);
                  }}
                  placeholder="Cart needed, walking, riding with someone, etc."
                  className="w-full min-h-[80px] rounded-lg p-3 bg-white text-green-900 border border-cream-dark placeholder:text-green-900/40 focus:outline-none focus:ring-2 focus:ring-brass/40"
                  rows={3}
                />
                <p className="text-cream/40 text-xs text-right">{notes.length}/200</p>
              </div>
            </div>
          )}

          {/* Buttons */}
          {playing !== null && (
            <div className="pt-2 space-y-3 animate-fade-in">
              <button
                onClick={() => onSubmit(playing, wantsWith, timeSlot || undefined, notes || undefined)}
                disabled={submitting}
                className="w-full min-h-[56px] bg-brass text-green-900 hover:bg-brass-light font-semibold text-lg rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit for {weekCount} Week{weekCount !== 1 ? "s" : ""}
                  </>
                )}
              </button>
            </div>
          )}

          <button
            onClick={onCancel}
            className="w-full text-center text-cream/40 hover:text-cream text-sm transition-colors py-2"
          >
            ← Back to dashboard
          </button>
        </div>

        <div className="mt-12 text-center">
          <div className="w-16 h-px bg-brass/30 mx-auto mb-4" />
          <p className="text-cream/30 text-xs">Fox Hollow Golf Club</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Search Component (original flow) ─────────── */
function PlayerSearch({
  onPlayerSelected,
}: {
  onPlayerSelected: (playerId: Id<"players">, playerName: string) => void;
}) {
  const players = useQuery(api.players.list);
  const [search, setSearch] = useState("");

  const filteredPlayers = useMemo(() => {
    if (!players || !search.trim()) return [];
    const q = search.toLowerCase().trim();
    return players.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 12);
  }, [players, search]);

  if (players === undefined) {
    return (
      <div className="min-h-screen bg-green-800 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="w-8 h-8 text-brass animate-spin mx-auto mb-4" />
          <p className="text-cream/60">Loading...</p>
        </div>
      </div>
    );
  }

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

        {/* Main search area */}
        <main className="flex-1 flex flex-col items-center px-6 pt-8">
          <div className="w-full max-w-lg animate-fade-in-delay-2">
            <h1 className="font-heading text-3xl md:text-4xl text-center mb-2 leading-tight">
              Find Your Name
            </h1>
            <p className="text-cream/50 text-center mb-8">
              Type your name to get started
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
                      onClick={() => onPlayerSelected(player._id, player.name)}
                      className="w-full flex items-center justify-between px-6 py-5 rounded-xl bg-green-700/40 border border-cream/10 hover:border-brass/30 hover:bg-green-700/60 active:scale-[0.98] transition-all text-left group"
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
                      <ChevronRight className="w-5 h-5 text-cream/30 group-hover:text-brass transition-colors" />
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

/* ─────────── Main Page ─────────── */
export default function PlayPage() {
  const [identified, setIdentified] = useState<StoredPlayer | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const stored = getStoredPlayer();
    if (stored) setIdentified(stored);
    setLoaded(true);
  }, []);

  const handlePlayerSelected = useCallback(
    (playerId: Id<"players">, playerName: string) => {
      setStoredPlayer(playerId as string, playerName);
      setIdentified({ playerId: playerId as string, playerName });
    },
    []
  );

  const handleSwitchPlayer = useCallback(() => {
    clearStoredPlayer();
    setIdentified(null);
  }, []);

  // Wait for localStorage check
  if (!loaded) {
    return (
      <div className="min-h-screen bg-green-800 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="w-8 h-8 text-brass animate-spin mx-auto mb-4" />
          <p className="text-cream/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (identified) {
    return (
      <PlayerDashboard
        playerId={identified.playerId as Id<"players">}
        playerName={identified.playerName}
        onSwitchPlayer={handleSwitchPlayer}
      />
    );
  }

  return <PlayerSearch onPlayerSelected={handlePlayerSelected} />;
}
