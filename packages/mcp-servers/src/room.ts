// GameRoom Durable Object
// Manages game state and broadcasts updates to web viewers

import type { GameState, GameType, CommandLogEntry } from "./mcp/types";
import { MCPServer } from "./mcp/server";
import { createRoomMCPServer, hasAdapterSupport } from "./adapters";
// Legacy imports (fallback for unsupported game types)
import { createChessServer } from "./games/chess";
import { createTicTacToeServer } from "./games/tictactoe";
import { createSnakeServer } from "./games/snake";

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
  private wsClients: Set<WebSocket> = new Set();
  private mcpServer: MCPServer | null = null;

  constructor(state: DurableObjectState) {
    this.state = state;
    // Restore WebSocket connections after hibernation
    this.state.getWebSockets().forEach((ws) => {
      this.wsClients.add(ws);
    });
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
      case "/ws":
        return this.handleWebSocket(request);
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

    // Use new adapter system if available
    if (hasAdapterSupport(this.roomState.gameType)) {
      this.mcpServer = createRoomMCPServer({
        gameType: this.roomState.gameType,
        initialState: this.roomState.gameState,
        onStateChange,
        onCommand,
      });
      return;
    }

    // Fallback to legacy implementation for unsupported types (e.g., canvas)
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
      case "snake":
        this.mcpServer = createSnakeServer(
          this.roomState.gameState,
          onStateChange,
          onCommand
        );
        break;
      // TODO: Add canvas
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

  // WebSocket upgrade handler
  private handleWebSocket(request: Request): Response {
    const upgradeHeader = request.headers.get("Upgrade");
    if (upgradeHeader !== "websocket") {
      return new Response("Expected WebSocket upgrade", { status: 426 });
    }

    // Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept the WebSocket connection (enables hibernation)
    this.state.acceptWebSocket(server);
    this.wsClients.add(server);

    // Send initial state
    server.send(JSON.stringify({
      type: "state",
      data: this.getPublicState(),
    }));

    // Send recent commands
    for (const cmd of this.roomState!.commandLog.slice(-20)) {
      server.send(JSON.stringify({
        type: "command",
        data: cmd,
      }));
    }

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  // WebSocket message handler (Durable Object hibernation API)
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    // Ensure room state is loaded
    if (!this.roomState) {
      this.roomState = await this.state.storage.get("roomState") ?? null;
    }
    if (!this.roomState) {
      ws.send(JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32600, message: "Room not initialized" },
      }));
      return;
    }

    // Ensure MCP server is created
    if (!this.mcpServer) {
      this.createMCPServer();
    }

    // Update activity
    this.roomState.lastActivity = Date.now();
    await this.state.storage.put("roomState", this.roomState);

    // Handle MCP message
    const messageStr = typeof message === "string" ? message : new TextDecoder().decode(message);
    const response = await this.mcpServer!.handleMessage(messageStr);

    // Save state
    await this.state.storage.put("roomState", this.roomState);

    // Send response back via WebSocket
    if (response) {
      ws.send(response);
    }
  }

  // WebSocket close handler
  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
    this.wsClients.delete(ws);
  }

  // WebSocket error handler
  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    this.wsClients.delete(ws);
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
    // SSE clients
    const sseMessage = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();
    const encoded = encoder.encode(sseMessage);

    for (const writer of this.sseClients) {
      writer.write(encoded).catch(() => {
        // Client disconnected, will be cleaned up
        this.sseClients.delete(writer);
      });
    }

    // WebSocket clients
    const wsMessage = JSON.stringify({ type: event, data });
    for (const ws of this.wsClients) {
      try {
        ws.send(wsMessage);
      } catch {
        this.wsClients.delete(ws);
      }
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

      // Close all WebSocket clients
      for (const ws of this.wsClients) {
        try {
          ws.close(1000, "Room expired");
        } catch {
          // Ignore
        }
      }
      this.wsClients.clear();
    } else {
      // Schedule next check
      await this.state.storage.setAlarm(
        now + (ROOM_TTL - timeSinceActivity)
      );
    }
  }
}
