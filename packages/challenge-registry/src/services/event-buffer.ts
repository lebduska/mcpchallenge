/**
 * Event Buffer
 *
 * In-memory event buffer per session for SSE reconnection support.
 * Stores recent events to replay on reconnect.
 */

import type { DomainEvent, SessionId, EventSeq } from '../types/domain-events';

// =============================================================================
// Types
// =============================================================================

export interface EventBufferOptions {
  /** Maximum events to keep per session (default: 100) */
  readonly maxEventsPerSession?: number;
  /** Session timeout in ms (default: 1 hour) */
  readonly sessionTimeoutMs?: number;
}

interface SessionBuffer {
  events: DomainEvent[];
  lastActivityAt: number;
}

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
  private readonly buffers: Map<string, SessionBuffer> = new Map();
  private readonly maxEventsPerSession: number;
  private readonly sessionTimeoutMs: number;

  constructor(options: EventBufferOptions = {}) {
    this.maxEventsPerSession = options.maxEventsPerSession ?? 100;
    this.sessionTimeoutMs = options.sessionTimeoutMs ?? 3600000; // 1 hour
  }

  /**
   * Add event to session buffer
   */
  push(sessionId: SessionId, event: DomainEvent): void {
    const key = sessionId as string;
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
  pushMany(sessionId: SessionId, events: readonly DomainEvent[]): void {
    for (const event of events) {
      this.push(sessionId, event);
    }
  }

  /**
   * Get events since a specific sequence number (exclusive)
   * Returns events where seq > afterSeq
   */
  getEventsSince(sessionId: SessionId, afterSeq: EventSeq): readonly DomainEvent[] {
    const key = sessionId as string;
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
  getAllEvents(sessionId: SessionId): readonly DomainEvent[] {
    const key = sessionId as string;
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
  getLastSeq(sessionId: SessionId): EventSeq | null {
    const key = sessionId as string;
    const buffer = this.buffers.get(key);

    if (!buffer || buffer.events.length === 0) {
      return null;
    }

    return buffer.events[buffer.events.length - 1].seq;
  }

  /**
   * Check if session has events
   */
  hasSession(sessionId: SessionId): boolean {
    return this.buffers.has(sessionId as string);
  }

  /**
   * Get event count for a session
   */
  getEventCount(sessionId: SessionId): number {
    const buffer = this.buffers.get(sessionId as string);
    return buffer?.events.length ?? 0;
  }

  /**
   * Clear events for a session
   */
  clear(sessionId: SessionId): void {
    this.buffers.delete(sessionId as string);
  }

  /**
   * Cleanup stale sessions
   */
  cleanup(): number {
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
  get size(): number {
    return this.buffers.size;
  }

  /**
   * Get total event count (all sessions)
   */
  get totalEvents(): number {
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

let globalBuffer: EventBuffer | null = null;

/**
 * Get global event buffer instance
 */
export function getEventBuffer(): EventBuffer {
  if (!globalBuffer) {
    globalBuffer = new EventBuffer();
  }
  return globalBuffer;
}

/**
 * Create a new event buffer (for testing)
 */
export function createEventBuffer(options?: EventBufferOptions): EventBuffer {
  return new EventBuffer(options);
}

/**
 * Reset global buffer (for testing)
 */
export function resetEventBuffer(): void {
  globalBuffer = null;
}
