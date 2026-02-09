/**
 * Pathfinding Game Engine
 *
 * Interactive pathfinding visualizer with BFS, Dijkstra, and A* algorithms.
 * Supports walls and weighted terrain (mud, water).
 */

import {
  generateGameId,
  type GameEngine,
  type GameState,
  type GameResult,
  type MoveResult,
  type GameStateJSON,
  type Difficulty,
} from '../types';

// =============================================================================
// Types
// =============================================================================

export type CellType = 'empty' | 'wall' | 'start' | 'goal' | 'mud' | 'water';
export type Algorithm = 'bfs' | 'dijkstra' | 'astar';

export interface Cell {
  type: CellType;
  visited: boolean;
  inPath: boolean;
  gCost: number;
  fCost: number;
}

export interface Position {
  row: number;
  col: number;
}

export interface PathfindingState extends GameState {
  grid: Cell[][];
  width: number;
  height: number;
  start: Position | null;
  goal: Position | null;
  algorithm: Algorithm;
  pathFound: boolean | null;
  pathLength: number;
  pathCost: number;
  nodesExpanded: number;
  path: Position[];
  difficulty: Difficulty;
  // Level system
  levelIndex: number;
  totalLevels: number;
  parCost: number;
  parNodes: number;
  levelName: string;
  mode: 'sandbox' | 'challenge';
}

export interface PathfindingMove {
  action: 'set_cell' | 'set_start' | 'set_goal' | 'find_path' | 'clear' | 'generate_maze' | 'load_level' | 'next_level';
  row?: number;
  col?: number;
  cellType?: CellType;
  algorithm?: Algorithm;
  level?: number;  // For load_level
}

export interface PathfindingOptions {
  width?: number;
  height?: number;
  difficulty?: Difficulty;
  level?: number;  // Start at specific level
  mode?: 'sandbox' | 'challenge';
}

// =============================================================================
// Constants
// =============================================================================

const CELL_COSTS: Record<CellType, number> = {
  empty: 1,
  wall: Infinity,
  start: 1,
  goal: 1,
  mud: 5,
  water: 10,
};

const DIRECTIONS_4 = [
  [-1, 0], [1, 0], [0, -1], [0, 1],
] as const;

const DIFFICULTY_CONFIG: Record<Difficulty, { width: number; height: number }> = {
  easy: { width: 10, height: 8 },
  medium: { width: 20, height: 15 },
  hard: { width: 30, height: 20 },
};

// =============================================================================
// Level System
// =============================================================================

export interface PathfindingLevel {
  id: number;
  name: string;
  description: string;
  width: number;
  height: number;
  map: string;  // Use symbols: . = empty, # = wall, ~ = mud, ≈ = water, S = start, G = goal
  parCost: number;  // Optimal path cost for scoring
  parNodes: number; // Optimal nodes expanded (A*)
  difficulty: Difficulty;
  hint?: string;
}

