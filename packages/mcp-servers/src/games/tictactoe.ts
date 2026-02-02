// Tic-Tac-Toe MCP Server Implementation
// Uses minimax algorithm for computer opponent

import { MCPServer, textContent, errorContent } from "../mcp/server";
import type {
  MCPTool,
  TicTacToeGameState,
  GameState,
  CommandLogEntry,
  ToolCallResult,
} from "../mcp/types";

const tictactoeTools: MCPTool[] = [
  {
    name: "new_game",
    description: "Start a new Tic-Tac-Toe game",
    inputSchema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          enum: ["X", "O", "random"],
          description: "Your symbol (X goes first). Default: X",
        },
      },
    },
  },
  {
    name: "get_board",
    description: "Get current board state",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_legal_moves",
    description: "Get available positions (0-8)",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "make_move",
    description: "Make a move at position 0-8 (top-left to bottom-right)",
    inputSchema: {
      type: "object",
      properties: {
        position: {
          type: "number",
          description: "Position 0-8 (0=top-left, 8=bottom-right)",
          minimum: 0,
          maximum: 8,
        },
      },
      required: ["position"],
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

// Minimax algorithm for computer moves
function minimax(
  board: (string | null)[],
  isMaximizing: boolean,
  computerSymbol: string,
  playerSymbol: string
): number {
  const winner = checkWinner(board);
  if (winner === computerSymbol) return 10;
  if (winner === playerSymbol) return -10;
  if (board.every((cell) => cell !== null)) return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = computerSymbol;
        const score = minimax(board, false, computerSymbol, playerSymbol);
        board[i] = null;
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = playerSymbol;
        const score = minimax(board, true, computerSymbol, playerSymbol);
        board[i] = null;
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}

function getBestMove(
  board: (string | null)[],
  computerSymbol: string,
  playerSymbol: string
): number {
  let bestScore = -Infinity;
  let bestMove = -1;

  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = computerSymbol;
      const score = minimax(board, false, computerSymbol, playerSymbol);
      board[i] = null;

      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }

  return bestMove;
}

function checkWinner(board: (string | null)[]): string | null {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6], // Diagonals
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
}

function formatBoard(board: (string | null)[]): string {
  const display = board.map((cell, i) => (cell === null ? String(i) : cell));
  return [
    ` ${display[0]} │ ${display[1]} │ ${display[2]} `,
    "───┼───┼───",
    ` ${display[3]} │ ${display[4]} │ ${display[5]} `,
    "───┼───┼───",
    ` ${display[6]} │ ${display[7]} │ ${display[8]} `,
  ].join("\n");
}

