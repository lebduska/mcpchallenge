// GameRoom Durable Object
// Manages game state and broadcasts updates to web viewers

import type { GameState, GameType, CommandLogEntry } from "./mcp/types";
import { MCPServer } from "./mcp/server";
import { createChessServer } from "./games/chess";
import { createTicTacToeServer } from "./games/tictactoe";

const ROOM_TTL = 60 * 60 * 1000; // 1 hour

interface RoomState {
  gameType: GameType;
  roomId: string;
  gameState: GameState | null;
  commandLog: CommandLogEntry[];
  createdAt: number;
  lastActivity: number;
}

export class GameRoom implements DurableObject {
  private state: DurableObjectState;
  private roomState: RoomState | null = null;
  private sseClients: Set<WritableStreamDefaultWriter> = new Set();
  private mcpServer: MCPServer | null = null;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Load room state if not loaded
    if (!this.roomState) {
      this.roomState = await this.state.storage.get("roomState") ?? null;
    }

    // Initialize room
    if (path === "/init" && request.method === "POST") {
      return this.handleInit(request);
    }

    // Room must be initialized for other operations
    if (!this.roomState) {
      return Response.json(
        { error: "Room not initialized" },
        { status: 400 }
      );
    }

    // Update last activity
    this.roomState.lastActivity = Date.now();
    await this.state.storage.put("roomState", this.roomState);

    // Schedule cleanup alarm
    await this.state.storage.setAlarm(Date.now() + ROOM_TTL);

    switch (path) {
      case "/mcp":
        return this.handleMCP(request);
      case "/sse":
        return this.handleSSE(request);
      case "/state":
        return this.handleState();
      default:
        return Response.json({ error: "Not found" }, { status: 404 });
    }
  }

  private async handleInit(request: Request): Promise<Response> {
    const { gameType, roomId } = await request.json() as {
      gameType: GameType;
      roomId: string;
    };

    // Initialize room state
    this.roomState = {
      gameType,
      roomId,
      gameState: null,
      commandLog: [],
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };

    // Create MCP server for this game type
    this.createMCPServer();

    // Save state
    await this.state.storage.put("roomState", this.roomState);

    // Schedule cleanup alarm
    await this.state.storage.setAlarm(Date.now() + ROOM_TTL);

    return Response.json({ success: true, roomId });
  }

  private createMCPServer(): void {
    if (!this.roomState) return;

    const onCommand = (entry: CommandLogEntry) => {
      this.roomState!.commandLog.push(entry);
      // Keep only last 100 commands
      if (this.roomState!.commandLog.length > 100) {
        this.roomState!.commandLog = this.roomState!.commandLog.slice(-100);
      }
      this.broadcast("command", entry);
    };

    const onStateChange = (gameState: GameState) => {
      this.roomState!.gameState = gameState;
      this.state.storage.put("roomState", this.roomState);
      this.broadcast("state", this.getPublicState());
    };

    switch (this.roomState.gameType) {
      case "chess":
        this.mcpServer = createChessServer(
          this.roomState.gameState,
          onStateChange,
          onCommand
        );
        break;
      case "tictactoe":
        this.mcpServer = createTicTacToeServer(
          this.roomState.gameState,
          onStateChange,
          onCommand
        );
        break;
      // TODO: Add snake and canvas
      default:
        throw new Error(`Unknown game type: ${this.roomState.gameType}`);
    }
  }

  private async handleMCP(request: Request): Promise<Response> {
    if (!this.mcpServer) {
      this.createMCPServer();
    }

    const message = await request.text();
    const response = await this.mcpServer!.handleMessage(message);

    // Save state after each MCP message
    await this.state.storage.put("roomState", this.roomState);

    if (!response) {
      // Notification - no response
      return new Response(null, { status: 204 });
    }

    return new Response(response, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  private handleSSE(request: Request): Response {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    // Add client to set
    this.sseClients.add(writer);

    // Send initial state
    const initialState = this.getPublicState();
    const encoder = new TextEncoder();
    writer.write(
      encoder.encode(`event: state\ndata: ${JSON.stringify(initialState)}\n\n`)
    );

    // Send recent commands
    for (const cmd of this.roomState!.commandLog.slice(-20)) {
      writer.write(
        encoder.encode(`event: command\ndata: ${JSON.stringify(cmd)}\n\n`)
      );
    }

    // Remove client when connection closes
    request.signal.addEventListener("abort", () => {
      this.sseClients.delete(writer);
      writer.close().catch(() => {});
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  private handleState(): Response {
    return Response.json(this.getPublicState(), {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  private getPublicState(): Record<string, unknown> {
    if (!this.roomState) {
      return { error: "Room not initialized" };
    }

    return {
      roomId: this.roomState.roomId,
      gameType: this.roomState.gameType,
      gameState: this.roomState.gameState,
      commandCount: this.roomState.commandLog.length,
      createdAt: this.roomState.createdAt,
      lastActivity: this.roomState.lastActivity,
    };
  }

  private broadcast(event: string, data: unknown): void {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();
    const encoded = encoder.encode(message);

    for (const writer of this.sseClients) {
      writer.write(encoded).catch(() => {
        // Client disconnected, will be cleaned up
        this.sseClients.delete(writer);
      });
    }
  }

  // Alarm handler for TTL cleanup
  async alarm(): Promise<void> {
    if (!this.roomState) return;

    const now = Date.now();
    const timeSinceActivity = now - this.roomState.lastActivity;

    if (timeSinceActivity >= ROOM_TTL) {
      // Room expired, clean up
      await this.state.storage.deleteAll();
      this.roomState = null;

      // Close all SSE clients
      for (const writer of this.sseClients) {
        writer.close().catch(() => {});
      }
      this.sseClients.clear();
    } else {
      // Schedule next check
      await this.state.storage.setAlarm(
        now + (ROOM_TTL - timeSinceActivity)
      );
    }
  }
}
