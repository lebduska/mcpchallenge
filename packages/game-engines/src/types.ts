/**
 * Core types for game engines
 *
 * All game engines implement the GameEngine interface, which provides:
 * - Pure game logic (no I/O, no side effects)
 * - Serializable state
 * - Text and JSON rendering for MCP responses
 */

// =============================================================================
// Game State
// =============================================================================

export type GameStatus = 'waiting' | 'playing' | 'won' | 'lost' | 'draw';
export type Turn = 'player' | 'opponent';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameState {
  /** Unique game identifier */
  readonly gameId: string;
  /** Current game status */
  readonly status: GameStatus;
  /** Whose turn is it */
  readonly turn: Turn;
  /** Optional score (for games like Snake) */
  readonly score?: number;
  /** Move counter */
  readonly moveCount: number;
  /** Timestamp of last move */
  readonly lastMoveAt?: number;
}

// =============================================================================
// Game Result
// =============================================================================

export interface GameResult {
  /** Final status */
  status: 'won' | 'lost' | 'draw';
  /** Final score (if applicable) */
  score?: number;
  /** Total moves made */
  totalMoves: number;
  /** Game duration in ms (if tracked) */
  duration?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Move Result
// =============================================================================

export interface MoveResult<TState extends GameState> {
  /** New state after the move */
  state: TState;
  /** Whether the move was valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Game result if game ended */
  result?: GameResult;
  /** Optional message to return (e.g., compare result) */
  message?: string;
}

// =============================================================================
// Game Engine Interface
// =============================================================================

export interface GameEngineMetadata {
  /** Unique engine identifier (e.g., 'chess', 'snake') */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Difficulty level */
  difficulty: Difficulty;
  /** Base points for completion */
  points: number;
  /** MCP transport type */
  transport: 'http' | 'sse' | 'websocket';
  /** Minimum players */
  minPlayers: 1 | 2;
  /** Maximum players */
  maxPlayers: 1 | 2;
}

export interface GameEngine<
  TState extends GameState,
  TMove,
  TOptions = Record<string, unknown>
> {
  // -------------------------------------------------------------------------
  // Metadata
  // -------------------------------------------------------------------------

  /** Engine metadata */
  readonly metadata: GameEngineMetadata;

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  /**
   * Create a new game with optional configuration
   */
  newGame(options?: TOptions): TState;

  /**
   * Validate that a state object is well-formed
   */
  validateState(state: unknown): state is TState;

  // -------------------------------------------------------------------------
  // Game Logic (pure functions)
  // -------------------------------------------------------------------------

  /**
   * Get all legal moves for the current player
   */
  getLegalMoves(state: TState): TMove[];

  /**
   * Check if a specific move is legal
   */
  isLegalMove(state: TState, move: TMove): boolean;

  /**
   * Apply a move and return the new state
   * Returns MoveResult with validity info
   */
  makeMove(state: TState, move: TMove): MoveResult<TState>;

  /**
   * Get the AI's move for the current position
   * @param difficulty - Override default difficulty
   */
  getAIMove(state: TState, difficulty?: Difficulty): TMove | null;

  /**
   * Check if the game is over
   */
  isGameOver(state: TState): boolean;

  /**
   * Get the game result (only valid if isGameOver is true)
   */
  getResult(state: TState): GameResult | null;

  // -------------------------------------------------------------------------
  // Serialization
  // -------------------------------------------------------------------------

  /**
   * Serialize state to a string (for storage/transmission)
   */
  serialize(state: TState): string;

  /**
   * Deserialize state from a string
   * @throws Error if data is invalid
   */
  deserialize(data: string): TState;

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  /**
   * Render state as ASCII text (for MCP text responses)
   */
  renderText(state: TState): string;

  /**
   * Render state as structured JSON (for UI and machine parsing)
   */
  renderJSON(state: TState): GameStateJSON;

  /**
   * Render a move as human-readable text
   */
  formatMove(move: TMove): string;

  /**
   * Parse a move from string input
   */
  parseMove(input: string): TMove | null;
}

// =============================================================================
// Rendered State (for UI/MCP responses)
// =============================================================================

export interface GameStateJSON {
  /** Engine ID */
  gameType: string;
  /** Game ID */
  gameId: string;
  /** Current status */
  status: GameStatus;
  /** Current turn */
  turn: Turn;
  /** Move count */
  moveCount: number;
  /** Score (if applicable) */
  score?: number;
  /** Legal moves in string format */
  legalMoves: string[];
  /** Game-specific board representation */
  board: unknown;
  /** Last move (if any) */
  lastMove?: string;
  /** Additional game-specific data */
  extra?: Record<string, unknown>;
}

// =============================================================================
// Helper Types
// =============================================================================

/** Type helper to extract state type from an engine */
export type StateOf<E> = E extends GameEngine<infer S, unknown> ? S : never;

/** Type helper to extract move type from an engine */
export type MoveOf<E> = E extends GameEngine<GameState, infer M> ? M : never;

/** Type helper to extract options type from an engine */
export type OptionsOf<E> = E extends GameEngine<GameState, unknown, infer O> ? O : never;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Generate a unique game ID
 */
export function generateGameId(): string {
  return crypto.randomUUID();
}

/**
 * Create a base game state
 */
export function createBaseState(gameId?: string): Pick<GameState, 'gameId' | 'status' | 'turn' | 'moveCount'> {
  return {
    gameId: gameId ?? generateGameId(),
    status: 'playing',
    turn: 'player',
    moveCount: 0,
  };
}
