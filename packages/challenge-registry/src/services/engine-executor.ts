/**
 * Engine Executor
 *
 * Executes game operations on GameEngine.
 * Pure wrapper with no state management.
 */

import type {
  GameEngine,
  GameState,
  GameResult,
  MoveResult,
  SerializedState,
  Difficulty,
  Seed,
} from '../types/engine';

// =============================================================================
// Types
// =============================================================================

/**
 * Move execution result
 */
export type ExecuteMoveResult<TState extends GameState, TMove> =
  | ExecuteMoveSuccess<TState, TMove>
  | ExecuteMoveFailure;

export interface ExecuteMoveSuccess<TState extends GameState, TMove> {
  readonly ok: true;
  readonly state: TState;
  readonly move: TMove;
  readonly moveString: string;
  readonly stateBefore: SerializedState;
  readonly stateAfter: SerializedState;
  readonly gameOver: boolean;
  readonly result: GameResult | null;
}

export interface ExecuteMoveFailure {
  readonly ok: false;
  readonly error: ExecutionError;
}

export interface ExecutionError {
  readonly code: ExecutionErrorCode;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

export type ExecutionErrorCode =
  | 'INVALID_MOVE_FORMAT'
  | 'ILLEGAL_MOVE'
  | 'GAME_ALREADY_OVER'
  | 'NOT_PLAYER_TURN'
  | 'ENGINE_ERROR';

/**
 * AI move result
 */
export type AIResult<TState extends GameState, TMove> =
  | AISuccess<TState, TMove>
  | AINoMove;

export interface AISuccess<TState extends GameState, TMove> {
  readonly hasMove: true;
  readonly state: TState;
  readonly move: TMove;
  readonly moveString: string;
  readonly stateBefore: SerializedState;
  readonly stateAfter: SerializedState;
  readonly gameOver: boolean;
  readonly result: GameResult | null;
}

export interface AINoMove {
  readonly hasMove: false;
}

/**
 * Game initialization result
 */
export interface InitGameResult<TState extends GameState> {
  readonly state: TState;
  readonly serialized: SerializedState;
  readonly legalMoves: readonly string[];
}

/**
 * State info result
 */
export interface StateInfo<TState extends GameState> {
  readonly state: TState;
  readonly serialized: SerializedState;
  readonly rendered: string;
  readonly legalMoves: readonly string[];
  readonly turn: 'player' | 'opponent';
  readonly gameOver: boolean;
  readonly result: GameResult | null;
}

// =============================================================================
// Engine Executor
// =============================================================================

/**
 * Executes operations on a GameEngine
 *
 * Responsibilities:
 * - Initialize games
 * - Execute player moves
 * - Execute AI moves
 * - Query game state
 *
 * NOT responsible for:
 * - Session management
 * - Replay recording
 * - Achievement evaluation
 */
export class EngineExecutor<
  TState extends GameState,
  TMove,
  TOptions extends Record<string, unknown> = Record<string, unknown>,
  TBoard = unknown
> {
  constructor(
    private readonly engine: GameEngine<TState, TMove, TOptions, TBoard>
  ) {}

  /**
   * Initialize a new game
   */
  initGame(options?: TOptions, seed?: Seed): InitGameResult<TState> {
    const state = this.engine.newGame(options, seed);

    return {
      state,
      serialized: this.engine.serialize(state),
      legalMoves: this.formatLegalMoves(state),
    };
  }

  /**
   * Execute a player move
   */
  executeMove(
    state: TState,
    moveInput: string
  ): ExecuteMoveResult<TState, TMove> {
    // Check if game is over
    if (this.engine.isGameOver(state)) {
      return {
        ok: false,
        error: {
          code: 'GAME_ALREADY_OVER',
          message: 'Game is already over',
        },
      };
    }

    // Check turn
    if (state.turn !== 'player') {
      return {
        ok: false,
        error: {
          code: 'NOT_PLAYER_TURN',
          message: 'Not player turn',
        },
      };
    }

    // Parse move
    const move = this.engine.parseMove(moveInput, state);
    if (!move) {
      return {
        ok: false,
        error: {
          code: 'INVALID_MOVE_FORMAT',
          message: `Invalid move format: ${moveInput}`,
          details: { input: moveInput, legalMoves: this.formatLegalMoves(state) },
        },
      };
    }

    // Check legality
    if (!this.engine.isLegalMove(state, move)) {
      return {
        ok: false,
        error: {
          code: 'ILLEGAL_MOVE',
          message: `Illegal move: ${moveInput}`,
          details: { input: moveInput, legalMoves: this.formatLegalMoves(state) },
        },
      };
    }

    // Execute
    const stateBefore = this.engine.serialize(state);
    const result = this.engine.makeMove(state, move);

    if (!result.valid) {
      return {
        ok: false,
        error: {
          code: 'ENGINE_ERROR',
          message: result.error ?? 'Engine rejected the move',
        },
      };
    }

    return {
      ok: true,
      state: result.state,
      move,
      moveString: this.engine.formatMove(move),
      stateBefore,
      stateAfter: this.engine.serialize(result.state),
      gameOver: this.engine.isGameOver(result.state),
      result: result.result ?? null,
    };
  }

  /**
   * Execute AI move
   */
  executeAI(
    state: TState,
    difficulty?: Difficulty,
    seed?: Seed
  ): AIResult<TState, TMove> {
    // Get AI move
    const move = this.engine.getAIMove(state, difficulty, seed);

    if (!move) {
      return { hasMove: false };
    }

    // Execute
    const stateBefore = this.engine.serialize(state);
    const result = this.engine.makeMove(state, move);

    if (!result.valid) {
      // AI made invalid move - should never happen
      return { hasMove: false };
    }

    return {
      hasMove: true,
      state: result.state,
      move,
      moveString: this.engine.formatMove(move),
      stateBefore,
      stateAfter: this.engine.serialize(result.state),
      gameOver: this.engine.isGameOver(result.state),
      result: result.result ?? null,
    };
  }

  /**
   * Get state info
   */
  getStateInfo(state: TState): StateInfo<TState> {
    return {
      state,
      serialized: this.engine.serialize(state),
      rendered: this.engine.renderText(state),
      legalMoves: this.formatLegalMoves(state),
      turn: state.turn,
      gameOver: this.engine.isGameOver(state),
      result: this.engine.getResult(state),
    };
  }

  /**
   * Check if game is over
   */
  isGameOver(state: TState): boolean {
    return this.engine.isGameOver(state);
  }

  /**
   * Get game result
   */
  getResult(state: TState): GameResult | null {
    return this.engine.getResult(state);
  }

  /**
   * Get legal moves as strings
   */
  getLegalMoves(state: TState): readonly string[] {
    return this.formatLegalMoves(state);
  }

  /**
   * Render state as text
   */
  renderText(state: TState): string {
    return this.engine.renderText(state);
  }

  /**
   * Serialize state
   */
  serialize(state: TState): SerializedState {
    return this.engine.serialize(state);
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private formatLegalMoves(state: TState): readonly string[] {
    return this.engine.getLegalMoves(state).map((m) => this.engine.formatMove(m));
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createEngineExecutor<
  TState extends GameState,
  TMove,
  TOptions extends Record<string, unknown> = Record<string, unknown>,
  TBoard = unknown
>(
  engine: GameEngine<TState, TMove, TOptions, TBoard>
): EngineExecutor<TState, TMove, TOptions, TBoard> {
  return new EngineExecutor(engine);
}
