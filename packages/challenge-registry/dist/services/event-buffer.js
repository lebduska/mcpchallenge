/**
 * Event Buffer
 *
 * In-memory event buffer per session for SSE reconnection support.
 * Stores recent events to replay on reconnect.
 */
// =============================================================================
// Event Buffer
// =============================================================================
/**
 * Event Buffer
 *
 * Responsibilities:
 * - Store recent events per session
 * - Support replay from specific sequence number
 * - Auto-cleanup stale sessions
 *
 * Thread-safe for single-instance use (Edge Runtime).
 */
export class EventBuffer {
    buffers = new Map();
    maxEventsPerSession;
    sessionTimeoutMs;
    constructor(options = {}) {
        this.maxEventsPerSession = options.maxEventsPerSession ?? 100;
        this.sessionTimeoutMs = options.sessionTimeoutMs ?? 3600000; // 1 hour
    }
    /**
     * Add event to session buffer
     */
    push(sessionId, event) {
        const key = sessionId;
        let buffer = this.buffers.get(key);
        if (!buffer) {
            buffer = { events: [], lastActivityAt: Date.now() };
            this.buffers.set(key, buffer);
        }
        buffer.events.push(event);
        buffer.lastActivityAt = Date.now();
        // Trim if over limit
        if (buffer.events.length > this.maxEventsPerSession) {
            buffer.events = buffer.events.slice(-this.maxEventsPerSession);
        }
    }
    /**
     * Add multiple events to session buffer
     */
    pushMany(sessionId, events) {
        for (const event of events) {
            this.push(sessionId, event);
        }
    }
    /**
     * Get events since a specific sequence number (exclusive)
     * Returns events where seq > afterSeq
     */
    getEventsSince(sessionId, afterSeq) {
        const key = sessionId;
        const buffer = this.buffers.get(key);
        if (!buffer) {
            return [];
        }
        buffer.lastActivityAt = Date.now();
        return buffer.events.filter((e) => e.seq > afterSeq);
    }
    /**
     * Get all events for a session
     */
    getAllEvents(sessionId) {
        const key = sessionId;
        const buffer = this.buffers.get(key);
        if (!buffer) {
            return [];
        }
        buffer.lastActivityAt = Date.now();
        return [...buffer.events];
    }
    /**
     * Get last sequence number for a session
     */
    getLastSeq(sessionId) {
        const key = sessionId;
        const buffer = this.buffers.get(key);
        if (!buffer || buffer.events.length === 0) {
            return null;
        }
        return buffer.events[buffer.events.length - 1].seq;
    }
    /**
     * Check if session has events
     */
    hasSession(sessionId) {
        return this.buffers.has(sessionId);
    }
    /**
     * Get event count for a session
     */
    getEventCount(sessionId) {
        const buffer = this.buffers.get(sessionId);
        return buffer?.events.length ?? 0;
    }
    /**
     * Clear events for a session
     */
    clear(sessionId) {
        this.buffers.delete(sessionId);
    }
    /**
     * Cleanup stale sessions
     */
    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, buffer] of this.buffers) {
            if (now - buffer.lastActivityAt > this.sessionTimeoutMs) {
                this.buffers.delete(key);
                cleaned++;
            }
        }
        return cleaned;
    }
    /**
     * Get total buffer size (all sessions)
     */
    get size() {
        return this.buffers.size;
    }
    /**
     * Get total event count (all sessions)
     */
    get totalEvents() {
        let total = 0;
        for (const buffer of this.buffers.values()) {
            total += buffer.events.length;
        }
        return total;
    }
}
// =============================================================================
// Singleton Instance
// =============================================================================
let globalBuffer = null;
/**
 * Get global event buffer instance
 */
export function getEventBuffer() {
    if (!globalBuffer) {
        globalBuffer = new EventBuffer();
    }
    return globalBuffer;
}
/**
 * Create a new event buffer (for testing)
 */
export function createEventBuffer(options) {
    return new EventBuffer(options);
}
/**
 * Reset global buffer (for testing)
 */
export function resetEventBuffer() {
    globalBuffer = null;
}
//# sourceMappingURL=event-buffer.js.map