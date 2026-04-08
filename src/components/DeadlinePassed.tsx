"use client";

import { Clock } from "lucide-react";

interface DeadlinePassedProps {
  playerName: string;
  playDate: number;
}

export function DeadlinePassed({ playerName, playDate }: DeadlinePassedProps) {
  const formattedDate = new Date(playDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-green-800 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-green-700 flex items-center justify-center mx-auto mb-8">
          <Clock className="w-10 h-10 text-brass" />
        </div>

        <h1 className="font-heading text-3xl text-cream mb-4">
          Submissions Closed
        </h1>

        <p className="text-cream/70 text-lg mb-2">
          Hey {playerName}, the deadline for this week has passed.
        </p>

        <p className="text-cream/50 mb-8">
          The round on <span className="text-brass">{formattedDate}</span> is
          already being finalized. Check with your league manager if you need to
          make changes.
        </p>

        <div className="w-16 h-px bg-brass/30 mx-auto mb-8" />

        <p className="text-cream/40 text-sm">Fox Hollow Men&apos;s League</p>
      </div>
    </div>
  );
}
