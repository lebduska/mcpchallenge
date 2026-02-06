/**
 * Sokoban Game Engine
 *
 * Classic box-pushing puzzle game
 * Push all boxes to goal positions to win
 */

import {
  generateGameId,
  type GameEngine,
  type GameState,
  type GameResult,
  type MoveResult,
  type GameStateJSON,
} from '../types';

// =============================================================================
// Types
// =============================================================================

export type CellType = 'floor' | 'wall' | 'goal';
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
  row: number;
  col: number;
}

export interface SokobanState extends GameState {
  /** Static board (floor, walls, goals) */
  board: CellType[][];
  /** Player position */
  player: Position;
  /** Box positions */
  boxes: Position[];
  /** Goal positions */
  goals: Position[];
  /** Board dimensions */
  rows: number;
  cols: number;
  /** Current level index */
  levelIndex: number;
  /** Total levels available */
  totalLevels: number;
  /** Number of pushes (moves that pushed a box) */
  pushCount: number;
}

export interface SokobanMove {
  direction: Direction;
}

export interface SokobanOptions {
  levelIndex?: number;
}

// =============================================================================
// Level Data (60 DOS Levels)
// =============================================================================

// Level format from begoon/sokoban-maps:
// X = wall, * = box, . = goal, @ = player, & = goal (alternate), space = floor

const LEVEL_DATA = `
; Level 1
    XXXXX
    X   X
    X*  X
  XXX  *XXX
  X  *  * X
XXX X XXX X     XXXXXX
X   X XXX XXXXXXX  ..X
X *  *             ..X
XXXXX XXXX X@XXXX  ..X
    X      XXX  XXXXXX
    XXXXXXXX

; Level 2
XXXXXXXXXXXX
X..  X     XXX
X..  X *  *  X
X..  X*XXXX  X
X..    @ XX  X
X..  X X  * XX
XXXXXX XX* * X
  X *  * * * X
  X    X     X
  XXXXXXXXXXXX

; Level 3
        XXXXXXXX
        X     @X
        X *X* XX
        X *  *X
        XX* * X
XXXXXXXXX * X XXX
X....  XX *  *  X
XX...    *  *   X
X....  XXXXXXXXXX
XXXXXXXX

; Level 4
              XXXXXXXX
              X  ....X
   XXXXXXXXXXXX  ....X
   X    X  * *   ....X
   X ***X*  * X  ....X
   X  *     * X  ....X
   X ** X* * *XXXXXXXX
XXXX  * X     X
X   X XXXXXXXXX
X    *  XX
X **X** @X
X   X   XX
XXXXXXXXX

; Level 5
        XXXXX
        X   XXXXX
        X X*XX  X
        X     * X
XXXXXXXXX XXX   X
X....  XX *  *XXX
X....    * ** XX
X....  XX*  * @X
XXXXXXXXX  *  XX
        X * *  X
        XXX XX X
          X    X
          XXXXXX

; Level 6
XXXXXX  XXX
X..  X XX@XX
X..  XXX   X
X..     ** X
X..  X X * X
X..XXX X * X
XXXX * X*  X
   X  *X * X
   X *  *  X
   X  XX   X
   XXXXXXXXX

; Level 7
       XXXXX
 XXXXXXX   XX
XX X @XX ** X
X    *      X
X  *  XXX   X
XXX XXXX*XXXX
X *  XXX ..X
X * * * ...X
X    XXX...X
XXXXXX XXXXX

; Level 8
  XXXX
  X  XXXXXXXXX
  X    *  *  X
  X * X  X * X
  X  *XXX*  @X
XXX*XXX  X XXX
X  *  X  X  X
X    *X  *  X
XXXX  X  *  X
   XXXX XXX X
  X....X X  X
  X....X    X
  XXXXXXXXX X
          XXX

; Level 9
          XXXXX
          X   XX
          X *  X
  XXXXXXX X*   X
XXX     XXX  * X
X  * XXX  * ** X
X  @*       XXXX
XXXXXX XXX* X
     X     *X
     XXX X  X
   X...XXX  X
   X...    XX
   X... XXXX
   XXXXX

; Level 10
     XXXXXXX
     X  ...X
    XX  ...X
   XX  X...X
   X  X X..X
XXXX* X XX.X
X   * X XXXX
X  ** X*   X
XXX    *  @X
  XXXXX * XX
      X  XX
      XXXX
`.trim();

