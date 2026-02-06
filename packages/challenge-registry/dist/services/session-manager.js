/**
 * Session Manager
 *
 * Manages game sessions lifecycle.
 * Pure CRUD operations with no game logic.
 */
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
    sessions = new Map();
    defaultMaxAge;
    constructor(options = {}) {
        this.defaultMaxAge = options.maxAgeMs ?? 3600000; // 1 hour
    }
    /**
     * Create a new session
     */
    create(input) {
        const id = this.generateId();
        const now = Date.now();
        const session = {
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
        this.sessions.set(id, session);
        return { ok: true, value: session };
    }
    /**
     * Get session by ID
     */
    get(id) {
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
        return { ok: true, value: session };
    }
    /**
     * Update session
     */
    update(id, input) {
        const result = this.get(id);
        if (!result.ok)
            return result;
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
    complete(id) {
        return this.update(id, { status: 'completed' });
    }
    /**
     * Delete a session
     */
    delete(id) {
        return this.sessions.delete(id);
    }
    /**
     * Query sessions
     */
    query(options = {}) {
        const results = [];
        const now = Date.now();
        for (const session of this.sessions.values()) {
            // Filter by status
            if (options.status && session.status !== options.status)
                continue;
            // Filter by challenge
            if (options.challengeId && session.challengeId !== options.challengeId)
                continue;
            // Filter by age
            if (options.maxAge && now - session.createdAt > options.maxAge)
                continue;
            results.push(session);
        }
        return results;
    }
    /**
     * Get all active session IDs
     */
    getActiveIds() {
        return this.query({ status: 'active' }).map((s) => s.id);
    }
    /**
     * Cleanup expired sessions
     */
    cleanup() {
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
    get size() {
        return this.sessions.size;
    }
    // ---------------------------------------------------------------------------
    // Private
    // ---------------------------------------------------------------------------
    generateId() {
        return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
    isExpired(session, now = Date.now()) {
        return now - session.lastActivityAt > this.defaultMaxAge;
    }
}
// =============================================================================
// Factory
// =============================================================================
export function createSessionManager(options) {
    return new SessionManager(options);
}
//# sourceMappingURL=session-manager.js.map