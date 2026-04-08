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
import { Plus, Loader2 } from "lucide-react";

export function CreateWeekDialog() {
  const [open, setOpen] = useState(false);
  const [playDate, setPlayDate] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("18:00");
  const [submitting, setSubmitting] = useState(false);

  const createWeek = useMutation(api.weeks.create);

  const handleSubmit = async () => {
    if (!playDate || !deadlineDate) return;

    setSubmitting(true);
    try {
      const playDateMs = new Date(playDate + "T08:00:00").getTime();
      const deadlineMs = new Date(
        deadlineDate + "T" + deadlineTime + ":00"
      ).getTime();

      await createWeek({
        playDate: playDateMs,
        deadline: deadlineMs,
        status: "draft",
      });

      setOpen(false);
      setPlayDate("");
      setDeadlineDate("");
      setDeadlineTime("18:00");
    } catch (error) {
      console.error("Failed to create week:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-brass text-green-900 hover:bg-brass-light">
            <Plus className="w-4 h-4 mr-1.5" />
            Create Week
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Week</DialogTitle>
          <DialogDescription>
            Set the play date and submission deadline for a new week.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="play-date">Play Date</Label>
            <Input
              id="play-date"
              type="date"
              value={playDate}
              onChange={(e) => setPlayDate(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline-date">Deadline Date</Label>
            <Input
              id="deadline-date"
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline-time">Deadline Time</Label>
            <Input
              id="deadline-time"
              type="time"
              value={deadlineTime}
              onChange={(e) => setDeadlineTime(e.target.value)}
              className="h-10"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!playDate || !deadlineDate || submitting}
            className="bg-green-800 text-cream hover:bg-green-700"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <Plus className="w-4 h-4 mr-1.5" />
            )}
            Create Week
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
