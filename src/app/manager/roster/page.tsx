"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AddPlayerDialog } from "@/components/manager/AddPlayerDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Users,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Download,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Pencil,
  Filter,
} from "lucide-react";

type SortKey = "name" | "handicap" | "email" | "phone" | "status";
type SortDir = "asc" | "desc";
type StatusFilter = "all" | "active" | "inactive";
const PAGE_SIZE = 50;

interface EditingCell {
  playerId: Id<"players">;
  field: "handicapIndex" | "email" | "phone";
  value: string;
}

export default function RosterPage() {
  const players = useQuery(api.players.listAll);
  const toggleActive = useMutation(api.players.toggleActive);
  const updatePlayer = useMutation(api.players.update);

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-30" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3.5 h-3.5 text-brass" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-brass" />
    );
  };

  const processedPlayers = useMemo(() => {
    if (!players) return [];

    let filtered = [...players];

    // Status filter
    if (statusFilter === "active") filtered = filtered.filter((p) => p.active);
    if (statusFilter === "inactive") filtered = filtered.filter((p) => !p.active);

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.email && p.email.toLowerCase().includes(q)) ||
          (p.phone && p.phone.includes(q))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "handicap":
          cmp = (a.handicapIndex ?? 999) - (b.handicapIndex ?? 999);
          break;
        case "email":
          cmp = (a.email ?? "").localeCompare(b.email ?? "");
          break;
        case "phone":
          cmp = (a.phone ?? "").localeCompare(b.phone ?? "");
          break;
        case "status":
          cmp = (a.active ? 0 : 1) - (b.active ? 0 : 1);
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return filtered;
  }, [players, search, sortKey, sortDir, statusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(processedPlayers.length / PAGE_SIZE));
  const pagedPlayers = processedPlayers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleStartEdit = (playerId: Id<"players">, field: EditingCell["field"], currentValue: string) => {
    setEditing({ playerId, field, value: currentValue });
  };

  const handleSaveEdit = useCallback(async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const update: Record<string, unknown> = { id: editing.playerId };
      if (editing.field === "handicapIndex") {
        const parsed = parseFloat(editing.value);
        if (!isNaN(parsed)) update.handicapIndex = parsed;
      } else {
        update[editing.field] = editing.value.trim() || undefined;
      }
      await updatePlayer(update as any);
      setEditing(null);
    } catch (err) {
      console.error("Failed to update:", err);
    } finally {
      setSaving(false);
    }
  }, [editing, updatePlayer]);

  const handleCancelEdit = () => setEditing(null);

  const handleExportCSV = () => {
    if (!processedPlayers.length) return;
    const header = "Name,Handicap,Email,Phone,Status";
    const rows = processedPlayers.map((p) =>
      [
        `"${p.name}"`,
        p.handicapIndex !== undefined ? p.handicapIndex.toFixed(1) : "",
        `"${p.email || ""}"`,
        `"${p.phone || ""}"`,
        p.active ? "Active" : "Inactive",
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    navigator.clipboard.writeText(csv).then(() => {
      // Brief visual feedback could go here
    });
  };

  if (players === undefined) {
    return (
      <div className="p-6 md:p-10">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-green-800" />
        </div>
      </div>
    );
  }

  const activeCount = players.filter((p) => p.active).length;
  const inactiveCount = players.length - activeCount;

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 animate-fade-in">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl text-green-900">
            Roster
          </h1>
          <p className="text-muted-foreground mt-1">
            <span className="font-semibold text-green-800">{activeCount}</span> active
            {" · "}
            <span className="font-semibold text-muted-foreground">{inactiveCount}</span> inactive
            {" · "}
            <span className="font-semibold text-green-800">{players.length}</span> total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="border-green-800/20 text-green-800"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export CSV
          </Button>
          <AddPlayerDialog />
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5 animate-fade-in-delay">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="search-input h-9 pl-9 pr-3 rounded-lg border border-cream-dark bg-white text-sm w-full focus:outline-none"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusFilter); setPage(0); }}>
          <SelectTrigger className="h-9 w-[130px] text-sm">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Players</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {players.length === 0 ? (
        <div className="text-center py-12 animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-cream-dark flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">
            No players in the roster yet.
          </p>
          <AddPlayerDialog />
        </div>
      ) : processedPlayers.length === 0 ? (
        <div className="text-center py-12 animate-scale-in">
          <p className="text-muted-foreground">No players match your search.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl ring-1 ring-green-800/10 overflow-hidden animate-fade-in-delay-2">
            <table className="premium-table w-full">
              <thead>
                <tr className="border-b border-cream-dark bg-cream/50">
                  <th
                    className="sortable-header text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase tracking-wider"
                    onClick={() => handleSort("name")}
                  >
                    <span className="flex items-center gap-1.5">
                      Name <SortIcon column="name" />
                    </span>
                  </th>
                  <th
                    className="sortable-header text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase tracking-wider"
                    onClick={() => handleSort("handicap")}
                  >
                    <span className="flex items-center gap-1.5">
                      Handicap <SortIcon column="handicap" />
                    </span>
                  </th>
                  <th
                    className="sortable-header text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase tracking-wider"
                    onClick={() => handleSort("email")}
                  >
                    <span className="flex items-center gap-1.5">
                      Email <SortIcon column="email" />
                    </span>
                  </th>
                  <th
                    className="sortable-header text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase tracking-wider"
                    onClick={() => handleSort("phone")}
                  >
                    <span className="flex items-center gap-1.5">
                      Phone <SortIcon column="phone" />
                    </span>
                  </th>
                  <th
                    className="sortable-header text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase tracking-wider"
                    onClick={() => handleSort("status")}
                  >
                    <span className="flex items-center gap-1.5">
                      Status <SortIcon column="status" />
                    </span>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-green-800 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="animate-stagger-rows">
                {pagedPlayers.map((player) => {
                  const isEditingThis = (field: EditingCell["field"]) =>
                    editing?.playerId === player._id && editing?.field === field;

                  return (
                    <tr key={player._id} className="border-b border-cream-dark/50 last:border-0 group">
                      {/* Name */}
                      <td className="px-4 py-3">
                        <span className="font-medium text-sm text-green-900">
                          {player.name}
                        </span>
                      </td>

                      {/* Handicap — inline editable */}
                      <td className="px-4 py-3">
                        {isEditingThis("handicapIndex") ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.1"
                              value={editing!.value}
                              onChange={(e) => setEditing({ ...editing!, value: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit();
                                if (e.key === "Escape") handleCancelEdit();
                              }}
                              className="w-16 h-7 px-2 text-sm border border-brass rounded-md focus:outline-none focus:ring-1 focus:ring-brass"
                              autoFocus
                            />
                            <button
                              onClick={handleSaveEdit}
                              disabled={saving}
                              className="p-0.5 text-green-700 hover:text-green-900"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-0.5 text-muted-foreground hover:text-red-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span
                            className="inline-edit-cell text-sm tabular-nums text-muted-foreground cursor-pointer"
                            onClick={() =>
                              handleStartEdit(
                                player._id,
                                "handicapIndex",
                                player.handicapIndex !== undefined
                                  ? player.handicapIndex.toFixed(1)
                                  : ""
                              )
                            }
                          >
                            {player.handicapIndex !== undefined
                              ? player.handicapIndex.toFixed(1)
                              : "—"}
                            <Pencil className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-40 transition-opacity" />
                          </span>
                        )}
                      </td>

                      {/* Email — inline editable */}
                      <td className="px-4 py-3">
                        {isEditingThis("email") ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="email"
                              value={editing!.value}
                              onChange={(e) => setEditing({ ...editing!, value: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit();
                                if (e.key === "Escape") handleCancelEdit();
                              }}
                              className="w-44 h-7 px-2 text-sm border border-brass rounded-md focus:outline-none focus:ring-1 focus:ring-brass"
                              autoFocus
                            />
                            <button onClick={handleSaveEdit} disabled={saving} className="p-0.5 text-green-700 hover:text-green-900">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={handleCancelEdit} className="p-0.5 text-muted-foreground hover:text-red-600">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span
                            className="inline-edit-cell text-sm text-muted-foreground cursor-pointer"
                            onClick={() => handleStartEdit(player._id, "email", player.email || "")}
                          >
                            {player.email || "—"}
                            <Pencil className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-40 transition-opacity" />
                          </span>
                        )}
                      </td>

                      {/* Phone — inline editable */}
                      <td className="px-4 py-3">
                        {isEditingThis("phone") ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="tel"
                              value={editing!.value}
                              onChange={(e) => setEditing({ ...editing!, value: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit();
                                if (e.key === "Escape") handleCancelEdit();
                              }}
                              className="w-36 h-7 px-2 text-sm border border-brass rounded-md focus:outline-none focus:ring-1 focus:ring-brass"
                              autoFocus
                            />
                            <button onClick={handleSaveEdit} disabled={saving} className="p-0.5 text-green-700 hover:text-green-900">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={handleCancelEdit} className="p-0.5 text-muted-foreground hover:text-red-600">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span
                            className="inline-edit-cell text-sm text-muted-foreground cursor-pointer"
                            onClick={() => handleStartEdit(player._id, "phone", player.phone || "")}
                          >
                            {player.phone || "—"}
                            <Pencil className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-40 transition-opacity" />
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive({ id: player._id })}
                          className="group/toggle"
                        >
                          <Badge
                            variant={player.active ? "default" : "secondary"}
                            className={`cursor-pointer transition-all ${
                              player.active
                                ? "bg-green-800 text-cream hover:bg-green-700"
                                : "bg-cream-dark text-muted-foreground hover:bg-cream-dark/80"
                            }`}
                          >
                            {player.active ? "Active" : "Inactive"}
                          </Badge>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive({ id: player._id })}
                          className="text-xs text-muted-foreground hover:text-green-800"
                        >
                          {player.active ? "Deactivate" : "Activate"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2 animate-stagger-slow">
            {pagedPlayers.map((player) => (
              <div
                key={player._id}
                className="bg-white rounded-xl ring-1 ring-green-800/10 p-4 premium-card"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-sm text-green-900">{player.name}</h3>
                    {player.handicapIndex !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        HCP {player.handicapIndex.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <button onClick={() => toggleActive({ id: player._id })}>
                    <Badge
                      className={`cursor-pointer ${
                        player.active
                          ? "bg-green-800 text-cream"
                          : "bg-cream-dark text-muted-foreground"
                      }`}
                    >
                      {player.active ? "Active" : "Inactive"}
                    </Badge>
                  </button>
                </div>
                {(player.email || player.phone) && (
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {player.email && <p>{player.email}</p>}
                    {player.phone && <p>{player.phone}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-cream-dark/80">
              <span className="text-xs text-muted-foreground">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, processedPlayers.length)} of{" "}
                {processedPlayers.length}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="h-8 w-8 p-0 border-cream-dark"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="h-8 w-8 p-0 border-cream-dark"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
