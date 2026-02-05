/**
 * MCP Tool Call Endpoint
 *
 * POST /api/mcp/tool
 * Handles MCP tool calls and pushes events to connected SSE clients.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { DomainEvent, DomainSessionId } from '@mcpchallenge/challenge-registry';
import { pushEventsToSession } from '@/lib/mcp-events';

export const runtime = 'edge';

// =============================================================================
// Types
// =============================================================================

interface ToolCallRequest {
  readonly tool: string;
  readonly args: Record<string, unknown>;
}

interface ToolCallResponse {
  readonly success: boolean;
  readonly data?: unknown;
  readonly error?: string;
  readonly events?: readonly DomainEvent[];
}

// =============================================================================
// Orchestrator Instance
// =============================================================================

// Note: In production, this would be imported from a shared module
// For now, we'll create a minimal stub that returns mock data
// The actual orchestrator would be connected here

async function handleToolCall(
  _tool: string,
  _args: Record<string, unknown>
): Promise<ToolCallResponse> {
  // TODO: Connect to actual MCPOrchestrator
  // For now, return a stub response
  return {
    success: false,
    error: 'Orchestrator not connected. This endpoint requires challenge-registry integration.',
  };
}

// =============================================================================
// Route Handler
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<ToolCallResponse>> {
  try {
    const body = (await request.json()) as ToolCallRequest;

    if (!body.tool || typeof body.tool !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid "tool" field' },
        { status: 400 }
      );
    }

    const args = body.args ?? {};

    // Call orchestrator
    const result = await handleToolCall(body.tool, args);

    // Push events to SSE clients if we have events and a sessionId
    if (result.events && result.events.length > 0) {
      const sessionId = (args.sessionId as string) ?? result.events[0]?.sessionId;
      if (sessionId) {
        pushEventsToSession(sessionId as DomainSessionId, result.events);
      }
    }

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
