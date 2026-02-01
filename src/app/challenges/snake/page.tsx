"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Code2,
  Lightbulb,
  Zap,
  Wifi,
  Radio,
  ArrowRight,
  Server,
  Laptop,
  RefreshCw,
} from "lucide-react";
import { SnakeGame } from "@/components/games/snake-game";
import { MCPPlayground } from "@/components/playground/mcp-playground";
import { useGameCompletion } from "@/hooks/use-game-completion";
import { AchievementToast } from "@/components/achievements/achievement-toast";

const snakeMCPCode = `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "snake-mcp-server",
  version: "1.0.0",
});

// Game constants
const GRID_SIZE = 15;
type Direction = "up" | "down" | "left" | "right";
type Position = { x: number; y: number };

// Game state
let snake: Position[] = [{ x: 7, y: 7 }];
let food: Position = { x: 5, y: 5 };
let direction: Direction = "right";
let score = 0;
let gameOver = false;

function getRandomPosition(): Position {
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
}

function look() {
  const head = snake[0];
  const check = (dx: number, dy: number) => {
    const x = head.x + dx, y = head.y + dy;
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return "wall";
    if (x === food.x && y === food.y) return "food";
    if (snake.some((s, i) => i > 0 && s.x === x && s.y === y)) return "body";
    return "empty";
  };
  return {
    up: check(0, -1),
    down: check(0, 1),
    left: check(-1, 0),
    right: check(1, 0),
  };
}

// Get current game state
server.tool(
  "snake_state",
  "Get current snake game state including position, food, score, and vision",
  {},
  async () => {
    const vision = look();
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          snake,
          food,
          direction,
          score,
          gameOver,
          gridSize: GRID_SIZE,
          look: vision,
        }, null, 2),
      }],
    };
  }
);

// Look around (what's in each direction)
server.tool(
  "snake_look",
  "See what's in each direction from the snake's head",
  {},
  async () => ({
    content: [{
      type: "text",
      text: JSON.stringify(look(), null, 2),
    }],
  })
);

// Make a move
server.tool(
  "snake_move",
  "Move the snake in a direction",
  {
    dir: z.enum(["up", "down", "left", "right"]).describe("Direction to move"),
  },
  async ({ dir }) => {
    if (gameOver) {
      return { content: [{ type: "text", text: "Game over! Use snake_reset to start new game." }] };
    }

    // Prevent 180-degree turns
    const opposites: Record<Direction, Direction> = {
      up: "down", down: "up", left: "right", right: "left",
    };
    if (opposites[dir] === direction) {
      return { content: [{ type: "text", text: \`Cannot turn 180 degrees! Current: \${direction}\` }] };
    }

    direction = dir;
    const head = snake[0];
    const newHead: Position = {
      x: head.x + (dir === "left" ? -1 : dir === "right" ? 1 : 0),
      y: head.y + (dir === "up" ? -1 : dir === "down" ? 1 : 0),
    };

    // Check collisions
    if (newHead.x < 0 || newHead.x >= GRID_SIZE ||
        newHead.y < 0 || newHead.y >= GRID_SIZE ||
        snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
      gameOver = true;
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            result: "collision",
            gameOver: true,
            finalScore: score
          }),
        }],
      };
    }

    snake = [newHead, ...snake];

    // Check food
    if (newHead.x === food.x && newHead.y === food.y) {
      score++;
      food = getRandomPosition();
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            result: "ate_food",
            score,
            newFood: food,
            look: look(),
          }),
        }],
      };
    } else {
      snake.pop();
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            result: "moved",
            position: newHead,
            look: look(),
          }),
        }],
      };
    }
  }
);

// Reset game
server.tool(
  "snake_reset",
  "Start a new game",
  {},
  async () => {
    snake = [{ x: 7, y: 7 }];
    food = getRandomPosition();
    direction = "right";
    score = 0;
    gameOver = false;
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          message: "New game started!",
          state: { snake, food, direction, score },
          look: look(),
        }),
      }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);`;

const websocketMCPCode = `// MCP Server with WebSocket Transport
// This enables real-time bidirectional communication

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebSocketServerTransport } from "@modelcontextprotocol/sdk/server/websocket.js";
import { WebSocketServer } from "ws";
import { z } from "zod";

const server = new McpServer({
  name: "snake-websocket-server",
  version: "1.0.0",
});

// ... (same game logic as stdio version) ...

// WebSocket Transport Setup
const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("Client connected");

  // Create transport for this connection
  const transport = new WebSocketServerTransport(ws);

  // Connect MCP server to this transport
  server.connect(transport);

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

console.log("MCP WebSocket server running on ws://localhost:8080");

// Benefits of WebSocket Transport:
// 1. Real-time updates (server can push state changes)
// 2. Lower latency than HTTP
// 3. Persistent connection (no reconnection overhead)
// 4. Bidirectional communication
// 5. Multiple clients can connect`;

