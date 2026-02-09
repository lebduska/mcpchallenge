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
import { Minesweeper } from "@/components/games/minesweeper";
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
const challengeConfig = getChallengeConfig("minesweeper");
const tools = challengeConfig?.mcpTools || [];

export function MinesweeperClientPage() {
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const { submitCompletion } = useGameCompletion("minesweeper");

  const handleGameComplete = useCallback(
    async (result: { won: boolean; time: number; difficulty: string }) => {
      if (result.won) {
        const response = await submitCompletion({
          winner: "player",
          moves: result.time,
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
          <ChallengeHeader challengeId="minesweeper" />

          {/* PLAY MODE */}
          <TabsContent value="play" className="mt-0">
            <div className="flex flex-col items-center">
              <Minesweeper onGameComplete={handleGameComplete} />
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
                      <p><strong className="text-zinc-900 dark:text-white">Goal:</strong> Reveal all cells without hitting a mine.</p>
                      <p><strong className="text-zinc-900 dark:text-white">Left-click:</strong> Reveal a cell. Numbers indicate adjacent mines.</p>
                      <p><strong className="text-zinc-900 dark:text-white">Right-click:</strong> Place or remove a flag to mark suspected mines.</p>
                      <p><strong className="text-zinc-900 dark:text-white">Tip:</strong> The first click is always safe!</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="history" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 mb-2">
                  <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      The Windows Era
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-3 pb-2">
                      <p>
                        <strong className="text-zinc-900 dark:text-white">1989:</strong> Robert Donner created Minesweeper for Windows 3.1.
                        Originally designed to teach users mouse skills — left-click, right-click, and precision clicking.
                      </p>
                      <p>
                        <strong className="text-zinc-900 dark:text-white">Windows 95-XP:</strong> Became the most-played computer game in history.
                        Almost every Windows user has played it, making it a cultural phenomenon.
                      </p>
                      <p>
                        <strong className="text-zinc-900 dark:text-white">Competitive Scene:</strong> World records are tracked for each difficulty.
                        Expert level (99 mines on 30×16) has been solved in under 30 seconds by top players.
                      </p>
                      <p className="text-zinc-500 dark:text-zinc-500 text-xs">
                        Fun fact: Minesweeper was removed from Windows 8 due to its addictive nature in workplaces.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="mathematics" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4">
                  <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      The Mathematics
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pb-2">
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-red-600 dark:text-red-400 text-sm">NP-complete</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          Determining if a Minesweeper configuration is solvable was proven NP-complete in 2000.
                          This means no efficient algorithm exists for arbitrary boards.
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-red-600 dark:text-red-400 text-sm">Constraint Satisfaction</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          Each number creates a constraint: exactly N neighbors are mines.
                          Solving requires propagating these constraints — similar to Sudoku or SAT problems.
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-red-600 dark:text-red-400 text-sm">Probability Theory</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          When logic fails, players must guess. Optimal play involves calculating the probability
                          each cell is a mine based on remaining constraints. Expert players intuit these odds.
                        </p>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">
                        AI approaches: CSP solvers, probabilistic models, and even neural networks for pattern recognition.
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
            <LiveGameBoard gameType="minesweeper" />

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
                        <code className="text-red-600 dark:text-red-400 font-mono text-sm font-semibold">
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
