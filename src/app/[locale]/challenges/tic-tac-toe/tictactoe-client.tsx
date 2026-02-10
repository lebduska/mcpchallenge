"use client";

import { useState, useCallback, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Bug, Terminal, Info, BookOpen, Cpu } from "lucide-react";
import { TicTacToe } from "@/components/games/tic-tac-toe";
import { ChallengeHeader, ChallengeSnippets } from "@/components/challenges";
import { LiveGameBoard } from "@/components/mcp/live-game-board";
import { MCPSessionDemo } from "@/components/mcp/mcp-session-demo";
import { DebugDrawer } from "@/components/mcp/debug-drawer";
import { useGameCompletion } from "@/hooks/use-game-completion";
import { AchievementToast } from "@/components/achievements/achievement-toast";
import { SetupWizard, SuccessCelebration, HintsSystem, tictactoeHints } from "@/components/onboarding";
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
const challengeConfig = getChallengeConfig("tic-tac-toe");
const tools = challengeConfig?.mcpTools || [];

const MCP_WIZARD_KEY = "mcp-tictactoe-wizard-seen";

export function TicTacToeClientPage() {
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [debugOpen, setDebugOpen] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isFirstWin, setIsFirstWin] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [activeTab, setActiveTab] = useState("play");
  const { submitCompletion } = useGameCompletion("tic-tac-toe");

  // Show wizard when switching to MCP tab for the first time
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    if (value === "mcp") {
      const hasSeenWizard = localStorage.getItem(MCP_WIZARD_KEY);
      if (!hasSeenWizard) {
        setShowWizard(true);
      }
    }
  }, []);

  const handleWizardComplete = useCallback(() => {
    localStorage.setItem(MCP_WIZARD_KEY, "true");
    setShowWizard(false);
  }, []);

  const handleWizardSkip = useCallback(() => {
    localStorage.setItem(MCP_WIZARD_KEY, "true");
    setShowWizard(false);
  }, []);

  const handleGameComplete = useCallback(
    async (result: { winner: "player" | "ai" | "draw"; moves: number }) => {
      const response = await submitCompletion({
        winner: result.winner,
        moves: result.moves,
      });

      // Show celebration for player wins
      if (result.winner === "player") {
        const hasWonBefore = localStorage.getItem("mcp-tictactoe-won");
        setIsFirstWin(!hasWonBefore);
        if (!hasWonBefore) {
          localStorage.setItem("mcp-tictactoe-won", "true");
        }
        setPointsEarned(response?.pointsEarned || 50);
        setShowCelebration(true);
      }

      if (response?.newAchievements && response.newAchievements.length > 0) {
        setUnlockedAchievements(response.newAchievements);
      }
    },
    [submitCompletion]
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <ChallengeHeader challengeId="tic-tac-toe" />

          {/* PLAY MODE */}
          <TabsContent value="play" className="mt-0">
            <TicTacToe onGameComplete={handleGameComplete} />

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
                      <p><strong className="text-zinc-900 dark:text-white">Goal:</strong> Get three of your marks in a row (horizontally, vertically, or diagonally).</p>
                      <p><strong className="text-zinc-900 dark:text-white">Play:</strong> Click any empty cell to place your mark. X always goes first.</p>
                      <p><strong className="text-zinc-900 dark:text-white">Win:</strong> First player to get three in a row wins. If all cells fill up, it&apos;s a draw.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="history" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 mb-2">
                  <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Ancient Origins
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-3 pb-2">
                      <p>
                        <strong className="text-zinc-900 dark:text-white">~1300 BCE:</strong> Ancient Egyptians played a similar three-in-a-row game.
                        Boards have been found carved into roofing tiles of temples.
                      </p>
                      <p>
                        <strong className="text-zinc-900 dark:text-white">Roman Empire:</strong> Called &quot;Terni Lapilli&quot; — each player had three pieces
                        and could move them, making it more like a positional game.
                      </p>
                      <p>
                        <strong className="text-zinc-900 dark:text-white">Modern Name:</strong> &quot;Noughts and Crosses&quot; in Britain, &quot;Tic-Tac-Toe&quot; in America.
                        The X&apos;s and O&apos;s version with paper became popular in the early 20th century.
                      </p>
                      <p className="text-zinc-500 dark:text-zinc-500 text-xs">
                        Fun fact: The name &quot;Tic-Tac-Toe&quot; comes from a game where players drew marks on a slate while saying the words.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="gametheory" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4">
                  <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      Game Theory
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pb-2">
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-purple-600 dark:text-purple-400 text-sm">Solved Game</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          Tic-Tac-Toe is fully solved — with perfect play from both sides, it always ends in a draw.
                          There are exactly 255,168 possible games, but only 138 unique positions to analyze.
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-purple-600 dark:text-purple-400 text-sm">Minimax Algorithm</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          The classic AI approach: assume your opponent plays perfectly. Build a tree of all possible moves,
                          score end states (+1 win, -1 loss, 0 draw), and pick the move that maximizes your minimum outcome.
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <div className="font-medium text-purple-600 dark:text-purple-400 text-sm">Perfect Strategy</div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                          X should start in a corner (not center!) for the best winning chances against imperfect play.
                          O must respond in center to have any chance. One mistake = loss against optimal play.
                        </p>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">
                        Tic-Tac-Toe is often the first game used to teach game tree search and the minimax algorithm.
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
            <LiveGameBoard gameType="tictactoe" />

            {/* Quick Start Code Snippets */}
            <ChallengeSnippets challengeId="tic-tac-toe" />

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
                        <code className="text-purple-600 dark:text-purple-400 font-mono text-sm font-semibold">
                          {tool.name}
                          {tool.params && (
                            <span className="text-zinc-400 dark:text-zinc-600">({tool.params})</span>
                          )}
                        </code>
                        <span className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">{tool.description}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-purple-800 dark:text-purple-200">
                      <strong>Board positions:</strong> 0-8 (left-to-right, top-to-bottom)
                    </p>
                    <pre className="mt-2 text-xs text-purple-600 dark:text-purple-300 font-mono">
                      0 | 1 | 2{"\n"}
                      ---------{"\n"}
                      3 | 4 | 5{"\n"}
                      ---------{"\n"}
                      6 | 7 | 8
                    </pre>
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
        <MCPSessionDemo challengeId="tic-tac-toe" />
      </DebugDrawer>

      {/* Achievement notification */}
      {unlockedAchievements.length > 0 && (
        <AchievementToast
          achievements={unlockedAchievements}
          onClose={() => setUnlockedAchievements([])}
        />
      )}

      {/* Onboarding: Setup Wizard for first-time visitors */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <SetupWizard
            challengeId="tic-tac-toe"
            onComplete={handleWizardComplete}
            onSkip={handleWizardSkip}
            className="max-w-xl w-full"
          />
        </div>
      )}

      {/* Onboarding: Success Celebration */}
      <SuccessCelebration
        challengeId="tic-tac-toe"
        challengeName="Tic-Tac-Toe"
        isFirstCompletion={isFirstWin}
        pointsEarned={pointsEarned}
        show={showCelebration}
        onClose={() => setShowCelebration(false)}
        onContinue={() => {
          setShowCelebration(false);
          window.location.href = "/challenges/chess";
        }}
      />

      {/* Onboarding: Contextual Hints */}
      <HintsSystem
        challengeId="tic-tac-toe"
        hints={tictactoeHints}
        position="bottom-left"
        autoShow={!showWizard}
      />
    </div>
  );
}
