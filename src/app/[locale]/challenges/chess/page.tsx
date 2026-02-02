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
  Bot,
  Users,
  Play,
  Plug,
  Copy,
  CheckCircle2,
  Trophy,
  Swords,
} from "lucide-react";
import { ChessGame } from "@/components/chess/chess-game";
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
    "chess": {
      "url": "https://mcp.mcpchallenge.org/chess"
    }
  }
}`;

const cursorConfig = `// In Cursor Settings → MCP Servers
{
  "chess": {
    "url": "https://mcp.mcpchallenge.org/chess"
  }
}`;

const tools = [
  { name: "get_board", description: "Get current board state (FEN, ASCII, turn)" },
  { name: "get_legal_moves", description: "Get all legal moves in current position" },
  { name: "make_move", params: "move", description: "Make a move (e.g., 'e4', 'Nf3', 'O-O')" },
  { name: "new_game", params: "color?", description: "Start a new game (white/black/random)" },
  { name: "resign", description: "Resign the current game" },
];

export default function ChessChallengePage() {
  const [copiedConfig, setCopiedConfig] = useState<string | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const { submitCompletion } = useGameCompletion("chess");

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedConfig(key);
    setTimeout(() => setCopiedConfig(null), 2000);
  };

  const handleGameComplete = useCallback(
    async (result: { winner: "player" | "llm" | "draw"; moves: number }) => {
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
            Play chess in the browser or connect your MCP client for AI-powered gameplay!
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
            <ChessGame onGameComplete={handleGameComplete} />

            {/* Game Modes Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bot className="h-4 w-4 text-blue-500" />
                    vs AI
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                  Play against Stockfish engine. Great for practice!
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
                    <span>Connect your MCP client (Claude, Cursor) to our chess server</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">2</span>
                    <span>Ask your AI to play chess - it will use the MCP tools to make moves</span>
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
                        https://mcp.mcpchallenge.org/chess
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

            {/* Live Board */}
            <Card>
              <CardHeader>
                <CardTitle>Live Game Board</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  When your MCP client makes moves, they will appear here in real-time.
                </p>
                <ChessGame onGameComplete={handleGameComplete} />
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
