"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Grid3X3,
  Bot,
  Users,
  Code2,
  Lightbulb,
  Zap,
  Brain,
} from "lucide-react";
import { TicTacToe } from "@/components/games/tic-tac-toe";
import { MCPPlayground } from "@/components/playground/mcp-playground";

const ticTacToeMCPCode = `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "tic-tac-toe-server",
  version: "1.0.0",
});

// Game state
let board = Array(9).fill(null);
let currentPlayer = "X";
let gameOver = false;

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6], // Diagonals
];

function checkWinner() {
  for (const [a, b, c] of WINNING_COMBOS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function formatBoard() {
  let result = "";
  for (let i = 0; i < 9; i += 3) {
    result += board.slice(i, i + 3).map(c => c || ".").join(" | ") + "\\n";
    if (i < 6) result += "---------\\n";
  }
  return result;
}

// Get current game state
server.tool(
  "ttt_board",
  "Get current tic-tac-toe board",
  {},
  async () => ({
    content: [{
      type: "text",
      text: \`Current board:\\n\\n\${formatBoard()}\\nCurrent player: \${currentPlayer}\\nGame over: \${gameOver}\`,
    }],
  })
);

// Make a move
server.tool(
  "ttt_move",
  "Make a move (positions 0-8, left-to-right, top-to-bottom)",
  {
    position: z.number().min(0).max(8).describe("Board position 0-8"),
  },
  async ({ position }) => {
    if (gameOver) {
      return { content: [{ type: "text", text: "Game is over! Use ttt_reset to start new game." }] };
    }
    if (board[position]) {
      return { content: [{ type: "text", text: \`Position \${position} is already taken!\` }] };
    }

    board[position] = currentPlayer;
    const winner = checkWinner();

    let status = \`\${currentPlayer} played at position \${position}\\n\\n\${formatBoard()}\`;

    if (winner) {
      gameOver = true;
      status += \`\\n\${winner} wins!\`;
    } else if (board.every(c => c)) {
      gameOver = true;
      status += "\\nIt's a draw!";
    } else {
      currentPlayer = currentPlayer === "X" ? "O" : "X";
      status += \`\\nNext player: \${currentPlayer}\`;
    }

    return { content: [{ type: "text", text: status }] };
  }
);

// Get legal moves
server.tool(
  "ttt_legal_moves",
  "Get available positions",
  {},
  async () => {
    const moves = board.map((c, i) => c ? null : i).filter(i => i !== null);
    return {
      content: [{
        type: "text",
        text: \`Available positions: \${moves.join(", ")}\`,
      }],
    };
  }
);

// Reset game
server.tool(
  "ttt_reset",
  "Start a new game",
  {},
  async () => {
    board = Array(9).fill(null);
    currentPlayer = "X";
    gameOver = false;
    return {
      content: [{
        type: "text",
        text: "New game started!\\n\\n" + formatBoard() + "\\nX goes first.",
      }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);`;

export default function TicTacToeChallengePage() {
  const [moveLog, setMoveLog] = useState<Array<{ position: number; player: string; board: string }>>([]);

  const handleMoveForMCP = (position: number, player: string, board: string) => {
    setMoveLog(prev => [...prev, { position, player, board }]);
  };

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
            <Badge variant="secondary">Game</Badge>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Classic tic-tac-toe with an unbeatable AI. Can you force a draw?
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
          </TabsList>

          <TabsContent value="play">
            <TicTacToe onMoveForMCP={handleMoveForMCP} />

            {/* Tips */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  Track your score across games!
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-500" />
                    2 Players Mode
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                  Play against a friend on the same device. X always goes first.
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
                    Tic-Tac-Toe MCP Server
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                    This MCP server lets an AI play tic-tac-toe. It maintains game state
                    and validates moves. Perfect for teaching AI game strategy!
                  </p>

                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge variant="outline">ttt_board</Badge>
                    <Badge variant="outline">ttt_move</Badge>
                    <Badge variant="outline">ttt_legal_moves</Badge>
                    <Badge variant="outline">ttt_reset</Badge>
                  </div>

                  <MCPPlayground
                    initialCode={ticTacToeMCPCode}
                    height="500px"
                    showToolTester={true}
                    title="Tic-Tac-Toe MCP Server"
                    description="An MCP server for playing tic-tac-toe"
                  />
                </CardContent>
              </Card>

              {/* Move Log for MCP */}
              {moveLog.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Move Log (for MCP)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-zinc-500 mb-2">
                      Recent moves from the game:
                    </p>
                    <div className="bg-zinc-900 rounded-lg p-4 font-mono text-sm text-zinc-100 max-h-48 overflow-y-auto">
                      {moveLog.slice(-10).map((entry, i) => (
                        <div key={i}>
                          <span className="text-zinc-500">{i + 1}.</span>{" "}
                          <span className="text-blue-400">{entry.player}</span>{" "}
                          <span className="text-zinc-400">→ position</span>{" "}
                          <span className="text-green-400">{entry.position}</span>{" "}
                          <span className="text-zinc-600">// {entry.board}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Strategy Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    MCP Challenge: Build a Smarter AI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                    Try implementing these features in your MCP server:
                  </p>
                  <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">1.</span>
                      <span>Add a <code className="px-1 bg-zinc-100 dark:bg-zinc-800 rounded">ttt_suggest</code> tool that suggests the best move</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">2.</span>
                      <span>Implement minimax algorithm for optimal play</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">3.</span>
                      <span>Add difficulty levels (easy: random, hard: minimax)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">4.</span>
                      <span>Track win/loss statistics across games</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