// Parse level string into structured data
function parseLevel(levelStr: string): {
  board: CellType[][];
  player: Position;
  boxes: Position[];
  goals: Position[];
  rows: number;
  cols: number;
} | null {
  const lines = levelStr.split('\n').filter(line => !line.startsWith(';') && line.trim());
  if (lines.length === 0) return null;

  const rows = lines.length;
  const cols = Math.max(...lines.map(l => l.length));

  const board: CellType[][] = [];
  let player: Position = { row: 0, col: 0 };
  const boxes: Position[] = [];
  const goals: Position[] = [];

  for (let r = 0; r < rows; r++) {
    const row: CellType[] = [];
    const line = lines[r].padEnd(cols, ' ');

    for (let c = 0; c < cols; c++) {
      const char = line[c];

      switch (char) {
        case 'X':
          row.push('wall');
          break;
        case '.':
        case '&':
          row.push('goal');
          goals.push({ row: r, col: c });
          break;
        case '*':
          row.push('floor');
          boxes.push({ row: r, col: c });
          break;
        case '@':
          row.push('floor');
          player = { row: r, col: c };
          break;
        case '+': // Player on goal
          row.push('goal');
          goals.push({ row: r, col: c });
          player = { row: r, col: c };
          break;
        case '$': // Alternative box symbol
          row.push('floor');
          boxes.push({ row: r, col: c });
          break;
        default:
          row.push('floor');
      }
    }
    board.push(row);
  }

  return { board, player, boxes, goals, rows, cols };
}

// Parse all levels
function parseLevels(): Array<ReturnType<typeof parseLevel>> {
  const levelStrings = LEVEL_DATA.split(/\n\n+/);
  return levelStrings.map(parseLevel).filter((l): l is NonNullable<typeof l> => l !== null);
}

const LEVELS = parseLevels();

// =============================================================================
// Helper Functions
// =============================================================================

