// Chess MCP Server Implementation
// Uses chess.js for game logic

import { Chess } from "chess.js";
import { MCPServer, textContent, errorContent } from "../mcp/server";
import type {
  MCPTool,
  ChessGameState,
  GameState,
  CommandLogEntry,
  ToolCallResult,
} from "../mcp/types";

const chessTools: MCPTool[] = [
  {
    name: "new_game",
    description: "Start a new chess game against Stockfish engine",
    inputSchema: {
      type: "object",
      properties: {
        color: {
          type: "string",
          enum: ["white", "black", "random"],
          description: "Your color (default: white)",
        },
        difficulty: {
          type: "string",
          enum: ["easy", "medium", "hard"],
          description: "Stockfish difficulty level (default: medium)",
        },
      },
    },
  },
  {
    name: "get_board",
    description: "Get current board state including FEN, ASCII representation, and turn",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_legal_moves",
    description: "Get all legal moves in the current position",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "make_move",
    description: "Make a move using SAN notation (e.g., e4, Nf3, O-O, exd5)",
    inputSchema: {
      type: "object",
      properties: {
        move: {
          type: "string",
          description: "Move in SAN notation (e.g., e4, Nf3, O-O)",
        },
      },
      required: ["move"],
    },
  },
  {
    name: "get_game_status",
    description: "Get detailed game status (check, checkmate, stalemate, draw)",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "resign",
    description: "Resign the current game",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

export function createChessServer(
  initialState: GameState | null,
  onStateChange: (state: GameState) => void,
  onCommand: (entry: CommandLogEntry) => void
): MCPServer {
  let chess: Chess;
  let gameState: ChessGameState | null = null;

  // Restore state if available
  if (initialState && initialState.gameType === "chess") {
    gameState = initialState as ChessGameState;
    chess = new Chess(gameState.fen);
  } else {
    chess = new Chess();
  }

  const updateState = () => {
    if (!gameState) return;

    gameState.fen = chess.fen();
    gameState.pgn = chess.pgn();
    gameState.turn = chess.turn() === "w" ? "white" : "black";
    gameState.lastActivity = Date.now();

    if (chess.isGameOver()) {
      gameState.status = "finished";
      if (chess.isCheckmate()) {
        gameState.result = chess.turn() === "w" ? "black" : "white";
      } else {
        gameState.result = "draw";
      }
    }

    onStateChange(gameState);
  };

  const makeStockfishMove = async (): Promise<string> => {
    // Simple random move for now (Stockfish WASM integration TODO)
    // In production, this would use Stockfish WASM
    const moves = chess.moves();
    if (moves.length === 0) return "";

    // Simple evaluation: prefer captures and checks
    const priorityMoves = moves.filter(
      (m) => m.includes("x") || m.includes("+")
    );
    const selectedMoves = priorityMoves.length > 0 ? priorityMoves : moves;
    const move = selectedMoves[Math.floor(Math.random() * selectedMoves.length)];

    chess.move(move);
    return move;
  };

  const handleToolCall = async (
    name: string,
    args: Record<string, unknown>
  ): Promise<ToolCallResult> => {
    switch (name) {
      case "new_game": {
        const colorPref = (args.color as string) || "white";
        const difficulty = (args.difficulty as string) || "medium";

        let playerColor: "white" | "black";
        if (colorPref === "random") {
          playerColor = Math.random() < 0.5 ? "white" : "black";
        } else {
          playerColor = colorPref as "white" | "black";
        }

        chess = new Chess();
        gameState = {
          gameType: "chess",
          status: "playing",
          createdAt: Date.now(),
          lastActivity: Date.now(),
          fen: chess.fen(),
          pgn: "",
          turn: "white",
          playerColor,
          difficulty: difficulty as "easy" | "medium" | "hard",
        };

        updateState();

        let response = `New game started! You are playing as ${playerColor}.\n`;
        response += `Difficulty: ${difficulty}\n\n`;

        // If player is black, engine makes first move
        if (playerColor === "black") {
          const engineMove = await makeStockfishMove();
          updateState();
          response += `Engine plays: ${engineMove}\n\n`;
        }

        response += chess.ascii();
        return textContent(response);
      }

      case "get_board": {
        if (!gameState || gameState.status === "waiting") {
          return errorContent("No game in progress. Use new_game to start.");
        }

        let response = `FEN: ${chess.fen()}\n`;
        response += `Turn: ${chess.turn() === "w" ? "White" : "Black"}\n\n`;
        response += chess.ascii();

        if (chess.isCheck()) {
          response += "\n\n⚠️ CHECK!";
        }

        return textContent(response);
      }

      case "get_legal_moves": {
        if (!gameState || gameState.status === "waiting") {
          return errorContent("No game in progress. Use new_game to start.");
        }

        const moves = chess.moves();
        if (moves.length === 0) {
          return textContent("No legal moves available.");
        }

        // Group moves by piece type
        const grouped: Record<string, string[]> = {};
        for (const move of moves) {
          const piece = move[0] === move[0].toUpperCase() ? move[0] : "P";
          if (!grouped[piece]) grouped[piece] = [];
          grouped[piece].push(move);
        }

        let response = `Legal moves (${moves.length} total):\n\n`;
        const pieceNames: Record<string, string> = {
          P: "Pawns",
          N: "Knights",
          B: "Bishops",
          R: "Rooks",
          Q: "Queen",
          K: "King",
        };

        for (const [piece, pieceMoves] of Object.entries(grouped)) {
          response += `${pieceNames[piece]}: ${pieceMoves.join(", ")}\n`;
        }

        return textContent(response);
      }

      case "make_move": {
        if (!gameState || gameState.status !== "playing") {
          return errorContent("No game in progress. Use new_game to start.");
        }

        const moveStr = args.move as string;
        if (!moveStr) {
          return errorContent("Please specify a move.");
        }

        // Check if it's player's turn
        const currentTurn = chess.turn() === "w" ? "white" : "black";
        if (currentTurn !== gameState.playerColor) {
          return errorContent("It's not your turn!");
        }

        try {
          const result = chess.move(moveStr);
          if (!result) {
            return errorContent(
              `Invalid move: ${moveStr}. Use get_legal_moves to see available moves.`
            );
          }

          updateState();

          let response = `Your move: ${result.san}\n\n`;
          response += chess.ascii();

          // Check game status
          if (chess.isGameOver()) {
            if (chess.isCheckmate()) {
              response += `\n\n🎉 Checkmate! You win!`;
            } else if (chess.isStalemate()) {
              response += `\n\n🤝 Stalemate - Draw`;
            } else if (chess.isDraw()) {
              response += `\n\n🤝 Draw`;
            }
            return textContent(response);
          }

          // Engine response
          const engineMove = await makeStockfishMove();
          updateState();

          response += `\n\nEngine plays: ${engineMove}\n\n`;
          response += chess.ascii();

          if (chess.isGameOver()) {
            if (chess.isCheckmate()) {
              response += `\n\n💀 Checkmate! Engine wins.`;
            } else if (chess.isStalemate()) {
              response += `\n\n🤝 Stalemate - Draw`;
            } else if (chess.isDraw()) {
              response += `\n\n🤝 Draw`;
            }
          } else if (chess.isCheck()) {
            response += `\n\n⚠️ CHECK!`;
          }

          return textContent(response);
        } catch (error) {
          return errorContent(
            `Invalid move: ${moveStr}. Use get_legal_moves to see available moves.`
          );
        }
      }

      case "get_game_status": {
        if (!gameState) {
          return textContent("No game in progress.");
        }

        let status = `Game Status:\n`;
        status += `- Turn: ${chess.turn() === "w" ? "White" : "Black"}\n`;
        status += `- Your color: ${gameState.playerColor}\n`;
        status += `- Difficulty: ${gameState.difficulty}\n`;
        status += `- Move count: ${chess.history().length}\n`;

        if (chess.isCheckmate()) {
          const winner = chess.turn() === "w" ? "Black" : "White";
          status += `- Result: Checkmate! ${winner} wins.\n`;
        } else if (chess.isStalemate()) {
          status += `- Result: Stalemate (Draw)\n`;
        } else if (chess.isDraw()) {
          status += `- Result: Draw\n`;
        } else {
          status += `- In progress\n`;
          if (chess.isCheck()) {
            status += `- ⚠️ CHECK!\n`;
          }
        }

        return textContent(status);
      }

      case "resign": {
        if (!gameState || gameState.status !== "playing") {
          return errorContent("No game in progress.");
        }

        gameState.status = "finished";
        gameState.result = gameState.playerColor === "white" ? "black" : "white";
        updateState();

        return textContent("You resigned. Engine wins.");
      }

      default:
        return errorContent(`Unknown tool: ${name}`);
    }
  };

  return new MCPServer({
    name: "chess-mcp-server",
    version: "0.1.0",
    tools: chessTools,
    onToolCall: handleToolCall,
    onCommand,
  });
}
