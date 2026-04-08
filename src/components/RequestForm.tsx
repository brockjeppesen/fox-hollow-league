"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PlayerCombobox } from "@/components/PlayerCombobox";
import { ConfirmationScreen } from "@/components/ConfirmationScreen";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";

const TIME_OPTIONS = [
  "6:00 AM",
  "6:30 AM",
  "7:00 AM",
  "7:30 AM",
  "8:00 AM",
  "8:30 AM",
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
];

interface RequestFormProps {
  playerId: Id<"players">;
  playerName: string;
  weekId: Id<"weeks">;
  playDate: number;
  existingRequest: {
    playing: boolean;
    wantsWith: Id<"players">[];
    avoid: Id<"players">[];
    earliestTime?: string;
    latestTime?: string;
    notes?: string;
  } | null;
  preferences: {
    defaultPartners: Id<"players">[];
    defaultAvoid: Id<"players">[];
    defaultEarliest?: string;
    defaultLatest?: string;
  } | null;
}

export function RequestForm({
  playerId,
  playerName,
  weekId,
  playDate,
  existingRequest,
  preferences,
}: RequestFormProps) {
  const players = useQuery(api.players.list) ?? [];
  const upsertRequest = useMutation(api.requests.upsert);
  const upsertPreferences = useMutation(api.preferences.upsert);

  // Initialize form from existing request, then preferences, then defaults
  const [playing, setPlaying] = useState<boolean | null>(
    existingRequest?.playing ?? null
  );
  const [wantsWith, setWantsWith] = useState<Id<"players">[]>(
    existingRequest?.wantsWith ?? preferences?.defaultPartners ?? []
  );
  const [avoid, setAvoid] = useState<Id<"players">[]>(
    existingRequest?.avoid ?? preferences?.defaultAvoid ?? []
  );
  const [earliestTime, setEarliestTime] = useState<string>(
    existingRequest?.earliestTime ?? preferences?.defaultEarliest ?? ""
  );
  const [latestTime, setLatestTime] = useState<string>(
    existingRequest?.latestTime ?? preferences?.defaultLatest ?? ""
  );
  const [notes, setNotes] = useState<string>(existingRequest?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const otherPlayers = players.filter((p) => p._id !== playerId);

  const formattedDate = new Date(playDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const handleSubmit = async () => {
    if (playing === null) return;

    setSubmitting(true);
    try {
      await upsertRequest({
        weekId,
        playerId,
        playing,
        wantsWith: playing ? wantsWith : [],
        avoid: playing ? avoid : [],
        earliestTime: playing ? earliestTime || undefined : undefined,
        latestTime: playing ? latestTime || undefined : undefined,
        notes: playing ? notes || undefined : undefined,
      });

      // Save preferences for next time
      await upsertPreferences({
        playerId,
        defaultPartners: wantsWith,
        defaultAvoid: avoid,
        defaultEarliest: earliestTime || undefined,
        defaultLatest: latestTime || undefined,
        preferredContact: "link",
      });

      setSubmitted(true);
    } catch (error) {
      console.error("Failed to submit:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    const wantsWithNames = otherPlayers
      .filter((p) => wantsWith.includes(p._id))
      .map((p) => p.name);
    const avoidNames = otherPlayers
      .filter((p) => avoid.includes(p._id))
      .map((p) => p.name);

    return (
      <ConfirmationScreen
        playerName={playerName}
        playing={playing ?? false}
        wantsWithNames={wantsWithNames}
        avoidNames={avoidNames}
        earliestTime={earliestTime || undefined}
        latestTime={latestTime || undefined}
        notes={notes || undefined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-green-800">
      <div className="max-w-lg mx-auto px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <p className="text-brass text-xs font-medium tracking-widest uppercase mb-2">
            Fox Hollow Men&apos;s League
          </p>
          <h1 className="font-heading text-3xl text-cream mb-2">
            Hey, {playerName}!
          </h1>
          <p className="text-cream/60">
            Submit your preferences for{" "}
            <span className="text-brass">{formattedDate}</span>
          </p>
        </div>

        <div className="space-y-6 animate-fade-in-delay">
          {/* Playing This Week? */}
          <div className="space-y-3">
            <Label className="text-cream text-base font-heading">
              Playing this week?
            </Label>
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
              {/* Wants to Play With */}
              <div className="space-y-2">
                <Label className="text-cream text-base font-heading">
                  Want to play with
                </Label>
                <p className="text-cream/40 text-xs">
                  Select up to 3 players you&apos;d like to be paired with
                </p>
                <PlayerCombobox
                  players={otherPlayers}
                  selected={wantsWith}
                  onChange={setWantsWith}
                  excludeIds={avoid}
                  max={3}
                  placeholder="Search for a player..."
                />
              </div>

              {/* Avoid */}
              <div className="space-y-2">
                <Label className="text-cream text-base font-heading">
                  Prefer to avoid
                </Label>
                <p className="text-cream/40 text-xs">
                  Anyone you&apos;d rather not be grouped with this week
                </p>
                <PlayerCombobox
                  players={otherPlayers}
                  selected={avoid}
                  onChange={setAvoid}
                  excludeIds={wantsWith}
                  max={3}
                  placeholder="Search for a player..."
                />
              </div>

              {/* Time Preferences */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-cream text-base font-heading">
                    Earliest time
                  </Label>
                  <Select
                    value={earliestTime}
                    onValueChange={(val) => setEarliestTime(val ?? "")}
                  >
                    <SelectTrigger className="min-h-[56px] bg-white text-green-900 border-cream-dark w-full">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-cream text-base font-heading">
                    Latest time
                  </Label>
                  <Select value={latestTime} onValueChange={(val) => setLatestTime(val ?? "")}>
                    <SelectTrigger className="min-h-[56px] bg-white text-green-900 border-cream-dark w-full">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-cream text-base font-heading">
                  Notes
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => {
                    if (e.target.value.length <= 200) {
                      setNotes(e.target.value);
                    }
                  }}
                  placeholder="Cart needed, walking, riding with someone, etc."
                  className="min-h-[80px] bg-white text-green-900 border-cream-dark placeholder:text-green-900/40"
                  rows={3}
                />
                <p className="text-cream/40 text-xs text-right">
                  {notes.length}/200
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {playing !== null && (
            <div className="pt-2 animate-fade-in">
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full min-h-[56px] bg-brass text-green-900 hover:bg-brass-light font-semibold text-lg rounded-lg transition-all"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    {existingRequest ? "Update Preferences" : "Submit Preferences"}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="w-16 h-px bg-brass/30 mx-auto mb-4" />
          <p className="text-cream/30 text-xs">Fox Hollow Golf Club</p>
        </div>
      </div>
    </div>
  );
}
