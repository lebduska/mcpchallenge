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
  Copy,
  CheckCircle2,
  Zap,
  Wifi,
  Radio,
  Trophy,
  Gamepad2,
  Server,
  Laptop,
  ArrowRight,
} from "lucide-react";
import { SnakeGame } from "@/components/games/snake-game";
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
    "snake": {
      "url": "wss://mcp.mcpchallenge.org/snake"
    }
  }
}`;

const cursorConfig = `// In Cursor Settings → MCP Servers
{
  "snake": {
    "url": "wss://mcp.mcpchallenge.org/snake"
  }
}`;

const tools = [
  { name: "get_state", description: "Get full game state (snake position, food, score, vision)" },
  { name: "look", description: "See what's in each direction (wall, food, body, empty)" },
  { name: "move", params: "direction", description: "Move snake (up/down/left/right)" },
  { name: "new_game", description: "Start a new game" },
];

type LookResult = {
  up: "empty" | "food" | "wall" | "body";
  down: "empty" | "food" | "wall" | "body";
  left: "empty" | "food" | "wall" | "body";
  right: "empty" | "food" | "wall" | "body";
};

type GameState = {
  snake: { x: number; y: number }[];
  food: { x: number; y: number };
  direction: "up" | "down" | "left" | "right";
  score: number;
  gameOver: boolean;
  look: LookResult;
};

export default function SnakeChallengePage() {
  const [copiedConfig, setCopiedConfig] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const { submitCompletion } = useGameCompletion("snake");

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedConfig(key);
    setTimeout(() => setCopiedConfig(null), 2000);
  };

  const handleStateChange = (state: GameState) => {
    setGameState(state);
  };

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
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
              WebSocket
            </Badge>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Play in the browser or connect your MCP client via WebSocket for real-time AI control!
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
            <SnakeGame onStateChange={handleStateChange} onGameComplete={handleGameComplete} />

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
            <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30">
              <CardHeader>
                <CardTitle className="text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  Real-time Snake via WebSocket MCP
                </CardTitle>
              </CardHeader>
              <CardContent className="text-zinc-700 dark:text-zinc-300">
                <ol className="space-y-2">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">1</span>
                    <span>Connect your MCP client to our WebSocket snake server</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">2</span>
                    <span>Your AI receives real-time game state updates</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">3</span>
                    <span>Send move commands to control the snake - can your AI survive?</span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            {/* WebSocket Transport Info */}
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-purple-500" />
                  Why WebSocket for Snake?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium text-sm">Low Latency</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Persistent connection means no connection overhead per move
                    </p>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Radio className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-sm">Bidirectional</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Server pushes state updates, client sends commands
                    </p>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Wifi className="h-4 w-4 text-green-500" />
                      <span className="font-medium text-sm">Real-time</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Perfect for games and live interactive applications
                    </p>
                  </div>
                </div>

                {/* Communication Flow */}
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 text-sm">WebSocket Communication Flow</h4>
                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <div className="bg-white dark:bg-zinc-700 rounded-lg p-3 mb-2">
                        <Laptop className="h-6 w-6 mx-auto mb-1" />
                        <span className="text-xs">MCP Client (AI)</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center">
                          <ArrowRight className="h-4 w-4 text-blue-500" />
                          <span className="text-xs px-2">move(dir)</span>
                          <ArrowRight className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="flex items-center">
                          <ArrowLeft className="h-4 w-4 text-green-500" />
                          <span className="text-xs px-2">state push</span>
                          <ArrowLeft className="h-4 w-4 text-green-500" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="bg-white dark:bg-zinc-700 rounded-lg p-3 mb-2">
                        <Server className="h-6 w-6 mx-auto mb-1" />
                        <span className="text-xs">MCP Server</span>
                      </div>
                    </div>
                  </div>
                </div>
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
                        wss://mcp.mcpchallenge.org/snake
                      </code>
                      <p className="text-sm text-zinc-500 mt-2">Transport: WebSocket</p>
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

            {/* Live Board */}
            <Card>
              <CardHeader>
                <CardTitle>Live Game Board</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  When your MCP client connects, moves will appear here in real-time.
                </p>
                <SnakeGame onStateChange={handleStateChange} onGameComplete={handleGameComplete} />
              </CardContent>
            </Card>

            {/* Live State */}
            {gameState && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Live Game State</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-500 mb-2">
                    This is what your MCP client receives from <code>get_state</code>:
                  </p>
                  <pre className="bg-zinc-900 rounded-lg p-4 font-mono text-sm text-zinc-100 overflow-x-auto max-h-48">
                    {JSON.stringify(gameState, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

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
