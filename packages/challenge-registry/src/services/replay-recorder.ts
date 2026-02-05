/**
 * Replay Recorder
 *
 * Records game events into replay format.
 * Pure functions for event creation and replay building.
 */

import type { GameResult, SerializedState, Seed, GameId } from '../types/engine';
import type {
  ReplayId,
  EventSeq,
  RelativeTimestamp,
  ReplayEvent,
  GameStartEvent,
  PlayerMoveEvent,
  AIMoveEvent,
  GameEndEvent,
  GameEndReason,
  GameReplay,
  ReplayMeta,
} from '../types/replay';

// =============================================================================
// Types
// =============================================================================

/**
 * Recording context (passed through pipeline)
 */
export interface RecordingContext {
  readonly startTime: number;
  readonly eventCount: number;
}

/**
 * Event creation inputs
 */
export interface GameStartInput {
  readonly options: Record<string, unknown>;
  readonly seed: Seed;
  readonly initialState: SerializedState;
}

export interface PlayerMoveInput<TMove> {
  readonly move: TMove;
  readonly moveString: string;
  readonly stateBefore: SerializedState;
  readonly stateAfter: SerializedState;
}

export interface AIMoveInput<TMove> {
  readonly move: TMove;
  readonly moveString: string;
  readonly stateBefore: SerializedState;
  readonly stateAfter: SerializedState;
  readonly thinkTimeMs?: number;
}

export interface GameEndInput {
  readonly result: GameResult;
  readonly finalState: SerializedState;
  readonly reason: GameEndReason;
}

/**
 * Replay building input
 */
export interface BuildReplayInput<TMove> {
  readonly challengeId: string;
  readonly gameId: string;
  readonly seed: Seed;
  readonly options: Record<string, unknown>;
  readonly events: readonly ReplayEvent<TMove>[];
  readonly result?: GameResult;
  readonly startTime: number;
  readonly endTime?: number;
  readonly userId?: string;
}

// =============================================================================
// Event Creators (Pure Functions)
// =============================================================================

/**
 * Create game start event
 */
export function createGameStartEvent(
  ctx: RecordingContext,
  input: GameStartInput
): GameStartEvent {
  return {
    seq: ctx.eventCount as EventSeq,
    timestamp: 0 as RelativeTimestamp,
    type: 'game_start',
    payload: {
      options: input.options,
      seed: input.seed,
      initialState: input.initialState,
    },
  };
}

/**
 * Create player move event
 */
export function createPlayerMoveEvent<TMove>(
  ctx: RecordingContext,
  input: PlayerMoveInput<TMove>
): PlayerMoveEvent<TMove> {
  const timestamp = Date.now() - ctx.startTime;

  return {
    seq: ctx.eventCount as EventSeq,
    timestamp: timestamp as RelativeTimestamp,
    type: 'player_move',
    payload: {
      move: input.move,
      moveString: input.moveString,
      stateBefore: input.stateBefore,
      stateAfter: input.stateAfter,
    },
  };
}

/**
 * Create AI move event
 */
export function createAIMoveEvent<TMove>(
  ctx: RecordingContext,
  input: AIMoveInput<TMove>
): AIMoveEvent<TMove> {
  const timestamp = Date.now() - ctx.startTime;

  return {
    seq: ctx.eventCount as EventSeq,
    timestamp: timestamp as RelativeTimestamp,
    type: 'ai_move',
    payload: {
      move: input.move,
      moveString: input.moveString,
      stateBefore: input.stateBefore,
      stateAfter: input.stateAfter,
      thinkTimeMs: input.thinkTimeMs,
    },
  };
}

/**
 * Create game end event
 */
export function createGameEndEvent(
  ctx: RecordingContext,
  input: GameEndInput
): GameEndEvent {
  const timestamp = Date.now() - ctx.startTime;

  return {
    seq: ctx.eventCount as EventSeq,
    timestamp: timestamp as RelativeTimestamp,
    type: 'game_end',
    payload: {
      result: input.result,
      finalState: input.finalState,
      reason: input.reason,
    },
  };
}

// =============================================================================
// Replay Builder (Pure Function)
// =============================================================================

/**
 * Build complete replay from events
 */
export function buildReplay<TMove>(
  input: BuildReplayInput<TMove>
): GameReplay<TMove> {
  const endTime = input.endTime ?? Date.now();
  const duration = endTime - input.startTime;

  // Count moves
  let playerMoves = 0;
  let aiMoves = 0;

  for (const event of input.events) {
    if (event.type === 'player_move') playerMoves++;
    if (event.type === 'ai_move') aiMoves++;
  }

  const meta: ReplayMeta = {
    createdAt: input.startTime,
    completedAt: endTime,
    playerMoves,
    aiMoves,
    duration,
  };

  return {
    version: '1.0',
    replayId: generateReplayId(),
    challengeId: input.challengeId,
    gameId: input.gameId as GameId,
    userId: input.userId,
    seed: input.seed,
    options: input.options,
    events: input.events,
    result: input.result,
    meta,
  };
}

// =============================================================================
// Replay Recorder Class
// =============================================================================

/**
 * Stateful replay recorder
 *
 * Wraps pure functions with mutable context.
 * Use for imperative recording during gameplay.
 */
export class ReplayRecorder<TMove = unknown> {
  private readonly startTime: number;
  private readonly events: ReplayEvent<TMove>[] = [];

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Get current recording context
   */
  getContext(): RecordingContext {
    return {
      startTime: this.startTime,
      eventCount: this.events.length,
    };
  }

  /**
   * Record game start
   */
  recordStart(input: GameStartInput): GameStartEvent {
    const event = createGameStartEvent(this.getContext(), input);
    this.events.push(event);
    return event;
  }

  /**
   * Record player move
   */
  recordPlayerMove(input: PlayerMoveInput<TMove>): PlayerMoveEvent<TMove> {
    const event = createPlayerMoveEvent(this.getContext(), input);
    this.events.push(event);
    return event;
  }

  /**
   * Record AI move
   */
  recordAIMove(input: AIMoveInput<TMove>): AIMoveEvent<TMove> {
    const event = createAIMoveEvent(this.getContext(), input);
    this.events.push(event);
    return event;
  }

  /**
   * Record game end
   */
  recordEnd(input: GameEndInput): GameEndEvent {
    const event = createGameEndEvent(this.getContext(), input);
    this.events.push(event);
    return event;
  }

  /**
   * Get all recorded events
   */
  getEvents(): readonly ReplayEvent<TMove>[] {
    return [...this.events];
  }

  /**
   * Get event count
   */
  get eventCount(): number {
    return this.events.length;
  }

  /**
   * Get recording start time
   */
  get recordingStartTime(): number {
    return this.startTime;
  }

  /**
   * Build final replay
   */
  build(input: Omit<BuildReplayInput<TMove>, 'events' | 'startTime'>): GameReplay<TMove> {
    return buildReplay({
      ...input,
      events: this.events,
      startTime: this.startTime,
    });
  }
}

// =============================================================================
// Factory & Utilities
// =============================================================================

export function createReplayRecorder<TMove = unknown>(): ReplayRecorder<TMove> {
  return new ReplayRecorder<TMove>();
}

function generateReplayId(): ReplayId {
  return `replay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` as ReplayId;
}
