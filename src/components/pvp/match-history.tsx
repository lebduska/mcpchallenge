"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trophy,
  Minus,
  TrendingUp,
  TrendingDown,
  Clock,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Match {
  id: string;
  roomId: string;
  gameType: string;
  result: string;
  playerColor: string;
  isWinner: boolean;
  isDraw: boolean;
  ratingChange: number | null;
  totalMoves: number;
  durationMs: number | null;
  startedAt: string;
  opponent: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  } | null;
}

interface MatchHistoryProps {
  className?: string;
  limit?: number;
  showViewAll?: boolean;
}

const GAME_ICONS: Record<string, string> = {
  chess: "♟️",
  "tic-tac-toe": "⭕",
};

export function MatchHistory({ className, limit = 5, showViewAll = true }: MatchHistoryProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchMatches();
  }, [limit]);

  async function fetchMatches() {
    try {
      const res = await fetch(`/api/pvp/matches?limit=${limit}`);
      if (res.ok) {
        const data = await res.json() as { matches: Match[]; total: number };
        setMatches(data.matches);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch matches:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatDuration(ms: number | null): string {
    if (!ms) return "-";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  if (loading) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      </Card>
    );
  }

  if (matches.length === 0) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="text-center py-8">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-zinc-300" />
          <p className="text-zinc-500 mb-4">No matches yet</p>
          <Link href="/pvp">
            <Button size="sm">Play PvP</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-zinc-900 dark:text-white">
          Recent Matches
        </h3>
        {showViewAll && total > limit && (
          <Link href="/pvp/history">
            <Button variant="ghost" size="sm">
              View All ({total})
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {matches.map((match) => (
          <div
            key={match.id}
            className={cn(
              "p-3 rounded-lg border",
              match.isWinner
                ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                : match.isDraw
                ? "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
            )}
          >
            <div className="flex items-center gap-3">
              {/* Game icon */}
              <span className="text-xl">{GAME_ICONS[match.gameType] || "🎮"}</span>

              {/* Opponent */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {match.opponent ? (
                    <>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={match.opponent.image || undefined} />
                        <AvatarFallback>
                          {(match.opponent.name || match.opponent.username || "?").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm text-zinc-900 dark:text-white">
                        {match.opponent.name || match.opponent.username || "Anonymous"}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-zinc-500">No opponent</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                  <Clock className="h-3 w-3" />
                  <span>{formatDuration(match.durationMs)}</span>
                  <span>•</span>
                  <span>{match.totalMoves} moves</span>
                  <span>•</span>
                  <span>{formatDate(match.startedAt)}</span>
                </div>
              </div>

              {/* Result */}
              <div className="text-right">
                <Badge
                  className={cn(
                    match.isWinner
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      : match.isDraw
                      ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  )}
                >
                  {match.isWinner ? "Win" : match.isDraw ? "Draw" : "Loss"}
                </Badge>
                {match.ratingChange !== null && match.ratingChange !== 0 && (
                  <div className={cn(
                    "flex items-center justify-end gap-1 mt-1 text-xs font-medium",
                    match.ratingChange > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {match.ratingChange > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {match.ratingChange > 0 ? "+" : ""}{match.ratingChange}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
