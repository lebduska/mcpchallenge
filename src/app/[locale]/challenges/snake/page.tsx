"use client";

export const runtime = "edge";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Play,
  Plug,
  Zap,
  Trophy,
  Gamepad2,
  Eye,
} from "lucide-react";
import { SnakeGame } from "@/components/games/snake-game";
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
  { name: "get_state", description: "Get full game state (snake position, food, score, vision)" },
  { name: "look", description: "See what's in each direction (wall, food, body, empty)" },
  { name: "move", params: "direction", description: "Move snake (up/down/left/right)" },
  { name: "new_game", description: "Start a new game" },
];

export default function SnakeChallengePage() {
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
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
            <span className="text-3xl">🐍</span>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Snake Game
            </h1>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              Game
            </Badge>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Play in the browser or connect your MCP client to watch AI control the snake!
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
            <SnakeGame onGameComplete={handleGameComplete} />

            {/* Game Modes Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    Real-time Mode
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                  Classic snake gameplay. Use arrow keys or WASD to control.
                  Speed increases as you eat!
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4 text-blue-500" />
                    Step Mode
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                  Game waits for each input. Perfect for MCP integration -
                  each move becomes a tool call!
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
                  Score 25+ for Serpent Master, 50+ for Snake God!
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* CONNECT MCP TAB */}
          <TabsContent value="mcp" className="space-y-6">
            {/* How it works */}
            <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/30">
              <CardHeader>
                <CardTitle className="text-green-700 dark:text-green-300">
                  Play Snake via MCP
                </CardTitle>
              </CardHeader>
              <CardContent className="text-zinc-700 dark:text-zinc-300">
                <ol className="space-y-2">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">1</span>
                    <span>Go to the &quot;Live Board&quot; tab and create a game room</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">2</span>
                    <span>Copy the MCP configuration and add it to your client (Claude, Cursor)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">3</span>
                    <span>Ask your AI to play snake - it will use the MCP tools to make moves</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">4</span>
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
                      <code className="text-green-600 dark:text-green-400 font-bold whitespace-nowrap">
                        {tool.name}
                        {tool.params && <span className="text-zinc-500">({tool.params})</span>}
                      </code>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">{tool.description}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>Grid:</strong> 15x15 | <strong>Vision:</strong> The <code>look</code> tool shows what&apos;s adjacent to the head
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Challenge */}
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-green-600 dark:text-green-400 flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Challenge: Snake God
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                  Can your AI score 50+ points? Try implementing these strategies:
                </p>
                <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1 mb-4">
                  <li>• <strong>Simple:</strong> Move toward food, avoid walls and body</li>
                  <li>• <strong>Pathfinding:</strong> Use A* or BFS for shortest path to food</li>
                  <li>• <strong>Survival:</strong> Prioritize keeping escape routes open</li>
                  <li>• <strong>Hamiltonian:</strong> Follow a cycle that visits every cell</li>
                </ul>
                <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded font-mono text-sm">
                  &quot;Play snake and try to score as high as possible. Use the look tool to see what&apos;s around you.&quot;
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LIVE BOARD TAB */}
          <TabsContent value="live" className="space-y-6">
            <LiveGameBoard gameType="snake" />
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