function posEquals(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

function posInList(pos: Position, list: Position[]): boolean {
  return list.some(p => posEquals(p, pos));
}

function getDirection(dir: Direction): Position {
  switch (dir) {
    case 'up': return { row: -1, col: 0 };
    case 'down': return { row: 1, col: 0 };
    case 'left': return { row: 0, col: -1 };
    case 'right': return { row: 0, col: 1 };
  }
}

function addPos(a: Position, b: Position): Position {
  return { row: a.row + b.row, col: a.col + b.col };
}

function isWall(board: CellType[][], pos: Position): boolean {
  if (pos.row < 0 || pos.row >= board.length) return true;
  if (pos.col < 0 || pos.col >= board[0].length) return true;
  return board[pos.row][pos.col] === 'wall';
}

function checkWin(boxes: Position[], goals: Position[]): boolean {
  if (boxes.length !== goals.length) return false;
  return boxes.every(box => posInList(box, goals));
}

// =============================================================================
// Sokoban Engine Implementation
// =============================================================================

function createSokobanEngine(): GameEngine<SokobanState, SokobanMove, SokobanOptions> {
  return {
    metadata: {
      id: 'sokoban',
      name: 'Sokoban',
      description: 'Classic box-pushing puzzle from DOS era',
      difficulty: 'hard',
      points: 150,
      transport: 'sse',
      minPlayers: 1,
      maxPlayers: 1,
    },

    newGame(options = {}): SokobanState {
      const levelIndex = Math.min(options.levelIndex ?? 0, LEVELS.length - 1);
      const level = LEVELS[levelIndex];

      if (!level) {
        throw new Error(`Level ${levelIndex} not found`);
      }

      return {
        gameId: generateGameId(),
        status: 'playing',
        turn: 'player',
        moveCount: 0,
        board: level.board.map(row => [...row]),
        player: { ...level.player },
        boxes: level.boxes.map(b => ({ ...b })),
        goals: level.goals.map(g => ({ ...g })),
        rows: level.rows,
        cols: level.cols,
        levelIndex,
        totalLevels: LEVELS.length,
        pushCount: 0,
      };
    },

    validateState(state: unknown): state is SokobanState {
      if (!state || typeof state !== 'object') return false;
      const s = state as SokobanState;
      return (
        typeof s.gameId === 'string' &&
        Array.isArray(s.board) &&
        typeof s.player === 'object' &&
        Array.isArray(s.boxes) &&
        Array.isArray(s.goals)
      );
    },

    getLegalMoves(state: SokobanState): SokobanMove[] {
      const moves: SokobanMove[] = [];
      const directions: Direction[] = ['up', 'down', 'left', 'right'];

      for (const direction of directions) {
        const delta = getDirection(direction);
        const newPos = addPos(state.player, delta);

        // Check if blocked by wall
        if (isWall(state.board, newPos)) continue;

        // Check if pushing a box
        if (posInList(newPos, state.boxes)) {
          const boxNewPos = addPos(newPos, delta);
          // Can't push if wall or another box behind
          if (isWall(state.board, boxNewPos)) continue;
          if (posInList(boxNewPos, state.boxes)) continue;
        }

        moves.push({ direction });
      }

      return moves;
    },

    isLegalMove(state: SokobanState, move: SokobanMove): boolean {
      return this.getLegalMoves(state).some(m => m.direction === move.direction);
    },

    makeMove(state: SokobanState, move: SokobanMove): MoveResult<SokobanState> {
      if (!this.isLegalMove(state, move)) {
        return {
          state,
          valid: false,
          error: `Cannot move ${move.direction}`,
        };
      }

      const delta = getDirection(move.direction);
      const newPlayerPos = addPos(state.player, delta);
      const newBoxes = state.boxes.map(b => ({ ...b }));
      let pushed = false;

      // Check if pushing a box
      const boxIndex = newBoxes.findIndex(b => posEquals(b, newPlayerPos));
      if (boxIndex !== -1) {
        const boxNewPos = addPos(newPlayerPos, delta);
        newBoxes[boxIndex] = boxNewPos;
        pushed = true;
      }

      const won = checkWin(newBoxes, state.goals);

      const newState: SokobanState = {
        ...state,
        player: newPlayerPos,
        boxes: newBoxes,
        moveCount: state.moveCount + 1,
        pushCount: state.pushCount + (pushed ? 1 : 0),
        status: won ? 'won' : 'playing',
        lastMoveAt: Date.now(),
      };

      if (won) {
        return {
          state: newState,
          valid: true,
          result: this.getResult(newState) ?? undefined,
        };
      }

      return { state: newState, valid: true };
    },

    getAIMove(): SokobanMove | null {
      return null; // Single player game
    },

    isGameOver(state: SokobanState): boolean {
      return state.status === 'won';
    },

    getResult(state: SokobanState): GameResult | null {
      if (state.status !== 'won') return null;

      return {
        status: 'won',
        totalMoves: state.moveCount,
        metadata: {
          levelIndex: state.levelIndex,
          pushCount: state.pushCount,
          boxCount: state.boxes.length,
        },
      };
    },

    serialize(state: SokobanState): string {
      return JSON.stringify(state);
    },

    deserialize(data: string): SokobanState {
      const parsed = JSON.parse(data);
      if (!this.validateState(parsed)) {
        throw new Error('Invalid sokoban state data');
      }
      return parsed;
    },

    renderText(state: SokobanState): string {
      const { board, player, boxes, goals, rows, cols } = state;
      const lines: string[] = [];

      lines.push(`Level ${state.levelIndex + 1}/${state.totalLevels}`);
      lines.push('');

      for (let r = 0; r < rows; r++) {
        let line = '';
        for (let c = 0; c < cols; c++) {
          const pos = { row: r, col: c };
          const isPlayer = posEquals(pos, player);
          const isBox = posInList(pos, boxes);
          const isGoal = posInList(pos, goals);
          const cell = board[r][c];

          if (isPlayer && isGoal) {
            line += '+'; // Player on goal
          } else if (isPlayer) {
            line += '@';
          } else if (isBox && isGoal) {
            line += '*'; // Box on goal
          } else if (isBox) {
            line += '$';
          } else if (isGoal) {
            line += '.';
          } else if (cell === 'wall') {
            line += '#';
          } else {
            line += ' ';
          }
        }
        lines.push(line);
      }

      lines.push('');
      lines.push(`Moves: ${state.moveCount} | Pushes: ${state.pushCount}`);
      lines.push(`Boxes on goals: ${boxes.filter(b => posInList(b, goals)).length}/${goals.length}`);

      if (state.status === 'won') {
        lines.push('');
        lines.push('🎉 Level Complete!');
      }

      return lines.join('\n');
    },

    renderJSON(state: SokobanState): GameStateJSON {
      const { board, player, boxes, goals, rows, cols } = state;

      // Create visual board representation
      const visualBoard: string[][] = [];
      for (let r = 0; r < rows; r++) {
        const row: string[] = [];
        for (let c = 0; c < cols; c++) {
          const pos = { row: r, col: c };
          const isPlayer = posEquals(pos, player);
          const isBox = posInList(pos, boxes);
          const isGoal = posInList(pos, goals);
          const cell = board[r][c];

          if (isPlayer && isGoal) {
            row.push('player_on_goal');
          } else if (isPlayer) {
            row.push('player');
          } else if (isBox && isGoal) {
            row.push('box_on_goal');
          } else if (isBox) {
            row.push('box');
          } else if (isGoal) {
            row.push('goal');
          } else if (cell === 'wall') {
            row.push('wall');
          } else {
            row.push('floor');
          }
        }
        visualBoard.push(row);
      }

      return {
        gameType: 'sokoban',
        gameId: state.gameId,
        status: state.status,
        turn: state.turn,
        moveCount: state.moveCount,
        legalMoves: this.getLegalMoves(state).map(m => m.direction),
        board: {
          cells: visualBoard,
          rows,
          cols,
        },
        extra: {
          levelIndex: state.levelIndex,
          totalLevels: state.totalLevels,
          pushCount: state.pushCount,
          boxesOnGoals: boxes.filter(b => posInList(b, goals)).length,
          totalBoxes: boxes.length,
          player: state.player,
        },
      };
    },

    formatMove(move: SokobanMove): string {
      return move.direction;
    },

    parseMove(input: string): SokobanMove | null {
      const dir = input.trim().toLowerCase();
      const dirMap: Record<string, Direction> = {
        'up': 'up', 'u': 'up', 'w': 'up',
        'down': 'down', 'd': 'down', 's': 'down',
        'left': 'left', 'l': 'left', 'a': 'left',
        'right': 'right', 'r': 'right',
      };

      if (dir in dirMap) {
        return { direction: dirMap[dir] };
      }
      return null;
    },
  };
}

// =============================================================================
// Export
// =============================================================================

export const sokobanEngine = createSokobanEngine();
export const SOKOBAN_LEVELS = LEVELS;
export const TOTAL_LEVELS = LEVELS.length;
