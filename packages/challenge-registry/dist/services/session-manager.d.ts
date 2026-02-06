/**
 * Session Manager
 *
 * Manages game sessions lifecycle.
 * Pure CRUD operations with no game logic.
 */
import type { Difficulty, Seed, GameState } from '../types/engine';
import type { ChallengeId } from '../types/challenge';
import type { ReplayEvent } from '../types/replay';
/**
 * Session identifier (branded type)
 */
export type SessionId = string & {
    readonly __brand: 'SessionId';
};
/**
 * Session state
 */
export type SessionStatus = 'active' | 'completed' | 'expired' | 'error';
/**
 * Game session data
 */
export interface Session<TState extends GameState = GameState, TMove = unknown> {
    readonly id: SessionId;
    readonly challengeId: ChallengeId;
    readonly difficulty: Difficulty;
    readonly seed: Seed;
    readonly createdAt: number;
    status: SessionStatus;
    state: TState;
    events: ReplayEvent<TMove>[];
    moveCount: number;
    lastActivityAt: number;
}
/**
 * Session creation input
 */
export interface CreateSessionInput<TState extends GameState> {
    readonly challengeId: ChallengeId;
    readonly difficulty: Difficulty;
    readonly seed: Seed;
    readonly initialState: TState;
}
/**
 * Session update input
 */
export interface UpdateSessionInput<TState extends GameState, TMove> {
    readonly state?: TState;
    readonly events?: ReplayEvent<TMove>[];
    readonly moveCount?: number;
    readonly status?: SessionStatus;
}
/**
 * Session query options
 */
export interface SessionQueryOptions {
    readonly status?: SessionStatus;
    readonly challengeId?: ChallengeId;
    readonly maxAge?: number;
}
/**
 * Session manager result types
 */
export type SessionResult<T> = {
    readonly ok: true;
    readonly value: T;
} | {
    readonly ok: false;
    readonly error: SessionError;
};
export interface SessionError {
    readonly code: SessionErrorCode;
    readonly message: string;
}
export type SessionErrorCode = 'SESSION_NOT_FOUND' | 'SESSION_EXPIRED' | 'SESSION_ALREADY_COMPLETED' | 'INVALID_SESSION_STATE';
/**
 * Manages game sessions
 *
 * Responsibilities:
 * - Create/read/update/delete sessions
 * - Session expiration
 * - Session queries
 *
 * NOT responsible for:
 * - Game logic
 * - Move validation
 * - Replay recording (that's ReplayRecorder)
 */
export declare class SessionManager {
    private readonly sessions;
    private readonly defaultMaxAge;
    constructor(options?: {
        maxAgeMs?: number;
    });
    /**
     * Create a new session
     */
    create<TState extends GameState>(input: CreateSessionInput<TState>): SessionResult<Session<TState>>;
    /**
     * Get session by ID
     */
    get<TState extends GameState = GameState, TMove = unknown>(id: SessionId): SessionResult<Session<TState, TMove>>;
    /**
     * Update session
     */
    update<TState extends GameState, TMove>(id: SessionId, input: UpdateSessionInput<TState, TMove>): SessionResult<Session<TState, TMove>>;
    /**
     * Complete a session (mark as done)
     */
    complete<TState extends GameState, TMove>(id: SessionId): SessionResult<Session<TState, TMove>>;
    /**
     * Delete a session
     */
    delete(id: SessionId): boolean;
    /**
     * Query sessions
     */
    query(options?: SessionQueryOptions): readonly Session[];
    /**
     * Get all active session IDs
     */
    getActiveIds(): readonly SessionId[];
    /**
     * Cleanup expired sessions
     */
    cleanup(): number;
    /**
     * Get session count
     */
    get size(): number;
    private generateId;
    private isExpired;
}
export declare function createSessionManager(options?: {
    maxAgeMs?: number;
}): SessionManager;
//# sourceMappingURL=session-manager.d.ts.map