// Legend: . = empty, # = wall, ~ = mud, ≈ = water, S = start, G = goal
export const PATHFINDING_LEVELS: PathfindingLevel[] = [
  // Level 1: Simple straight path
  {
    id: 1,
    name: "First Steps",
    description: "Find the shortest path with no obstacles",
    width: 10,
    height: 5,
    map: `
..........
..........
S........G
..........
..........
`.trim(),
    parCost: 9,
    parNodes: 25,
    difficulty: "easy",
    hint: "BFS and A* perform equally well here",
  },

  // Level 2: Simple wall
  {
    id: 2,
    name: "First Wall",
    description: "Navigate around a simple obstacle",
    width: 10,
    height: 7,
    map: `
..........
..........
S...####..
..........
......####
..........
.........G
`.trim(),
    parCost: 14,
    parNodes: 40,
    difficulty: "easy",
  },

  // Level 3: Maze introduction
  {
    id: 3,
    name: "Mini Maze",
    description: "Find your way through a small maze",
    width: 11,
    height: 7,
    map: `
S.#.......
..#.###.#.
..#...#.#.
..###.#.#.
......#.#.
.####.#...
.........G
`.trim(),
    parCost: 18,
    parNodes: 35,
    difficulty: "easy",
  },

  // Level 4: Weighted terrain introduction
  {
    id: 4,
    name: "Muddy Path",
    description: "Mud costs 5x - is the shortcut worth it?",
    width: 12,
    height: 6,
    map: `
S...........
.###########
.#~~~~~~~~~~
.#~~~~~~~~~~
.#..........
............G
`.trim(),
    parCost: 16,
    parNodes: 45,
    difficulty: "easy",
    hint: "Going through mud costs 5 per cell",
  },

  // Level 5: Strategic choice
  {
    id: 5,
    name: "Choose Wisely",
    description: "Short muddy path or long clear path?",
    width: 15,
    height: 8,
    map: `
S..............
.##############
.#~~~~~~~~~~~~#
.#~~~~~~~~~~~~#
.#~~~~~~~~~~~~#
.#~~~~~~~~~~~~#
.##############
..............G
`.trim(),
    parCost: 28,
    parNodes: 50,
    difficulty: "medium",
    hint: "Dijkstra finds the optimal weighted path",
  },

  // Level 6: Water hazard
  {
    id: 6,
    name: "River Crossing",
    description: "Water costs 10x - find the bridge!",
    width: 15,
    height: 8,
    map: `
S..............
≈≈≈≈≈≈≈.≈≈≈≈≈≈≈
≈≈≈≈≈≈≈.≈≈≈≈≈≈≈
≈≈≈≈≈≈≈.≈≈≈≈≈≈≈
≈≈≈≈≈≈≈.≈≈≈≈≈≈≈
≈≈≈≈≈≈≈.≈≈≈≈≈≈≈
≈≈≈≈≈≈≈.≈≈≈≈≈≈≈
..............G
`.trim(),
    parCost: 21,
    parNodes: 60,
    difficulty: "medium",
  },

  // Level 7: Complex maze
  {
    id: 7,
    name: "Labyrinth",
    description: "Navigate a complex maze efficiently",
    width: 17,
    height: 11,
    map: `
S.#............#.
..#.###.#####..#.
..#.#.....#....#.
###.#.###.#.####.
....#.#.#.#......
.####.#.#.#####.#
.#....#.#.......#
.#.####.#######.#
.#.............#.
.###############.
................G
`.trim(),
    parCost: 32,
    parNodes: 80,
    difficulty: "medium",
  },

  // Level 8: Mixed terrain maze
  {
    id: 8,
    name: "Terrain Challenge",
    description: "Walls, mud, and water - optimize your path!",
    width: 15,
    height: 10,
    map: `
S..#..≈≈≈......
...#..≈≈≈..###.
...#..≈≈≈..#...
...#..≈≈≈..#.#.
...#.......#.#.
...####~~###.#.
......#~~#...#.
.####.#~~#.###.
.#....#..#.....
.#....#.......G
`.trim(),
    parCost: 26,
    parNodes: 70,
    difficulty: "medium",
  },

  // Level 9: A* showcase
  {
    id: 9,
    name: "Heuristic Advantage",
    description: "A* shines with good heuristics",
    width: 20,
    height: 12,
    map: `
S...................
....................
....................
....................
....................
################....
....................
....................
....................
....................
....................
...................G
`.trim(),
    parCost: 30,
    parNodes: 45,
    difficulty: "hard",
    hint: "A* explores fewer nodes than BFS here",
  },

  // Level 10: Ultimate challenge
  {
    id: 10,
    name: "The Gauntlet",
    description: "Master all terrain types in one challenge",
    width: 20,
    height: 12,
    map: `
S..#....≈≈≈≈.....#..
...#....≈≈≈≈.....#..
...#....≈≈≈≈.....#..
...#....≈≈≈≈.....#..
...#...........###..
...####~~~~~####....
.......~~~~~........
.####..~~~~~..####..
.#.....~~~~~.....#..
.#...............#..
.#...............#..
.#.................G
`.trim(),
    parCost: 35,
    parNodes: 90,
    difficulty: "hard",
  },
];

export const TOTAL_LEVELS = PATHFINDING_LEVELS.length;

function parseLevel(level: PathfindingLevel): { grid: Cell[][]; start: Position | null; goal: Position | null } {
  const lines = level.map.split('\n').filter(l => l.length > 0);
  const height = lines.length;
  const width = level.width;
  const grid = createEmptyGrid(width, height);
  let start: Position | null = null;
  let goal: Position | null = null;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width && col < lines[row].length; col++) {
      const char = lines[row][col];
      switch (char) {
        case '#':
          grid[row][col].type = 'wall';
          break;
        case '~':
          grid[row][col].type = 'mud';
          break;
        case '≈':
          grid[row][col].type = 'water';
          break;
        case 'S':
          grid[row][col].type = 'start';
          start = { row, col };
          break;
        case 'G':
          grid[row][col].type = 'goal';
          goal = { row, col };
          break;
        default:
          grid[row][col].type = 'empty';
      }
    }
  }

  return { grid, start, goal };
}