const httpSseMCPCode = `// MCP Server with HTTP + SSE Transport
// HTTP for requests, Server-Sent Events for server notifications

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { HttpSseServerTransport } from "@modelcontextprotocol/sdk/server/http-sse.js";
import express from "express";
import { z } from "zod";

const app = express();
const server = new McpServer({
  name: "snake-http-sse-server",
  version: "1.0.0",
});

// ... (same game logic) ...

// HTTP + SSE Transport Setup
app.post("/mcp", express.json(), async (req, res) => {
  // Handle tool calls via HTTP POST
  const transport = new HttpSseServerTransport();
  await server.connect(transport);

  const response = await transport.handleRequest(req.body);
  res.json(response);
});

app.get("/mcp/sse", (req, res) => {
  // Server-Sent Events for real-time updates
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Send game state updates
  const interval = setInterval(() => {
    res.write(\`data: \${JSON.stringify(gameState)}\\n\\n\`);
  }, 100);

  req.on("close", () => clearInterval(interval));
});

app.listen(3000, () => {
  console.log("MCP HTTP+SSE server on http://localhost:3000");
});

// HTTP+SSE is good when:
// 1. You need firewall-friendly transport (HTTP)
// 2. Server needs to push updates (SSE)
// 3. You want REST-like simplicity`;

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

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: string;
}

