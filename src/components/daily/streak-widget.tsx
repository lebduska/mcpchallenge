"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Flame, Calendar, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakData {
  dailyStreak: number;
  longestDailyStreak: number;
  lastDailyCompletedAt: string | null;
}

interface StreakWidgetProps {
  className?: string;
  compact?: boolean;
}

export function StreakWidget({ className, compact = false }: StreakWidgetProps) {
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStreak() {
      try {
        const res = await fetch("/api/daily-challenge");
        if (res.ok) {
          const json = await res.json() as { userStreak?: number };
          setData({
            dailyStreak: json.userStreak || 0,
            longestDailyStreak: 0, // Would need separate endpoint
            lastDailyCompletedAt: null,
          });
        }
      } catch (error) {
        console.error("Failed to fetch streak:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStreak();
  }, []);

  if (loading || !data) {
    return null;
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Flame className={cn(
          "h-4 w-4",
          data.dailyStreak > 0 ? "text-orange-500" : "text-zinc-400"
        )} />
        <span className={cn(
          "font-semibold",
          data.dailyStreak > 0 ? "text-orange-500" : "text-zinc-400"
        )}>
          {data.dailyStreak}
        </span>
      </div>
    );
  }

  return (
    <Card className={cn(
      "p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800",
      className
    )}>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/50">
          <Flame className={cn(
            "h-5 w-5",
            data.dailyStreak > 0 ? "text-orange-600 dark:text-orange-400" : "text-zinc-400"
          )} />
        </div>
        <div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {data.dailyStreak}
          </div>
          <div className="text-xs text-zinc-500">
            {data.dailyStreak === 1 ? "day streak" : "day streak"}
          </div>
        </div>
      </div>

      {data.longestDailyStreak > data.dailyStreak && (
        <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800 flex items-center gap-2 text-xs text-zinc-500">
          <Trophy className="h-3 w-3" />
          Best: {data.longestDailyStreak} days
        </div>
      )}
    </Card>
  );
}
