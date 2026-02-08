"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Banana, Play, Plug, ArrowLeft, Terminal, Info, Loader2, BookOpen, Cpu } from "lucide-react";
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

export function GorillasClientPage() {
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

            {/* Educational Content */}
            <div className="mt-8 max-w-3xl mx-auto">
              <Accordion type="single" collapsible>
                <AccordionItem value="howto" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 mb-2">
                  <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      How to Play
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pb-2 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                      <p><strong className="text-zinc-900 dark:text-white">Goal:</strong> Hit the opponent gorilla with bananas before they hit you!</p>
                      <p><strong className="text-zinc-900 dark:text-white">Throwing:</strong> Set the angle (0-90°) and power (10-200) to throw your banana.</p>
                      <p><strong className="text-zinc-900 dark:text-white">Wind:</strong> Pay attention to the wind indicator - it affects your banana trajectory!</p>
                      <p><strong className="text-zinc-900 dark:text-white">Tip:</strong> Higher angles for nearby targets, lower angles with more power for distant ones.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="history" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 mb-2">
                  <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      The DOS Era
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-3 pb-2">
                      <p>
                        <strong className="text-zinc-900 dark:text-white">1991:</strong> Gorillas was included with MS-DOS 5.0 as a QBasic sample program.
                        Along with Nibbles (Snake), it taught millions their first programming concepts.
                      </p>
                      <p>
                        <strong className="text-zinc-900 dark:text-white">Artillery Genre:</strong> Part of a genre dating back to &quot;Artillery&quot; (1976) on PLATO.
                        Worms, Angry Birds, and countless mobile games owe their existence to this formula.
                      </p>
                      <p>
                        <strong className="text-zinc-900 dark:text-white">Source Available:</strong> The original GORILLA.BAS was ~500 lines of QBasic,
                        making it a popular learning example. Many programmers&apos; first game was a Gorillas clone.
                      </p>
                      <p className="text-zinc-500 dark:text-zinc-500 text-xs">
                        Fun fact: The exploding banana animation used XOR graphics for smooth animation on slow hardware.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="physics" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4">
                  <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      The Physics
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pb-2">
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-yellow-600 dark:text-yellow-400 text-sm">Projectile Motion</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          Classic physics: x = v₀·cos(θ)·t, y = v₀·sin(θ)·t - ½gt².
                          Gravity pulls the banana down while initial velocity carries it forward.
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-yellow-600 dark:text-yellow-400 text-sm">Wind Effects</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          Wind adds horizontal acceleration: x += ½·wind·t².
                          Positive wind pushes right, negative pushes left. Stronger wind = bigger adjustment needed.
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-yellow-600 dark:text-yellow-400 text-sm">AI Strategy</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          For an AI: calculate the required angle and velocity to hit a target,
                          then adjust for wind. Use binary search or solve the quadratic equation directly.
                        </p>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">
                        Perfect for teaching physics simulation and iterative refinement through trial-and-error.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
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
