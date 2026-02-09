"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Terminal, Info, BookOpen, Cpu } from "lucide-react";
import { SokobanGame } from "@/components/games/sokoban";
import { LiveGameBoard } from "@/components/mcp/live-game-board";
import { useGameCompletion } from "@/hooks/use-game-completion";
import { AchievementToast } from "@/components/achievements/achievement-toast";
import { ChallengeHeader } from "@/components/challenges";
import { getChallengeConfig } from "@/lib/challenge-config";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: string;
}

// Get tools from central config
const challengeConfig = getChallengeConfig("sokoban");
const tools = challengeConfig?.mcpTools || [];

export function SokobanClientPage() {
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const { submitCompletion } = useGameCompletion("sokoban");

  const handleGameComplete = useCallback(
    async (result: { won: boolean; level: number; moves: number; pushes: number }) => {
      if (result.won) {
        const response = await submitCompletion({
          winner: "player",
          moves: result.moves,
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
          <ChallengeHeader challengeId="sokoban" />

          {/* PLAY MODE */}
          <TabsContent value="play" className="mt-0">
            <div className="flex flex-col items-center">
              <SokobanGame onGameComplete={handleGameComplete} />
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
                      <p><strong className="text-zinc-900 dark:text-white">Goal:</strong> Push all boxes onto the goal positions (marked in yellow).</p>
                      <p><strong className="text-zinc-900 dark:text-white">Movement:</strong> Use arrow keys or WASD to move the player.</p>
                      <p><strong className="text-zinc-900 dark:text-white">Pushing:</strong> Walk into a box to push it. You can only push one box at a time.</p>
                      <p><strong className="text-zinc-900 dark:text-white">Undo:</strong> Press U or Ctrl+Z to undo your last move.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="history" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 mb-2">
                  <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      History
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-3 pb-2">
                      <p>
                        <strong className="text-zinc-900 dark:text-white">1982:</strong> Created by Hiroyuki Imabayashi in Japan.
                        The name means &quot;warehouse keeper&quot; (倉庫番). Originally published by Thinking Rabbit.
                      </p>
                      <p>
                        <strong className="text-zinc-900 dark:text-white">Legacy:</strong> One of the most influential puzzle games ever made.
                        Ported to virtually every platform from MSX to modern smartphones.
                      </p>
                      <p>
                        <strong className="text-zinc-900 dark:text-white">Competitions:</strong> Annual Sokoban competitions exist where
                        players compete to solve levels in the fewest moves or pushes.
                      </p>
                      <p className="text-zinc-500 dark:text-zinc-500 text-xs">
                        Over 1,000 level collections exist online with varying difficulty from trivial to impossibly hard.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="complexity" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4">
                  <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      Computational Complexity
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pb-2">
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-amber-600 dark:text-amber-400 text-sm">PSPACE-complete</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          Sokoban was proven PSPACE-complete in 1997. This means solving arbitrary puzzles
                          is at least as hard as any problem solvable with polynomial space.
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-amber-600 dark:text-amber-400 text-sm">State Space Explosion</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          A 10×10 level with 5 boxes has billions of possible states.
                          Naive brute-force is impossible — smart heuristics are required.
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-amber-600 dark:text-amber-400 text-sm">Deadlock Detection</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          Key AI challenge: detecting when a position is unsolvable (box stuck in corner,
                          two boxes blocking each other). Early pruning is essential.
                        </p>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">
                        AI techniques: BFS with deadlock detection, pattern databases, IDA* with domain-specific heuristics.
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
            <LiveGameBoard gameType="sokoban" />

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
