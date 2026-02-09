// MCP Component Types

export type GameType = "chess" | "tictactoe" | "snake" | "canvas" | "minesweeper" | "polybridge" | "sokoban" | "gorillas" | "fractals" | "lightsout" | "pathfinding";

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

export interface MinesweeperGameState {
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

export interface PolyBridgeGameState {
  gameType: "polybridge";
  status: "waiting" | "playing" | "finished";
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

export interface SokobanGameState {
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

export interface GorillasGameState {
  gameType: "gorillas";
  status: "waiting" | "playing" | "won" | "lost";
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

export interface FractalsGameState {
  gameType: "fractals";
  status: "waiting" | "playing" | "finished";
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

export interface LightsOutGameState {
  gameType: "lightsout";
  status: "waiting" | "playing" | "won";
  grid: boolean[][];
  size: number;
  toggleCount: number;
  minSolution: number;
  difficulty: "easy" | "medium" | "hard";
}

export interface PathfindingGameState {
  gameType: "pathfinding";
  status: "waiting" | "playing" | "won";
  grid: string[][]; // 'empty' | 'wall' | 'start' | 'goal' | 'mud' | 'water' | 'path' | 'visited'
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

export type GameState =
  | ChessGameState
  | TicTacToeGameState
  | SnakeGameState
  | CanvasGameState
  | MinesweeperGameState
  | PolyBridgeGameState
  | SokobanGameState
  | GorillasGameState
  | FractalsGameState
  | LightsOutGameState
  | PathfindingGameState;

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
  sessionNonce?: string;  // For agent.identify verification
  // PvP mode
  gameMode?: "ai" | "pvp";
  playerNonces?: {
    white: string | null;
    black: string | null;
  };
}
