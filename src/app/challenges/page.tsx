"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Gamepad2, Wrench, Play } from "lucide-react";

const challenges = [
  {
    id: "chess",
    title: "Chess Challenge",
    description: "Play chess against AI or a friend. Build an MCP chess server!",
    difficulty: "beginner",
    points: 100,
    type: "game",
    completions: 0,
    featured: true,
  },
  {
    id: "tic-tac-toe",
    title: "Tic-Tac-Toe",
    description: "Classic game with unbeatable minimax AI. Can you force a draw?",
    difficulty: "beginner",
    points: 50,
    type: "game",
    completions: 0,
  },
  {
    id: "snake",
    title: "Snake + MCP Transports",
    description: "Learn stdio, HTTP+SSE, and WebSocket transports by building a snake AI!",
    difficulty: "intermediate",
    points: 150,
    type: "game",
    completions: 0,
    featured: true,
  },
  {
    id: "hello-world",
    title: "Hello World",
    description: "Create your first MCP tool that greets users",
    difficulty: "beginner",
    points: 50,
    type: "build",
    completions: 234,
  },
  {
    id: "calculator",
    title: "Calculator Tool",
    description: "Build a calculator tool with basic math operations",
    difficulty: "beginner",
    points: 100,
    type: "build",
    completions: 156,
  },
  {
    id: "file-reader",
    title: "File Reader",
    description: "Use the files.read tool to find specific content",
    difficulty: "intermediate",
    points: 150,
    type: "use",
    completions: 89,
  },
  {
    id: "weather-api",
    title: "Weather API Integration",
    description: "Create an MCP server that fetches real weather data",
    difficulty: "intermediate",
    points: 200,
    type: "build",
    completions: 67,
  },
  {
    id: "multi-tool",
    title: "Multi-Tool Server",
    description: "Build a server with 5+ interconnected tools",
    difficulty: "advanced",
    points: 300,
    type: "build",
    completions: 23,
  },
  {
    id: "data-pipeline",
    title: "Data Pipeline",
    description: "Chain multiple MCP tools to process and transform data",
    difficulty: "advanced",
    points: 400,
    type: "use",
    completions: 12,
  },
];

const difficultyColors = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

const typeLabels = {
  build: { label: "Build Server", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100", icon: Wrench },
  use: { label: "Use Tools", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100", icon: Play },
  game: { label: "Game", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100", icon: Gamepad2 },
};

type FilterType = "all" | "game" | "build" | "use";
type FilterDifficulty = "all" | "beginner" | "intermediate" | "advanced";

export default function ChallengesPage() {
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<FilterDifficulty>("all");

  const filteredChallenges = useMemo(() => {
    return challenges.filter((challenge) => {
      const matchesType = typeFilter === "all" || challenge.type === typeFilter;
      const matchesDifficulty = difficultyFilter === "all" || challenge.difficulty === difficultyFilter;
      return matchesType && matchesDifficulty;
    });
  }, [typeFilter, difficultyFilter]);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
              Challenges
            </h1>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              Test your MCP skills and climb the leaderboard
            </p>
          </div>
          <Link href="/leaderboard">
            <Badge variant="outline" className="text-lg px-4 py-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2">
              <Trophy className="h-5 w-5" /> Leaderboard
            </Badge>
          </Link>
        </div>

        {/* Filters */}
        <div className="mt-8 space-y-3">
          {/* Type filters */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-zinc-500 mr-2 self-center">Type:</span>
            <Badge
              variant={typeFilter === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTypeFilter("all")}
            >
              All
            </Badge>
            <Badge
              variant={typeFilter === "game" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTypeFilter("game")}
            >
              <Gamepad2 className="h-3 w-3 mr-1" />
              Games
            </Badge>
            <Badge
              variant={typeFilter === "build" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTypeFilter("build")}
            >
              <Wrench className="h-3 w-3 mr-1" />
              Build Server
            </Badge>
            <Badge
              variant={typeFilter === "use" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTypeFilter("use")}
            >
              <Play className="h-3 w-3 mr-1" />
              Use Tools
            </Badge>
          </div>

          {/* Difficulty filters */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-zinc-500 mr-2 self-center">Difficulty:</span>
            <Badge
              variant={difficultyFilter === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setDifficultyFilter("all")}
            >
              All
            </Badge>
            <Badge
              variant={difficultyFilter === "beginner" ? "default" : "outline"}
              className={`cursor-pointer ${difficultyFilter === "beginner" ? "" : "hover:bg-green-50 dark:hover:bg-green-950"}`}
              onClick={() => setDifficultyFilter("beginner")}
            >
              Beginner
            </Badge>
            <Badge
              variant={difficultyFilter === "intermediate" ? "default" : "outline"}
              className={`cursor-pointer ${difficultyFilter === "intermediate" ? "" : "hover:bg-yellow-50 dark:hover:bg-yellow-950"}`}
              onClick={() => setDifficultyFilter("intermediate")}
            >
              Intermediate
            </Badge>
            <Badge
              variant={difficultyFilter === "advanced" ? "default" : "outline"}
              className={`cursor-pointer ${difficultyFilter === "advanced" ? "" : "hover:bg-red-50 dark:hover:bg-red-950"}`}
              onClick={() => setDifficultyFilter("advanced")}
            >
              Advanced
            </Badge>
          </div>
        </div>

        {/* Challenge Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredChallenges.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-zinc-500">
              No challenges match your filters. Try adjusting the filters above.
            </div>
          ) : null}
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
                      <div className="text-xs text-zinc-500">points</div>
                    </div>
                  </div>
                  <CardTitle className="mt-4">{challenge.title}</CardTitle>
                  <CardDescription>{challenge.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={difficultyColors[challenge.difficulty as keyof typeof difficultyColors]}
                    >
                      {challenge.difficulty}
                    </Badge>
                    <span className="text-sm text-zinc-500">
                      {challenge.completions} completions
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
            More Challenges Coming Soon
          </h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            We&apos;re working on new challenges. Want to contribute?
            <a href="https://github.com" className="text-blue-600 hover:underline ml-1">
              Submit a challenge idea
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
