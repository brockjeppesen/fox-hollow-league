"use client";

import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, MessageSquare } from "lucide-react";

const SLOT_COLORS: Record<
  string,
  { bg: string; border: string; stripe: string; label: string; pillClass: string }
> = {
  early: {
    bg: "bg-green-700/5",
    border: "ring-green-700/15",
    stripe: "bg-green-700",
    label: "Early",
    pillClass: "slot-pill slot-pill-early",
  },
  mid: {
    bg: "bg-blue-50/60",
    border: "ring-blue-700/10",
    stripe: "bg-blue-600",
    label: "Mid",
    pillClass: "slot-pill slot-pill-mid",
  },
  late: {
    bg: "bg-amber-50/60",
    border: "ring-amber-700/10",
    stripe: "bg-amber-500",
    label: "Late",
    pillClass: "slot-pill slot-pill-late",
  },
};

function getSlotForTime(teeTime: string): string {
  const parts = teeTime.split(" ");
  const period = parts[1];
  const timeParts = parts[0].split(":").map(Number);
  let h = timeParts[0];
  const m = timeParts[1];
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  const totalMin = h * 60 + m;

  if (totalMin < 15 * 60 + 32) return "early";
  if (totalMin < 16 * 60 + 20) return "mid";
  return "late";
}

interface TeeSheetGroup {
  teeTime: string;
  players: Id<"players">[];
  cartNote?: string;
}

interface PlayerInfo {
  _id: Id<"players">;
  name: string;
  handicapIndex?: number;
}

interface TeeSheetViewProps {
  groups: TeeSheetGroup[];
  playerMap: Map<string, PlayerInfo>;
  status: string;
  generatedAt: number;
}

export function TeeSheetView({
  groups,
  playerMap,
  status,
  generatedAt,
}: TeeSheetViewProps) {
  const generatedDate = new Date(generatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const totalPlayers = groups.reduce((sum, g) => sum + g.players.length, 0);

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground animate-fade-in">
        <Badge
          variant={status === "published" ? "default" : "secondary"}
          className={
            status === "published"
              ? "bg-green-800 text-cream"
              : "bg-brass/20 text-brass border border-brass/30"
          }
        >
          {status === "published" ? "✓ Published" : "Draft"}
        </Badge>
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          <strong className="text-green-900">{totalPlayers}</strong> players in{" "}
          <strong className="text-green-900">{groups.length}</strong> groups
        </span>
        <span className="text-xs">Generated {generatedDate}</span>
      </div>

      {/* Tee time group cards */}
      <div className="space-y-4 animate-stagger-slow">
        {groups.map((group, idx) => {
          const slot = getSlotForTime(group.teeTime);
          const colors = SLOT_COLORS[slot] || SLOT_COLORS.mid;

          return (
            <div
              key={idx}
              className={`tee-sheet-card print-break-avoid relative rounded-2xl ${colors.bg} ring-1 ${colors.border} overflow-hidden premium-card`}
            >
              {/* Left color stripe */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1.5 ${colors.stripe} rounded-l-2xl`}
              />

              {/* Group number badge */}
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/80 ring-1 ring-green-800/10 text-xs font-semibold text-green-800">
                  {idx + 1}
                </span>
              </div>

              <div className="pl-5 pr-4 py-4">
                {/* Tee time header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-brass" />
                    <span className="font-heading text-xl font-bold text-green-900 tracking-tight">
                      {group.teeTime}
                    </span>
                  </div>
                  <span className={colors.pillClass}>{colors.label}</span>
                </div>

                {/* Player rows */}
                <div className="space-y-1.5">
                  {group.players.map((playerId, pIdx) => {
                    const player = playerMap.get(playerId);
                    return (
                      <div
                        key={pIdx}
                        className="flex items-center justify-between bg-white/70 rounded-xl px-4 py-2.5 transition-colors hover:bg-white/90"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-full bg-green-800/8 flex items-center justify-center text-[10px] font-semibold text-green-800/50">
                            {pIdx + 1}
                          </span>
                          <span className="font-medium text-sm text-green-900">
                            {player?.name ?? "Unknown"}
                          </span>
                        </div>
                        {player?.handicapIndex !== undefined && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-cream-dark/60 text-xs font-medium text-muted-foreground tabular-nums">
                            {player.handicapIndex.toFixed(1)}
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {/* Empty slots — dashed placeholders */}
                  {Array.from({ length: Math.max(0, 4 - group.players.length) }).map(
                    (_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="flex items-center justify-center rounded-xl px-4 py-2.5 border-2 border-dashed border-green-800/8"
                      >
                        <span className="text-xs text-muted-foreground/40 italic">
                          Open slot
                        </span>
                      </div>
                    )
                  )}
                </div>

                {/* Cart note */}
                {group.cartNote && (
                  <div className="flex items-start gap-2 mt-3 pt-2 border-t border-green-800/5">
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground italic">
                      {group.cartNote}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
