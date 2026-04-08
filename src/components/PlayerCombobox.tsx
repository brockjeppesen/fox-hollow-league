"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

interface Player {
  _id: Id<"players">;
  name: string;
}

interface PlayerComboboxProps {
  players: Player[];
  selected: Id<"players">[];
  onChange: (selected: Id<"players">[]) => void;
  excludeIds?: Id<"players">[];
  max?: number;
  placeholder?: string;
}

export function PlayerCombobox({
  players,
  selected,
  onChange,
  excludeIds = [],
  max = 3,
  placeholder = "Search players...",
}: PlayerComboboxProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const excludeSet = new Set([...excludeIds, ...selected]);
  const availablePlayers = players.filter((p) => !excludeSet.has(p._id));
  const selectedPlayers = players.filter((p) => selected.includes(p._id));

  const handleSelect = (playerId: Id<"players">) => {
    if (selected.length >= max) return;
    onChange([...selected, playerId]);
    setSearch("");
  };

  const handleRemove = (playerId: Id<"players">) => {
    onChange(selected.filter((id) => id !== playerId));
  };

  return (
    <div className="space-y-2">
      {selectedPlayers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedPlayers.map((player) => (
            <Badge
              key={player._id}
              variant="secondary"
              className="h-8 gap-1.5 pl-3 pr-1.5 text-sm bg-green-700 text-cream border-green-600"
            >
              {player.name}
              <button
                type="button"
                onClick={() => handleRemove(player._id)}
                className="ml-1 rounded-full p-0.5 hover:bg-green-600 transition-colors min-h-[24px] min-w-[24px] flex items-center justify-center"
                aria-label={`Remove ${player.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {selected.length < max && (
        <div className="relative">
          <Command className="rounded-lg border border-cream-dark bg-white" shouldFilter={true}>
            <CommandInput
              placeholder={placeholder}
              value={search}
              onValueChange={(val) => {
                setSearch(val);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => {
                // Small delay to allow click to register
                setTimeout(() => setOpen(false), 200);
              }}
            />
            {open && (
              <CommandList>
                <CommandEmpty className="py-3 text-sm text-muted-foreground">
                  No players found.
                </CommandEmpty>
                <CommandGroup>
                  {availablePlayers.map((player) => (
                    <CommandItem
                      key={player._id}
                      value={player.name}
                      onSelect={() => handleSelect(player._id)}
                      className="min-h-[44px] cursor-pointer"
                    >
                      {player.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            )}
          </Command>
          {selected.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {selected.length} of {max} selected
            </p>
          )}
        </div>
      )}
    </div>
  );
}
