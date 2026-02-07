"use client";

export const runtime = "edge";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Banana, Play, Plug, ArrowLeft, Terminal, Info, Loader2 } from "lucide-react";
import Link from "next/link";
import { useGameCompletion } from "@/hooks/use-game-completion";
import { AchievementToast } from "@/components/achievements/achievement-toast";
import { cn } from "@/lib/utils";

// Dynamic imports to avoid SSR issues with game engines
const GorillasGame = dynamic(
  () => import("@/components/games/gorillas").then(mod => mod.GorillasGame),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[500px] text-zinc-500">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
);

const LiveGameBoard = dynamic(
  () => import("@/components/mcp/live-game-board").then(mod => mod.LiveGameBoard),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[400px] text-zinc-500">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
);

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: string;
}

const tools = [
  { name: "get_state", description: "Get current game state (buildings, gorillas, wind)" },
  { name: "throw_banana", params: "angle, velocity", description: "Throw banana with angle (0-90) and velocity (10-200)" },
  { name: "get_level", description: "Get current level info and wind conditions" },
  { name: "new_game", params: "level?, difficulty?", description: "Start new game (optional level 1-10, difficulty easy/medium/hard)" },
];

export default function GorillasChallengePage() {
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const { submitCompletion } = useGameCompletion("gorillas");

  const handleGameComplete = useCallback(
    async (result: { won: boolean; level: number; score: number }) => {
      if (result.won) {
        const response = await submitCompletion({
          winner: "player",
          moves: result.score,
        });
        if (response?.newAchievements && response.newAchievements.length > 0) {
          setUnlockedAchievements(response.newAchievements);
        }
      }
    },
    [submitCompletion]
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="play" className="w-full">
          {/* Header with integrated segmented control */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/challenges"
                className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Challenges
              </Link>
              <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
              <div className="flex items-center gap-2">
                <Banana className="h-5 w-5 text-yellow-500" />
                <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Gorillas</h1>
              </div>
            </div>

            {/* Mode Switch */}
            <TabsList className="h-9 p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <TabsTrigger
                value="play"
                className={cn(
                  "h-7 px-4 text-sm font-medium rounded-md transition-all",
                  "data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800",
                  "data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400",
                  "data-[state=active]:shadow-sm"
                )}
              >
                <Play className="h-3.5 w-3.5 mr-1.5" />
                Play
              </TabsTrigger>
              <TabsTrigger
                value="mcp"
                className={cn(
                  "h-7 px-4 text-sm font-medium rounded-md transition-all",
                  "data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800",
                  "data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400",
                  "data-[state=active]:shadow-sm"
                )}
              >
                <Plug className="h-3.5 w-3.5 mr-1.5" />
                MCP
              </TabsTrigger>
            </TabsList>
          </div>

          {/* PLAY MODE */}
          <TabsContent value="play" className="mt-0">
            <div className="flex flex-col items-center">
              <GorillasGame onGameComplete={handleGameComplete} />
            </div>

            {/* How to Play */}
            <Accordion type="single" collapsible className="w-full mt-8">
              <AccordionItem value="howto" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4">
                <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    How to Play
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pb-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                    <p>
                      <strong className="text-zinc-900 dark:text-white">Goal:</strong> Hit the opponent gorilla with bananas before they hit you!
                    </p>
                    <p>
                      <strong className="text-zinc-900 dark:text-white">Throwing:</strong> Set the angle (0-90°) and power (10-200) to throw your banana.
                    </p>
                    <p>
                      <strong className="text-zinc-900 dark:text-white">Wind:</strong> Pay attention to the wind indicator - it affects your banana trajectory!
                    </p>
                    <p>
                      <strong className="text-zinc-900 dark:text-white">Scoring:</strong> First to reach the target score (shown at top) wins the level.
                    </p>
                    <p>
                      <strong className="text-zinc-900 dark:text-white">Tip:</strong> Higher angles for nearby targets, lower angles with more power for distant ones.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          {/* MCP MODE */}
          <TabsContent value="mcp" className="mt-0 space-y-6">
            {/* Live Game Board */}
            <LiveGameBoard gameType="gorillas" />

            {/* MCP Tools */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="tools" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4">
                <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    Available MCP Tools
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2">
                    {tools.map((tool) => (
                      <div
                        key={tool.name}
                        className="flex flex-col p-2.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                      >
                        <code className="text-amber-600 dark:text-amber-400 font-mono text-sm font-semibold">
                          {tool.name}
                          {tool.params && (
                            <span className="text-zinc-400 dark:text-zinc-600">({tool.params})</span>
                          )}
                        </code>
                        <span className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">{tool.description}</span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </div>

      {/* Achievement notification */}
      {unlockedAchievements.length > 0 && (
        <AchievementToast
          achievements={unlockedAchievements}
          onClose={() => setUnlockedAchievements([])}
        />
      )}
    </div>
  );
}
