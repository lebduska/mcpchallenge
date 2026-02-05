/**
 * Session Manager
 *
 * Manages game sessions lifecycle.
 * Pure CRUD operations with no game logic.
 */

import type { Difficulty, Seed, GameState } from '../types/engine';
import type { ChallengeId } from '../types/challenge';
import type { ReplayEvent } from '../types/replay';

// =============================================================================
// Types
// =============================================================================

/**
 * Session identifier (branded type)
 */
export type SessionId = string & { readonly __brand: 'SessionId' };

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
  status: SessionStatus;  // Mutable - changes during session lifecycle
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
export type SessionResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: SessionError };

export interface SessionError {
  readonly code: SessionErrorCode;
  readonly message: string;
}

export type SessionErrorCode =
  | 'SESSION_NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'SESSION_ALREADY_COMPLETED'
  | 'INVALID_SESSION_STATE';

// =============================================================================
// Session Manager
// =============================================================================

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
export class SessionManager {
  private readonly sessions: Map<SessionId, Session> = new Map();
  private readonly defaultMaxAge: number;

  constructor(options: { maxAgeMs?: number } = {}) {
    this.defaultMaxAge = options.maxAgeMs ?? 3600000; // 1 hour
  }

  /**
   * Create a new session
   */
  create<TState extends GameState>(
    input: CreateSessionInput<TState>
  ): SessionResult<Session<TState>> {
    const id = this.generateId();
    const now = Date.now();

    const session: Session<TState> = {
      id,
      challengeId: input.challengeId,
      difficulty: input.difficulty,
      seed: input.seed,
      createdAt: now,
      lastActivityAt: now,
      status: 'active',
      state: input.initialState,
      events: [],
      moveCount: 0,
    };

    this.sessions.set(id, session as Session);

    return { ok: true, value: session };
  }

  /**
   * Get session by ID
   */
  get<TState extends GameState = GameState, TMove = unknown>(
    id: SessionId
  ): SessionResult<Session<TState, TMove>> {
    const session = this.sessions.get(id);

    if (!session) {
      return {
        ok: false,
        error: { code: 'SESSION_NOT_FOUND', message: `Session not found: ${id}` },
      };
    }

    // Check expiration
    if (this.isExpired(session)) {
      session.status = 'expired';
      return {
        ok: false,
        error: { code: 'SESSION_EXPIRED', message: `Session expired: ${id}` },
      };
    }

    return { ok: true, value: session as Session<TState, TMove> };
  }

  /**
   * Update session
   */
  update<TState extends GameState, TMove>(
    id: SessionId,
    input: UpdateSessionInput<TState, TMove>
  ): SessionResult<Session<TState, TMove>> {
    const result = this.get<TState, TMove>(id);
    if (!result.ok) return result;

    const session = result.value;

    // Check if already completed
    if (session.status === 'completed' && input.status !== 'completed') {
      return {
        ok: false,
        error: {
          code: 'SESSION_ALREADY_COMPLETED',
          message: `Session already completed: ${id}`,
        },
      };
    }

    // Apply updates
    if (input.state !== undefined) {
      session.state = input.state;
    }
    if (input.events !== undefined) {
      session.events = input.events;
    }
    if (input.moveCount !== undefined) {
      session.moveCount = input.moveCount;
    }
    if (input.status !== undefined) {
      session.status = input.status;
    }

    session.lastActivityAt = Date.now();

    return { ok: true, value: session };
  }

  /**
   * Complete a session (mark as done)
   */
  complete<TState extends GameState, TMove>(
    id: SessionId
  ): SessionResult<Session<TState, TMove>> {
    return this.update<TState, TMove>(id, { status: 'completed' });
  }

  /**
   * Delete a session
   */
  delete(id: SessionId): boolean {
    return this.sessions.delete(id);
  }

  /**
   * Query sessions
   */
  query(options: SessionQueryOptions = {}): readonly Session[] {
    const results: Session[] = [];
    const now = Date.now();

    for (const session of this.sessions.values()) {
      // Filter by status
      if (options.status && session.status !== options.status) continue;

      // Filter by challenge
      if (options.challengeId && session.challengeId !== options.challengeId) continue;

      // Filter by age
      if (options.maxAge && now - session.createdAt > options.maxAge) continue;

      results.push(session);
    }

    return results;
  }

  /**
   * Get all active session IDs
   */
  getActiveIds(): readonly SessionId[] {
    return this.query({ status: 'active' }).map((s) => s.id);
  }

  /**
   * Cleanup expired sessions
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, session] of this.sessions) {
      if (this.isExpired(session, now)) {
        this.sessions.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get session count
   */
  get size(): number {
    return this.sessions.size;
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private generateId(): SessionId {
    return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` as SessionId;
  }

  private isExpired(session: Session, now: number = Date.now()): boolean {
    return now - session.lastActivityAt > this.defaultMaxAge;
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createSessionManager(
  options?: { maxAgeMs?: number }
): SessionManager {
  return new SessionManager(options);
}
