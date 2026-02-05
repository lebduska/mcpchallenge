/**
 * MCP Event Management
 *
 * Shared state and utilities for MCP SSE connections.
 * Used by both /api/mcp/stream and /api/mcp/tool routes.
 */

import type { DomainEvent, DomainSessionId } from '@mcpchallenge/challenge-registry';

// =============================================================================
// Types
// =============================================================================

interface SessionConnection {
  controller: ReadableStreamDefaultController<Uint8Array>;
  lastActivity: number;
}

interface SessionBuffer {
  events: DomainEvent[];
  lastActivity: number;
}

// =============================================================================
// In-Memory State (per Edge instance)
// =============================================================================

// Active SSE connections per session
const connections = new Map<string, Set<SessionConnection>>();

// Event buffer per session (for reconnection)
const eventBuffers = new Map<string, SessionBuffer>();

// Configuration
const MAX_EVENTS_PER_SESSION = 100;
const SESSION_TIMEOUT_MS = 3600000; // 1 hour

// =============================================================================
// Event Buffer Management
// =============================================================================

/**
 * Add events to session buffer
 */
export function bufferEvents(sessionId: string, events: readonly DomainEvent[]): void {
  let buffer = eventBuffers.get(sessionId);

  if (!buffer) {
    buffer = { events: [], lastActivity: Date.now() };
    eventBuffers.set(sessionId, buffer);
  }

  buffer.events.push(...events);
  buffer.lastActivity = Date.now();

  // Trim if over limit
  if (buffer.events.length > MAX_EVENTS_PER_SESSION) {
    buffer.events = buffer.events.slice(-MAX_EVENTS_PER_SESSION);
  }
}

/**
 * Get events since a specific sequence number
 */
export function getEventsSince(sessionId: string, afterSeq: number): readonly DomainEvent[] {
  const buffer = eventBuffers.get(sessionId);
  if (!buffer) return [];

  return buffer.events.filter((e) => e.seq > afterSeq);
}

/**
 * Cleanup stale sessions
 */
export function cleanupStaleSessions(): void {
  const now = Date.now();

  for (const [sessionId, buffer] of eventBuffers) {
    if (now - buffer.lastActivity > SESSION_TIMEOUT_MS) {
      eventBuffers.delete(sessionId);
      connections.delete(sessionId);
    }
  }
}

// =============================================================================
// SSE Helpers
// =============================================================================

const encoder = new TextEncoder();

/**
 * Format SSE message
 */
export function formatSSE(event: string, data: string, id?: string): string {
  let message = '';
  if (id) {
    message += `id: ${id}\n`;
  }
  message += `event: ${event}\n`;
  message += `data: ${data}\n\n`;
  return message;
}

/**
 * Send event to a connection
 */
export function sendEvent(
  conn: SessionConnection,
  event: string,
  data: string,
  id?: string
): boolean {
  try {
    conn.controller.enqueue(encoder.encode(formatSSE(event, data, id)));
    conn.lastActivity = Date.now();
    return true;
  } catch {
    return false;
  }
}

/**
 * Send heartbeat comment (keeps connection alive)
 */
export function sendHeartbeat(conn: SessionConnection): boolean {
  try {
    conn.controller.enqueue(encoder.encode(': heartbeat\n\n'));
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// Connection Management
// =============================================================================

/**
 * Register a connection for a session
 */
export function registerConnection(sessionId: string, conn: SessionConnection): void {
  let sessionConns = connections.get(sessionId);
  if (!sessionConns) {
    sessionConns = new Set();
    connections.set(sessionId, sessionConns);
  }
  sessionConns.add(conn);
}

/**
 * Remove a connection
 */
export function removeConnection(sessionId: string, conn: SessionConnection): void {
  const sessionConns = connections.get(sessionId);
  if (sessionConns) {
    sessionConns.delete(conn);
    if (sessionConns.size === 0) {
      connections.delete(sessionId);
    }
  }
}

/**
 * Push events to all connected clients for a session
 */
export function pushEventsToSession(
  sessionId: DomainSessionId,
  events: readonly DomainEvent[]
): void {
  const sessionKey = sessionId as string;

  // Buffer events for reconnection
  bufferEvents(sessionKey, events);

  // Push to connected clients
  const sessionConns = connections.get(sessionKey);
  if (!sessionConns) return;

  const deadConnections: SessionConnection[] = [];

  for (const conn of sessionConns) {
    for (const event of events) {
      const success = sendEvent(conn, event.type, JSON.stringify(event), event.id as string);
      if (!success) {
        deadConnections.push(conn);
        break;
      }
    }
  }

  // Remove dead connections
  for (const dead of deadConnections) {
    sessionConns.delete(dead);
  }

  if (sessionConns.size === 0) {
    connections.delete(sessionKey);
  }
}

/**
 * Get event buffer stats (for debugging)
 */
export function getBufferStats(): { sessions: number; totalEvents: number } {
  let totalEvents = 0;
  for (const buffer of eventBuffers.values()) {
    totalEvents += buffer.events.length;
  }
  return {
    sessions: eventBuffers.size,
    totalEvents,
  };
}

// Export SessionConnection type for route use
export type { SessionConnection };
