"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Link2,
  Copy,
  Check,
  CheckCircle,
  Circle,
  Wand2,
  ClipboardCopy,
} from "lucide-react";

export default function LinksPage() {
  const currentWeek = useQuery(api.weeks.getCurrent);
  const tokens = useQuery(
    api.tokens.listByWeek,
    currentWeek ? { weekId: currentWeek._id } : "skip"
  );
  const generateAll = useMutation(api.tokens.generateAll);

  const [generating, setGenerating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  if (currentWeek === undefined) {
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
          Player Links
        </h1>
        <p className="text-muted-foreground">
          No week is currently scheduled. Create a week from the Overview page.
        </p>
      </div>
    );
  }

  const handleGenerateAll = async () => {
    setGenerating(true);
    try {
      await generateAll({ weekId: currentWeek._id });
    } catch (error) {
      console.error("Failed to generate links:", error);
    } finally {
      setGenerating(false);
    }
  };

  const getBaseUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "";
  };

  const handleCopyLink = async (token: string) => {
    const url = `${getBaseUrl()}/request/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleCopyAll = async () => {
    if (!tokens || tokens.length === 0) return;
    const baseUrl = getBaseUrl();
    const lines = tokens.map(
      (t) => `${t.playerName}: ${baseUrl}/request/${t.token}`
    );
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl text-green-900">
            Player Links
          </h1>
          <p className="text-muted-foreground mt-1">
            Unique submission links for each player
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {tokens && tokens.length > 0 && (
            <Button
              variant="outline"
              onClick={handleCopyAll}
              className="border-green-800 text-green-800"
            >
              {copiedAll ? (
                <>
                  <Check className="w-4 h-4 mr-1.5 text-green-700" />
                  Copied!
                </>
              ) : (
                <>
                  <ClipboardCopy className="w-4 h-4 mr-1.5" />
                  Copy All
                </>
              )}
            </Button>
          )}
          <Button
            onClick={handleGenerateAll}
            disabled={generating}
            className="bg-brass text-green-900 hover:bg-brass-light"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <Wand2 className="w-4 h-4 mr-1.5" />
            )}
            Generate All
          </Button>
        </div>
      </div>

      {/* Links Table */}
      {!tokens || tokens.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-cream-dark flex items-center justify-center mx-auto mb-4">
            <Link2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-6">
            No links generated yet for this week.
          </p>
          <Button
            onClick={handleGenerateAll}
            disabled={generating}
            className="bg-brass text-green-900 hover:bg-brass-light"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <Wand2 className="w-4 h-4 mr-1.5" />
            )}
            Generate All Links
          </Button>
        </div>
      ) : (
        <>
          {/* ═══ Desktop Table ═══ */}
          <div className="hidden md:block bg-white rounded-xl ring-1 ring-green-800/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-cream/50">
                  <TableHead>Player</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((tokenDoc) => (
                  <TableRow key={tokenDoc._id}>
                    <TableCell className="font-medium">
                      {tokenDoc.playerName}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-cream-dark/50 px-2 py-1 rounded text-muted-foreground max-w-[300px] truncate block">
                        /request/{tokenDoc.token.slice(0, 12)}...
                      </code>
                    </TableCell>
                    <TableCell>
                      {tokenDoc.submitted ? (
                        <Badge
                          variant="default"
                          className="bg-green-800 text-cream"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Yes
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-cream-dark text-muted-foreground"
                        >
                          <Circle className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyLink(tokenDoc.token)}
                        className="min-h-[44px]"
                      >
                        {copiedToken === tokenDoc.token ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1 text-green-700" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* ═══ Mobile Cards ═══ */}
          <div className="md:hidden space-y-2 animate-stagger-slow">
            {tokens.map((tokenDoc) => (
              <div
                key={tokenDoc._id}
                className="bg-white rounded-xl ring-1 ring-green-800/10 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm text-green-900 truncate">
                      {tokenDoc.playerName}
                    </h3>
                    <code className="text-[10px] text-muted-foreground/60 block truncate">
                      /request/{tokenDoc.token.slice(0, 16)}...
                    </code>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {tokenDoc.submitted ? (
                      <Badge
                        variant="default"
                        className="bg-green-800 text-cream"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Yes
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-cream-dark text-muted-foreground"
                      >
                        <Circle className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyLink(tokenDoc.token)}
                      className="min-h-[44px] min-w-[44px]"
                    >
                      {copiedToken === tokenDoc.token ? (
                        <Check className="w-4 h-4 text-green-700" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
