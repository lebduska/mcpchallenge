// MCP Servers - Cloudflare Worker Entry Point
// Handles routing to different game MCP servers

import { GameRoom } from "./room";

export { GameRoom };

export interface Env {
  GAME_ROOM: DurableObjectNamespace;
  ENVIRONMENT: string;
}

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Health check
    if (path === "/" || path === "/health") {
      return Response.json(
        {
          status: "ok",
          service: "mcp-servers",
          version: "0.1.0",
          games: ["chess", "tictactoe", "snake", "canvas"],
        },
        { headers: corsHeaders }
      );
    }

    // Route to game endpoints
    const gameMatch = path.match(/^\/(chess|tictactoe|snake|canvas)(\/.*)?$/);
    if (gameMatch) {
      const gameType = gameMatch[1] as "chess" | "tictactoe" | "snake" | "canvas";
      const subPath = gameMatch[2] || "";

      return handleGameRequest(request, env, gameType, subPath);
    }

    return Response.json(
      { error: "Not found", path },
      { status: 404, headers: corsHeaders }
    );
  },
};

async function handleGameRequest(
  request: Request,
  env: Env,
  gameType: string,
  subPath: string
): Promise<Response> {
  const url = new URL(request.url);

  // Create new room
  if (subPath === "/room/create" && request.method === "POST") {
    const roomId = crypto.randomUUID();
    const id = env.GAME_ROOM.idFromName(`${gameType}:${roomId}`);
    const room = env.GAME_ROOM.get(id);

    // Initialize the room
    const initResponse = await room.fetch(
      new Request(`https://internal/init`, {
        method: "POST",
        body: JSON.stringify({ gameType, roomId }),
      })
    );

    if (!initResponse.ok) {
      return Response.json(
        { error: "Failed to create room" },
        { status: 500, headers: corsHeaders }
      );
    }

    return Response.json(
      {
        roomId,
        gameType,
        mcpUrl: `https://mcp.mcpchallenge.org/${gameType}?room=${roomId}`,
        sseUrl: `https://mcp.mcpchallenge.org/${gameType}/sse?room=${roomId}`,
      },
      { headers: corsHeaders }
    );
  }

  // Get room ID from query params
  const roomId = url.searchParams.get("room");

  if (!roomId) {
    // No room specified - return info about the game MCP server
    return Response.json(
      {
        gameType,
        description: getGameDescription(gameType),
        createRoom: `POST /${gameType}/room/create`,
        usage: `Add ?room=<roomId> to connect`,
      },
      { headers: corsHeaders }
    );
  }

  // Get the Durable Object for this room
  const id = env.GAME_ROOM.idFromName(`${gameType}:${roomId}`);
  const room = env.GAME_ROOM.get(id);

  // SSE endpoint for web UI
  if (subPath === "/sse") {
    return room.fetch(
      new Request(`https://internal/sse`, {
        headers: request.headers,
      })
    );
  }

  // State endpoint (for initial load)
  if (subPath === "/state") {
    return room.fetch(new Request(`https://internal/state`));
  }

  // MCP protocol endpoint (POST for messages)
  if (request.method === "POST") {
    const body = await request.text();
    return room.fetch(
      new Request(`https://internal/mcp`, {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
        },
      })
    );
  }

  // GET request to MCP endpoint - return server info
  return Response.json(
    {
      name: `${gameType}-mcp-server`,
      version: "0.1.0",
      description: getGameDescription(gameType),
      roomId,
      endpoints: {
        mcp: `POST /${gameType}?room=${roomId}`,
        sse: `GET /${gameType}/sse?room=${roomId}`,
        state: `GET /${gameType}/state?room=${roomId}`,
      },
    },
    { headers: corsHeaders }
  );
}

function getGameDescription(gameType: string): string {
  switch (gameType) {
    case "chess":
      return "Chess MCP Server - Play chess against Stockfish engine";
    case "tictactoe":
      return "Tic-Tac-Toe MCP Server - Classic game with minimax AI";
    case "snake":
      return "Snake MCP Server - Real-time snake game via WebSocket";
    case "canvas":
      return "Canvas MCP Server - Draw on canvas via MCP commands";
    default:
      return "MCP Game Server";
  }
}
