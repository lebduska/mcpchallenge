/**
 * Event Collector
 *
 * Collects domain events during pipeline execution.
 * Passed through orchestrator stages to gather events.
 */
import type { DomainEvent, DomainEventType, SessionId, EventSeq } from '../types/domain-events';
type PayloadOf<T extends DomainEventType> = Extract<DomainEvent, {
    type: T;
}>['payload'];
/**
 * Get current sequence number for a session (without incrementing)
 */
export declare function getCurrentSeq(sessionId: SessionId): EventSeq;
/**
 * Reset sequence for a session (for testing)
 */
export declare function resetSeq(sessionId: SessionId): void;
/**
 * Event Collector
 *
 * Responsibilities:
 * - Collect domain events during pipeline execution
 * - Provide typed emit methods
 * - Assign monotonic sequence numbers
 * - Return collected events for response
 *
 * NOT responsible for:
 * - Event persistence
 * - Event broadcasting (that's the API layer)
 */
export declare class EventCollector {
    private readonly events;
    private readonly sessionId;
    constructor(sessionId: SessionId);
    /**
     * Emit a domain event with auto-assigned sequence
     */
    emit<T extends DomainEventType>(type: T, payload: PayloadOf<T>): DomainEvent;
    /**
     * Get all collected events (immutable copy)
     */
    getEvents(): readonly DomainEvent[];
    /**
     * Get events of a specific type
     */
    getEventsOfType<T extends DomainEventType>(type: T): readonly Extract<DomainEvent, {
        type: T;
    }>[];
    /**
     * Check if any errors were emitted
     */
    hasErrors(): boolean;
    /**
     * Get event count
     */
    get count(): number;
    /**
     * Get session ID
     */
    getSessionId(): SessionId;
    /**
     * Get last sequence number
     */
    getLastSeq(): EventSeq;
    /**
     * Clear all events (doesn't reset sequence)
     */
    clear(): void;
}
/**
 * Create an event collector for a session
 */
export declare function createEventCollector(sessionId: SessionId): EventCollector;
/**
 * Create an event collector with string session ID (for convenience)
 */
export declare function createEventCollectorFromString(sessionId: string): EventCollector;
export {};
//# sourceMappingURL=event-collector.d.ts.map