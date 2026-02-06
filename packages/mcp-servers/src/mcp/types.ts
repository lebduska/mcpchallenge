// MCP Protocol Types (JSON-RPC 2.0 based)

export interface MCPRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

export interface MCPNotification {
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, unknown>;
}

// Tool definitions
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, MCPSchema>;
    required?: string[];
  };
}

export interface MCPSchema {
  type: string;
  description?: string;
  enum?: string[];
  minimum?: number;
  maximum?: number;
}

// Server info
export interface MCPServerInfo {
  name: string;
  version: string;
}

export interface MCPCapabilities {
  tools?: Record<string, unknown>;
  resources?: Record<string, unknown>;
  prompts?: Record<string, unknown>;
}

// Initialize request/response
export interface InitializeParams {
  protocolVersion: string;
  capabilities: Record<string, unknown>;
  clientInfo: {
    name: string;
    version: string;
  };
}

export interface InitializeResult {
  protocolVersion: string;
  capabilities: MCPCapabilities;
  serverInfo: MCPServerInfo;
}

// Tools list
export interface ToolsListResult {
  tools: MCPTool[];
}

// Tool call
export interface ToolCallParams {
  name: string;
  arguments?: Record<string, unknown>;
}

export interface ToolCallResult {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

// Command log entry (for UI)
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

// Game mode types (for 2-player support)
export type GameMode = "ai" | "pvp";
export type PlayerColor = "white" | "black";

export interface PlayerSlot {
  nonce: string;
  agentSnapshot: import("./agent-types").AgentSnapshot | null;
  connectedAt: number;
  lastActivity: number;
}

// Game state types
export type GameType = "chess" | "tictactoe" | "snake" | "canvas" | "minesweeper" | "polybridge" | "sokoban";

export interface BaseGameState {
  gameType: GameType;
  status: "waiting" | "playing" | "finished" | "won" | "lost";
  createdAt: number;
  lastActivity: number;
}

export interface ChessGameState extends BaseGameState {
  gameType: "chess";
  fen: string;
  pgn: string;
  turn: "white" | "black";
  playerColor?: "white" | "black";  // Optional for PvP mode
  result?: "white" | "black" | "draw";
  difficulty: "easy" | "medium" | "hard";
  // PvP mode fields
  gameMode?: GameMode;
  players?: {
    white: { name: string; model: string } | null;
    black: { name: string; model: string } | null;
  };
}

export interface TicTacToeGameState extends BaseGameState {
  gameType: "tictactoe";
  board: (string | null)[];
  currentTurn: "X" | "O";
  playerSymbol: "X" | "O";
  winner?: "X" | "O" | "draw";
}

export interface SnakeGameState extends BaseGameState {
  gameType: "snake";
  snake: Array<{ x: number; y: number }>;
  food: { x: number; y: number };
  direction: "up" | "down" | "left" | "right";
  score: number;
  gridSize: number;
  gameOver: boolean;
}

export interface CanvasGameState extends BaseGameState {
  gameType: "canvas";
  width: number;
  height: number;
  commands: Array<{
    type: string;
    params: Record<string, unknown>;
  }>;
}

export interface MinesweeperGameState extends BaseGameState {
  gameType: "minesweeper";
  status: "waiting" | "playing" | "won" | "lost";
  board: number[][];        // -1=mine, 0-8=adjacent count (visible after reveal)
  revealed: boolean[][];
  flagged: boolean[][];
  rows: number;
  cols: number;
  mineCount: number;
  flagsRemaining: number;
  elapsedSeconds: number;
}

export interface PolyBridgeGameState extends BaseGameState {
  gameType: "polybridge";
  levelIndex: number;
  structures: Array<{
    id: string;
    type: "beam" | "cable" | "road";
    start: { x: number; y: number };
    end: { x: number; y: number };
    material: "wood" | "steel" | "cable" | "road";
    cost: number;
  }>;
  budgetUsed: number;
  budgetTotal: number;
  testResult: "untested" | "testing" | "passed" | "failed";
  vehicleProgress: number;
  levelComplete: boolean;
}

export interface SokobanGameState extends BaseGameState {
  gameType: "sokoban";
  status: "waiting" | "playing" | "won";
  board: string[][];
  player: { row: number; col: number };
  boxes: Array<{ row: number; col: number }>;
  goals: Array<{ row: number; col: number }>;
  rows: number;
  cols: number;
  levelIndex: number;
  totalLevels: number;
  moveCount: number;
  pushCount: number;
  boxesOnGoals: number;
}

export type GameState = ChessGameState | TicTacToeGameState | SnakeGameState | CanvasGameState | MinesweeperGameState | PolyBridgeGameState | SokobanGameState;
