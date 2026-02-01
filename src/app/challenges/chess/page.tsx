"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Crown,
  Bot,
  Users,
  Code2,
  Lightbulb,
  Zap,
} from "lucide-react";
import { ChessGame } from "@/components/chess/chess-game";
import { MCPPlayground } from "@/components/playground/mcp-playground";

const chessMCPCode = `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Chess } from "chess.js";

const server = new McpServer({
  name: "chess-server",
  version: "1.0.0",
});

// Store the current game
let game = new Chess();

// Get current board state
server.tool(
  "chess_board",
  "Get the current chess board state",
  {},
  async () => {
    const board = game.board();
    const ascii = game.ascii();
    return {
      content: [{
        type: "text",
        text: \`Current position (FEN): \${game.fen()}\\n\\n\${ascii}\\n\\nTurn: \${game.turn() === 'w' ? 'White' : 'Black'}\`,
      }],
    };
  }
);

// Make a move
server.tool(
  "chess_move",
  "Make a chess move in algebraic notation (e.g., 'e4', 'Nf3', 'O-O')",
  {
    move: z.string().describe("The move in algebraic notation"),
  },
  async ({ move }) => {
    try {
      const result = game.move(move);
      if (!result) {
        return {
          content: [{ type: "text", text: \`Invalid move: \${move}\` }],
        };
      }

      let status = \`Move played: \${result.san}\\n\\n\${game.ascii()}\`;

      if (game.isCheckmate()) {
        status += "\\n\\nCheckmate!";
      } else if (game.isDraw()) {
        status += "\\n\\nDraw!";
      } else if (game.isCheck()) {
        status += "\\n\\nCheck!";
      }

      return { content: [{ type: "text", text: status }] };
    } catch (error) {
      return {
        content: [{ type: "text", text: \`Error: \${error}\` }],
      };
    }
  }
);

// Get legal moves
server.tool(
  "chess_legal_moves",
  "Get all legal moves in the current position",
  {},
  async () => {
    const moves = game.moves();
    return {
      content: [{
        type: "text",
        text: \`Legal moves (\${moves.length}): \${moves.join(", ")}\`,
      }],
    };
  }
);

// Reset the game
server.tool(
  "chess_reset",
  "Start a new game",
  {},
  async () => {
    game = new Chess();
    return {
      content: [{ type: "text", text: "New game started!\\n\\n" + game.ascii() }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);`;

export default function ChessChallengePage() {
  const [moveLog, setMoveLog] = useState<Array<{ move: string; fen: string }>>([]);

  const handleMoveForMCP = (move: string, fen: string) => {
    setMoveLog(prev => [...prev, { move, fen }]);
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
            <Crown className="h-8 w-8 text-amber-500" />
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Chess Challenge
            </h1>
            <Badge variant="secondary">Game</Badge>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Play chess against AI or a friend. Learn how to build an MCP server for chess!
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
            <ChessGame onMoveForMCP={handleMoveForMCP} />

            {/* Tips */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bot className="h-4 w-4 text-blue-500" />
                    vs AI Mode
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                  Play against a simple AI opponent. The AI uses basic heuristics
                  to select moves.
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
                  Play against a friend on the same device. Take turns making
                  moves on the same board.
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    MCP Integration
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600 dark:text-zinc-400">
                  Check the &quot;MCP Server&quot; tab to see how to build a chess
                  server that AI can play!
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
                    Chess MCP Server
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                    This MCP server exposes chess tools that allow an AI to play chess.
                    The server maintains game state and validates moves.
                  </p>

                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge variant="outline">chess_board</Badge>
                    <Badge variant="outline">chess_move</Badge>
                    <Badge variant="outline">chess_legal_moves</Badge>
                    <Badge variant="outline">chess_reset</Badge>
                  </div>

                  <MCPPlayground
                    initialCode={chessMCPCode}
                    height="500px"
                    showToolTester={true}
                    title="Chess MCP Server"
                    description="An MCP server that lets AI play chess"
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
                      These moves were made in the game. You can use this data with your MCP server:
                    </p>
                    <div className="bg-zinc-900 rounded-lg p-4 font-mono text-sm text-zinc-100 max-h-48 overflow-y-auto">
                      {moveLog.map((entry, i) => (
                        <div key={i}>
                          <span className="text-zinc-500">{i + 1}.</span>{" "}
                          <span className="text-green-400">{entry.move}</span>{" "}
                          <span className="text-zinc-600">// {entry.fen}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
