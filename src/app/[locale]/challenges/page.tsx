"use client";

export const runtime = "edge";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Gamepad2 } from "lucide-react";

const challengeData = [
  { id: "chess", key: "chess", difficulty: "beginner", points: 100, type: "game", completions: 0, featured: true, transport: "HTTP+SSE" },
  { id: "tic-tac-toe", key: "tictactoe", difficulty: "beginner", points: 50, type: "game", completions: 0, transport: "HTTP+SSE" },
  { id: "minesweeper", key: "minesweeper", difficulty: "beginner", points: 75, type: "game", completions: 0, transport: "N/A" },
  // TODO: Snake temporarily disabled - WebSocket transport needs work
  // { id: "snake", key: "snake", difficulty: "intermediate", points: 150, type: "game", completions: 0, featured: true, transport: "WebSocket" },
  { id: "canvas-draw", key: "canvasDraw", difficulty: "intermediate", points: 250, type: "creative", completions: 0, featured: true, transport: "HTTP+SSE" },
];

const difficultyColors = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

type Filter = "all" | "game" | "creative" | "beginner" | "intermediate";

export default function ChallengesPage() {
  const t = useTranslations("challenges");
  const tc = useTranslations("common");
  const [filter, setFilter] = useState<Filter>("all");

  const typeLabels = {
    game: { label: t("types.game"), color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100" },
    creative: { label: t("types.creative"), color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100" },
  };

  const filteredChallenges = useMemo(() => {
    if (filter === "all") return challengeData;
    return challengeData.filter((c) => c.type === filter || c.difficulty === filter);
  }, [filter]);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
              {t("title")}
            </h1>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              {t("subtitle")}
            </p>
          </div>
          <Link href="/leaderboard">
            <Badge variant="outline" className="text-lg px-4 py-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2">
              <Trophy className="h-5 w-5" /> {t("leaderboard")}
            </Badge>
          </Link>
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-wrap gap-2">
          {[
            { key: "all", label: t("filters.all") },
            { key: "game", label: t("filters.games"), icon: Gamepad2 },
            { key: "creative", label: t("filters.creative") },
            { key: "beginner", label: t("filters.beginner") },
            { key: "intermediate", label: t("filters.intermediate") },
          ].map(({ key, label, icon: Icon }) => (
            <Badge
              key={key}
              variant={filter === key ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilter(key as Filter)}
            >
              {Icon && <Icon className="h-3 w-3 mr-1" />}
              {label}
            </Badge>
          ))}
        </div>

        {/* Challenge Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredChallenges.map((challenge) => (
            <Link key={challenge.id} href={`/challenges/${challenge.id}`}>
              <Card className="h-full transition-all hover:shadow-lg hover:border-zinc-400 dark:hover:border-zinc-600 cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Badge className={typeLabels[challenge.type as keyof typeof typeLabels].color}>
                      {typeLabels[challenge.type as keyof typeof typeLabels].label}
                    </Badge>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                        {challenge.points}
                      </div>
                      <div className="text-xs text-zinc-500">{tc("points")}</div>
                    </div>
                  </div>
                  <CardTitle className="mt-4">{t(`items.${challenge.key}.title`)}</CardTitle>
                  <CardDescription>{t(`items.${challenge.key}.description`)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={difficultyColors[challenge.difficulty as keyof typeof difficultyColors]}
                    >
                      {t(`difficulty.${challenge.difficulty}`)}
                    </Badge>
                    <span className="text-sm text-zinc-500">
                      {challenge.completions} {t("completions")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Coming Soon */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {t("comingSoon.title")}
          </h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {t("comingSoon.description")}
            <a href="https://github.com" className="text-blue-600 hover:underline ml-1">
              {t("comingSoon.submitIdea")}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