// =============================================================================
// Helper Functions
// =============================================================================

function createEmptyGrid(width: number, height: number): Cell[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({
      type: 'empty' as CellType,
      visited: false,
      inPath: false,
      gCost: Infinity,
      fCost: Infinity,
    }))
  );
}

function cloneGrid(grid: Cell[][]): Cell[][] {
  return grid.map(row => row.map(cell => ({ ...cell })));
}

function manhattan(a: Position, b: Position): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

// Priority Queue for Dijkstra and A*
class PriorityQueue<T> {
  private items: { item: T; priority: number }[] = [];

  enqueue(item: T, priority: number): void {
    this.items.push({ item, priority });
    this.items.sort((a, b) => a.priority - b.priority);
  }

  dequeue(): T | undefined {
    return this.items.shift()?.item;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

// BFS Algorithm
function runBFS(state: PathfindingState): { path: Position[]; nodesExpanded: number } {
  if (!state.start || !state.goal) return { path: [], nodesExpanded: 0 };

  const grid = cloneGrid(state.grid);
  const queue: Position[] = [state.start];
  const visited = new Set<string>();
  const parent = new Map<string, Position | null>();
  let nodesExpanded = 0;

  const key = (p: Position) => `${p.row},${p.col}`;
  visited.add(key(state.start));
  parent.set(key(state.start), null);

  while (queue.length > 0) {
    const current = queue.shift()!;
    nodesExpanded++;

    if (current.row === state.goal.row && current.col === state.goal.col) {
      // Reconstruct path
      const path: Position[] = [];
      let node: Position | null = current;
      while (node) {
        path.unshift(node);
        node = parent.get(key(node)) ?? null;
      }
      return { path, nodesExpanded };
    }

    for (const [dr, dc] of DIRECTIONS_4) {
      const nr = current.row + dr;
      const nc = current.col + dc;

      if (nr < 0 || nr >= state.height || nc < 0 || nc >= state.width) continue;
      if (grid[nr][nc].type === 'wall') continue;

      const nKey = `${nr},${nc}`;
      if (visited.has(nKey)) continue;

      visited.add(nKey);
      parent.set(nKey, current);
      queue.push({ row: nr, col: nc });
    }
  }

  return { path: [], nodesExpanded };
}

// Dijkstra Algorithm
function runDijkstra(state: PathfindingState): { path: Position[]; nodesExpanded: number; totalCost: number } {
  if (!state.start || !state.goal) return { path: [], nodesExpanded: 0, totalCost: 0 };

  const pq = new PriorityQueue<Position>();
  const dist = new Map<string, number>();
  const parent = new Map<string, Position | null>();
  let nodesExpanded = 0;

  const key = (p: Position) => `${p.row},${p.col}`;
  dist.set(key(state.start), 0);
  parent.set(key(state.start), null);
  pq.enqueue(state.start, 0);

  while (!pq.isEmpty()) {
    const current = pq.dequeue()!;
    const currentKey = key(current);
    nodesExpanded++;

    if (current.row === state.goal.row && current.col === state.goal.col) {
      const path: Position[] = [];
      let node: Position | null = current;
      while (node) {
        path.unshift(node);
        node = parent.get(key(node)) ?? null;
      }
      return { path, nodesExpanded, totalCost: dist.get(currentKey) ?? 0 };
    }

    const currentDist = dist.get(currentKey) ?? Infinity;

    for (const [dr, dc] of DIRECTIONS_4) {
      const nr = current.row + dr;
      const nc = current.col + dc;

      if (nr < 0 || nr >= state.height || nc < 0 || nc >= state.width) continue;

      const cell = state.grid[nr][nc];
      if (cell.type === 'wall') continue;

      const cost = CELL_COSTS[cell.type];
      const newDist = currentDist + cost;
      const nKey = `${nr},${nc}`;

      if (newDist < (dist.get(nKey) ?? Infinity)) {
        dist.set(nKey, newDist);
        parent.set(nKey, current);
        pq.enqueue({ row: nr, col: nc }, newDist);
      }
    }
  }

  return { path: [], nodesExpanded, totalCost: 0 };
}

// A* Algorithm
function runAStar(state: PathfindingState): { path: Position[]; nodesExpanded: number; totalCost: number } {
  if (!state.start || !state.goal) return { path: [], nodesExpanded: 0, totalCost: 0 };

  const pq = new PriorityQueue<Position>();
  const gScore = new Map<string, number>();
  const parent = new Map<string, Position | null>();
  let nodesExpanded = 0;

  const key = (p: Position) => `${p.row},${p.col}`;
  gScore.set(key(state.start), 0);
  parent.set(key(state.start), null);
  pq.enqueue(state.start, manhattan(state.start, state.goal));

  while (!pq.isEmpty()) {
    const current = pq.dequeue()!;
    const currentKey = key(current);
    nodesExpanded++;

    if (current.row === state.goal.row && current.col === state.goal.col) {
      const path: Position[] = [];
      let node: Position | null = current;
      while (node) {
        path.unshift(node);
        node = parent.get(key(node)) ?? null;
      }
      return { path, nodesExpanded, totalCost: gScore.get(currentKey) ?? 0 };
    }

    const currentG = gScore.get(currentKey) ?? Infinity;

    for (const [dr, dc] of DIRECTIONS_4) {
      const nr = current.row + dr;
      const nc = current.col + dc;

      if (nr < 0 || nr >= state.height || nc < 0 || nc >= state.width) continue;

      const cell = state.grid[nr][nc];
      if (cell.type === 'wall') continue;

      const cost = CELL_COSTS[cell.type];
      const tentativeG = currentG + cost;
      const nKey = `${nr},${nc}`;

      if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
        gScore.set(nKey, tentativeG);
        parent.set(nKey, current);
        const fScore = tentativeG + manhattan({ row: nr, col: nc }, state.goal);
        pq.enqueue({ row: nr, col: nc }, fScore);
      }
    }
  }

  return { path: [], nodesExpanded, totalCost: 0 };
}

// Generate random maze using recursive backtracking
function generateMaze(width: number, height: number): { grid: Cell[][]; start: Position; goal: Position } {
  const grid = createEmptyGrid(width, height);

  // Fill with walls
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      grid[r][c].type = 'wall';
    }
  }

  // Recursive backtracking
  const stack: Position[] = [];
  const startPos = { row: 1, col: 1 };
  grid[startPos.row][startPos.col].type = 'empty';
  stack.push(startPos);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors: Position[] = [];

    for (const [dr, dc] of [[0, 2], [2, 0], [0, -2], [-2, 0]]) {
      const nr = current.row + dr;
      const nc = current.col + dc;
      if (nr > 0 && nr < height - 1 && nc > 0 && nc < width - 1 && grid[nr][nc].type === 'wall') {
        neighbors.push({ row: nr, col: nc });
      }
    }

    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      // Remove wall between current and next
      const midR = (current.row + next.row) / 2;
      const midC = (current.col + next.col) / 2;
      grid[midR][midC].type = 'empty';
      grid[next.row][next.col].type = 'empty';
      stack.push(next);
    } else {
      stack.pop();
    }
  }

  // Add some mud and water randomly
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (grid[r][c].type === 'empty' && Math.random() < 0.1) {
        grid[r][c].type = Math.random() < 0.5 ? 'mud' : 'water';
      }
    }
  }

  const start = { row: 1, col: 1 };
  const goal = { row: height - 2, col: width - 2 };
  grid[start.row][start.col].type = 'start';
  grid[goal.row][goal.col].type = 'goal';

  return { grid, start, goal };
}

