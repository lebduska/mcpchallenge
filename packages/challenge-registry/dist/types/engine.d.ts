/**
 * Game Engine Core Types
 *
 * Defines the contract for game engines with full type inference.
 * All game logic must be pure (no side effects, deterministic).
 */
declare const __brand: unique symbol;
type Brand<T, B> = T & {
    readonly [__brand]: B;
};
/** Serialized state string (JSON) */
export type SerializedState = Brand<string, 'SerializedState'>;
/** Random seed for deterministic replay */
export type Seed = Brand<string, 'Seed'>;
/** Unique game identifier */
export type GameId = Brand<string, 'GameId'>;
export type GameStatus = 'waiting' | 'playing' | 'won' | 'lost' | 'draw';
export type Turn = 'player' | 'opponent';
export type Difficulty = 'easy' | 'medium' | 'hard';
/**
 * Minimal game state that all engines must include
 */
export interface BaseGameState {
    readonly gameId: GameId;
    readonly status: GameStatus;
    readonly turn: Turn;
    readonly moveCount: number;
    readonly score?: number;
    readonly lastMoveAt?: number;
}
/**
 * Constraint for valid game states
 */
export type GameState = BaseGameState & Record<string, unknown>;
export interface GameResult<TMeta = Record<string, unknown>> {
    readonly status: 'won' | 'lost' | 'draw';
    readonly score?: number;
    readonly totalMoves: number;
    readonly duration?: number;
    readonly metadata?: TMeta;
}
export type MoveResult<TState extends GameState> = MoveSuccess<TState> | MoveFailure<TState>;
export interface MoveSuccess<TState extends GameState> {
    readonly valid: true;
    readonly state: TState;
    readonly result?: GameResult;
}
export interface MoveFailure<TState extends GameState> {
    readonly valid: false;
    readonly state: TState;
    readonly error: string;
}
export interface RenderedState<TBoard = unknown> {
    readonly gameType: string;
    readonly gameId: GameId;
    readonly status: GameStatus;
    readonly turn: Turn;
    readonly moveCount: number;
    readonly score?: number;
    readonly legalMoves: readonly string[];
    readonly board: TBoard;
    readonly lastMove?: string;
    readonly extra?: Record<string, unknown>;
}
/**
 * Core game engine interface
 *
 * @typeParam TState - Game state type (must extend BaseGameState)
 * @typeParam TMove - Move type (engine-specific)
 * @typeParam TOptions - Game initialization options
 * @typeParam TBoard - Board representation for rendering
 */
export interface GameEngine<TState extends GameState, TMove, TOptions extends Record<string, unknown> = Record<string, unknown>, TBoard = unknown> {
    readonly id: string;
    readonly name: string;
    readonly version: string;
    /**
     * Create a new game with given options
     * Must be deterministic when seed is provided
     */
    newGame(options?: TOptions, seed?: Seed): TState;
    /**
     * Type guard for validating state shape
     */
    isValidState(value: unknown): value is TState;
    /**
     * Get all legal moves for current player
     */
    getLegalMoves(state: TState): readonly TMove[];
    /**
     * Check if a specific move is legal
     */
    isLegalMove(state: TState, move: TMove): boolean;
    /**
     * Apply a move and return new state
     * Must be pure (no mutation)
     */
    makeMove(state: TState, move: TMove): MoveResult<TState>;
    /**
     * Get AI move for current position
     * Must be deterministic when seed is provided
     */
    getAIMove(state: TState, difficulty?: Difficulty, seed?: Seed): TMove | null;
    /**
     * Check if game is over
     */
    isGameOver(state: TState): boolean;
    /**
     * Get game result (null if game not over)
     */
    getResult(state: TState): GameResult | null;
    /**
     * Serialize state to string
     * Must be reversible via deserialize
     */
    serialize(state: TState): SerializedState;
    /**
     * Deserialize state from string
     * @throws Error if data is invalid
     */
    deserialize(data: SerializedState): TState;
    /**
     * Format move as human-readable string
     */
    formatMove(move: TMove): string;
    /**
     * Parse move from string
     * Returns null if parsing fails
     */
    parseMove(input: string, state?: TState): TMove | null;
    /**
     * Render state as ASCII text
     */
    renderText(state: TState): string;
    /**
     * Render state as structured JSON
     */
    renderJSON(state: TState): RenderedState<TBoard>;
}
/** Extract state type from engine */
export type StateOf<E> = E extends GameEngine<infer S, any, any, any> ? S : never;
/** Extract move type from engine */
export type MoveOf<E> = E extends GameEngine<any, infer M, any, any> ? M : never;
/** Extract options type from engine */
export type OptionsOf<E> = E extends GameEngine<any, any, infer O, any> ? O : never;
/** Extract board type from engine */
export type BoardOf<E> = E extends GameEngine<any, any, any, infer B> ? B : never;
/** Make engine type from components */
export type EngineType<TState extends GameState, TMove, TOptions extends Record<string, unknown> = Record<string, unknown>, TBoard = unknown> = GameEngine<TState, TMove, TOptions, TBoard>;
export {};
//# sourceMappingURL=engine.d.ts.map