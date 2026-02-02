"use client";

export const runtime = "edge";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Grid3X3,
  Bot,
  Users,
  Play,
  Plug,
  Copy,
  CheckCircle2,
  Trophy,
  Brain,
  Swords,
} from "lucide-react";
import { TicTacToe } from "@/components/games/tic-tac-toe";
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

const claudeConfig = `{
  "mcpServers": {
    "tic-tac-toe": {
      "url": "https://mcp.mcpchallenge.org/tictactoe"
    }
  }
}`;

const cursorConfig = `// In Cursor Settings → MCP Servers
{
  "tic-tac-toe": {
    "url": "https://mcp.mcpchallenge.org/tictactoe"
  }
}`;

const tools = [
  { name: "get_board", description: "Get current board state (positions, turn, game status)" },
  { name: "get_legal_moves", description: "Get all available positions (0-8)" },
  { name: "make_move", params: "position", description: "Make a move at position (0-8)" },
  { name: "new_game", params: "player?", description: "Start new game (X/O/random)" },
  { name: "resign", description: "Resign the current game" },
];

export default function TicTacToeChallengePage() {
  const [copiedConfig, setCopiedConfig] = useState<string | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const { submitCompletion } = useGameCompletion("tic-tac-toe");

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedConfig(key);
    setTimeout(() => setCopiedConfig(null), 2000);
  };

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
            <Grid3X3 className="h-8 w-8 text-purple-500" />
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Tic-Tac-Toe
            </h1>
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
              Game
            </Badge>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Play in the browser or connect your MCP client to challenge the unbeatable AI!
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="play" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="play" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Play Now
            </TabsTrigger>
            <TabsTrigger value="mcp" className="flex items-center gap-2">
              <Plug className="h-4 w-4" />
              Connect MCP
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
                    Minimax AI
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                  The AI uses the minimax algorithm - it&apos;s unbeatable!
                  Best you can do is a draw.
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bot className="h-4 w-4 text-blue-500" />
                    vs AI Mode
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                  Play as X (first move) or O (second move) against the AI.
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
                    <span>Connect your MCP client (Claude, Cursor) to our tic-tac-toe server</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">2</span>
                    <span>Ask your AI to play tic-tac-toe - it will use the MCP tools to make moves</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">3</span>
                    <span>Watch the game unfold on the board below!</span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            {/* Connection Config */}
            <Card>
              <CardHeader>
                <CardTitle>Server Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="claude" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="claude">Claude Desktop</TabsTrigger>
                    <TabsTrigger value="cursor">Cursor</TabsTrigger>
                    <TabsTrigger value="other">Other</TabsTrigger>
                  </TabsList>

                  <TabsContent value="claude">
                    <div className="relative">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                        Add to <code className="px-1 bg-zinc-100 dark:bg-zinc-800 rounded">claude_desktop_config.json</code>:
                      </p>
                      <pre className="p-4 bg-zinc-900 text-zinc-100 rounded-lg text-sm overflow-x-auto">
                        {claudeConfig}
                      </pre>
                      <button
                        onClick={() => copyToClipboard(claudeConfig, "claude")}
                        className="absolute top-10 right-2 p-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                      >
                        {copiedConfig === "claude" ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </TabsContent>

                  <TabsContent value="cursor">
                    <div className="relative">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                        In Cursor Settings → Features → MCP Servers:
                      </p>
                      <pre className="p-4 bg-zinc-900 text-zinc-100 rounded-lg text-sm overflow-x-auto">
                        {cursorConfig}
                      </pre>
                      <button
                        onClick={() => copyToClipboard(cursorConfig, "cursor")}
                        className="absolute top-10 right-2 p-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                      >
                        {copiedConfig === "cursor" ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </TabsContent>

                  <TabsContent value="other">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                      <p className="text-zinc-700 dark:text-zinc-300 mb-2"><strong>Server URL:</strong></p>
                      <code className="block p-3 bg-zinc-200 dark:bg-zinc-800 rounded text-sm">
                        https://mcp.mcpchallenge.org/tictactoe
                      </code>
                      <p className="text-sm text-zinc-500 mt-2">Transport: HTTP + SSE</p>
                    </div>
                  </TabsContent>
                </Tabs>
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

            {/* Live Board */}
            <Card>
              <CardHeader>
                <CardTitle>Live Game Board</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  When your MCP client makes moves, they will appear here in real-time.
                </p>
                <TicTacToe onGameComplete={handleGameComplete} />
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
                  The minimax AI is unbeatable. Can your MCP client play perfectly and force a draw?
                </p>
                <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded font-mono text-sm">
                  &quot;Play tic-tac-toe against the AI. Use optimal strategy to force a draw.&quot;
                </div>
              </CardContent>
            </Card>
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
