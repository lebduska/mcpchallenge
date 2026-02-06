/**
 * Event Collector
 *
 * Collects domain events during pipeline execution.
 * Passed through orchestrator stages to gather events.
 */
import { createDomainEvent } from '../types/domain-events';
// =============================================================================
// Sequence Tracker (per session)
// =============================================================================
const sessionSequences = new Map();
/**
 * Get next sequence number for a session
 */
function nextSeq(sessionId) {
    const current = sessionSequences.get(sessionId) ?? 0;
    const next = current + 1;
    sessionSequences.set(sessionId, next);
    return next;
}
/**
 * Get current sequence number for a session (without incrementing)
 */
export function getCurrentSeq(sessionId) {
    return (sessionSequences.get(sessionId) ?? 0);
}
/**
 * Reset sequence for a session (for testing)
 */
export function resetSeq(sessionId) {
    sessionSequences.delete(sessionId);
}
// =============================================================================
// Event Collector
// =============================================================================
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
export class EventCollector {
    events = [];
    sessionId;
    constructor(sessionId) {
        this.sessionId = sessionId;
    }
    /**
     * Emit a domain event with auto-assigned sequence
     */
    emit(type, payload) {
        const seq = nextSeq(this.sessionId);
        const event = createDomainEvent(type, this.sessionId, payload, seq);
        this.events.push(event);
        return event;
    }
    /**
     * Get all collected events (immutable copy)
     */
    getEvents() {
        return [...this.events];
    }
    /**
     * Get events of a specific type
     */
    getEventsOfType(type) {
        return this.events.filter((e) => e.type === type);
    }
    /**
     * Check if any errors were emitted
     */
    hasErrors() {
        return this.events.some((e) => e.type === 'error');
    }
    /**
     * Get event count
     */
    get count() {
        return this.events.length;
    }
    /**
     * Get session ID
     */
    getSessionId() {
        return this.sessionId;
    }
    /**
     * Get last sequence number
     */
    getLastSeq() {
        return getCurrentSeq(this.sessionId);
    }
    /**
     * Clear all events (doesn't reset sequence)
     */
    clear() {
        this.events.length = 0;
    }
}
// =============================================================================
// Factory
// =============================================================================
/**
 * Create an event collector for a session
 */
export function createEventCollector(sessionId) {
    return new EventCollector(sessionId);
}
/**
 * Create an event collector with string session ID (for convenience)
 */
export function createEventCollectorFromString(sessionId) {
    return new EventCollector(sessionId);
}
//# sourceMappingURL=event-collector.js.map