/**
 * Replay Engine
 *
 * Applies ReplayEvent sequences to game engines,
 * verifies determinism, and returns final GameResult.
 */
import type { GameEngine, GameState, GameResult, SerializedState } from '../types/engine';
import type { GameReplay, ReplayEvent, ReplayValidationResult, ReplayValidationError, EventSeq } from '../types/replay';
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
export type ReplayExecutionResult<TState extends GameState> = ReplayExecutionSuccess<TState> | ReplayExecutionFailure<TState>;
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
/**
 * Replay Engine for executing and validating game replays
 */
export declare class ReplayEngine<TState extends GameState, TMove, TOptions extends Record<string, unknown> = Record<string, unknown>, TBoard = unknown> {
    private readonly engine;
    private readonly config;
    constructor(engine: GameEngine<TState, TMove, TOptions, TBoard>, config?: ReplayEngineConfig);
    /**
     * Execute a complete replay and return the final result
     */
    execute(replay: GameReplay<TMove>): ReplayExecutionResult<TState>;
    /**
     * Validate a replay without executing (faster, less thorough)
     */
    validate(replay: GameReplay<TMove>): ReplayValidationResult;
    /**
     * Create an iterator for step-by-step replay
     */
    steps(replay: GameReplay<TMove>): Generator<ReplayStep<TState, TMove>>;
    /**
     * Verify that a replay is deterministic (same seed produces same result)
     */
    verifyDeterminism(replay: GameReplay<TMove>): boolean;
    private initializeFromStart;
    private processEvent;
    private processPlayerMove;
    private processAIMove;
    private processGameEnd;
    private failure;
    private invalidResult;
}
/**
 * Create a replay engine for a specific game engine
 */
export declare function createReplayEngine<TState extends GameState, TMove, TOptions extends Record<string, unknown> = Record<string, unknown>, TBoard = unknown>(engine: GameEngine<TState, TMove, TOptions, TBoard>, config?: ReplayEngineConfig): ReplayEngine<TState, TMove, TOptions, TBoard>;
//# sourceMappingURL=replay-engine.d.ts.map