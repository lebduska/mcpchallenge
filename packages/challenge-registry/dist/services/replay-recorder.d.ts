/**
 * Replay Recorder
 *
 * Records game events into replay format.
 * Pure functions for event creation and replay building.
 */
import type { GameResult, SerializedState, Seed } from '../types/engine';
import type { ReplayEvent, GameStartEvent, PlayerMoveEvent, AIMoveEvent, GameEndEvent, GameEndReason, GameReplay } from '../types/replay';
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
/**
 * Create game start event
 */
export declare function createGameStartEvent(ctx: RecordingContext, input: GameStartInput): GameStartEvent;
/**
 * Create player move event
 */
export declare function createPlayerMoveEvent<TMove>(ctx: RecordingContext, input: PlayerMoveInput<TMove>): PlayerMoveEvent<TMove>;
/**
 * Create AI move event
 */
export declare function createAIMoveEvent<TMove>(ctx: RecordingContext, input: AIMoveInput<TMove>): AIMoveEvent<TMove>;
/**
 * Create game end event
 */
export declare function createGameEndEvent(ctx: RecordingContext, input: GameEndInput): GameEndEvent;
/**
 * Build complete replay from events
 */
export declare function buildReplay<TMove>(input: BuildReplayInput<TMove>): GameReplay<TMove>;
/**
 * Stateful replay recorder
 *
 * Wraps pure functions with mutable context.
 * Use for imperative recording during gameplay.
 */
export declare class ReplayRecorder<TMove = unknown> {
    private readonly startTime;
    private readonly events;
    constructor();
    /**
     * Get current recording context
     */
    getContext(): RecordingContext;
    /**
     * Record game start
     */
    recordStart(input: GameStartInput): GameStartEvent;
    /**
     * Record player move
     */
    recordPlayerMove(input: PlayerMoveInput<TMove>): PlayerMoveEvent<TMove>;
    /**
     * Record AI move
     */
    recordAIMove(input: AIMoveInput<TMove>): AIMoveEvent<TMove>;
    /**
     * Record game end
     */
    recordEnd(input: GameEndInput): GameEndEvent;
    /**
     * Get all recorded events
     */
    getEvents(): readonly ReplayEvent<TMove>[];
    /**
     * Get event count
     */
    get eventCount(): number;
    /**
     * Get recording start time
     */
    get recordingStartTime(): number;
    /**
     * Build final replay
     */
    build(input: Omit<BuildReplayInput<TMove>, 'events' | 'startTime'>): GameReplay<TMove>;
}
export declare function createReplayRecorder<TMove = unknown>(): ReplayRecorder<TMove>;
//# sourceMappingURL=replay-recorder.d.ts.map