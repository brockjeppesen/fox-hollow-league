"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ClipboardList,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  MessageSquare,
  Users,
  Ban,
} from "lucide-react";

type FilterTab = "all" | "playing" | "not-playing";
type SortKey = "name" | "handicap" | "timeSlot" | "submitted";
type SortDir = "asc" | "desc";

const SLOT_LABELS: Record<string, string> = {
  early: "Early",
  mid: "Mid",
  late: "Late",
  no_preference: "No Pref",
};

const SLOT_PILL_CLASS: Record<string, string> = {
  early: "slot-pill slot-pill-early",
  mid: "slot-pill slot-pill-mid",
  late: "slot-pill slot-pill-late",
  no_preference: "slot-pill slot-pill-none",
};

const SLOT_ORDER: Record<string, number> = {
  early: 0,
  mid: 1,
  late: 2,
  no_preference: 3,
};

export default function RequestsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const currentWeek = useQuery(api.weeks.getCurrent);
  const requests = useQuery(
    api.requests.getByWeek,
    currentWeek ? { weekId: currentWeek._id } : "skip"
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-30" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5 text-brass" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-brass" />
    );
  };

  const processedRequests = useMemo(() => {
    if (!requests) return [];

    let filtered = [...requests];

    // Tab filter
    if (activeTab === "playing") filtered = filtered.filter((r) => r.playing);
    if (activeTab === "not-playing") filtered = filtered.filter((r) => !r.playing);

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.playerName.toLowerCase().includes(q) ||
          r.wantsWithNames.some((n) => n.toLowerCase().includes(q)) ||
          (r.notes && r.notes.toLowerCase().includes(q))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.playerName.localeCompare(b.playerName);
          break;
        case "handicap":
          cmp = (a.playerHandicap ?? 999) - (b.playerHandicap ?? 999);
          break;
        case "timeSlot":
          cmp = (SLOT_ORDER[a.timeSlot ?? "no_preference"] ?? 3) - (SLOT_ORDER[b.timeSlot ?? "no_preference"] ?? 3);
          break;
        case "submitted":
          cmp = a.submittedAt - b.submittedAt;
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return filtered;
  }, [requests, activeTab, search, sortKey, sortDir]);

  // Counts
  const playingCount = requests?.filter((r) => r.playing).length ?? 0;
  const notPlayingCount = requests?.filter((r) => !r.playing).length ?? 0;

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

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: requests?.length ?? 0 },
    { key: "playing", label: "Playing", count: playingCount },
    { key: "not-playing", label: "Not Playing", count: notPlayingCount },
  ];

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <h1 className="font-heading text-2xl md:text-3xl text-green-900">
          Requests
        </h1>
        <p className="text-muted-foreground mt-1">
          Player submissions for the current week
        </p>
      </div>

      {/* Summary Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5 animate-fade-in-delay">
        <div className="flex items-center gap-1.5 bg-green-800/5 px-3 py-1.5 rounded-lg">
          <span className="text-2xl font-heading font-bold text-green-800">{playingCount}</span>
          <span className="text-xs text-green-800/70">playing</span>
        </div>
        <div className="flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-lg">
          <span className="text-2xl font-heading font-bold text-red-800/70">{notPlayingCount}</span>
          <span className="text-xs text-red-800/50">not playing</span>
        </div>
        {requests && (
          <div className="flex items-center gap-1.5 bg-cream-dark/50 px-3 py-1.5 rounded-lg">
            <span className="text-2xl font-heading font-bold text-muted-foreground">{requests.length}</span>
            <span className="text-xs text-muted-foreground">total</span>
          </div>
        )}
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 animate-fade-in-delay-2">
        <div className="flex gap-2 border-b border-cream-dark pb-3 sm:pb-0 sm:border-0">
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

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input h-9 pl-9 pr-3 rounded-lg border border-cream-dark bg-white text-sm w-full sm:w-56 focus:outline-none"
          />
        </div>
      </div>

      {/* Content */}
      {processedRequests.length === 0 ? (
        <div className="text-center py-12 animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-cream-dark flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            {search
              ? "No requests match your search."
              : activeTab === "all"
                ? "No submissions yet for this week."
                : `No ${activeTab === "playing" ? "playing" : "not-playing"} submissions.`}
          </p>
        </div>
      ) : (
        <>
          {/* ═══ Desktop Table ═══ */}
          <div className="hidden md:block bg-white rounded-xl ring-1 ring-green-800/10 overflow-hidden">
            <table className="premium-table w-full">
              <thead>
                <tr className="border-b border-cream-dark bg-cream/50">
                  <th
                    className="sortable-header text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase tracking-wider"
                    onClick={() => handleSort("name")}
                  >
                    <span className="flex items-center gap-1.5">
                      Player <SortIcon column="name" />
                    </span>
                  </th>
                  <th
                    className="sortable-header text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase tracking-wider"
                    onClick={() => handleSort("handicap")}
                  >
                    <span className="flex items-center gap-1.5">
                      HCP <SortIcon column="handicap" />
                    </span>
                  </th>
                  <th
                    className="sortable-header text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase tracking-wider"
                    onClick={() => handleSort("timeSlot")}
                  >
                    <span className="flex items-center gap-1.5">
                      Time Slot <SortIcon column="timeSlot" />
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase tracking-wider">
                    Partners
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase tracking-wider">
                    Notes
                  </th>
                  <th
                    className="sortable-header text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase tracking-wider"
                    onClick={() => handleSort("submitted")}
                  >
                    <span className="flex items-center gap-1.5">
                      Submitted <SortIcon column="submitted" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="animate-stagger-rows">
                {processedRequests.map((req) => {
                  const ts = new Date(req.submittedAt);
                  const submitted = ts.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                  const submittedTime = ts.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  });
                  const slot = req.timeSlot ?? "no_preference";

                  return (
                    <tr key={req._id} className="border-b border-cream-dark/50 last:border-0">
                      {/* Player */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              req.playing ? "bg-green-600" : "bg-red-400"
                            }`}
                          />
                          <span className="font-medium text-sm text-green-900">
                            {req.playerName}
                          </span>
                          {!req.playing && (
                            <Badge className="bg-red-50 text-red-700 border-0 text-[10px] px-1.5 py-0">
                              Out
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Handicap */}
                      <td className="px-4 py-3 text-sm text-muted-foreground tabular-nums">
                        {req.playerHandicap !== undefined
                          ? req.playerHandicap.toFixed(1)
                          : "—"}
                      </td>

                      {/* Time Slot */}
                      <td className="px-4 py-3">
                        {req.playing ? (
                          <span className={SLOT_PILL_CLASS[slot] || "slot-pill slot-pill-none"}>
                            {SLOT_LABELS[slot] || slot}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Partners */}
                      <td className="px-4 py-3">
                        {req.playing && req.wantsWithNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {req.wantsWithNames.map((name, i) => (
                              <span key={i} className="partner-chip">
                                {name}
                              </span>
                            ))}
                          </div>
                        ) : req.playing && req.avoidNames.length > 0 ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Ban className="w-3 h-3" />
                            <span className="italic">Avoid: {req.avoidNames.join(", ")}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="px-4 py-3 max-w-[200px]">
                        {req.notes ? (
                          <div className="flex items-start gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                            <span className="text-xs text-muted-foreground italic truncate">
                              {req.notes}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Submitted */}
                      <td className="px-4 py-3">
                        <div className="text-xs text-muted-foreground">
                          <span>{submitted}</span>
                          <span className="block text-[10px] opacity-60">{submittedTime}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ═══ Mobile Cards ═══ */}
          <div className="md:hidden space-y-3 animate-stagger-slow">
            {processedRequests.map((req) => {
              const ts = new Date(req.submittedAt);
              const submitted = ts.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              });
              const slot = req.timeSlot ?? "no_preference";

              return (
                <div
                  key={req._id}
                  className={`rounded-xl p-4 ring-1 premium-card ${
                    req.playing
                      ? "bg-white ring-green-800/10"
                      : "bg-red-50/50 ring-red-200/30"
                  }`}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-heading text-base font-medium text-green-900">
                        {req.playerName}
                      </h3>
                      {req.playerHandicap !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          HCP {req.playerHandicap.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {req.playing && (
                        <span className={SLOT_PILL_CLASS[slot] || "slot-pill slot-pill-none"}>
                          {SLOT_LABELS[slot] || slot}
                        </span>
                      )}
                      <Badge
                        className={
                          req.playing
                            ? "bg-green-800 text-cream border-0"
                            : "bg-red-100 text-red-700 border-0"
                        }
                      >
                        {req.playing ? "Playing" : "Out"}
                      </Badge>
                    </div>
                  </div>

                  {/* Details */}
                  {req.playing && (
                    <div className="space-y-1.5 text-sm mt-3">
                      {req.wantsWithNames.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Users className="w-3.5 h-3.5 text-green-700 shrink-0 mt-0.5" />
                          <div className="flex flex-wrap gap-1">
                            {req.wantsWithNames.map((name, i) => (
                              <span key={i} className="partner-chip">
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {req.avoidNames.length > 0 && (
                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Ban className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span className="italic">Avoid: {req.avoidNames.join(", ")}</span>
                        </div>
                      )}
                      {req.notes && (
                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                          <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span className="italic">{req.notes}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className="text-[10px] text-muted-foreground/60 mt-3 pt-2 border-t border-cream-dark/50">
                    Submitted {submitted}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
