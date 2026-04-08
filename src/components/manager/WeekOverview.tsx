"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Users, CheckCircle } from "lucide-react";

interface WeekOverviewProps {
  playDate: number;
  deadline: number;
  status: string;
  submitted: number;
  total: number;
  playing: number;
}

function formatCountdown(targetMs: number): string {
  const diff = targetMs - Date.now();
  if (diff <= 0) return "Deadline passed";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);

  return parts.join(" ");
}

function statusVariant(status: string) {
  switch (status) {
    case "open":
      return "default" as const;
    case "draft":
      return "secondary" as const;
    case "closed":
      return "outline" as const;
    default:
      return "secondary" as const;
  }
}

export function WeekOverview({
  playDate,
  deadline,
  status,
  submitted,
  total,
  playing,
}: WeekOverviewProps) {
  const [countdown, setCountdown] = useState(formatCountdown(deadline));

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(formatCountdown(deadline));
    }, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [deadline]);

  const formattedPlayDate = new Date(playDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const formattedDeadline = new Date(deadline).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const progressPercent = total > 0 ? Math.round((submitted / total) * 100) : 0;

  return (
    <Card className="border-0 ring-1 ring-green-800/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">This Week</CardTitle>
          <Badge variant={statusVariant(status)} className="capitalize">
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date & Deadline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-800/10 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-green-800" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Play Date
              </p>
              <p className="font-medium text-sm">{formattedPlayDate}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-brass/10 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-brass" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Deadline
              </p>
              <p className="font-medium text-sm">{formattedDeadline}</p>
              {Date.now() < deadline && (
                <p className="text-xs text-brass font-medium">{countdown} remaining</p>
              )}
            </div>
          </div>
        </div>

        {/* Submission Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Submissions</span>
            </div>
            <span className="font-medium">
              {submitted} of {total} players
            </span>
          </div>
          <div className="w-full h-3 bg-cream-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-green-800 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-green-700" />
            <span>
              <strong>{playing}</strong> playing
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-cream-dark flex items-center justify-center text-xs">
              ✕
            </span>
            <span>
              <strong>{submitted - playing}</strong> not playing
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
