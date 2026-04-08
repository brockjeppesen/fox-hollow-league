"use client";

import { CheckCircle, XCircle } from "lucide-react";

interface ConfirmationScreenProps {
  playerName: string;
  playing: boolean;
  wantsWithNames: string[];
  avoidNames: string[];
  earliestTime?: string;
  latestTime?: string;
  notes?: string;
}

export function ConfirmationScreen({
  playerName,
  playing,
  wantsWithNames,
  avoidNames,
  earliestTime,
  latestTime,
  notes,
}: ConfirmationScreenProps) {
  return (
    <div className="min-h-screen bg-green-800 flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-brass/20 flex items-center justify-center mx-auto mb-8">
          <CheckCircle className="w-10 h-10 text-brass" />
        </div>

        <h1 className="font-heading text-3xl text-cream mb-2">
          You&apos;re All Set!
        </h1>
        <p className="text-cream/60 text-lg mb-10">
          Thanks, {playerName}. Your preferences have been submitted.
        </p>

        <div className="bg-green-700/50 rounded-xl p-6 text-left space-y-4 mb-10">
          <div className="flex items-center gap-3">
            {playing ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-brass" />
                <span className="text-cream font-medium">Playing this week</span>
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

              {avoidNames.length > 0 && (
                <div>
                  <p className="text-cream/50 text-xs uppercase tracking-wider mb-1">
                    Prefers to avoid
                  </p>
                  <p className="text-cream">{avoidNames.join(", ")}</p>
                </div>
              )}

              {(earliestTime || latestTime) && (
                <div>
                  <p className="text-cream/50 text-xs uppercase tracking-wider mb-1">
                    Time preference
                  </p>
                  <p className="text-cream">
                    {earliestTime && `Earliest: ${earliestTime}`}
                    {earliestTime && latestTime && " · "}
                    {latestTime && `Latest: ${latestTime}`}
                  </p>
                </div>
              )}

              {notes && (
                <div>
                  <p className="text-cream/50 text-xs uppercase tracking-wider mb-1">
                    Notes
                  </p>
                  <p className="text-cream">{notes}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="w-16 h-px bg-brass/30 mx-auto mb-8" />

        <p className="text-cream/40 text-sm">
          You can revisit this link to update your preferences before the
          deadline.
        </p>
      </div>
    </div>
  );
}
