"use client";

export const runtime = "edge";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
// Badge removed - not used with new cover image design
import {
  Trophy,
  Gamepad2,
  Sparkles,
  Crown,
  Bomb,
  Paintbrush,
  ChevronRight,
  Package,
  // Construction, // Poly Bridge hidden
} from "lucide-react";
import { cn } from "@/lib/utils";
import { challengeCovers } from "@/lib/challenge-covers";

const challengeData = [
  {
    id: "chess",
    key: "chess",
    difficulty: "beginner",
    points: 100,
    type: "game",
    completions: 0,
    featured: true,
    transport: "HTTP+SSE",
    icon: Crown,
    gradient: "from-amber-500/20 via-orange-500/10 to-yellow-500/20",
    accentColor: "amber",
  },
  {
    id: "tic-tac-toe",
    key: "tictactoe",
    difficulty: "beginner",
    points: 50,
    type: "game",
    completions: 0,
    transport: "HTTP+SSE",
    icon: Gamepad2,
    gradient: "from-purple-500/20 via-violet-500/10 to-indigo-500/20",
    accentColor: "purple",
  },
  {
    id: "minesweeper",
    key: "minesweeper",
    difficulty: "beginner",
    points: 75,
    type: "game",
    completions: 0,
    transport: "N/A",
    icon: Bomb,
    gradient: "from-zinc-500/20 via-slate-500/10 to-gray-500/20",
    accentColor: "zinc",
  },
  {
    id: "sokoban",
    key: "sokoban",
    difficulty: "intermediate",
    points: 150,
    type: "game",
    completions: 0,
    transport: "HTTP+SSE",
    icon: Package,
    gradient: "from-amber-500/20 via-yellow-500/10 to-orange-500/20",
    accentColor: "amber",
  },
  {
    id: "canvas-draw",
    key: "canvasDraw",
    difficulty: "intermediate",
    points: 250,
    type: "creative",
    completions: 0,
    featured: false,
    transport: "HTTP+SSE",
    icon: Paintbrush,
    gradient: "from-pink-500/20 via-rose-500/10 to-fuchsia-500/20",
    accentColor: "pink",
  },
  // Poly Bridge - hidden until physics is fixed
  // {
  //   id: "poly-bridge",
  //   key: "polyBridge",
  //   difficulty: "intermediate",
  //   points: 200,
  //   type: "game",
  //   completions: 0,
  //   featured: false,
  //   transport: "HTTP+SSE",
  //   icon: Construction,
  //   gradient: "from-cyan-500/20 via-sky-500/10 to-blue-500/20",
  //   accentColor: "cyan",
  // },
];

const difficultyConfig = {
  beginner: {
    label: "Beginner",
    dotColor: "bg-emerald-500",
  },
  intermediate: {
    label: "Intermediate",
    dotColor: "bg-amber-500",
  },
  advanced: {
    label: "Advanced",
    dotColor: "bg-red-500",
  },
};

type Filter = "all" | "game" | "creative";

