"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TeeSheetView } from "@/components/manager/TeeSheetView";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Grid3X3,
  Wand2,
  RefreshCw,
  Send,
  CheckCircle,
  Copy,
  Printer,
  Check,
} from "lucide-react";

export default function TeeSheetPage() {
  const currentWeek = useQuery(api.weeks.getCurrent);
  const teeSheet = useQuery(
    api.teeSheet.getByWeek,
    currentWeek ? { weekId: currentWeek._id } : "skip"
  );
  const stats = useQuery(
    api.requests.getStats,
    currentWeek ? { weekId: currentWeek._id } : "skip"
  );
  const allPlayers = useQuery(api.players.listAll);

  const generateTeeSheet = useMutation(api.teeSheet.generate);
  const publishTeeSheet = useMutation(api.teeSheet.publish);

  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Loading
  if (currentWeek === undefined || teeSheet === undefined) {
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
          Tee Sheet
        </h1>
        <p className="text-muted-foreground">
          No week is currently scheduled. Create a week from the Overview page.
        </p>
      </div>
    );
  }

  const playDateStr = new Date(currentWeek.playDate).toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric" }
  );

  // Build player map
  const playerMap = new Map<
    string,
    { _id: string; name: string; handicapIndex?: number }
  >();
  if (allPlayers) {
    for (const p of allPlayers) {
      playerMap.set(p._id, p);
    }
  }

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateTeeSheet({ weekId: currentWeek._id });
    } catch (error) {
      console.error("Failed to generate tee sheet:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!teeSheet) return;
    setPublishing(true);
    try {
      await publishTeeSheet({ id: teeSheet._id });
    } catch (error) {
      console.error("Failed to publish tee sheet:", error);
    } finally {
      setPublishing(false);
    }
  };

  const handleCopy = () => {
    if (!teeSheet || !currentWeek) return;

    const dateStr = new Date(currentWeek.playDate).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    const formatStr = currentWeek.format ? `${currentWeek.format}\n\n` : "";

    const lines = teeSheet.groups.map((group: any) => {
      const playerNames = group.players
        .map((pid: string) => {
          const p = playerMap.get(pid);
          if (!p) return "Unknown";
          const hcp = p.handicapIndex !== undefined ? ` (${p.handicapIndex.toFixed(1)})` : "";
          return `${p.name}${hcp}`;
        })
        .join(", ");
      return `${group.teeTime}  |  ${playerNames}`;
    });

    const text = `Fox Hollow Men's League — ${dateStr}\n${formatStr}${lines.join("\n")}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl text-green-900">
            Tee Sheet
          </h1>
          <p className="text-muted-foreground mt-1">{playDateStr}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap no-print">
          {teeSheet && (
            <>
              <Button
                onClick={handleCopy}
                variant="outline"
                className="border-green-800/20 text-green-800 hover:bg-green-800 hover:text-cream"
              >
                {copied ? (
                  <Check className="w-4 h-4 mr-1.5 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 mr-1.5" />
                )}
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button
                onClick={handlePrint}
                variant="outline"
                className="border-green-800/20 text-green-800 hover:bg-green-800 hover:text-cream"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Print
              </Button>
            </>
          )}
          {teeSheet && teeSheet.status === "draft" && (
            <Button
              onClick={handlePublish}
              disabled={publishing}
              className="bg-green-800 text-cream hover:bg-green-700"
            >
              {publishing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <Send className="w-4 h-4 mr-1.5" />
              )}
              Publish
            </Button>
          )}
          {teeSheet && teeSheet.status === "published" && (
            <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Published
            </div>
          )}
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className={
              teeSheet
                ? "border-green-800 text-green-800 hover:bg-green-800 hover:text-cream"
                : "bg-brass text-green-900 hover:bg-brass-light"
            }
            variant={teeSheet ? "outline" : "default"}
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : teeSheet ? (
              <RefreshCw className="w-4 h-4 mr-1.5" />
            ) : (
              <Wand2 className="w-4 h-4 mr-1.5" />
            )}
            {teeSheet ? "Regenerate" : "Generate Tee Sheet"}
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
          <span className="text-muted-foreground">
            <strong className="text-green-900">{stats.playing}</strong> playing
          </span>
          <span className="text-muted-foreground">
            <strong className="text-green-900">{stats.submitted - stats.playing}</strong>{" "}
            not playing
          </span>
          <span className="text-muted-foreground">
            <strong className="text-green-900">
              {stats.total - stats.submitted}
            </strong>{" "}
            pending
          </span>
        </div>
      )}

      {/* Tee Sheet Content */}
      {!teeSheet ? (
        <Card className="border-0 ring-1 ring-green-800/10 max-w-lg">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-green-800/10 flex items-center justify-center mx-auto mb-4">
              <Grid3X3 className="w-8 h-8 text-green-800" />
            </div>
            <h2 className="font-heading text-xl mb-2">No Tee Sheet Yet</h2>
            <p className="text-muted-foreground mb-6">
              Generate a tee sheet from player requests to assign groups and tee
              times.
            </p>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-brass text-green-900 hover:bg-brass-light font-semibold px-8 py-3 text-base"
            >
              {generating ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Wand2 className="w-5 h-5 mr-2" />
              )}
              Generate Tee Sheet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Print-only header */}
          <div className="hidden print:block mb-6">
            <h2 className="text-2xl font-bold">Fox Hollow Men&apos;s League — {playDateStr}</h2>
            {currentWeek.format && (
              <p className="text-base text-gray-600 mt-1">{currentWeek.format}</p>
            )}
          </div>
          <TeeSheetView
            groups={teeSheet.groups as any}
            playerMap={playerMap as any}
            status={teeSheet.status}
            generatedAt={teeSheet.generatedAt}
          />
        </>
      )}
    </div>
  );
}
