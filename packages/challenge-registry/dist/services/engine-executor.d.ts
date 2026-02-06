/**
 * Engine Executor
 *
 * Executes game operations on GameEngine.
 * Pure wrapper with no state management.
 */
import type { GameEngine, GameState, GameResult, SerializedState, Difficulty, Seed } from '../types/engine';
/**
 * Move execution result
 */
export type ExecuteMoveResult<TState extends GameState, TMove> = ExecuteMoveSuccess<TState, TMove> | ExecuteMoveFailure;
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
export type ExecutionErrorCode = 'INVALID_MOVE_FORMAT' | 'ILLEGAL_MOVE' | 'GAME_ALREADY_OVER' | 'NOT_PLAYER_TURN' | 'ENGINE_ERROR';
/**
 * AI move result
 */
export type AIResult<TState extends GameState, TMove> = AISuccess<TState, TMove> | AINoMove;
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
export declare class EngineExecutor<TState extends GameState, TMove, TOptions extends Record<string, unknown> = Record<string, unknown>, TBoard = unknown> {
    private readonly engine;
    constructor(engine: GameEngine<TState, TMove, TOptions, TBoard>);
    /**
     * Initialize a new game
     */
    initGame(options?: TOptions, seed?: Seed): InitGameResult<TState>;
    /**
     * Execute a player move
     */
    executeMove(state: TState, moveInput: string): ExecuteMoveResult<TState, TMove>;
    /**
     * Execute AI move
     */
    executeAI(state: TState, difficulty?: Difficulty, seed?: Seed): AIResult<TState, TMove>;
    /**
     * Get state info
     */
    getStateInfo(state: TState): StateInfo<TState>;
    /**
     * Check if game is over
     */
    isGameOver(state: TState): boolean;
    /**
     * Get game result
     */
    getResult(state: TState): GameResult | null;
    /**
     * Get legal moves as strings
     */
    getLegalMoves(state: TState): readonly string[];
    /**
     * Render state as text
     */
    renderText(state: TState): string;
    /**
     * Serialize state
     */
    serialize(state: TState): SerializedState;
    private formatLegalMoves;
}
export declare function createEngineExecutor<TState extends GameState, TMove, TOptions extends Record<string, unknown> = Record<string, unknown>, TBoard = unknown>(engine: GameEngine<TState, TMove, TOptions, TBoard>): EngineExecutor<TState, TMove, TOptions, TBoard>;
//# sourceMappingURL=engine-executor.d.ts.map