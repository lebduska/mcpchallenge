"use client";

export const runtime = "edge";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Crown,
  Cpu,
  Users,
  Play,
  Plug,
  Trophy,
  Swords,
  Eye,
} from "lucide-react";
import { ChessGame } from "@/components/chess/chess-game";
import { LiveGameBoard } from "@/components/mcp/live-game-board";
import { useGameCompletion } from "@/hooks/use-game-completion";
import { AchievementToast } from "@/components/achievements/achievement-toast";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: string;
}


const tools = [
  { name: "get_board", description: "Get current board state (FEN, ASCII, turn)" },
  { name: "get_legal_moves", description: "Get all legal moves in current position" },
  { name: "make_move", params: "move", description: "Make a move (e.g., 'e4', 'Nf3', 'O-O')" },
  { name: "new_game", params: "color?", description: "Start a new game (white/black/random)" },
  { name: "resign", description: "Resign the current game" },
];

export default function ChessChallengePage() {
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/challenges"
            className="inline-flex items-center text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Challenges
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Crown className="h-8 w-8 text-amber-500" />
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Chess Challenge
            </h1>
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
              Game
            </Badge>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Play chess in the browser against Stockfish or connect your MCP client!
          </p>
        </div>

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
            <ChessGame onGameComplete={handleGameComplete} />

            {/* Game Modes Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-blue-500" />
                    vs Stockfish
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                  Play against the Stockfish chess engine. Great for practice!
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

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                  Win games to unlock achievements and climb the leaderboard!
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
                  Play Chess via MCP
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
                    <span>Ask your AI to play chess - it will use the MCP tools to make moves</span>
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
                      <code className="text-amber-600 dark:text-amber-400 font-bold whitespace-nowrap">
                        {tool.name}
                        {tool.params && <span className="text-zinc-500">({tool.params})</span>}
                      </code>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">{tool.description}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tournament Mode Preview */}
            <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
              <CardHeader>
                <CardTitle className="text-amber-700 dark:text-amber-300 flex items-center gap-2">
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
                  <li>• Random color assignment</li>
                  <li>• Spectate live on the web</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LIVE BOARD TAB */}
          <TabsContent value="live" className="space-y-6">
            <LiveGameBoard gameType="chess" />
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
