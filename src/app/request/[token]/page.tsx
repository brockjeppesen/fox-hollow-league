"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { RequestForm } from "@/components/RequestForm";
import { DeadlinePassed } from "@/components/DeadlinePassed";
import { Loader2, AlertCircle } from "lucide-react";

export default function RequestPage() {
  const params = useParams();
  const token = params.token as string;

  const data = useQuery(api.requests.getByToken, { token });

  // Loading state
  if (data === undefined) {
    return (
      <div className="min-h-screen bg-green-800 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="w-8 h-8 text-brass animate-spin mx-auto mb-4" />
          <p className="text-cream/60">Loading your form...</p>
        </div>
      </div>
    );
  }

  // Invalid token
  if (data === null) {
    return (
      <div className="min-h-screen bg-green-800 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-green-700 flex items-center justify-center mx-auto mb-8">
            <AlertCircle className="w-10 h-10 text-brass" />
          </div>
          <h1 className="font-heading text-3xl text-cream mb-4">
            Invalid Link
          </h1>
          <p className="text-cream/60 text-lg mb-2">
            This link doesn&apos;t seem to be valid.
          </p>
          <p className="text-cream/40">
            Please check your link or contact your league manager for a new one.
          </p>
          <div className="w-16 h-px bg-brass/30 mx-auto mt-10 mb-4" />
          <p className="text-cream/30 text-xs">Fox Hollow Men&apos;s League</p>
        </div>
      </div>
    );
  }

  const { player, week, preferences, existingRequest } = data;

  // No week assigned or week is closed/finalized
  if (!week || week.status === "closed" || week.status === "finalized") {
    return (
      <DeadlinePassed
        playerName={player.name}
        playDate={week?.playDate ?? Date.now()}
      />
    );
  }

  // Check if deadline has passed
  if (Date.now() > week.deadline) {
    return (
      <DeadlinePassed playerName={player.name} playDate={week.playDate} />
    );
  }

  return (
    <RequestForm
      playerId={player._id}
      playerName={player.name}
      weekId={week._id}
      playDate={week.playDate}
      existingRequest={existingRequest}
      preferences={preferences}
    />
  );
}
