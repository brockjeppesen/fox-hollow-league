"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  Calendar,
  Timer,
  Loader2,
  Copy,
  LayoutDashboard,
} from "lucide-react";

const SLOT_LABELS: Record<string, string> = {
  early: "Early (3:00–3:30)",
  mid: "Mid (3:30–4:15)",
  late: "Late (4:15–5:00)",
  no_preference: "No Preference",
};

interface ConfirmationScreenProps {
  playerName: string;
  playing: boolean;
  wantsWithNames: string[];
  wantsWithIds?: Id<"players">[];
  timeSlot?: string;

  isUpdate?: boolean;
  // New multi-week props
  playerId?: Id<"players">;
  weekId?: Id<"weeks">;
}

export function ConfirmationScreen({
  playerName,
  playing,
  wantsWithNames,
  wantsWithIds,
  timeSlot,
  isUpdate,
  playerId,
  weekId,
}: ConfirmationScreenProps) {
  const router = useRouter();
  const submissions = useQuery(
    api.requests.getPlayerSubmissions,
    playerId ? { playerId } : "skip"
  );
  const bulkUpsert = useMutation(api.requests.bulkUpsert);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  // Find other open weeks that haven't been submitted
  const otherUnsubmitted =
    submissions?.filter((s) => !s.submitted && s.weekId !== weekId) ?? [];

  const handleCopyToAll = async () => {
    if (!playerId || otherUnsubmitted.length === 0) return;
    setCopying(true);
    try {
      await bulkUpsert({
        weekIds: otherUnsubmitted.map((s) => s.weekId as Id<"weeks">),
        playerId,
        playing,
        wantsWith: playing && wantsWithIds ? wantsWithIds : [],
        avoid: [],
        timeSlot: playing ? timeSlot : undefined,
        
      });
      setCopied(true);
    } catch (e) {
      console.error("Copy to all failed:", e);
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-800 flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-brass/20 flex items-center justify-center mx-auto mb-8">
          <CheckCircle className="w-10 h-10 text-brass" />
        </div>

        <h1 className="font-heading text-3xl text-cream mb-2">
          {isUpdate ? "Submission Updated!" : "You're All Set!"}
        </h1>
        <p className="text-cream/60 text-lg mb-10">
          Thanks, {playerName}. Your preferences have been{" "}
          {isUpdate ? "updated" : "submitted"}.
        </p>

        <div className="bg-green-700/50 rounded-xl p-6 text-left space-y-4 mb-8">
          <div className="flex items-center gap-3">
            {playing ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-brass" />
                <span className="text-cream font-medium">
                  Playing this week
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-cream/40" />
                <span className="text-cream/60 font-medium">
                  Not playing this week
                </span>
              </div>
            )}
          </div>

          {playing && (
            <>
              {wantsWithNames.length > 0 && (
                <div>
                  <p className="text-cream/50 text-xs uppercase tracking-wider mb-1">
                    Wants to play with
                  </p>
                  <p className="text-cream">{wantsWithNames.join(", ")}</p>
                </div>
              )}

              {timeSlot && timeSlot !== "no_preference" && (
                <div>
                  <p className="text-cream/50 text-xs uppercase tracking-wider mb-1">
                    Time preference
                  </p>
                  <p className="text-cream">
                    {SLOT_LABELS[timeSlot] ?? timeSlot}
                  </p>
                </div>
              )}


            </>
          )}
        </div>

        {/* Other open weeks section */}
        {playerId && otherUnsubmitted.length > 0 && !copied && (
          <div className="mb-8 animate-fade-in-delay">
            <div className="bg-green-700/30 border border-brass/15 rounded-xl p-5 text-left">
              <div className="flex items-center gap-2 mb-3">
                <Timer className="w-4 h-4 text-amber-400" />
                <span className="text-cream font-heading text-sm">
                  {otherUnsubmitted.length} more open week
                  {otherUnsubmitted.length !== 1 ? "s" : ""}:
                </span>
              </div>

              <div className="space-y-2 mb-4">
                {otherUnsubmitted.map((week) => {
                  const d = new Date(week.playDate);
                  return (
                    <div
                      key={week.weekId}
                      className="flex items-center gap-2 text-cream/60 text-sm"
                    >
                      <Calendar className="w-3.5 h-3.5 text-brass/60" />
                      <span>
                        {d.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      {week.format && (
                        <span className="text-cream/30 text-xs">
                          · {week.format}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleCopyToAll}
                disabled={copying}
                className="w-full min-h-[48px] bg-brass text-green-900 hover:bg-brass-light font-semibold rounded-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {copying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy to All Open Weeks
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Copied success */}
        {copied && (
          <div className="mb-8 p-4 rounded-xl bg-green-600/30 border border-green-500/30 animate-fade-in">
            <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-cream font-medium text-sm">
              Copied to {otherUnsubmitted.length} week
              {otherUnsubmitted.length !== 1 ? "s" : ""}!
            </p>
          </div>
        )}

        {/* Back to Dashboard */}
        {playerId && (
          <button
            onClick={() => router.push("/play")}
            className="inline-flex items-center gap-2 text-brass/70 hover:text-brass text-sm transition-colors mb-6"
          >
            <LayoutDashboard className="w-4 h-4" />
            Back to Dashboard
          </button>
        )}

        <div className="w-16 h-px bg-brass/30 mx-auto mb-8" />

        <p className="text-cream/40 text-sm">
          You can revisit this link to update your preferences before the
          deadline.
        </p>
      </div>
    </div>
  );
}
