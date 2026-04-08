"use client";

import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";

const SLOT_COLORS: Record<string, { bg: string; border: string; label: string }> = {
  early: { bg: "bg-green-700/20", border: "border-green-700/30", label: "Early" },
  mid: { bg: "bg-blue-700/10", border: "border-blue-700/20", label: "Mid" },
  late: { bg: "bg-amber-700/10", border: "border-amber-700/20", label: "Late" },
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
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <Badge
          variant={status === "published" ? "default" : "secondary"}
          className={
            status === "published"
              ? "bg-green-800 text-cream"
              : "bg-brass/20 text-brass border border-brass/30"
          }
        >
          {status === "published" ? "Published" : "Draft"}
        </Badge>
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {totalPlayers} players in {groups.length} groups
        </span>
        <span>Generated {generatedDate}</span>
      </div>

      {/* Tee time groups */}
      <div className="space-y-3">
        {groups.map((group, idx) => {
          const slot = getSlotForTime(group.teeTime);
          const colors = SLOT_COLORS[slot] || SLOT_COLORS.mid;

          return (
            <div
              key={idx}
              className={`rounded-xl border ${colors.border} ${colors.bg} p-4 transition-all`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brass" />
                  <span className="font-heading text-base font-medium text-green-900">
                    {group.teeTime}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-xs border-green-800/20 text-muted-foreground"
                  >
                    {colors.label}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  Group {idx + 1}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {group.players.map((playerId, pIdx) => {
                  const player = playerMap.get(playerId);
                  return (
                    <div
                      key={pIdx}
                      className="flex items-center justify-between bg-white/80 rounded-lg px-3 py-2"
                    >
                      <span className="font-medium text-sm text-green-900 truncate">
                        {player?.name ?? "Unknown"}
                      </span>
                      {player?.handicapIndex !== undefined && (
                        <span className="text-xs text-muted-foreground ml-2 shrink-0">
                          {player.handicapIndex.toFixed(1)}
                        </span>
                      )}
                    </div>
                  );
                })}
                {/* Empty slots */}
                {Array.from({ length: Math.max(0, 4 - group.players.length) }).map(
                  (_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="flex items-center justify-center bg-white/30 rounded-lg px-3 py-2 border border-dashed border-green-800/10"
                    >
                      <span className="text-xs text-muted-foreground/50">
                        Open
                      </span>
                    </div>
                  )
                )}
              </div>

              {group.cartNote && (
                <p className="mt-2 text-xs text-muted-foreground italic">
                  🛒 {group.cartNote}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
