/**
 * Snake Game Engine
 *
 * Classic snake game with look-ahead vision
 * Grid: 15x15 by default, snake starts in center
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

export type Direction = 'up' | 'down' | 'left' | 'right';
export type Cell = 'empty' | 'food' | 'wall' | 'body' | 'head';

export interface Position {
  x: number;
  y: number;
}

export interface SnakeState extends GameState {
  /** Snake body positions (head is index 0) */
  snake: Position[];
  /** Food position */
  food: Position;
  /** Current direction */
  direction: Direction;
  /** Grid size (square grid) */
  gridSize: number;
  /** Is game over */
  gameOver: boolean;
}

export interface SnakeMove {
  /** Direction to move */
  direction: Direction;
}

export interface SnakeOptions {
  /** Grid size (default: 15) */
  gridSize?: number;
  /** Initial snake length (default: 3) */
  initialLength?: number;
}

export interface Vision {
  up: Cell;
  down: Cell;
  left: Cell;
  right: Cell;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_GRID_SIZE = 15;
const DEFAULT_INITIAL_LENGTH = 3;

const OPPOSITES: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const DIRECTION_VECTORS: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

// =============================================================================
// Helper Functions
// =============================================================================

function positionsEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

function randomPosition(gridSize: number, exclude: Position[]): Position {
  const maxAttempts = gridSize * gridSize;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const pos: Position = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize),
    };
    if (!exclude.some(p => positionsEqual(p, pos))) {
      return pos;
    }
    attempts++;
  }

  // Fallback: find first empty cell
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const pos = { x, y };
      if (!exclude.some(p => positionsEqual(p, pos))) {
        return pos;
      }
    }
  }

  // This should never happen in a normal game
  return { x: 0, y: 0 };
}

function createInitialSnake(gridSize: number, length: number): Position[] {
  const centerX = Math.floor(gridSize / 2);
  const centerY = Math.floor(gridSize / 2);

  const snake: Position[] = [];
  for (let i = 0; i < length; i++) {
    snake.push({ x: centerX - i, y: centerY });
  }

  return snake;
}

function lookAt(pos: Position, state: SnakeState): Cell {
  const { gridSize, snake, food } = state;

  // Wall check
  if (pos.x < 0 || pos.x >= gridSize || pos.y < 0 || pos.y >= gridSize) {
    return 'wall';
  }

  // Head check
  if (positionsEqual(pos, snake[0])) {
    return 'head';
  }

  // Body check (excluding head)
  if (snake.slice(1).some(p => positionsEqual(p, pos))) {
    return 'body';
  }

  // Food check
  if (positionsEqual(pos, food)) {
    return 'food';
  }

  return 'empty';
}

function getVision(state: SnakeState): Vision {
  const head = state.snake[0];
  return {
    up: lookAt({ x: head.x, y: head.y - 1 }, state),
    down: lookAt({ x: head.x, y: head.y + 1 }, state),
    left: lookAt({ x: head.x - 1, y: head.y }, state),
    right: lookAt({ x: head.x + 1, y: head.y }, state),
  };
}

function renderBoard(state: SnakeState): string {
  const { gridSize, snake, food } = state;
  const lines: string[] = [];

  // Top border
  lines.push('+' + '-'.repeat(gridSize * 2 + 1) + '+');

  for (let y = 0; y < gridSize; y++) {
    let row = '|';
    for (let x = 0; x < gridSize; x++) {
      const pos = { x, y };
      const isHead = positionsEqual(snake[0], pos);
      const isBody = snake.slice(1).some(p => positionsEqual(p, pos));
      const isFood = positionsEqual(food, pos);

      if (isHead) {
        row += ' O';
      } else if (isBody) {
        row += ' o';
      } else if (isFood) {
        row += ' *';
      } else {
        row += ' .';
      }
    }
    row += ' |';
    lines.push(row);
  }

  // Bottom border
  lines.push('+' + '-'.repeat(gridSize * 2 + 1) + '+');

  return lines.join('\n');
}

// =============================================================================
// Snake Engine Implementation
// =============================================================================

