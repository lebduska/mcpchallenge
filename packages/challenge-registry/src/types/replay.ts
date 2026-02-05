/**
 * Replay System Types
 *
 * Types for recording, storing, and replaying games.
 * All replay data must be serializable (JSON-safe).
 */

import type {
  GameState,
  GameResult,
  SerializedState,
  Seed,
  GameId,
} from './engine';

// =============================================================================
// Branded Types
// =============================================================================

declare const __brand: unique symbol;
type Brand<T, B> = T & { readonly [__brand]: B };

/** Unique replay identifier */
export type ReplayId = Brand<string, 'ReplayId'>;

/** Event sequence number */
export type EventSeq = Brand<number, 'EventSeq'>;

/** Timestamp relative to game start (ms) */
export type RelativeTimestamp = Brand<number, 'RelativeTimestamp'>;

// =============================================================================
// Replay Event Types (Discriminated Union)
// =============================================================================

/**
 * All possible replay event types
 */
export type ReplayEventType =
  | 'game_start'
  | 'player_move'
  | 'ai_move'
  | 'game_end'
  | 'resign'
  | 'timeout'
  | 'undo'
  | 'error';

/**
 * Base event structure (all events have these fields)
 */
interface BaseReplayEvent<TType extends ReplayEventType> {
  readonly seq: EventSeq;
  readonly timestamp: RelativeTimestamp;
  readonly type: TType;
}

// =============================================================================
// Event Payloads (Discriminated by 'type' field)
// =============================================================================

/**
 * Game start event
 */
export interface GameStartEvent extends BaseReplayEvent<'game_start'> {
  readonly payload: {
    readonly options: Readonly<Record<string, unknown>>;
    readonly seed: Seed;
    readonly initialState: SerializedState;
  };
}

/**
 * Player move event
 */
export interface PlayerMoveEvent<TMove = unknown> extends BaseReplayEvent<'player_move'> {
  readonly payload: {
    readonly move: TMove;
    readonly moveString: string;
    readonly stateBefore: SerializedState;
    readonly stateAfter: SerializedState;
  };
}

/**
 * AI move event
 */
export interface AIMoveEvent<TMove = unknown> extends BaseReplayEvent<'ai_move'> {
  readonly payload: {
    readonly move: TMove;
    readonly moveString: string;
    readonly stateBefore: SerializedState;
    readonly stateAfter: SerializedState;
    readonly thinkTimeMs?: number;
  };
}

/**
 * Game end event (natural conclusion)
 */
export interface GameEndEvent extends BaseReplayEvent<'game_end'> {
  readonly payload: {
    readonly result: GameResult;
    readonly finalState: SerializedState;
    readonly reason: GameEndReason;
  };
}

export type GameEndReason =
  | 'checkmate'
  | 'stalemate'
  | 'timeout'
  | 'resignation'
  | 'draw_agreement'
  | 'repetition'
  | 'insufficient_material'
  | 'fifty_moves'
  | 'completed'
  | 'game_over';

/**
 * Resignation event
 */
export interface ResignEvent extends BaseReplayEvent<'resign'> {
  readonly payload: {
    readonly resignedBy: 'player' | 'opponent';
    readonly stateAtResign: SerializedState;
  };
}

/**
 * Timeout event
 */
export interface TimeoutEvent extends BaseReplayEvent<'timeout'> {
  readonly payload: {
    readonly timedOutPlayer: 'player' | 'opponent';
    readonly stateAtTimeout: SerializedState;
  };
}

/**
 * Undo event (if supported)
 */
export interface UndoEvent extends BaseReplayEvent<'undo'> {
  readonly payload: {
    readonly undoCount: number;
    readonly stateAfterUndo: SerializedState;
  };
}

/**
 * Error event
 */
export interface ErrorEvent extends BaseReplayEvent<'error'> {
  readonly payload: {
    readonly code: string;
    readonly message: string;
    readonly recoverable: boolean;
    readonly stateAtError?: SerializedState;
  };
}

// =============================================================================
// Union Type for All Events
// =============================================================================

/**
 * Any replay event (discriminated union)
 */
