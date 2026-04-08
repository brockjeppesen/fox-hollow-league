"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CreateWeekDialog } from "@/components/manager/CreateWeekDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Calendar,
  CalendarPlus,
  Play,
  Lock,
  CheckCircle,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

function statusBadge(status: string) {
  switch (status) {
    case "open":
      return (
        <Badge className="bg-green-800 text-cream">
          <Play className="w-3 h-3 mr-1" />
          Open
        </Badge>
      );
    case "closed":
      return (
        <Badge variant="outline" className="border-amber-600 text-amber-700">
          <Lock className="w-3 h-3 mr-1" />
          Closed
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-brass/20 text-brass border border-brass/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    case "draft":
    default:
      return (
        <Badge
          variant="secondary"
          className="bg-cream-dark text-muted-foreground"
        >
          Draft
        </Badge>
      );
  }
}

export default function SchedulePage() {
  const weeks = useQuery(api.weeks.listAll);
  const currentWeek = useQuery(api.weeks.getCurrent);
  const updateStatus = useMutation(api.weeks.updateStatus);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (weeks === undefined) {
    return (
      <div className="p-6 md:p-10">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-green-800" />
        </div>
      </div>
    );
  }

  // Sort weeks by playDate ascending
  const sortedWeeks = [...weeks].sort((a, b) => a.playDate - b.playDate);

  const handleStatusChange = async (
    weekId: Id<"weeks">,
    newStatus: string
  ) => {
    setUpdatingId(weekId);
    try {
      await updateStatus({ id: weekId, status: newStatus });
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  // Find next draft week to open
  const now = Date.now();
  const nextDraft = sortedWeeks.find(
    (w) => w.status === "draft" && w.playDate >= now
  );
  const currentOpen = sortedWeeks.find((w) => w.status === "open");

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl text-green-900">
            Season Schedule
          </h1>
          <p className="text-muted-foreground mt-1">
            {sortedWeeks.length} week{sortedWeeks.length !== 1 ? "s" : ""}{" "}
            scheduled
          </p>
        </div>
        <div className="flex items-center gap-3">
          {currentOpen && (
            <Button
              variant="outline"
              className="border-amber-600 text-amber-700 hover:bg-amber-50"
              onClick={() => handleStatusChange(currentOpen._id, "closed")}
              disabled={updatingId === currentOpen._id}
            >
              {updatingId === currentOpen._id ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <Lock className="w-4 h-4 mr-1.5" />
              )}
              Close Current Week
            </Button>
          )}
          {nextDraft && (
            <Button
              className="bg-green-800 text-cream hover:bg-green-700"
              onClick={() => handleStatusChange(nextDraft._id, "open")}
              disabled={updatingId === nextDraft._id}
            >
              {updatingId === nextDraft._id ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <Play className="w-4 h-4 mr-1.5" />
              )}
              Open Next Week
            </Button>
          )}
          <CreateWeekDialog />
        </div>
      </div>

      {/* Week list */}
      {sortedWeeks.length === 0 ? (
        <Card className="border-0 ring-1 ring-green-800/10 max-w-lg">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-green-800/10 flex items-center justify-center mx-auto mb-4">
              <CalendarPlus className="w-8 h-8 text-green-800" />
            </div>
            <h2 className="font-heading text-xl mb-2">No Weeks Scheduled</h2>
            <p className="text-muted-foreground mb-6">
              Create weeks to build out the season schedule.
            </p>
            <CreateWeekDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sortedWeeks.map((week) => {
            const isCurrent = currentWeek?._id === week._id;
            const playDate = new Date(week.playDate);
            const isPast = week.playDate < now;

            const formattedDate = playDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            const deadlineStr = new Date(week.deadline).toLocaleDateString(
              "en-US",
              {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              }
            );

            return (
              <div
                key={week._id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl transition-all ${
                  isCurrent
                    ? "bg-green-800/5 ring-2 ring-green-800/20"
                    : isPast
                      ? "bg-cream-dark/30"
                      : "bg-white ring-1 ring-green-800/5"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? "bg-green-800 text-cream"
                        : isPast
                          ? "bg-cream-dark text-muted-foreground"
                          : "bg-green-800/10 text-green-800"
                    }`}
                  >
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-medium text-sm ${isPast ? "text-muted-foreground" : "text-green-900"}`}
                      >
                        {formattedDate}
                      </span>
                      {isCurrent && (
                        <span className="text-xs bg-green-800 text-cream px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        Deadline: {deadlineStr}
                      </span>
                      {week.format && (
                        <span className="text-xs text-brass">
                          {week.format}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:ml-auto">
                  {statusBadge(week.status)}

                  {/* Quick actions */}
                  {week.status === "draft" && !isPast && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusChange(week._id, "open")}
                      disabled={updatingId === week._id}
                      className="text-xs text-green-800 hover:text-green-900"
                    >
                      {updatingId === week._id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "Open"
                      )}
                    </Button>
                  )}
                  {week.status === "open" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusChange(week._id, "closed")}
                      disabled={updatingId === week._id}
                      className="text-xs text-amber-700 hover:text-amber-800"
                    >
                      {updatingId === week._id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "Close"
                      )}
                    </Button>
                  )}
                  {week.status === "closed" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusChange(week._id, "completed")}
                      disabled={updatingId === week._id}
                      className="text-xs text-brass hover:text-brass-light"
                    >
                      {updatingId === week._id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "Complete"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
