"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2 } from "lucide-react";

export function AddPlayerDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [handicap, setHandicap] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const createPlayer = useMutation(api.players.create);

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      await createPlayer({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        handicapIndex: handicap ? parseFloat(handicap) : undefined,
      });

      setOpen(false);
      setName("");
      setPhone("");
      setEmail("");
      setHandicap("");
    } catch (error) {
      console.error("Failed to create player:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-brass text-green-900 hover:bg-brass-light">
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add Player
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Player</DialogTitle>
          <DialogDescription>
            Add a player to the league roster.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="player-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="player-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="player-phone">Phone</Label>
            <Input
              id="player-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(801) 555-1234"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="player-email">Email</Label>
            <Input
              id="player-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="player-handicap">Handicap Index</Label>
            <Input
              id="player-handicap"
              type="number"
              step="0.1"
              value={handicap}
              onChange={(e) => setHandicap(e.target.value)}
              placeholder="12.4"
              className="h-10"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || submitting}
            className="bg-green-800 text-cream hover:bg-green-700"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <UserPlus className="w-4 h-4 mr-1.5" />
            )}
            Add Player
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
