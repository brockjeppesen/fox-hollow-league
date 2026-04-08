"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Users, Ban, MessageSquare } from "lucide-react";

const SLOT_LABELS: Record<string, string> = {
  early: "Early (3:00–3:30)",
  mid: "Mid (3:30–4:15)",
  late: "Late (4:15–5:00)",
  no_preference: "No Preference",
};

interface RequestCardProps {
  playerName: string;
  playerHandicap?: number;
  playing: boolean;
  wantsWithNames: string[];
  avoidNames: string[];
  timeSlot?: string;
  notes?: string;
  submittedAt: number;
}

export function RequestCard({
  playerName,
  playerHandicap,
  playing,
  wantsWithNames,
  avoidNames,
  timeSlot,
  notes,
  submittedAt,
}: RequestCardProps) {
  const submittedDate = new Date(submittedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Card className="border-0 ring-1 ring-green-800/10">
      <CardContent className="pt-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-heading text-base font-medium">{playerName}</h3>
            {playerHandicap !== undefined && (
              <p className="text-xs text-muted-foreground">
                HCP {playerHandicap.toFixed(1)}
              </p>
            )}
          </div>
          <Badge
            variant={playing ? "default" : "secondary"}
            className={
              playing
                ? "bg-green-800 text-cream"
                : "bg-cream-dark text-muted-foreground"
            }
          >
            {playing ? (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Playing
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                Not Playing
              </span>
            )}
          </Badge>
        </div>

        {playing && (
          <div className="space-y-2.5 text-sm">
            {wantsWithNames.length > 0 && (
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 text-green-700 shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground text-xs">With: </span>
                  <span>{wantsWithNames.join(", ")}</span>
                </div>
              </div>
            )}

            {avoidNames.length > 0 && (
              <div className="flex items-start gap-2">
                <Ban className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground text-xs">Avoid: </span>
                  <span>{avoidNames.join(", ")}</span>
                </div>
              </div>
            )}

            {timeSlot && timeSlot !== "no_preference" && (
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-brass shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground text-xs">Time: </span>
                  <span>{SLOT_LABELS[timeSlot] ?? timeSlot}</span>
                </div>
              </div>
            )}

            {notes && (
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-muted-foreground italic">{notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer timestamp */}
        <p className="text-xs text-muted-foreground mt-3 pt-2 border-t border-cream-dark">
          Submitted {submittedDate}
        </p>
      </CardContent>
    </Card>
  );
}
