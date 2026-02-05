/**
 * Event Collector
 *
 * Collects domain events during pipeline execution.
 * Passed through orchestrator stages to gather events.
 */

import type {
  DomainEvent,
  DomainEventType,
  SessionId,
  EventSeq,
} from '../types/domain-events';
import { createDomainEvent } from '../types/domain-events';

// =============================================================================
// Types
// =============================================================================

type PayloadOf<T extends DomainEventType> = Extract<DomainEvent, { type: T }>['payload'];

// =============================================================================
// Sequence Tracker (per session)
// =============================================================================

const sessionSequences = new Map<string, number>();

/**
 * Get next sequence number for a session
 */
function nextSeq(sessionId: SessionId): EventSeq {
  const current = sessionSequences.get(sessionId as string) ?? 0;
  const next = current + 1;
  sessionSequences.set(sessionId as string, next);
  return next as EventSeq;
}

/**
 * Get current sequence number for a session (without incrementing)
 */
export function getCurrentSeq(sessionId: SessionId): EventSeq {
  return (sessionSequences.get(sessionId as string) ?? 0) as EventSeq;
}

/**
 * Reset sequence for a session (for testing)
 */
export function resetSeq(sessionId: SessionId): void {
  sessionSequences.delete(sessionId as string);
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
  private readonly events: DomainEvent[] = [];
  private readonly sessionId: SessionId;

  constructor(sessionId: SessionId) {
    this.sessionId = sessionId;
  }

  /**
   * Emit a domain event with auto-assigned sequence
   */
  emit<T extends DomainEventType>(type: T, payload: PayloadOf<T>): DomainEvent {
    const seq = nextSeq(this.sessionId);
    const event = createDomainEvent(type, this.sessionId, payload as any, seq);
    this.events.push(event);
    return event;
  }

  /**
   * Get all collected events (immutable copy)
   */
  getEvents(): readonly DomainEvent[] {
    return [...this.events];
  }

  /**
   * Get events of a specific type
   */
  getEventsOfType<T extends DomainEventType>(type: T): readonly Extract<DomainEvent, { type: T }>[] {
    return this.events.filter((e): e is Extract<DomainEvent, { type: T }> => e.type === type);
  }

  /**
   * Check if any errors were emitted
   */
  hasErrors(): boolean {
    return this.events.some((e) => e.type === 'error');
  }

  /**
   * Get event count
   */
  get count(): number {
    return this.events.length;
  }

  /**
   * Get session ID
   */
  getSessionId(): SessionId {
    return this.sessionId;
  }

  /**
   * Get last sequence number
   */
  getLastSeq(): EventSeq {
    return getCurrentSeq(this.sessionId);
  }

  /**
   * Clear all events (doesn't reset sequence)
   */
  clear(): void {
    this.events.length = 0;
  }
}

// =============================================================================
// Factory
// =============================================================================

/**
 * Create an event collector for a session
 */
export function createEventCollector(sessionId: SessionId): EventCollector {
  return new EventCollector(sessionId);
}

/**
 * Create an event collector with string session ID (for convenience)
 */
export function createEventCollectorFromString(sessionId: string): EventCollector {
  return new EventCollector(sessionId as SessionId);
}
