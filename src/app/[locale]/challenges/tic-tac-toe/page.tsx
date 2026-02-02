"use client";

export const runtime = "edge";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Grid3X3,
  Brain,
  Users,
  Play,
  Plug,
  Trophy,
  Swords,
  Eye,
} from "lucide-react";
import { TicTacToe } from "@/components/games/tic-tac-toe";
import { LiveGameBoard } from "@/components/mcp/live-game-board";
import { useGameCompletion } from "@/hooks/use-game-completion";
import { AchievementToast } from "@/components/achievements/achievement-toast";
import { ChallengeHero } from "@/components/challenges/challenge-hero";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: string;
}

const tools = [
  { name: "get_board", description: "Get current board state (positions, turn, game status)" },
  { name: "get_legal_moves", description: "Get all available positions (0-8)" },
  { name: "make_move", params: "position", description: "Make a move at position (0-8)" },
  { name: "new_game", params: "player?", description: "Start new game (X/O/random)" },
  { name: "resign", description: "Resign the current game" },
];

export default function TicTacToeChallengePage() {
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const { submitCompletion } = useGameCompletion("tic-tac-toe");

  const handleGameComplete = useCallback(
    async (result: { winner: "player" | "ai" | "draw"; moves: number }) => {
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <ChallengeHero
          title="Tic-Tac-Toe"
          description="Play in the browser or connect your MCP client to challenge the unbeatable minimax algorithm!"
          image="/images/challenges/tictactoe.jpg"
          icon={<Grid3X3 className="h-8 w-8 text-purple-400" />}
          badges={[
            { label: "Game", className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100" },
          ]}
        />

        {/* Main Tabs */}
        <Tabs defaultValue="play" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="play" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Play Now
            </TabsTrigger>
            <TabsTrigger value="mcp" className="flex items-center gap-2">
              <Plug className="h-4 w-4" />
              Connect MCP
            </TabsTrigger>
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Live Board
            </TabsTrigger>
          </TabsList>

          {/* PLAY NOW TAB */}
          <TabsContent value="play" className="space-y-6">
            <TicTacToe onGameComplete={handleGameComplete} />

            {/* Game Modes Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-500" />
                    Minimax Algorithm
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                  The computer uses the minimax algorithm - it&apos;s unbeatable!
                  Best you can do is a draw.
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4 text-blue-500" />
                    vs Computer
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                  Play as X (first move) or O (second move) against the computer.
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-500" />
                    2 Players
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                  Play against a friend on the same device.
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* CONNECT MCP TAB */}
          <TabsContent value="mcp" className="space-y-6">
            {/* How it works */}
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30">
              <CardHeader>
                <CardTitle className="text-blue-700 dark:text-blue-300">
                  Play Tic-Tac-Toe via MCP
                </CardTitle>
              </CardHeader>
              <CardContent className="text-zinc-700 dark:text-zinc-300">
                <ol className="space-y-2">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">1</span>
                    <span>Go to the &quot;Live Board&quot; tab and create a game room</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">2</span>
                    <span>Copy the MCP configuration and add it to your client (Claude, Cursor)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">3</span>
                    <span>Ask your AI to play tic-tac-toe - it will use the MCP tools to make moves</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">4</span>
                    <span>Watch the game and MCP commands live on the board!</span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            {/* Available Tools */}
            <Card>
              <CardHeader>
                <CardTitle>Available Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tools.map((tool) => (
                    <div key={tool.name} className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                      <code className="text-purple-600 dark:text-purple-400 font-bold whitespace-nowrap">
                        {tool.name}
                        {tool.params && <span className="text-zinc-500">({tool.params})</span>}
                      </code>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">{tool.description}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
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
              </CardContent>
            </Card>

            {/* Tournament Mode Preview */}
            <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
              <CardHeader>
                <CardTitle className="text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <Swords className="h-5 w-5" />
                  Tournament Mode (Coming Soon)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-zinc-700 dark:text-zinc-300">
                <p className="mb-2">
                  Soon you&apos;ll be able to create tournaments where two MCP clients play against each other!
                </p>
                <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                  <li>• Create a game room with unique ID</li>
                  <li>• Two players connect with their MCP clients</li>
                  <li>• Random X/O assignment</li>
                  <li>• Spectate live on the web</li>
                </ul>
              </CardContent>
            </Card>

            {/* Challenge */}
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="text-purple-600 dark:text-purple-400 flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Challenge: Force a Draw!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                  The minimax algorithm is unbeatable. Can your MCP client play perfectly and force a draw?
                </p>
                <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded font-mono text-sm">
                  &quot;Play tic-tac-toe against the computer. Use optimal strategy to force a draw.&quot;
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LIVE BOARD TAB */}
          <TabsContent value="live" className="space-y-6">
            <LiveGameBoard gameType="tictactoe" />
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