function createSnakeEngine(): GameEngine<SnakeState, SnakeMove, SnakeOptions> {
  return {
    // -------------------------------------------------------------------------
    // Metadata
    // -------------------------------------------------------------------------
    metadata: {
      id: 'snake',
      name: 'Snake',
      description: 'Classic snake game - eat food, grow longer, avoid walls and yourself',
      difficulty: 'medium',
      points: 50,
      transport: 'websocket',
      minPlayers: 1,
      maxPlayers: 1,
    },

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------
    newGame(options = {}): SnakeState {
      const {
        gridSize = DEFAULT_GRID_SIZE,
        initialLength = DEFAULT_INITIAL_LENGTH,
      } = options;

      const snake = createInitialSnake(gridSize, initialLength);
      const food = randomPosition(gridSize, snake);

      return {
        gameId: generateGameId(),
        status: 'playing',
        turn: 'player',
        moveCount: 0,
        score: 0,
        snake,
        food,
        direction: 'right',
        gridSize,
        gameOver: false,
      };
    },

    validateState(state: unknown): state is SnakeState {
      if (!state || typeof state !== 'object') return false;
      const s = state as SnakeState;
      return (
        typeof s.gameId === 'string' &&
        Array.isArray(s.snake) &&
        s.snake.length > 0 &&
        typeof s.food === 'object' &&
        typeof s.gridSize === 'number' &&
        ['up', 'down', 'left', 'right'].includes(s.direction)
      );
    },

    // -------------------------------------------------------------------------
    // Game Logic
    // -------------------------------------------------------------------------
    getLegalMoves(state: SnakeState): SnakeMove[] {
      if (state.gameOver) return [];

      const moves: SnakeMove[] = [];
      const opposite = OPPOSITES[state.direction];

      for (const dir of ['up', 'down', 'left', 'right'] as Direction[]) {
        // Can't go in opposite direction (180 degree turn)
        if (dir !== opposite) {
          moves.push({ direction: dir });
        }
      }

      return moves;
    },

    isLegalMove(state: SnakeState, move: SnakeMove): boolean {
      if (state.gameOver) return false;

      const { direction } = move;
      if (!['up', 'down', 'left', 'right'].includes(direction)) {
        return false;
      }

      // Can't go in opposite direction
      return direction !== OPPOSITES[state.direction];
    },

    makeMove(state: SnakeState, move: SnakeMove): MoveResult<SnakeState> {
      const { direction } = move;

      // Validate direction
      if (!['up', 'down', 'left', 'right'].includes(direction)) {
        return {
          state,
          valid: false,
          error: 'Invalid direction. Use: up, down, left, right',
        };
      }

      // Check for 180 degree turn
      if (direction === OPPOSITES[state.direction]) {
        return {
          state,
          valid: false,
          error: 'Cannot turn 180 degrees',
        };
      }

      // Calculate new head position
      const head = state.snake[0];
      const delta = DIRECTION_VECTORS[direction];
      const newHead: Position = {
        x: head.x + delta.x,
        y: head.y + delta.y,
      };

      // Check wall collision
      if (
        newHead.x < 0 ||
        newHead.x >= state.gridSize ||
        newHead.y < 0 ||
        newHead.y >= state.gridSize
      ) {
        const finalState: SnakeState = {
          ...state,
          gameOver: true,
          status: 'lost',
          lastMoveAt: Date.now(),
        };
        return {
          state: finalState,
          valid: true,
          result: {
            status: 'lost',
            score: state.score,
            totalMoves: state.moveCount + 1,
            metadata: { reason: 'wall_collision' },
          },
        };
      }

      // Check body collision
      if (state.snake.some(p => positionsEqual(p, newHead))) {
        const finalState: SnakeState = {
          ...state,
          gameOver: true,
          status: 'lost',
          lastMoveAt: Date.now(),
        };
        return {
          state: finalState,
          valid: true,
          result: {
            status: 'lost',
            score: state.score,
            totalMoves: state.moveCount + 1,
            metadata: { reason: 'body_collision' },
          },
        };
      }

      // Move snake (add new head)
      const newSnake = [newHead, ...state.snake];
      let newScore = state.score;
      let newFood = state.food;

      // Check food collision
      if (positionsEqual(newHead, state.food)) {
        // Eat food - don't remove tail, spawn new food
        newScore = (state.score ?? 0) + 1;
        newFood = randomPosition(state.gridSize, newSnake);
      } else {
        // No food - remove tail
        newSnake.pop();
      }

      const newState: SnakeState = {
        ...state,
        snake: newSnake,
        food: newFood,
        direction,
        score: newScore,
        moveCount: state.moveCount + 1,
        lastMoveAt: Date.now(),
      };

      return {
        state: newState,
        valid: true,
      };
    },

    getAIMove(state: SnakeState, difficulty?: Difficulty): SnakeMove | null {
      if (state.gameOver) return null;

      const vision = getVision(state);
      const legalMoves = this.getLegalMoves(state);

      if (legalMoves.length === 0) return null;

      const diff = difficulty ?? 'medium';

      switch (diff) {
        case 'easy':
          // Random legal move
          return legalMoves[Math.floor(Math.random() * legalMoves.length)];

        case 'medium':
        case 'hard': {
          // Prefer food, avoid death
          const safeMoves = legalMoves.filter(m => {
            const cell = vision[m.direction];
            return cell !== 'wall' && cell !== 'body';
          });

          if (safeMoves.length === 0) {
            // No safe moves, just pick any
            return legalMoves[0];
          }

          // Look for food
          const foodMove = safeMoves.find(m => vision[m.direction] === 'food');
          if (foodMove) return foodMove;

          // Otherwise pick random safe move
          return safeMoves[Math.floor(Math.random() * safeMoves.length)];
        }
      }
    },

    isGameOver(state: SnakeState): boolean {
      return state.gameOver;
    },

    getResult(state: SnakeState): GameResult | null {
      if (!state.gameOver) return null;

      return {
        status: 'lost', // Snake can only lose
        score: state.score,
        totalMoves: state.moveCount,
      };
    },

    // -------------------------------------------------------------------------
    // Serialization
    // -------------------------------------------------------------------------
    serialize(state: SnakeState): string {
      return JSON.stringify(state);
    },

    deserialize(data: string): SnakeState {
      const parsed = JSON.parse(data);
      if (!this.validateState(parsed)) {
        throw new Error('Invalid snake state data');
      }
      return parsed;
    },

    // -------------------------------------------------------------------------
    // Rendering
    // -------------------------------------------------------------------------
    renderText(state: SnakeState): string {
      const vision = getVision(state);

      let text = renderBoard(state);
      text += `\n\nScore: ${state.score}`;
      text += `\nDirection: ${state.direction}`;
      text += `\nVision: ↑${vision.up} ↓${vision.down} ←${vision.left} →${vision.right}`;

      if (state.gameOver) {
        text += `\n\n💀 Game Over! Final score: ${state.score}`;
      }

      return text;
    },

    renderJSON(state: SnakeState): GameStateJSON {
      const vision = getVision(state);

      return {
        gameType: 'snake',
        gameId: state.gameId,
        status: state.status,
        turn: state.turn,
        moveCount: state.moveCount,
        score: state.score,
        legalMoves: this.getLegalMoves(state).map(m => m.direction),
        board: {
          gridSize: state.gridSize,
          snake: state.snake,
          food: state.food,
          ascii: renderBoard(state),
        },
        extra: {
          direction: state.direction,
          vision,
          gameOver: state.gameOver,
          snakeLength: state.snake.length,
        },
      };
    },

    formatMove(move: SnakeMove): string {
      return move.direction;
    },

    parseMove(input: string): SnakeMove | null {
      const direction = input.trim().toLowerCase() as Direction;
      if (!['up', 'down', 'left', 'right'].includes(direction)) {
        return null;
      }
      return { direction };
    },
  };
}

// =============================================================================
// Export
// =============================================================================

export const snakeEngine = createSnakeEngine();

// Export helper for external use
export { getVision };
