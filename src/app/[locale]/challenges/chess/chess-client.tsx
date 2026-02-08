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
import { Crown, Play, Plug, Bug, Terminal, ArrowLeft, Info, Cpu, BookOpen } from "lucide-react";
import Link from "next/link";
import { ChessGame } from "@/components/chess/chess-game";
import { LiveGameBoard } from "@/components/mcp/live-game-board";
import { MCPSessionDemo } from "@/components/mcp/mcp-session-demo";
import { DebugDrawer } from "@/components/mcp/debug-drawer";
import { useGameCompletion } from "@/hooks/use-game-completion";
import { AchievementToast } from "@/components/achievements/achievement-toast";
import { ChallengeComments } from "@/components/comments/challenge-comments";
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
  { name: "get_board", description: "Current board state (FEN, turn)" },
  { name: "get_legal_moves", description: "All legal moves" },
  { name: "make_move", params: "move", description: "Make a move (e4, Nf3, O-O)" },
  { name: "new_game", params: "color?", description: "Start new game" },
  { name: "resign", description: "Resign game" },
];

export function ChessClientPage() {
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [debugOpen, setDebugOpen] = useState(false);
  const { submitCompletion } = useGameCompletion("chess");

  const handleGameComplete = useCallback(
    async (result: { winner: "player" | "engine" | "draw"; moves: number }) => {
      const response = await submitCompletion({
        winner: result.winner,
        moves: result.moves,
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
                <Crown className="h-5 w-5 text-amber-500" />
                <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Chess</h1>
              </div>
            </div>

            {/* Segmented Control - Mode Switch */}
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
            <ChessGame onGameComplete={handleGameComplete} />

            {/* Educational Content */}
            <div className="mt-8 max-w-3xl mx-auto">
              <Accordion type="single" collapsible>
                <AccordionItem value="history" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 mb-2">
                  <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      History of Chess
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-3 pb-2">
                      <p>
                        <strong className="text-zinc-900 dark:text-white">~600 AD:</strong> Chess originated in India as <em>chaturanga</em>,
                        spreading to Persia where it became <em>shatranj</em>, then to Europe via the Islamic world.
                      </p>
                      <p>
                        <strong className="text-zinc-900 dark:text-white">1997:</strong> IBM&apos;s Deep Blue defeated world champion Garry Kasparov —
                        a landmark moment in AI history. It evaluated 200 million positions per second.
                      </p>
                      <p>
                        <strong className="text-zinc-900 dark:text-white">2017:</strong> DeepMind&apos;s AlphaZero learned chess from scratch in 4 hours,
                        then defeated Stockfish 28-0 (72 draws). It discovered creative strategies humans had never seen.
                      </p>
                      <p className="text-zinc-500 dark:text-zinc-500 text-xs">
                        Today, chess engines like Stockfish (used here) are rated ~3600 ELO — far beyond any human.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="algorithms" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 mb-2">
                  <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      The Algorithms
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pb-2">
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-amber-600 dark:text-amber-400 text-sm">Minimax</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          Assumes both players play optimally. Builds a game tree, evaluates leaf positions,
                          and propagates scores up — maximizing for self, minimizing for opponent.
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-amber-600 dark:text-amber-400 text-sm">Alpha-Beta Pruning</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          Optimization that skips branches that can&apos;t affect the final decision.
                          Reduces search from O(b^d) to O(b^(d/2)) — exploring √n nodes instead of n.
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-amber-600 dark:text-amber-400 text-sm">Neural Network Evaluation</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          Modern engines like Leela Chess Zero use NNUE (Efficiently Updatable Neural Network)
                          for position evaluation, combining traditional search with learned patterns.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="tips" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4">
                  <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Strategy Tips
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2 pb-2">
                      <p><strong className="text-zinc-900 dark:text-white">Control the center:</strong> e4, d4, e5, d5 are the most important squares.</p>
                      <p><strong className="text-zinc-900 dark:text-white">Develop pieces:</strong> Get knights and bishops out before moving the same piece twice.</p>
                      <p><strong className="text-zinc-900 dark:text-white">Castle early:</strong> Protect your king and connect your rooks.</p>
                      <p><strong className="text-zinc-900 dark:text-white">Think in plans:</strong> Don&apos;t just react — have a strategic goal for each phase.</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-3">
                        Against Stockfish, try setting a lower difficulty level to practice fundamentals!
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Discussion */}
              <div className="mt-8">
                <ChallengeComments challengeId="chess" />
              </div>
            </div>
          </TabsContent>

          {/* MCP MODE */}
          <TabsContent value="mcp" className="mt-0 space-y-6">
            {/* Live Game Board - Command Center */}
            <LiveGameBoard gameType="chess" />

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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pb-2">
                    {tools.map((tool) => (
                      <div
                        key={tool.name}
                        className="flex flex-col p-2.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                      >
                        <code className="text-emerald-600 dark:text-emerald-400 font-mono text-sm font-semibold">
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
        <MCPSessionDemo challengeId="chess" />
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
