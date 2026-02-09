"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Lightbulb, Terminal, Info, Zap } from "lucide-react";
import { useGameCompletion } from "@/hooks/use-game-completion";
import { AchievementToast } from "@/components/achievements/achievement-toast";
import { LightsOutGame } from "@/components/games/lights-out";
import { LiveGameBoard } from "@/components/mcp/live-game-board";
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
const challengeConfig = getChallengeConfig("lightsout");
const tools = challengeConfig?.mcpTools || [];

const xorExplanation = [
  { concept: "XOR Logic", description: "Toggling a light twice returns it to its original state" },
  { concept: "Order Independence", description: "The final state depends only on which cells were toggled, not the order" },
  { concept: "Linear Algebra", description: "Solvable as a system of equations over GF(2) - a finite field with only 0 and 1" },
  { concept: "Optimal Solution", description: "The minimum solution can be found using Gaussian elimination" },
];

export function LightsOutClientPage() {
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const { submitCompletion } = useGameCompletion("lightsout");

  const handleGameComplete = useCallback(
    async (state: { toggleCount: number; efficiency: number }) => {
      const response = await submitCompletion({
        winner: "player",
        moves: state.toggleCount,
      });
      if (response?.newAchievements && response.newAchievements.length > 0) {
        setUnlockedAchievements(response.newAchievements);
      }
    },
    [submitCompletion]
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="play" className="w-full">
          <ChallengeHeader challengeId="lightsout" />

          {/* Play Tab */}
          <TabsContent value="play" className="mt-0">
            <LightsOutGame onComplete={handleGameComplete} />

            {/* How to Play */}
            <div className="mt-8 max-w-3xl mx-auto">
              <Accordion type="single" collapsible defaultValue="how-to-play">
                <AccordionItem value="how-to-play" className="border-zinc-800">
                  <AccordionTrigger className="text-sm font-medium text-zinc-300 hover:text-white">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      How to Play
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 text-sm text-zinc-400">
                      <p>
                        <strong className="text-white">Lights Out</strong> is a puzzle game from Tiger Electronics (1995).
                        The goal is simple: <strong className="text-yellow-400">turn off all the lights</strong>.
                      </p>
                      <div>
                        <strong className="text-white">The Twist:</strong>
                        <p className="mt-1">
                          Each click toggles not just that light, but also its <strong className="text-yellow-400">4 neighbors</strong> (up, down, left, right).
                          This creates a cross-shaped pattern of changes.
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-800 rounded-lg font-mono text-xs">
                        <div className="text-zinc-500 mb-2"># When you click the center:</div>
                        <div className="grid grid-cols-5 gap-1 w-fit">
                          <div className="w-6 h-6 bg-zinc-700 rounded" />
                          <div className="w-6 h-6 bg-yellow-500 rounded" />
                          <div className="w-6 h-6 bg-zinc-700 rounded" />
                          <div className="w-6 h-6" />
                          <div className="w-6 h-6" />
                          <div className="w-6 h-6 bg-yellow-500 rounded" />
                          <div className="w-6 h-6 bg-yellow-500 rounded border-2 border-white" />
                          <div className="w-6 h-6 bg-yellow-500 rounded" />
                          <div className="w-6 h-6" />
                          <div className="w-6 h-6 text-xs text-zinc-500 flex items-center">← all toggle</div>
                          <div className="w-6 h-6 bg-zinc-700 rounded" />
                          <div className="w-6 h-6 bg-yellow-500 rounded" />
                          <div className="w-6 h-6 bg-zinc-700 rounded" />
                        </div>
                      </div>
                      <p className="text-zinc-500">
                        Tip: Every puzzle is solvable! The challenge is finding the minimum number of moves.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="math" className="border-zinc-800">
                  <AccordionTrigger className="text-sm font-medium text-zinc-300 hover:text-white">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      The Mathematics
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {xorExplanation.map((item) => (
                        <div
                          key={item.concept}
                          className="p-3 bg-zinc-800 rounded-lg"
                        >
                          <div className="font-medium text-yellow-400 text-sm">{item.concept}</div>
                          <div className="text-xs text-zinc-400 mt-1">{item.description}</div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-xs text-zinc-500">
                      Fun fact: For a standard 5×5 grid, there are exactly 2^25 (33 million) possible configurations,
                      but only about 2^23 of them are solvable from the all-off state.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="history" className="border-zinc-800">
                  <AccordionTrigger className="text-sm font-medium text-zinc-300 hover:text-white">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      History
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="text-sm text-zinc-400 space-y-2">
                      <p>
                        <strong className="text-white">1995:</strong> Tiger Electronics released Lights Out as a handheld electronic game.
                        It became an instant classic with its simple concept but challenging puzzles.
                      </p>
                      <p>
                        <strong className="text-white">Appearances:</strong> The mechanics appear in many games:
                        Portal 2, Zelda series, Resident Evil, and countless puzzle games.
                      </p>
                      <p>
                        <strong className="text-white">AI Challenge:</strong> Perfect for testing an agent&apos;s ability to reason about
                        XOR logic and find optimal solutions through systematic exploration.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* MCP Tab */}
          <TabsContent value="mcp" className="mt-0 space-y-6">
            <LiveGameBoard gameType="lightsout" />

            {/* MCP Tools Reference */}
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible defaultValue="tools">
                <AccordionItem value="tools" className="border-zinc-800">
                  <AccordionTrigger className="text-sm font-medium text-zinc-300 hover:text-white">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4" />
                      Available MCP Tools
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {tools.map((tool) => (
                        <div
                          key={tool.name}
                          className="p-3 bg-zinc-800 rounded-lg"
                        >
                          <div className="font-mono text-sm">
                            <span className="text-yellow-400">
                              {tool.name}
                            </span>
                            {tool.params && (
                              <span className="text-zinc-500">
                                ({tool.params})
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-400 mt-1">
                            {tool.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="example" className="border-zinc-800">
                  <AccordionTrigger className="text-sm font-medium text-zinc-300 hover:text-white">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Example Session
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="font-mono text-xs space-y-2 p-3 bg-zinc-900 text-zinc-100 rounded-lg">
                      <div className="text-zinc-500"># Start a new easy puzzle</div>
                      <div><span className="text-yellow-400">→</span> new_game(difficulty: &quot;easy&quot;)</div>
                      <div className="text-zinc-500 mt-2"># Check current state</div>
                      <div><span className="text-yellow-400">→</span> get_state()</div>
                      <div className="text-zinc-600 ml-4">{"{"} grid: [[true, false, ...], ...], lightsOn: 8 {"}"}</div>
                      <div className="text-zinc-500 mt-2"># Toggle lights strategically</div>
                      <div><span className="text-yellow-400">→</span> toggle(row: 2, col: 2)</div>
                      <div><span className="text-yellow-400">→</span> toggle(row: 0, col: 1)</div>
                      <div><span className="text-yellow-400">→</span> toggle(row: 4, col: 3)</div>
                      <div className="text-zinc-500 mt-2"># Check if solved</div>
                      <div><span className="text-yellow-400">→</span> get_state()</div>
                      <div className="text-green-400 ml-4">{"{"} status: &quot;won&quot;, toggleCount: 5 {"}"}</div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="strategy" className="border-zinc-800">
                  <AccordionTrigger className="text-sm font-medium text-zinc-300 hover:text-white">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      AI Strategy Hints
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="text-sm text-zinc-400 space-y-3">
                      <div className="p-3 bg-zinc-800 rounded-lg">
                        <div className="font-medium text-white">Light Chasing</div>
                        <p className="text-xs mt-1">
                          Work row by row from top to bottom. For each lit cell in a row,
                          toggle the cell directly below it. This &quot;chases&quot; lights downward.
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-800 rounded-lg">
                        <div className="font-medium text-white">Bottom Row Analysis</div>
                        <p className="text-xs mt-1">
                          After chasing, look at the bottom row pattern. Certain first-row toggles
                          will clear specific bottom patterns. There are only 7 valid patterns.
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-800 rounded-lg">
                        <div className="font-medium text-white">Gaussian Elimination</div>
                        <p className="text-xs mt-1">
                          Model as Ax = b (mod 2) where A is the toggle matrix, x is the solution,
                          and b is the initial state. Solve using XOR-based row reduction.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Achievement Toast */}
      {unlockedAchievements.length > 0 && (
        <AchievementToast
          achievements={unlockedAchievements}
          onClose={() => setUnlockedAchievements([])}
        />
      )}
    </div>
  );
}
