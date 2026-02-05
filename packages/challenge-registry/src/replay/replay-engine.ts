/**
 * Replay Engine
 *
 * Applies ReplayEvent sequences to game engines,
 * verifies determinism, and returns final GameResult.
 */

import type {
  GameEngine,
  GameState,
  GameResult,
  SerializedState,
  Seed,
  MoveResult,
} from '../types/engine';
import type {
  GameReplay,
  ReplayEvent,
  ReplayValidationResult,
  ReplayValidationError,
  ReplayErrorCode,
  EventSeq,
  GameStartEvent,
  PlayerMoveEvent,
  AIMoveEvent,
  GameEndEvent,
} from '../types/replay';
import {
  isGameStartEvent,
  isMoveEvent,
  isGameEndEvent,
  isTerminalEvent,
} from '../types/replay';

// =============================================================================
// Types
// =============================================================================

/**
 * Configuration for replay execution
 */
export interface ReplayEngineConfig {
  /** Verify state matches after each move */
  readonly verifyStates?: boolean;

  /** Verify AI moves are deterministic (requires same seed) */
  readonly verifyAIMoves?: boolean;

  /** Stop on first error */
  readonly stopOnError?: boolean;

  /** Custom state comparator */
  readonly compareStates?: (a: SerializedState, b: SerializedState) => boolean;
}

/**
 * Result of replay execution
 */
export type ReplayExecutionResult<TState extends GameState> =
  | ReplayExecutionSuccess<TState>
  | ReplayExecutionFailure<TState>;

export interface ReplayExecutionSuccess<TState extends GameState> {
  readonly success: true;
  readonly finalState: TState;
  readonly result: GameResult | null;
  readonly eventsProcessed: number;
  readonly warnings: readonly ReplayWarning[];
}

export interface ReplayExecutionFailure<TState extends GameState> {
  readonly success: false;
  readonly error: ReplayValidationError;
  readonly lastValidState: TState | null;
  readonly eventsProcessed: number;
  readonly warnings: readonly ReplayWarning[];
}

export interface ReplayWarning {
  readonly eventSeq: EventSeq;
  readonly code: string;
  readonly message: string;
}

/**
 * Step-by-step replay iterator result
 */
export interface ReplayStep<TState extends GameState, TMove> {
  readonly eventSeq: EventSeq;
  readonly event: ReplayEvent<TMove>;
  readonly stateBefore: TState;
  readonly stateAfter: TState;
  readonly moveApplied?: TMove;
}

// =============================================================================
// Replay Engine
// =============================================================================

/**
 * Replay Engine for executing and validating game replays
 */
export class ReplayEngine<
  TState extends GameState,
  TMove,
  TOptions extends Record<string, unknown> = Record<string, unknown>,
  TBoard = unknown
