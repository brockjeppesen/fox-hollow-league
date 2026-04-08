"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { RequestCard } from "@/components/manager/RequestCard";
import { Button } from "@/components/ui/button";
import { Loader2, ClipboardList } from "lucide-react";

type FilterTab = "all" | "playing" | "not-playing";

export default function RequestsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const currentWeek = useQuery(api.weeks.getCurrent);
  const requests = useQuery(
    api.requests.getByWeek,
    currentWeek ? { weekId: currentWeek._id } : "skip"
  );

  if (currentWeek === undefined || requests === undefined) {
    return (
      <div className="p-6 md:p-10">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-green-800" />
        </div>
      </div>
    );
  }

  if (!currentWeek) {
    return (
      <div className="p-6 md:p-10">
        <h1 className="font-heading text-2xl md:text-3xl text-green-900 mb-2">
          Requests
        </h1>
        <p className="text-muted-foreground">
          No week is currently scheduled. Create a week from the Overview page.
        </p>
      </div>
    );
  }

  const filteredRequests =
    requests?.filter((r) => {
      if (activeTab === "playing") return r.playing;
      if (activeTab === "not-playing") return !r.playing;
      return true;
    }) ?? [];

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: requests?.length ?? 0 },
    {
      key: "playing",
      label: "Playing",
      count: requests?.filter((r) => r.playing).length ?? 0,
    },
    {
      key: "not-playing",
      label: "Not Playing",
      count: requests?.filter((r) => !r.playing).length ?? 0,
    },
  ];

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl md:text-3xl text-green-900">
          Requests
        </h1>
        <p className="text-muted-foreground mt-1">
          Player submissions for the current week
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-cream-dark pb-3">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
            className={
              activeTab === tab.key
                ? "bg-green-800 text-cream"
                : "text-muted-foreground hover:text-green-900"
            }
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>
          </Button>
        ))}
      </div>

      {/* Request Cards */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-cream-dark flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            {activeTab === "all"
              ? "No submissions yet for this week."
              : `No ${activeTab === "playing" ? "playing" : "not-playing"} submissions.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRequests.map((request) => (
            <RequestCard
              key={request._id}
              playerName={request.playerName}
              playerHandicap={request.playerHandicap}
              playing={request.playing}
              wantsWithNames={request.wantsWithNames}
              avoidNames={request.avoidNames}
              timeSlot={request.timeSlot}
              notes={request.notes}
              submittedAt={request.submittedAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