export function createTicTacToeServer(
  initialState: GameState | null,
  onStateChange: (state: GameState) => void,
  onCommand: (entry: CommandLogEntry) => void
): MCPServer {
  let gameState: TicTacToeGameState | null = null;

  // Restore state if available
  if (initialState && initialState.gameType === "tictactoe") {
    gameState = initialState as TicTacToeGameState;
  }

  const updateState = () => {
    if (!gameState) return;
    gameState.lastActivity = Date.now();
    onStateChange(gameState);
  };

  const handleToolCall = async (
    name: string,
    args: Record<string, unknown>
  ): Promise<ToolCallResult> => {
    switch (name) {
      case "new_game": {
        const symbolPref = (args.symbol as string) || "X";

        let playerSymbol: "X" | "O";
        if (symbolPref === "random") {
          playerSymbol = Math.random() < 0.5 ? "X" : "O";
        } else {
          playerSymbol = symbolPref as "X" | "O";
        }

        gameState = {
          gameType: "tictactoe",
          status: "playing",
          createdAt: Date.now(),
          lastActivity: Date.now(),
          board: Array(9).fill(null),
          currentTurn: "X",
          playerSymbol,
        };

        let response = `New game started! You are ${playerSymbol}.\n`;
        response += `(${playerSymbol === "X" ? "You go first" : "Computer goes first"})\n\n`;

        // If player is O, computer goes first
        if (playerSymbol === "O") {
          const computerSymbol = "X";
          const move = getBestMove(gameState.board, computerSymbol, playerSymbol);
          gameState.board[move] = computerSymbol;
          gameState.currentTurn = "O";
          response += `Computer plays position ${move}\n\n`;
        }

        response += formatBoard(gameState.board);
        response += "\n\n(Use positions 0-8 to make moves)";

        updateState();
        return textContent(response);
      }

      case "get_board": {
        if (!gameState || gameState.status === "waiting") {
          return errorContent("No game in progress. Use new_game to start.");
        }

        let response = formatBoard(gameState.board);
        response += `\n\nTurn: ${gameState.currentTurn}`;
        response += ` (${gameState.currentTurn === gameState.playerSymbol ? "Your turn" : "Computer's turn"})`;

        return textContent(response);
      }

      case "get_legal_moves": {
        if (!gameState || gameState.status === "waiting") {
          return errorContent("No game in progress. Use new_game to start.");
        }

        const available = gameState.board
          .map((cell, i) => (cell === null ? i : -1))
          .filter((i) => i !== -1);

        if (available.length === 0) {
          return textContent("No moves available.");
        }

        return textContent(`Available positions: ${available.join(", ")}`);
      }

      case "make_move": {
        if (!gameState || gameState.status !== "playing") {
          return errorContent("No game in progress. Use new_game to start.");
        }

        const position = args.position as number;
        if (position < 0 || position > 8 || !Number.isInteger(position)) {
          return errorContent("Position must be an integer from 0 to 8.");
        }

        // Check if it's player's turn
        if (gameState.currentTurn !== gameState.playerSymbol) {
          return errorContent("It's not your turn!");
        }

        // Check if position is available
        if (gameState.board[position] !== null) {
          return errorContent(
            `Position ${position} is already taken. Use get_legal_moves to see available positions.`
          );
        }

        // Make player's move
        gameState.board[position] = gameState.playerSymbol;

        let response = `You played position ${position}\n\n`;

        // Check for winner
        let winner = checkWinner(gameState.board);
        if (winner) {
          gameState.status = "finished";
          gameState.winner = winner as "X" | "O";
          response += formatBoard(gameState.board);
          response += `\n\n🎉 ${winner} wins! Congratulations!`;
          updateState();
          return textContent(response);
        }

        // Check for draw
        if (gameState.board.every((cell) => cell !== null)) {
          gameState.status = "finished";
          gameState.winner = "draw";
          response += formatBoard(gameState.board);
          response += "\n\n🤝 It's a draw!";
          updateState();
          return textContent(response);
        }

        // Computer's turn
        const computerSymbol = gameState.playerSymbol === "X" ? "O" : "X";
        gameState.currentTurn = computerSymbol;

        const computerMove = getBestMove(
          gameState.board,
          computerSymbol,
          gameState.playerSymbol
        );
        gameState.board[computerMove] = computerSymbol;
        gameState.currentTurn = gameState.playerSymbol;

        response += formatBoard(gameState.board);
        response += `\n\nComputer plays position ${computerMove}\n\n`;

        // Check for winner after computer move
        winner = checkWinner(gameState.board);
        if (winner) {
          gameState.status = "finished";
          gameState.winner = winner as "X" | "O";
          response += `💀 ${winner} wins! Computer wins.`;
          updateState();
          return textContent(response);
        }

        // Check for draw
        if (gameState.board.every((cell) => cell !== null)) {
          gameState.status = "finished";
          gameState.winner = "draw";
          response += "🤝 It's a draw!";
          updateState();
          return textContent(response);
        }

        response += formatBoard(gameState.board);
        response += "\n\nYour turn!";

        updateState();
        return textContent(response);
      }

      case "resign": {
        if (!gameState || gameState.status !== "playing") {
          return errorContent("No game in progress.");
        }

        gameState.status = "finished";
        gameState.winner = gameState.playerSymbol === "X" ? "O" : "X";
        updateState();

        return textContent("You resigned. Computer wins.");
      }

      default:
        return errorContent(`Unknown tool: ${name}`);
    }
  };

  return new MCPServer({
    name: "tictactoe-mcp-server",
    version: "0.1.0",
    tools: tictactoeTools,
    onToolCall: handleToolCall,
    onCommand,
  });
}
