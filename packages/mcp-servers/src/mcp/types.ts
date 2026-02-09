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
export type GameType = "chess" | "tictactoe" | "snake" | "canvas" | "minesweeper" | "polybridge" | "sokoban" | "gorillas" | "fractals" | "lightsout" | "pathfinding" | "sorting";

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

export interface GorillasGameState extends BaseGameState {
  gameType: "gorillas";
  buildings: Array<{
    x: number;
    width: number;
    height: number;
    color: string;
    destroyed: boolean;
  }>;
  player1: {
    x: number;
    y: number;
    score: number;
    isAI: boolean;
  };
  player2: {
    x: number;
    y: number;
    score: number;
    isAI: boolean;
  };
  currentPlayer: 1 | 2;
  wind: number;
  gravity: number;
  levelIndex: number;
  totalLevels: number;
  pointsToWin: number;
  isVsAI: boolean;
  aiDifficulty: "easy" | "medium" | "hard";
  lastTrajectory?: {
    points: Array<{ x: number; y: number }>;
    hit: "player1" | "player2" | "building" | "miss" | null;
    explosionCenter?: { x: number; y: number };
  };
  canvasWidth: number;
  canvasHeight: number;
}

export interface FractalsGameState extends BaseGameState {
  gameType: "fractals";
  axiom: string;
  rules: Array<{
    symbol: string;
    replacement: string;
    probability: number;
  }>;
  iterations: number;
  angle: number;
  length: number;
  decay: number;
  preset: string | null;
  colorScheme: string;
  expandedLength: number;
  stats: {
    segmentsDrawn: number;
    maxDepth: number;
  };
  canvasWidth: number;
  canvasHeight: number;
}

export interface LightsOutGameState extends BaseGameState {
  gameType: "lightsout";
  grid: boolean[][];
  size: number;
  toggleCount: number;
  minSolution: number;
  difficulty: "easy" | "medium" | "hard";
}

export interface PathfindingGameState extends BaseGameState {
  gameType: "pathfinding";
  status: "waiting" | "playing" | "won";
  grid: string[][];  // 'empty' | 'wall' | 'start' | 'goal' | 'mud' | 'water'
  width: number;
  height: number;
  start: { row: number; col: number } | null;
  goal: { row: number; col: number } | null;
  algorithm: "bfs" | "dijkstra" | "astar";
  pathFound: boolean | null;
  pathLength: number;
  pathCost: number;
  nodesExpanded: number;
  path: Array<{ row: number; col: number }>;
  levelIndex: number;
  totalLevels: number;
  difficulty: "easy" | "medium" | "hard";
}

export interface SortingGameState extends BaseGameState {
  gameType: "sorting";
  status: "waiting" | "playing" | "won";
  length: number;
  comparisons: number;
  swaps: number;
  isSorted: boolean;
  parComparisons: number;
  parSwaps: number;
  levelIndex: number;
  totalLevels: number;
  difficulty: "easy" | "medium" | "hard";
  lastCompared: [number, number] | null;
  lastSwapped: [number, number] | null;
  // For UI visualization - relative bar heights
  relativeHeights: number[];
}

export type GameState = ChessGameState | TicTacToeGameState | SnakeGameState | CanvasGameState | MinesweeperGameState | PolyBridgeGameState | SokobanGameState | GorillasGameState | FractalsGameState | LightsOutGameState | PathfindingGameState | SortingGameState;