> {
  private readonly engine: GameEngine<TState, TMove, TOptions, TBoard>;
  private readonly config: Required<ReplayEngineConfig>;

  constructor(
    engine: GameEngine<TState, TMove, TOptions, TBoard>,
    config: ReplayEngineConfig = {}
  ) {
    this.engine = engine;
    this.config = {
      verifyStates: config.verifyStates ?? true,
      verifyAIMoves: config.verifyAIMoves ?? true,
      stopOnError: config.stopOnError ?? true,
      compareStates: config.compareStates ?? defaultStateComparator,
    };
  }

  /**
   * Execute a complete replay and return the final result
   */
  execute(replay: GameReplay<TMove>): ReplayExecutionResult<TState> {
    const warnings: ReplayWarning[] = [];
    let currentState: TState | null = null;
    let eventsProcessed = 0;

    // Find and validate start event
    const startEvent = replay.events.find(isGameStartEvent);
    if (!startEvent) {
      return this.failure(
        'MISSING_START_EVENT',
        'Replay must begin with a game_start event',
        null,
        0,
        warnings
      );
    }

    // Initialize game from start event
    try {
      currentState = this.initializeFromStart(startEvent, replay.seed);
    } catch (err) {
      return this.failure(
        'INVALID_INITIAL_STATE',
        `Failed to initialize game: ${err instanceof Error ? err.message : String(err)}`,
        null,
        0,
        warnings,
        startEvent.seq
      );
    }

    // Verify initial state matches if configured
    if (this.config.verifyStates) {
      const serialized = this.engine.serialize(currentState);
      if (!this.config.compareStates(serialized, startEvent.payload.initialState)) {
        return this.failure(
          'STATE_MISMATCH',
          'Initial state does not match expected state from replay',
          currentState,
          0,
          warnings,
          startEvent.seq,
          { expected: startEvent.payload.initialState, actual: serialized }
        );
      }
    }

    eventsProcessed = 1;

    // Process remaining events
    for (const event of replay.events) {
      // Skip start event (already processed)
      if (isGameStartEvent(event)) continue;

      const result = this.processEvent(event, currentState, replay.seed, warnings);

      if (!result.success) {
        if (this.config.stopOnError) {
          return this.failure(
            result.error.code,
            result.error.message,
            currentState,
            eventsProcessed,
            warnings,
            event.seq,
            result.error.details
          );
        }
        // Continue with warning
        warnings.push({
          eventSeq: event.seq,
          code: result.error.code,
          message: result.error.message,
        });
      } else {
        currentState = result.state;
      }

      eventsProcessed++;

      // Check for terminal event
      if (isTerminalEvent(event)) {
        break;
      }
    }

    // Get final result
    const gameResult = this.engine.getResult(currentState);

    return {
      success: true,
      finalState: currentState,
      result: gameResult,
      eventsProcessed,
      warnings,
    };
  }

  /**
   * Validate a replay without executing (faster, less thorough)
   */
  validate(replay: GameReplay<TMove>): ReplayValidationResult {
    // Quick structural validation
    if (replay.events.length === 0) {
      return this.invalidResult('MISSING_START_EVENT', 'Replay has no events');
    }

    const firstEvent = replay.events[0];
    if (!isGameStartEvent(firstEvent)) {
      return this.invalidResult(
        'MISSING_START_EVENT',
        'First event must be game_start',
        firstEvent.seq
      );
    }

    // Validate sequence numbers
    let expectedSeq = 0;
    for (const event of replay.events) {
      if ((event.seq as number) !== expectedSeq) {
        return this.invalidResult(
          'INVALID_SEQUENCE',
          `Expected sequence ${expectedSeq}, got ${event.seq}`,
          event.seq
        );
      }
      expectedSeq++;
    }

    // Full execution validation
    const result = this.execute(replay);

    if (!result.success) {
      return {
        valid: false,
        error: result.error,
      };
    }

    return {
      valid: true,
      finalState: this.engine.serialize(result.finalState),
    };
  }

  /**
   * Create an iterator for step-by-step replay
   */
  *steps(replay: GameReplay<TMove>): Generator<ReplayStep<TState, TMove>> {
    const startEvent = replay.events.find(isGameStartEvent);
    if (!startEvent) return;

    let currentState = this.initializeFromStart(startEvent, replay.seed);

    yield {
      eventSeq: startEvent.seq,
      event: startEvent,
      stateBefore: currentState,
      stateAfter: currentState,
    };

    for (const event of replay.events) {
      if (isGameStartEvent(event)) continue;

      const stateBefore = currentState;
      let moveApplied: TMove | undefined;

      if (isMoveEvent(event)) {
        const move = event.payload.move as TMove;
        const result = this.engine.makeMove(currentState, move);
        if (result.valid) {
          currentState = result.state;
          moveApplied = move;
        }
      }

      yield {
        eventSeq: event.seq,
        event,
        stateBefore,
        stateAfter: currentState,
        moveApplied,
      };

      if (isTerminalEvent(event)) break;
    }
  }

  /**
   * Verify that a replay is deterministic (same seed produces same result)
   */
  verifyDeterminism(replay: GameReplay<TMove>): boolean {
    // Execute twice and compare
    const result1 = this.execute(replay);
    const result2 = this.execute(replay);

    if (!result1.success || !result2.success) {
      return false;
    }

    const state1 = this.engine.serialize(result1.finalState);
    const state2 = this.engine.serialize(result2.finalState);

    return this.config.compareStates(state1, state2);
  }

  // ---------------------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------------------

  private initializeFromStart(event: GameStartEvent, seed: Seed): TState {
    const options = event.payload.options as TOptions;
    return this.engine.newGame(options, seed);
  }

  private processEvent(
    event: ReplayEvent<TMove>,
    state: TState,
    seed: Seed,
    warnings: ReplayWarning[]
  ): { success: true; state: TState } | { success: false; error: ReplayValidationError } {
    switch (event.type) {
      case 'player_move':
        return this.processPlayerMove(event as PlayerMoveEvent<TMove>, state);

      case 'ai_move':
        return this.processAIMove(event as AIMoveEvent<TMove>, state, seed, warnings);

      case 'game_end':
        return this.processGameEnd(event as GameEndEvent, state);

      case 'resign':
      case 'timeout':
      case 'error':
        // These don't change game state through engine
        return { success: true, state };

      case 'undo':
        // Undo not supported in basic replay
        warnings.push({
          eventSeq: event.seq,
          code: 'UNDO_NOT_SUPPORTED',
          message: 'Undo events are not replayed',
        });
        return { success: true, state };

      default:
        return {
          success: false,
          error: {
            code: 'INVALID_SEQUENCE',
            message: `Unknown event type: ${(event as ReplayEvent<TMove>).type}`,
            eventSeq: event.seq,
          },
        };
    }
  }

  private processPlayerMove(
    event: PlayerMoveEvent<TMove>,
    state: TState
  ): { success: true; state: TState } | { success: false; error: ReplayValidationError } {
    const move = event.payload.move;

    // Verify move is legal
    if (!this.engine.isLegalMove(state, move)) {
      return {
        success: false,
        error: {
          code: 'ILLEGAL_MOVE',
          message: `Illegal player move: ${event.payload.moveString}`,
          eventSeq: event.seq,
          details: { move: event.payload.moveString },
        },
      };
    }

    // Apply move
    const result = this.engine.makeMove(state, move);
    if (!result.valid) {
      return {
        success: false,
        error: {
          code: 'ILLEGAL_MOVE',
          message: `Move failed: ${result.error}`,
          eventSeq: event.seq,
        },
      };
    }

    // Verify state after move
    if (this.config.verifyStates) {
      const serialized = this.engine.serialize(result.state);
      if (!this.config.compareStates(serialized, event.payload.stateAfter)) {
        return {
          success: false,
          error: {
            code: 'STATE_MISMATCH',
            message: 'State after move does not match expected',
            eventSeq: event.seq,
            details: { expected: event.payload.stateAfter, actual: serialized },
          },
        };
      }
    }

    return { success: true, state: result.state };
  }

  private processAIMove(
    event: AIMoveEvent<TMove>,
    state: TState,
    seed: Seed,
    warnings: ReplayWarning[]
  ): { success: true; state: TState } | { success: false; error: ReplayValidationError } {
    const recordedMove = event.payload.move;

    // Verify AI would make the same move (determinism check)
    if (this.config.verifyAIMoves) {
      const aiMove = this.engine.getAIMove(state, undefined, seed);
      if (aiMove !== null) {
        const recordedStr = this.engine.formatMove(recordedMove);
        const aiStr = this.engine.formatMove(aiMove);
        if (recordedStr !== aiStr) {
          warnings.push({
            eventSeq: event.seq,
            code: 'AI_MOVE_MISMATCH',
            message: `AI move differs: expected ${recordedStr}, got ${aiStr}`,
          });
        }
      }
    }

    // Apply the recorded move (not the AI's choice)
    if (!this.engine.isLegalMove(state, recordedMove)) {
      return {
        success: false,
        error: {
          code: 'ILLEGAL_MOVE',
          message: `Illegal AI move: ${event.payload.moveString}`,
          eventSeq: event.seq,
        },
      };
    }

    const result = this.engine.makeMove(state, recordedMove);
    if (!result.valid) {
      return {
        success: false,
        error: {
          code: 'ILLEGAL_MOVE',
          message: `AI move failed: ${result.error}`,
          eventSeq: event.seq,
        },
      };
    }

    // Verify state
    if (this.config.verifyStates) {
      const serialized = this.engine.serialize(result.state);
      if (!this.config.compareStates(serialized, event.payload.stateAfter)) {
        return {
          success: false,
          error: {
            code: 'STATE_MISMATCH',
            message: 'State after AI move does not match expected',
            eventSeq: event.seq,
          },
        };
      }
    }

    return { success: true, state: result.state };
  }

  private processGameEnd(
    event: GameEndEvent,
    state: TState
  ): { success: true; state: TState } | { success: false; error: ReplayValidationError } {
    // Verify game is actually over
    if (!this.engine.isGameOver(state)) {
      return {
        success: false,
        error: {
          code: 'STATE_MISMATCH',
          message: 'Game end event but game is not over',
          eventSeq: event.seq,
        },
      };
    }

    // Verify final state matches
    if (this.config.verifyStates) {
      const serialized = this.engine.serialize(state);
      if (!this.config.compareStates(serialized, event.payload.finalState)) {
        return {
          success: false,
          error: {
            code: 'STATE_MISMATCH',
            message: 'Final state does not match expected',
            eventSeq: event.seq,
            details: { expected: event.payload.finalState, actual: serialized },
          },
        };
      }
    }

    return { success: true, state };
  }

  private failure(
    code: ReplayErrorCode,
    message: string,
    lastValidState: TState | null,
    eventsProcessed: number,
    warnings: readonly ReplayWarning[],
    eventSeq?: EventSeq,
    details?: Record<string, unknown>
  ): ReplayExecutionFailure<TState> {
    return {
      success: false,
      error: { code, message, eventSeq, details },
      lastValidState,
      eventsProcessed,
      warnings,
    };
  }

  private invalidResult(
    code: ReplayErrorCode,
    message: string,
    eventSeq?: EventSeq
  ): ReplayValidationResult {
    return {
      valid: false,
      error: { code, message, eventSeq },
    };
  }
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Default state comparator (JSON equality)
 */
function defaultStateComparator(a: SerializedState, b: SerializedState): boolean {
  return a === b;
}

/**
 * Create a replay engine for a specific game engine
 */
export function createReplayEngine<
  TState extends GameState,
  TMove,
  TOptions extends Record<string, unknown> = Record<string, unknown>,
  TBoard = unknown
>(
  engine: GameEngine<TState, TMove, TOptions, TBoard>,
  config?: ReplayEngineConfig
): ReplayEngine<TState, TMove, TOptions, TBoard> {
  return new ReplayEngine(engine, config);
}
