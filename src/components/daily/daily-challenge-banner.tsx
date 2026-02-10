"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Flame, Trophy, ChevronRight, Check, Loader2 } from "lucide-react";
import { getChallengeConfig } from "@/lib/challenge-config";
import { cn } from "@/lib/utils";

interface DailyChallenge {
  id: string;
  date: string;
  challengeId: string;
  difficulty: string;
  bonusPoints: number;
  challenge: {
    name: string;
    shortName: string;
    description: string;
    category: string;
  } | null;
}

interface DailyChallengeData {
  dailyChallenge: DailyChallenge;
  completed: boolean;
  userStreak: number;
  totalCompletions: number;
}

const difficultyColors: Record<string, string> = {
  easy: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  normal: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  hard: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export function DailyChallengeBanner() {
  const [data, setData] = useState<DailyChallengeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDailyChallenge() {
      try {
        const res = await fetch("/api/daily-challenge");
        if (res.ok) {
          const json = await res.json() as DailyChallengeData;
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch daily challenge:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDailyChallenge();
  }, []);

  if (loading) {
    return (
      <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
        <div className="flex items-center justify-center py-2">
          <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
        </div>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { dailyChallenge, completed, userStreak, totalCompletions } = data;
  const challengeConfig = getChallengeConfig(dailyChallenge.challengeId);
  const Icon = challengeConfig?.icon;

  return (
    <Card className={cn(
      "p-4 border transition-colors",
      completed
        ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800"
        : "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800"
    )}>
      <div className="flex items-center justify-between gap-4">
        {/* Left: Challenge Info */}
        <div className="flex items-center gap-4">
          {/* Calendar Icon */}
          <div className={cn(
            "flex items-center justify-center w-12 h-12 rounded-lg",
            completed ? "bg-green-100 dark:bg-green-900/50" : "bg-amber-100 dark:bg-amber-900/50"
          )}>
            {completed ? (
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            ) : (
              <Calendar className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-zinc-900 dark:text-white">
                Daily Challenge
              </h3>
              <Badge className={difficultyColors[dailyChallenge.difficulty]}>
                {dailyChallenge.difficulty}
              </Badge>
              {completed && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  Completed
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              {Icon && <Icon className={cn("h-4 w-4", challengeConfig?.iconColor)} />}
              <span>{dailyChallenge.challenge?.name || dailyChallenge.challengeId}</span>
              <span className="text-zinc-400">•</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                +{dailyChallenge.bonusPoints} bonus pts
              </span>
            </div>
          </div>
        </div>

        {/* Right: Stats & Button */}
        <div className="flex items-center gap-4">
          {/* Streak */}
          {userStreak > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
              <Flame className="h-4 w-4" />
              <span className="font-semibold">{userStreak}</span>
              <span className="text-xs text-zinc-500">streak</span>
            </div>
          )}

          {/* Completions */}
          <div className="hidden md:flex items-center gap-1.5 text-zinc-500">
            <Trophy className="h-4 w-4" />
            <span className="text-sm">{totalCompletions} today</span>
          </div>

          {/* Play Button */}
          <Link href={`/challenges/${dailyChallenge.challengeId}`}>
            <Button
              variant={completed ? "outline" : "default"}
              className={cn(
                completed
                  ? "border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/50"
                  : "bg-amber-500 hover:bg-amber-600 text-white"
              )}
            >
              {completed ? "View" : "Play"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
