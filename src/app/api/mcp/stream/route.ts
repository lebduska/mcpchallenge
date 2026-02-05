/**
 * MCP Session SSE Stream
 *
 * GET /api/mcp/stream?sessionId=...&lastEventId=...
 * Edge runtime compatible SSE endpoint with reconnection support.
 */

import { NextRequest } from 'next/server';
import {
  registerConnection,
  removeConnection,
  getEventsSince,
  sendEvent,
  sendHeartbeat,
  cleanupStaleSessions,
  type SessionConnection,
} from '@/lib/mcp-events';

export const runtime = 'edge';

// Configuration
const HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds

// Cleanup tracking
let lastCleanup = Date.now();

function maybeCleanup(): void {
  const now = Date.now();
  if (now - lastCleanup > 60000) {
    // Every minute
    lastCleanup = now;
    cleanupStaleSessions();
  }
}

// =============================================================================
// Route Handler
// =============================================================================

export async function GET(request: NextRequest): Promise<Response> {
  maybeCleanup();

  const sessionId = request.nextUrl.searchParams.get('sessionId');
  const lastEventId = request.nextUrl.searchParams.get('lastEventId');

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Missing sessionId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse last event ID for reconnection
  let lastSeq = 0;
  if (lastEventId) {
    const parts = lastEventId.split(':');
    if (parts.length === 2) {
      lastSeq = parseInt(parts[1], 10) || 0;
    }
  }

  // Create SSE stream
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const conn: SessionConnection = {
        controller,
        lastActivity: Date.now(),
      };

      // Register connection
      registerConnection(sessionId, conn);

      // Send connection confirmation
      sendEvent(conn, 'connected', JSON.stringify({ sessionId, lastSeq }));

      // Send missed events on reconnection
      if (lastSeq > 0) {
        const missedEvents = getEventsSince(sessionId, lastSeq);
        for (const event of missedEvents) {
          sendEvent(conn, event.type, JSON.stringify(event), event.id as string);
        }

        if (missedEvents.length > 0) {
          sendEvent(
            conn,
            'reconnected',
            JSON.stringify({
              missedCount: missedEvents.length,
              fromSeq: lastSeq,
              toSeq: missedEvents[missedEvents.length - 1].seq,
            })
          );
        }
      }

      // Heartbeat interval
      const heartbeatId = setInterval(() => {
        const success = sendHeartbeat(conn);
        if (!success) {
          clearInterval(heartbeatId);
          removeConnection(sessionId, conn);
        }
      }, HEARTBEAT_INTERVAL_MS);

      // Cleanup on abort
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatId);
        removeConnection(sessionId, conn);
      });
    },

    cancel() {
      // Connection closed by client - cleanup happens via abort signal
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
