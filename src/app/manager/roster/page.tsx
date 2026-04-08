"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AddPlayerDialog } from "@/components/manager/AddPlayerDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users } from "lucide-react";

export default function RosterPage() {
  const players = useQuery(api.players.listAll);
  const toggleActive = useMutation(api.players.toggleActive);

  if (players === undefined) {
    return (
      <div className="p-6 md:p-10">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-green-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl text-green-900">
            Roster
          </h1>
          <p className="text-muted-foreground mt-1">
            {players.length} player{players.length !== 1 ? "s" : ""} in the
            league
          </p>
        </div>
        <AddPlayerDialog />
      </div>

      {/* Table */}
      {players.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-cream-dark flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">
            No players in the roster yet.
          </p>
          <AddPlayerDialog />
        </div>
      ) : (
        <div className="bg-white rounded-xl ring-1 ring-green-800/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-cream/50">
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Handicap
                </TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player) => (
                <TableRow key={player._id}>
                  <TableCell className="font-medium">
                    <div>
                      {player.name}
                      <div className="sm:hidden text-xs text-muted-foreground">
                        {player.handicapIndex !== undefined &&
                          `HCP ${player.handicapIndex.toFixed(1)}`}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {player.handicapIndex !== undefined
                      ? player.handicapIndex.toFixed(1)
                      : "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {player.phone || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {player.email || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={player.active ? "default" : "secondary"}
                      className={
                        player.active
                          ? "bg-green-800 text-cream"
                          : "bg-cream-dark text-muted-foreground"
                      }
                    >
                      {player.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive({ id: player._id })}
                      className="text-xs"
                    >
                      {player.active ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
