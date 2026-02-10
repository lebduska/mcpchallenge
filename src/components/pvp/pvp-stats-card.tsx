"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Swords,
  Trophy,
  Target,
  TrendingUp,
  Flame,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PvPStats {
  pvpWins: number;
  pvpLosses: number;
  pvpRating: number;
  pvpWinStreak: number;
  pvpBestWinStreak: number;
}

interface PvPStatsCardProps {
  className?: string;
}

export function PvPStatsCard({ className }: PvPStatsCardProps) {
  const [stats, setStats] = useState<PvPStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const data = await res.json() as {
          stats: PvPStats;
        };
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
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

  if (!stats) {
    return null;
  }

  const totalGames = stats.pvpWins + stats.pvpLosses;
  const winRate = totalGames > 0
    ? Math.round((stats.pvpWins / totalGames) * 100)
    : 0;

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
          <Swords className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-white">
            PvP Stats
          </h3>
          <p className="text-sm text-zinc-500">
            Your multiplayer record
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Rating */}
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {stats.pvpRating}
          </div>
          <div className="text-xs text-zinc-500">Rating</div>
        </div>

        {/* Win Rate */}
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {winRate}%
          </div>
          <div className="text-xs text-zinc-500">Win Rate</div>
        </div>

        {/* Wins */}
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {stats.pvpWins}
          </div>
          <div className="text-xs text-zinc-500">Wins</div>
        </div>

        {/* Best Streak */}
        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {stats.pvpBestWinStreak}
          </div>
          <div className="text-xs text-zinc-500">Best Streak</div>
        </div>
      </div>

      {/* Record */}
      <div className="text-center text-sm text-zinc-500 mb-4">
        Record: {stats.pvpWins}W - {stats.pvpLosses}L
      </div>

      <Link href="/pvp">
        <Button className="w-full">
          <Swords className="h-4 w-4 mr-2" />
          Play PvP
        </Button>
      </Link>
    </Card>
  );
}
