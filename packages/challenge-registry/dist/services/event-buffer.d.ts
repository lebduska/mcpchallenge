/**
 * Event Buffer
 *
 * In-memory event buffer per session for SSE reconnection support.
 * Stores recent events to replay on reconnect.
 */
import type { DomainEvent, SessionId, EventSeq } from '../types/domain-events';
export interface EventBufferOptions {
    /** Maximum events to keep per session (default: 100) */
    readonly maxEventsPerSession?: number;
    /** Session timeout in ms (default: 1 hour) */
    readonly sessionTimeoutMs?: number;
}
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
export declare class EventBuffer {
    private readonly buffers;
    private readonly maxEventsPerSession;
    private readonly sessionTimeoutMs;
    constructor(options?: EventBufferOptions);
    /**
     * Add event to session buffer
     */
    push(sessionId: SessionId, event: DomainEvent): void;
    /**
     * Add multiple events to session buffer
     */
    pushMany(sessionId: SessionId, events: readonly DomainEvent[]): void;
    /**
     * Get events since a specific sequence number (exclusive)
     * Returns events where seq > afterSeq
     */
    getEventsSince(sessionId: SessionId, afterSeq: EventSeq): readonly DomainEvent[];
    /**
     * Get all events for a session
     */
    getAllEvents(sessionId: SessionId): readonly DomainEvent[];
    /**
     * Get last sequence number for a session
     */
    getLastSeq(sessionId: SessionId): EventSeq | null;
    /**
     * Check if session has events
     */
    hasSession(sessionId: SessionId): boolean;
    /**
     * Get event count for a session
     */
    getEventCount(sessionId: SessionId): number;
    /**
     * Clear events for a session
     */
    clear(sessionId: SessionId): void;
    /**
     * Cleanup stale sessions
     */
    cleanup(): number;
    /**
     * Get total buffer size (all sessions)
     */
    get size(): number;
    /**
     * Get total event count (all sessions)
     */
    get totalEvents(): number;
}
/**
 * Get global event buffer instance
 */
export declare function getEventBuffer(): EventBuffer;
/**
 * Create a new event buffer (for testing)
 */
export declare function createEventBuffer(options?: EventBufferOptions): EventBuffer;
/**
 * Reset global buffer (for testing)
 */
export declare function resetEventBuffer(): void;
//# sourceMappingURL=event-buffer.d.ts.map