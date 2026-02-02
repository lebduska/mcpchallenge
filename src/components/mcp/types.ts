// MCP Component Types

export type GameType = "chess" | "tictactoe" | "snake" | "canvas";

export interface CommandLogEntry {
  timestamp: number;
  type: "request" | "response";
  id?: string | number;
  method?: string;
  toolName?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: string;
}

export interface ChessGameState {
  gameType: "chess";
  status: "waiting" | "playing" | "finished";
  fen: string;
  pgn: string;
  turn: "white" | "black";
  playerColor: "white" | "black";
  result?: "white" | "black" | "draw";
  difficulty: "easy" | "medium" | "hard";
}

export interface TicTacToeGameState {
  gameType: "tictactoe";
  status: "waiting" | "playing" | "finished";
  board: (string | null)[];
  currentTurn: "X" | "O";
  playerSymbol: "X" | "O";
  winner?: "X" | "O" | "draw";
}

export interface SnakeGameState {
  gameType: "snake";
  status: "waiting" | "playing" | "finished";
  snake: Array<{ x: number; y: number }>;
  food: { x: number; y: number };
  direction: "up" | "down" | "left" | "right";
  score: number;
  gridSize: number;
  gameOver: boolean;
}

export interface CanvasGameState {
  gameType: "canvas";
  status: "waiting" | "playing" | "finished";
  width: number;
  height: number;
  commands: Array<{
    type: string;
    params: Record<string, unknown>;
  }>;
}

export type GameState =
  | ChessGameState
  | TicTacToeGameState
  | SnakeGameState
  | CanvasGameState;

export interface RoomState {
  roomId: string;
  gameType: GameType;
  gameState: GameState | null;
  commandCount: number;
  createdAt: number;
  lastActivity: number;
}

export interface RoomInfo {
  roomId: string;
  gameType: GameType;
  mcpUrl: string;
  sseUrl: string;
  wsUrl?: string;
}