function formatGrid(state: PathfindingState): string {
  const lines: string[] = [];
  const symbols: Record<CellType, string> = {
    empty: '·',
    wall: '█',
    start: 'S',
    goal: 'G',
    mud: '~',
    water: '≋',
  };

  for (let r = 0; r < state.height; r++) {
    let line = '';
    for (let c = 0; c < state.width; c++) {
      const cell = state.grid[r][c];
      if (cell.inPath && cell.type !== 'start' && cell.type !== 'goal') {
        line += '★';
      } else if (cell.visited && cell.type === 'empty') {
        line += '○';
      } else {
        line += symbols[cell.type];
      }
    }
    lines.push(line);
  }

  return lines.join('\n');
}

// =============================================================================
// Pathfinding Engine Implementation
// =============================================================================

function createPathfindingEngine(): GameEngine<PathfindingState, PathfindingMove, PathfindingOptions> {
  return {
    metadata: {
      id: 'pathfinding',
      name: 'Pathfinding Playground',
      description: 'Explore BFS, Dijkstra, and A* pathfinding algorithms',
      difficulty: 'medium',
      points: 150,
      transport: 'sse',
      minPlayers: 1,
      maxPlayers: 1,
    },

    newGame(options = {}): PathfindingState {
      const mode = options.mode ?? 'challenge';
      const levelIndex = options.level ?? 1;

      // Challenge mode: load level
      if (mode === 'challenge' && levelIndex >= 1 && levelIndex <= TOTAL_LEVELS) {
        const level = PATHFINDING_LEVELS[levelIndex - 1];
        const { grid, start, goal } = parseLevel(level);

        return {
          gameId: generateGameId(),
          status: 'playing',
          turn: 'player',
          moveCount: 0,
          grid,
          width: level.width,
          height: grid.length,
          start,
          goal,
          algorithm: 'astar',
          pathFound: null,
          pathLength: 0,
          pathCost: 0,
          nodesExpanded: 0,
          path: [],
          difficulty: level.difficulty,
          levelIndex,
          totalLevels: TOTAL_LEVELS,
          parCost: level.parCost,
          parNodes: level.parNodes,
          levelName: level.name,
          mode: 'challenge',
        };
      }

      // Sandbox mode
      const difficulty = options.difficulty ?? 'medium';
      const config = DIFFICULTY_CONFIG[difficulty];
      const width = options.width ?? config.width;
      const height = options.height ?? config.height;

      const grid = createEmptyGrid(width, height);

      return {
        gameId: generateGameId(),
        status: 'playing',
        turn: 'player',
        moveCount: 0,
        grid,
        width,
        height,
        start: null,
        goal: null,
        algorithm: 'astar',
        pathFound: null,
        pathLength: 0,
        pathCost: 0,
        nodesExpanded: 0,
        path: [],
        difficulty,
        levelIndex: 0,
        totalLevels: TOTAL_LEVELS,
        parCost: 0,
        parNodes: 0,
        levelName: 'Sandbox',
        mode: 'sandbox',
      };
    },

    validateState(state: unknown): state is PathfindingState {
      if (!state || typeof state !== 'object') return false;
      const s = state as PathfindingState;
      return (
        typeof s.gameId === 'string' &&
        Array.isArray(s.grid) &&
        typeof s.width === 'number' &&
        typeof s.height === 'number'
      );
    },

    getLegalMoves(state: PathfindingState): PathfindingMove[] {
      const moves: PathfindingMove[] = [];

      // Level management (in challenge mode)
      for (let i = 1; i <= TOTAL_LEVELS; i++) {
        moves.push({ action: 'load_level', level: i });
      }
      if (state.mode === 'challenge' && state.levelIndex < TOTAL_LEVELS && state.pathFound) {
        moves.push({ action: 'next_level' });
      }

      // Cell placement moves (sandbox mode only)
      if (state.mode === 'sandbox') {
        for (let row = 0; row < state.height; row++) {
          for (let col = 0; col < state.width; col++) {
            moves.push({ action: 'set_cell', row, col, cellType: 'wall' });
            moves.push({ action: 'set_cell', row, col, cellType: 'mud' });
            moves.push({ action: 'set_cell', row, col, cellType: 'water' });
            moves.push({ action: 'set_cell', row, col, cellType: 'empty' });
          }
        }

        // Start and goal placement
        if (!state.start) {
          moves.push({ action: 'set_start', row: 0, col: 0 });
        }
        if (!state.goal) {
          moves.push({ action: 'set_goal', row: state.height - 1, col: state.width - 1 });
        }
      }

      // Find path (both modes)
      if (state.start && state.goal) {
        moves.push({ action: 'find_path', algorithm: 'bfs' });
        moves.push({ action: 'find_path', algorithm: 'dijkstra' });
        moves.push({ action: 'find_path', algorithm: 'astar' });
      }

      // Utility
      moves.push({ action: 'clear' });
      moves.push({ action: 'generate_maze' });

      return moves;
    },

    isLegalMove(state: PathfindingState, move: PathfindingMove): boolean {
      if (move.action === 'set_cell' || move.action === 'set_start' || move.action === 'set_goal') {
        const { row, col } = move;
        return row !== undefined && col !== undefined &&
               row >= 0 && row < state.height &&
               col >= 0 && col < state.width;
      }
      if (move.action === 'find_path') {
        return state.start !== null && state.goal !== null;
      }
      return true;
    },

    makeMove(state: PathfindingState, move: PathfindingMove): MoveResult<PathfindingState> {
      const newState = { ...state, grid: cloneGrid(state.grid), moveCount: state.moveCount + 1 };

      switch (move.action) {
        case 'set_cell': {
          const { row, col, cellType } = move;
          if (row === undefined || col === undefined || !cellType) {
            return { state, valid: false, error: 'Missing row, col, or cellType' };
          }
          if (row < 0 || row >= state.height || col < 0 || col >= state.width) {
            return { state, valid: false, error: 'Position out of bounds' };
          }
          newState.grid[row][col].type = cellType;
          // Clear path visualization
          newState.pathFound = null;
          newState.path = [];
          return { state: newState, valid: true };
        }

        case 'set_start': {
          const { row, col } = move;
          if (row === undefined || col === undefined) {
            return { state, valid: false, error: 'Missing row or col' };
          }
          // Clear old start
          if (state.start) {
            newState.grid[state.start.row][state.start.col].type = 'empty';
          }
          newState.grid[row][col].type = 'start';
          newState.start = { row, col };
          newState.pathFound = null;
          newState.path = [];
          return { state: newState, valid: true };
        }

        case 'set_goal': {
          const { row, col } = move;
          if (row === undefined || col === undefined) {
            return { state, valid: false, error: 'Missing row or col' };
          }
          // Clear old goal
          if (state.goal) {
            newState.grid[state.goal.row][state.goal.col].type = 'empty';
          }
          newState.grid[row][col].type = 'goal';
          newState.goal = { row, col };
          newState.pathFound = null;
          newState.path = [];
          return { state: newState, valid: true };
        }

        case 'find_path': {
          if (!state.start || !state.goal) {
            return { state, valid: false, error: 'Set start and goal first' };
          }

          const algorithm = move.algorithm ?? state.algorithm;
          newState.algorithm = algorithm;

          // Clear previous path visualization
          for (let r = 0; r < state.height; r++) {
            for (let c = 0; c < state.width; c++) {
              newState.grid[r][c].visited = false;
              newState.grid[r][c].inPath = false;
            }
          }

          let result: { path: Position[]; nodesExpanded: number; totalCost?: number };

          switch (algorithm) {
            case 'bfs':
              result = runBFS(newState);
              break;
            case 'dijkstra':
              result = runDijkstra(newState);
              break;
            case 'astar':
              result = runAStar(newState);
              break;
            default:
              return { state, valid: false, error: 'Unknown algorithm' };
          }

          newState.pathFound = result.path.length > 0;
          newState.pathLength = result.path.length;
          newState.pathCost = result.totalCost ?? result.path.length;
          newState.nodesExpanded = result.nodesExpanded;
          newState.path = result.path;

          // Mark path on grid
          for (const pos of result.path) {
            newState.grid[pos.row][pos.col].inPath = true;
          }

          if (newState.pathFound) {
            newState.status = 'won';
            return {
              state: newState,
              valid: true,
              result: this.getResult(newState) ?? undefined,
            };
          }

          return { state: newState, valid: true };
        }

        case 'clear': {
          const grid = createEmptyGrid(state.width, state.height);
          return {
            state: {
              ...newState,
              grid,
              start: null,
              goal: null,
              pathFound: null,
              pathLength: 0,
              pathCost: 0,
              nodesExpanded: 0,
              path: [],
            },
            valid: true,
          };
        }

        case 'generate_maze': {
          const { grid, start, goal } = generateMaze(state.width, state.height);
          return {
            state: {
              ...newState,
              grid,
              start,
              goal,
              pathFound: null,
              pathLength: 0,
              pathCost: 0,
              nodesExpanded: 0,
              path: [],
              mode: 'sandbox',
              levelIndex: 0,
              levelName: 'Random Maze',
              parCost: 0,
              parNodes: 0,
            },
            valid: true,
          };
        }

        case 'load_level': {
          const levelNum = move.level ?? 1;
          if (levelNum < 1 || levelNum > TOTAL_LEVELS) {
            return { state, valid: false, error: `Level must be 1-${TOTAL_LEVELS}` };
          }
          const level = PATHFINDING_LEVELS[levelNum - 1];
          const { grid, start, goal } = parseLevel(level);
          return {
            state: {
              ...newState,
              grid,
              width: level.width,
              height: grid.length,
              start,
              goal,
              pathFound: null,
              pathLength: 0,
              pathCost: 0,
              nodesExpanded: 0,
              path: [],
              difficulty: level.difficulty,
              levelIndex: levelNum,
              levelName: level.name,
              parCost: level.parCost,
              parNodes: level.parNodes,
              mode: 'challenge',
              status: 'playing',
            },
            valid: true,
          };
        }

        case 'next_level': {
          if (state.mode !== 'challenge') {
            return { state, valid: false, error: 'Not in challenge mode' };
          }
          const nextLevel = state.levelIndex + 1;
          if (nextLevel > TOTAL_LEVELS) {
            return { state, valid: false, error: 'No more levels - you completed all challenges!' };
          }
          const level = PATHFINDING_LEVELS[nextLevel - 1];
          const { grid, start, goal } = parseLevel(level);
          return {
            state: {
              ...newState,
              grid,
              width: level.width,
              height: grid.length,
              start,
              goal,
              pathFound: null,
              pathLength: 0,
              pathCost: 0,
              nodesExpanded: 0,
              path: [],
              difficulty: level.difficulty,
              levelIndex: nextLevel,
              levelName: level.name,
              parCost: level.parCost,
              parNodes: level.parNodes,
              mode: 'challenge',
              status: 'playing',
            },
            valid: true,
          };
        }

        default:
          return { state, valid: false, error: 'Unknown action' };
      }
    },

    getAIMove(): PathfindingMove | null {
      return null; // Single-player
    },

    isGameOver(state: PathfindingState): boolean {
      return state.status === 'won';
    },

    getResult(state: PathfindingState): GameResult | null {
      if (!state.pathFound) return null;

      let score: number;
      let stars = 0;

      if (state.mode === 'challenge' && state.parCost > 0) {
        // Challenge mode: score based on par
        const costRatio = state.parCost / state.pathCost;
        const nodesRatio = state.parNodes / Math.max(state.nodesExpanded, 1);

        // Stars based on performance
        if (state.pathCost <= state.parCost && state.nodesExpanded <= state.parNodes) {
          stars = 3; // Perfect: at or under par on both
        } else if (state.pathCost <= state.parCost * 1.2) {
          stars = 2; // Good: within 20% of par cost
        } else {
          stars = 1; // Completed
        }

        // Score: base 100 * stars, bonus for efficiency
        score = stars * 100;
        if (costRatio >= 1) score += Math.round((costRatio - 1) * 50);
        if (nodesRatio >= 1) score += Math.round((nodesRatio - 1) * 25);
      } else {
        // Sandbox mode: score based on efficiency
        const optimalLength = state.start && state.goal
          ? manhattan(state.start, state.goal)
          : state.pathLength;

        const lengthEfficiency = optimalLength / state.pathLength;
        const expansionPenalty = Math.max(0, 1 - (state.nodesExpanded / (state.width * state.height)));
        score = Math.round((lengthEfficiency * 0.7 + expansionPenalty * 0.3) * 100);
        stars = score >= 80 ? 3 : score >= 50 ? 2 : 1;
      }

      return {
        status: 'won',
        score,
        totalMoves: state.moveCount,
        metadata: {
          algorithm: state.algorithm,
          pathLength: state.pathLength,
          pathCost: state.pathCost,
          nodesExpanded: state.nodesExpanded,
          gridSize: `${state.width}x${state.height}`,
          level: state.levelIndex,
          levelName: state.levelName,
          parCost: state.parCost,
          parNodes: state.parNodes,
          stars,
          mode: state.mode,
        },
      };
    },

    serialize(state: PathfindingState): string {
      return JSON.stringify(state);
    },

    deserialize(data: string): PathfindingState {
      const parsed = JSON.parse(data);
      if (!this.validateState(parsed)) {
        throw new Error('Invalid pathfinding state data');
      }
      return parsed;
    },

    renderText(state: PathfindingState): string {
      let text = '';

      // Level header for challenge mode
      if (state.mode === 'challenge' && state.levelIndex > 0) {
        const level = PATHFINDING_LEVELS[state.levelIndex - 1];
        text += `═══ Level ${state.levelIndex}/${TOTAL_LEVELS}: ${state.levelName} ═══\n`;
        text += `${level.description}\n`;
        text += `Par: Cost ≤${state.parCost}, Nodes ≤${state.parNodes}\n\n`;
      } else {
        text += `═══ Sandbox Mode ═══\n\n`;
      }

      text += formatGrid(state);
      text += '\n\n';
      text += `Legend: · empty  █ wall  ~ mud(5)  ≋ water(10)  S start  G goal  ★ path\n`;
      text += `Algorithm: ${state.algorithm.toUpperCase()}\n`;

      if (state.pathFound !== null) {
        if (state.pathFound) {
          text += `\n✓ Path found! Length: ${state.pathLength}, Cost: ${state.pathCost}, Nodes: ${state.nodesExpanded}`;

          if (state.mode === 'challenge' && state.parCost > 0) {
            const costOk = state.pathCost <= state.parCost;
            const nodesOk = state.nodesExpanded <= state.parNodes;
            if (costOk && nodesOk) {
              text += `\n⭐⭐⭐ PERFECT! Under par on both metrics!`;
            } else if (costOk) {
              text += `\n⭐⭐ Good! Cost at par, but ${state.nodesExpanded - state.parNodes} extra nodes expanded`;
            } else {
              text += `\n⭐ Completed! Cost ${state.pathCost - state.parCost} over par`;
            }

            if (state.levelIndex < TOTAL_LEVELS) {
              text += `\n\nUse 'next_level' to continue!`;
            } else {
              text += `\n\n🎉 Congratulations! All levels completed!`;
            }
          }
        } else {
          text += `\n✗ No path found. Nodes expanded: ${state.nodesExpanded}`;
        }
      } else {
        if (state.mode === 'challenge') {
          text += '\nUse find_path to solve the level!';
        } else {
          text += '\nSet start (S), goal (G), add obstacles, then run find_path';
        }
      }

      text += `\n\nTools: find_path [bfs|dijkstra|astar], load_level N, next_level, generate_maze, clear`;

      return text;
    },

    renderJSON(state: PathfindingState): GameStateJSON {
      return {
        gameType: 'pathfinding',
        gameId: state.gameId,
        status: state.status,
        turn: state.turn,
        moveCount: state.moveCount,
        legalMoves: state.mode === 'sandbox'
          ? ['set_cell', 'set_start', 'set_goal', 'find_path', 'clear', 'generate_maze', 'load_level']
          : ['find_path', 'load_level', 'next_level'],
        board: {
          grid: state.grid.map(row => row.map(c => c.type)),
          width: state.width,
          height: state.height,
          start: state.start,
          goal: state.goal,
        },
        extra: {
          mode: state.mode,
          levelIndex: state.levelIndex,
          totalLevels: state.totalLevels,
          levelName: state.levelName,
          parCost: state.parCost,
          parNodes: state.parNodes,
          algorithm: state.algorithm,
          pathFound: state.pathFound,
          pathLength: state.pathLength,
          pathCost: state.pathCost,
          nodesExpanded: state.nodesExpanded,
          path: state.path,
        },
      };
    },

    formatMove(move: PathfindingMove): string {
      switch (move.action) {
        case 'set_cell':
          return `set_cell ${move.row},${move.col} ${move.cellType}`;
        case 'set_start':
          return `set_start ${move.row},${move.col}`;
        case 'set_goal':
          return `set_goal ${move.row},${move.col}`;
        case 'find_path':
          return `find_path ${move.algorithm ?? 'astar'}`;
        default:
          return move.action;
      }
    },

    parseMove(input: string): PathfindingMove | null {
      const parts = input.trim().toLowerCase().split(/\s+/);

      switch (parts[0]) {
        case 'set_cell': {
          const coords = parts[1]?.split(',');
          if (!coords || coords.length !== 2) return null;
          const cellType = parts[2] as CellType;
          if (!['empty', 'wall', 'mud', 'water'].includes(cellType)) return null;
          return {
            action: 'set_cell',
            row: parseInt(coords[0], 10),
            col: parseInt(coords[1], 10),
            cellType,
          };
        }
        case 'set_start': {
          const coords = parts[1]?.split(',');
          if (!coords || coords.length !== 2) return null;
          return {
            action: 'set_start',
            row: parseInt(coords[0], 10),
            col: parseInt(coords[1], 10),
          };
        }
        case 'set_goal': {
          const coords = parts[1]?.split(',');
          if (!coords || coords.length !== 2) return null;
          return {
            action: 'set_goal',
            row: parseInt(coords[0], 10),
            col: parseInt(coords[1], 10),
          };
        }
        case 'find_path':
          return {
            action: 'find_path',
            algorithm: (parts[1] as Algorithm) ?? 'astar',
          };
        case 'clear':
          return { action: 'clear' };
        case 'generate_maze':
        case 'maze':
          return { action: 'generate_maze' };
        case 'load_level':
        case 'level': {
          const levelNum = parseInt(parts[1], 10);
          if (isNaN(levelNum)) return null;
          return { action: 'load_level', level: levelNum };
        }
        case 'next_level':
        case 'next':
          return { action: 'next_level' };
        default:
          return null;
      }
    },
  };
}

// =============================================================================
// Export
// =============================================================================

export const pathfindingEngine = createPathfindingEngine();