export type ReplayEvent<TMove = unknown> =
  | GameStartEvent
  | PlayerMoveEvent<TMove>
  | AIMoveEvent<TMove>
  | GameEndEvent
  | ResignEvent
  | TimeoutEvent
  | UndoEvent
  | ErrorEvent;

// =============================================================================
// Type Guards
// =============================================================================

export function isGameStartEvent(e: ReplayEvent): e is GameStartEvent {
  return e.type === 'game_start';
}

export function isPlayerMoveEvent<T>(e: ReplayEvent<T>): e is PlayerMoveEvent<T> {
  return e.type === 'player_move';
}

export function isAIMoveEvent<T>(e: ReplayEvent<T>): e is AIMoveEvent<T> {
  return e.type === 'ai_move';
}

export function isMoveEvent<T>(e: ReplayEvent<T>): e is PlayerMoveEvent<T> | AIMoveEvent<T> {
  return e.type === 'player_move' || e.type === 'ai_move';
}

export function isGameEndEvent(e: ReplayEvent): e is GameEndEvent {
  return e.type === 'game_end';
}

export function isTerminalEvent(e: ReplayEvent): e is GameEndEvent | ResignEvent | TimeoutEvent {
  return e.type === 'game_end' || e.type === 'resign' || e.type === 'timeout';
}

// =============================================================================
// Replay Metadata
// =============================================================================

export interface ReplayMeta {
  /** When replay was created (absolute timestamp) */
  readonly createdAt: number;

  /** When replay was completed (absolute timestamp) */
  readonly completedAt?: number;

  /** Total player moves */
  readonly playerMoves: number;

  /** Total AI moves */
  readonly aiMoves: number;

  /** Total game duration (ms) */
  readonly duration: number;

  /** Client that recorded this replay */
  readonly client?: ClientInfo;

  /** Custom metadata */
  readonly custom?: Readonly<Record<string, unknown>>;
}

export interface ClientInfo {
  readonly name: string;
  readonly version: string;
  readonly platform?: string;
}

// =============================================================================
// Game Replay
// =============================================================================

/**
 * Complete game replay (fully serializable)
 *
 * @typeParam TMove - Move type from the game engine
 */
export interface GameReplay<TMove = unknown> {
  /** Replay format version (for backwards compatibility) */
  readonly version: '1.0';

  /** Unique replay identifier */
  readonly replayId: ReplayId;

  /** Challenge this replay belongs to */
  readonly challengeId: string;

  /** Game ID within the replay */
  readonly gameId: GameId;

  /** User ID (if authenticated) */
  readonly userId?: string;

  /** Random seed for deterministic replay */
  readonly seed: Seed;

  /** Game options used at start */
  readonly options: Readonly<Record<string, unknown>>;

  /** Ordered list of events */
  readonly events: readonly ReplayEvent<TMove>[];

  /** Final result (derived from events) */
  readonly result?: GameResult;

  /** Replay metadata */
  readonly meta: ReplayMeta;
}

// =============================================================================
// Replay Validation Types
// =============================================================================

export type ReplayValidationResult =
  | ReplayValid
  | ReplayInvalid;

export interface ReplayValid {
  readonly valid: true;
  readonly finalState: SerializedState;
}

export interface ReplayInvalid {
  readonly valid: false;
  readonly error: ReplayValidationError;
}

export interface ReplayValidationError {
  readonly code: ReplayErrorCode;
  readonly message: string;
  readonly eventSeq?: EventSeq;
  readonly details?: Record<string, unknown>;
}

export type ReplayErrorCode =
  | 'MISSING_START_EVENT'
  | 'INVALID_INITIAL_STATE'
  | 'ILLEGAL_MOVE'
  | 'STATE_MISMATCH'
  | 'SEED_MISMATCH'
  | 'INVALID_SEQUENCE'
  | 'DESERIALIZATION_FAILED'
  | 'CUSTOM_VALIDATION_FAILED';

// =============================================================================
// Type Utilities
// =============================================================================

/** Extract move type from replay */
export type MoveOfReplay<R> = R extends GameReplay<infer M> ? M : never;

/** Create typed replay from engine */
export type ReplayFor<E> = E extends { getMoves: () => infer M }
  ? GameReplay<M>
  : GameReplay<unknown>;