export default function ChallengesPage() {
  const t = useTranslations("challenges");
  const [filter, setFilter] = useState<Filter>("all");

  const filteredChallenges = useMemo(() => {
    if (filter === "all") return challengeData;
    return challengeData.filter((c) => c.type === filter);
  }, [filter]);

  // Sort to put featured first
  const sortedChallenges = useMemo(() => {
    return [...filteredChallenges].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
  }, [filteredChallenges]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-end justify-between mb-12">
            <div>
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
                {t("title")}
              </h1>
              <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400">
                {t("subtitle")}
              </p>
            </div>
            <Link href="/leaderboard">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-medium text-sm hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-colors">
                <Trophy className="h-4 w-4" />
                {t("leaderboard")}
              </div>
            </Link>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-8">
            {[
              { key: "all", label: t("filters.all") },
              { key: "game", label: t("filters.games"), icon: Gamepad2 },
              { key: "creative", label: t("filters.creative"), icon: Sparkles },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key as Filter)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all",
                  filter === key
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg"
                    : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700"
                )}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {label}
              </button>
            ))}
          </div>

          {/* Challenge Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {sortedChallenges.map((challenge) => {
              const Icon = challenge.icon;
              const diffConfig = difficultyConfig[challenge.difficulty as keyof typeof difficultyConfig];

              const cover = challengeCovers[challenge.id];

              return (
                <Link key={challenge.id} href={`/challenges/${challenge.id}`}>
                  <div
                    className={cn(
                      "group relative overflow-hidden rounded-2xl",
                      "bg-white dark:bg-zinc-900",
                      "border border-zinc-200/80 dark:border-zinc-800",
                      "shadow-md shadow-zinc-200/50 dark:shadow-zinc-950/50",
                      "hover:shadow-xl hover:shadow-zinc-300/50 dark:hover:shadow-zinc-950/70",
                      "hover:border-zinc-300 dark:hover:border-zinc-700",
                      "hover:-translate-y-1 hover:scale-[1.02]",
                      "transition-all duration-300 ease-out",
                      "cursor-pointer",
                      challenge.featured && "ring-2 ring-amber-400/50 dark:ring-amber-500/30"
                    )}
                  >
                    {/* Cover Image */}
                    {cover && (
                      <div className="relative h-32 w-full overflow-hidden">
                        <Image
                          src={cover.image}
                          alt={cover.alt}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                        {/* Gradient Overlay for text readability */}
                        <div
                          className={cn(
                            "absolute inset-0 bg-gradient-to-t",
                            cover.overlayGradient
                          )}
                        />
                      </div>
                    )}

                    {/* Fallback gradient if no cover */}
                    {!cover && (
                      <div
                        className={cn(
                          "absolute inset-0 bg-gradient-to-br opacity-60 dark:opacity-40",
                          challenge.gradient
                        )}
                      />
                    )}

                    {/* Featured Badge */}
                    {challenge.featured && (
                      <div className="absolute top-3 left-3 z-10">
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-lg shadow-amber-500/30">
                          <Sparkles className="h-3 w-3" />
                          Featured
                        </div>
                      </div>
                    )}

                    {/* Points Badge */}
                    <div className="absolute top-3 right-3 z-10">
                      <div
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                          "bg-gradient-to-br from-emerald-500 to-emerald-600",
                          "text-white font-bold text-sm",
                          "shadow-lg shadow-emerald-500/30",
                          "group-hover:scale-110 transition-transform duration-300"
                        )}
                      >
                        <Trophy className="h-3.5 w-3.5" />
                        {challenge.points}
                      </div>
                    </div>

                    {/* Content */}
                    <div className={cn("relative p-6", cover ? "pt-4" : "pt-14")}>
                      {/* Icon */}
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                          "bg-zinc-100 dark:bg-zinc-800/80 backdrop-blur-sm",
                          "group-hover:scale-110 transition-transform duration-300",
                          cover && "-mt-10 relative z-10 shadow-lg border border-zinc-200 dark:border-zinc-700"
                        )}
                      >
                        <Icon className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                        {t(`items.${challenge.key}.title`)}
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4">
                        {t(`items.${challenge.key}.description`)}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        {/* Difficulty */}
                        <div className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full", diffConfig.dotColor)} />
                          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            {t(`difficulty.${challenge.difficulty}`)}
                          </span>
                        </div>

                        {/* Play Indicator */}
                        <div
                          className={cn(
                            "flex items-center gap-1 text-sm font-medium",
                            "text-zinc-400 dark:text-zinc-500",
                            "group-hover:text-zinc-900 dark:group-hover:text-white",
                            "transition-colors duration-300"
                          )}
                        >
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Play
                          </span>
                          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Coming Soon */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-sm">
              <Sparkles className="h-4 w-4" />
              {t("comingSoon.title")} —{" "}
              <a
                href="https://github.com"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {t("comingSoon.submitIdea")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
