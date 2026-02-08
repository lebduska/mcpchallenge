"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Play, Plug, Bug, Terminal, ArrowLeft, Wifi, Info, BookOpen, Cpu } from "lucide-react";
import Link from "next/link";
import { SnakeGame } from "@/components/games/snake-game";
import { LiveGameBoard } from "@/components/mcp/live-game-board";
import { MCPSessionDemo } from "@/components/mcp/mcp-session-demo";
import { DebugDrawer } from "@/components/mcp/debug-drawer";
import { useGameCompletion } from "@/hooks/use-game-completion";
import { AchievementToast } from "@/components/achievements/achievement-toast";
import { cn } from "@/lib/utils";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: string;
}

const tools = [
  { name: "get_state", description: "Get full game state (snake position, food, score, vision)" },
  { name: "look", description: "See what's in each direction (wall, food, body, empty)" },
  { name: "move", params: "direction", description: "Move snake (up/down/left/right)" },
  { name: "new_game", description: "Start a new game" },
];

export function SnakeClientPage() {
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [debugOpen, setDebugOpen] = useState(false);
  const { submitCompletion } = useGameCompletion("snake");

  const handleGameComplete = useCallback(
    async (result: { score: number }) => {
      const response = await submitCompletion({ score: result.score });
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
          {/* Compact Header with integrated segmented control */}
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
                <span className="text-xl">🐍</span>
                <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Snake</h1>
              </div>
            </div>

            {/* Segmented Control - Mode Switch */}
            <TabsList className="h-9 p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <TabsTrigger
                value="play"
                className={cn(
                  "h-7 px-4 text-sm font-medium rounded-md transition-all",
                  "data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800",
                  "data-[state=active]:text-green-600 dark:data-[state=active]:text-green-400",
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
            <SnakeGame onGameComplete={handleGameComplete} />

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
                      <p><strong className="text-zinc-900 dark:text-white">Goal:</strong> Eat food to grow longer. Survive as long as possible!</p>
                      <p><strong className="text-zinc-900 dark:text-white">Controls:</strong> Arrow keys or WASD to change direction.</p>
                      <p><strong className="text-zinc-900 dark:text-white">Game Over:</strong> Hitting the wall or your own body ends the game.</p>
                      <p><strong className="text-zinc-900 dark:text-white">Tip:</strong> Plan ahead — the longer you get, the harder it becomes!</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="history" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 mb-2">
                  <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      The Nokia Era
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-3 pb-2">
                      <p>
                        <strong className="text-zinc-900 dark:text-white">1976:</strong> The concept originated with &quot;Blockade&quot; arcade game —
                        two snakes competing to trap each other. Inspired by the light cycles in Tron (1982).
                      </p>
                      <p>
                        <strong className="text-zinc-900 dark:text-white">1991:</strong> &quot;Nibbles&quot; was included with MS-DOS as a QBasic sample program,
                        alongside Gorillas. Many programmers first learned coding by modifying Nibbles.
                      </p>
                      <p>
                        <strong className="text-zinc-900 dark:text-white">1997:</strong> Nokia pre-installed Snake on the Nokia 6110.
                        It became the most-played mobile game ever — over 400 million devices shipped with it.
                      </p>
                      <p className="text-zinc-500 dark:text-zinc-500 text-xs">
                        Fun fact: Taneli Armanto programmed the Nokia Snake in just a few weeks. It had only 15 levels of speed.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="ai" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4">
                  <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      The AI Challenge
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pb-2">
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-green-600 dark:text-green-400 text-sm">Hamiltonian Cycle</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          A perfect Snake AI follows a Hamiltonian path — visiting every cell exactly once.
                          This guarantees no collision but is slow. The challenge: optimize the path dynamically.
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-green-600 dark:text-green-400 text-sm">Path-Finding</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          BFS or A* can find the shortest path to food, but naive pathfinding leads to traps.
                          Smart AIs verify escape routes exist before committing to a path.
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-green-600 dark:text-green-400 text-sm">Reinforcement Learning</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          Modern approaches use deep Q-learning. The AI learns to balance short-term gains (food)
                          against long-term survival. State: grid vision. Actions: four directions.
                        </p>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">
                        Perfect play fills the entire board. On a 15×15 grid, that&apos;s a snake 225 segments long!
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          {/* MCP MODE */}
          <TabsContent value="mcp" className="mt-0 space-y-6">
            {/* Live Game Board - Command Center */}
            <LiveGameBoard gameType="snake" />

            {/* Tools & Config - in accordion */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="tools" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4">
                <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    Available MCP Tools
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pb-2">
                    {tools.map((tool) => (
                      <div
                        key={tool.name}
                        className="flex flex-col p-2.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                      >
                        <code className="text-green-600 dark:text-green-400 font-mono text-sm font-semibold">
                          {tool.name}
                          {tool.params && (
                            <span className="text-zinc-400 dark:text-zinc-600">({tool.params})</span>
                          )}
                        </code>
                        <span className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">{tool.description}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <strong>Grid:</strong> 15x15 | <strong>Vision:</strong> The <code className="bg-green-100 dark:bg-green-900 px-1 rounded">look</code> tool shows what&apos;s adjacent to the head
                    </p>
                  </div>
                  <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Wifi className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium text-purple-800 dark:text-purple-200">WebSocket Transport</span>
                    </div>
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      Snake uses WebSocket for real-time bidirectional communication. Server pushes state updates, client sends move commands.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </div>

      {/* Debug Drawer - Events + Scrubber */}
      <DebugDrawer
        open={debugOpen}
        onOpenChange={setDebugOpen}
        trigger={
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-4 right-4 z-50 bg-white/80 dark:bg-zinc-900/80 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={() => setDebugOpen(true)}
          >
            <Bug className="h-4 w-4" />
          </Button>
        }
      >
        <MCPSessionDemo challengeId="snake" />
      </DebugDrawer>

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