export default function SnakeChallengePage() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const { submitCompletion } = useGameCompletion("snake");

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
            <Badge variant="secondary">Game</Badge>
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
              WebSocket
            </Badge>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Learn MCP transports by building a snake game AI. Explore stdio, HTTP+SSE, and WebSocket!
          </p>
        </div>

        <Tabs defaultValue="play" className="space-y-6">
          <TabsList>
            <TabsTrigger value="play" className="gap-2">
              <Zap className="h-4 w-4" />
              Play
            </TabsTrigger>
            <TabsTrigger value="mcp" className="gap-2">
              <Code2 className="h-4 w-4" />
              MCP Server
            </TabsTrigger>
            <TabsTrigger value="transports" className="gap-2">
              <Wifi className="h-4 w-4" />
              Transports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="play">
            <SnakeGame onStateChange={handleStateChange} onGameComplete={handleGameComplete} />

            {/* Tips */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <Radio className="h-4 w-4 text-purple-500" />
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
                    <Wifi className="h-4 w-4 text-blue-500" />
                    WebSocket Transport
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                  Real-time MCP with persistent connections.
                  Lower latency, bidirectional communication.
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="mcp">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code2 className="h-5 w-5" />
                    Snake MCP Server (stdio)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                    This MCP server lets an AI play snake turn-by-turn. It provides
                    game state, vision (what&apos;s around the head), and move commands.
                  </p>

                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge variant="outline">snake_state</Badge>
                    <Badge variant="outline">snake_look</Badge>
                    <Badge variant="outline">snake_move</Badge>
                    <Badge variant="outline">snake_reset</Badge>
                  </div>

                  <MCPPlayground
                    initialCode={snakeMCPCode}
                    height="500px"
                    showToolTester={true}
                    title="Snake MCP Server"
                    description="An MCP server for playing snake"
                  />
                </CardContent>
              </Card>

              {/* Live State from Game */}
              {gameState && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 text-green-500" />
                      Live Game State (from UI)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-zinc-500 mb-2">
                      This is what the MCP server would return from snake_state:
                    </p>
                    <pre className="bg-zinc-900 rounded-lg p-4 font-mono text-sm text-zinc-100 overflow-x-auto">
{JSON.stringify(gameState, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {/* AI Strategy Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    AI Strategy Ideas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">1.</span>
                      <span><strong>Simple:</strong> Move toward food, avoid walls and body</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">2.</span>
                      <span><strong>Pathfinding:</strong> Use A* or BFS to find shortest path to food</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">3.</span>
                      <span><strong>Survival:</strong> Prioritize keeping escape routes open</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">4.</span>
                      <span><strong>Hamiltonian:</strong> Follow a cycle that visits every cell</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transports">
            <div className="space-y-6">
              {/* Transport Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="h-5 w-5" />
                    MCP Transport Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                    MCP supports multiple transports. The choice depends on your use case:
                  </p>

                  {/* Visual comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Server className="h-5 w-5 text-zinc-500" />
                        <span className="font-semibold">stdio</span>
                      </div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                        <p>Standard input/output pipes</p>
                        <ul className="text-xs space-y-1 mt-2">
                          <li className="flex items-center gap-1">
                            <span className="text-green-500">✓</span> Simple setup
                          </li>
                          <li className="flex items-center gap-1">
                            <span className="text-green-500">✓</span> Local processes
                          </li>
                          <li className="flex items-center gap-1">
                            <span className="text-red-500">✗</span> No network
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 border-blue-500">
                      <div className="flex items-center gap-2 mb-3">
                        <Radio className="h-5 w-5 text-blue-500" />
                        <span className="font-semibold">HTTP + SSE</span>
                        <Badge variant="outline" className="text-xs">Popular</Badge>
                      </div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                        <p>HTTP requests + Server-Sent Events</p>
                        <ul className="text-xs space-y-1 mt-2">
                          <li className="flex items-center gap-1">
                            <span className="text-green-500">✓</span> Firewall friendly
                          </li>
                          <li className="flex items-center gap-1">
                            <span className="text-green-500">✓</span> Server push via SSE
                          </li>
                          <li className="flex items-center gap-1">
                            <span className="text-yellow-500">~</span> Higher latency
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 border-purple-500">
                      <div className="flex items-center gap-2 mb-3">
                        <Wifi className="h-5 w-5 text-purple-500" />
                        <span className="font-semibold">WebSocket</span>
                        <Badge className="bg-purple-100 text-purple-800 text-xs">Real-time</Badge>
                      </div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                        <p>Persistent bidirectional connection</p>
                        <ul className="text-xs space-y-1 mt-2">
                          <li className="flex items-center gap-1">
                            <span className="text-green-500">✓</span> Lowest latency
                          </li>
                          <li className="flex items-center gap-1">
                            <span className="text-green-500">✓</span> Bidirectional
                          </li>
                          <li className="flex items-center gap-1">
                            <span className="text-green-500">✓</span> Real-time games
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Flow diagram */}
                  <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-6">
                    <h4 className="font-semibold mb-4">Communication Flow</h4>
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                      <div>
                        <div className="bg-white dark:bg-zinc-700 rounded-lg p-3 mb-2">
                          <Laptop className="h-6 w-6 mx-auto mb-1" />
                          <span className="text-xs">MCP Client</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center">
                            <ArrowRight className="h-4 w-4 text-blue-500" />
                            <span className="text-xs px-2">tool call</span>
                            <ArrowRight className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="flex items-center">
                            <ArrowLeft className="h-4 w-4 text-green-500" />
                            <span className="text-xs px-2">result</span>
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

              {/* WebSocket Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="h-5 w-5 text-purple-500" />
                    WebSocket Transport Example
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                    WebSocket provides persistent, bidirectional communication - perfect for games!
                  </p>
                  <MCPPlayground
                    initialCode={websocketMCPCode}
                    height="400px"
                    title="WebSocket MCP Server"
                    description="Snake server with WebSocket transport"
                  />
                </CardContent>
              </Card>

              {/* HTTP+SSE Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Radio className="h-5 w-5 text-blue-500" />
                    HTTP + SSE Transport Example
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                    HTTP for tool calls, Server-Sent Events for real-time updates.
                    Works through firewalls and proxies.
                  </p>
                  <MCPPlayground
                    initialCode={httpSseMCPCode}
                    height="400px"
                    title="HTTP+SSE MCP Server"
                    description="Snake server with HTTP+SSE transport"
                  />
                </CardContent>
              </Card>

              {/* When to use which */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    Which Transport Should I Use?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                      <Server className="h-5 w-5 text-zinc-500 mt-0.5" />
                      <div>
                        <p className="font-semibold">Use stdio when:</p>
                        <p className="text-zinc-600 dark:text-zinc-400">
                          Running MCP server as a local subprocess. Claude Desktop, VS Code extensions,
                          and most CLI tools use this.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Radio className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-semibold">Use HTTP + SSE when:</p>
                        <p className="text-zinc-600 dark:text-zinc-400">
                          Server is remote, behind a firewall, or needs to work in restricted environments.
                          Good for web-based MCP clients.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <Wifi className="h-5 w-5 text-purple-500 mt-0.5" />
                      <div>
                        <p className="font-semibold">Use WebSocket when:</p>
                        <p className="text-zinc-600 dark:text-zinc-400">
                          You need real-time, low-latency bidirectional communication.
                          Perfect for games, live data, and interactive applications.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
