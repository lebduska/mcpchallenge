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
          games: ["chess", "tictactoe", "snake", "canvas", "minesweeper", "sokoban", "gorillas", "fractals", "lightsout", "pathfinding", "sorting"],
        },
        { headers: corsHeaders }
      );
    }

    // Route to game endpoints
    const gameMatch = path.match(/^\/(chess|tictactoe|snake|canvas|minesweeper|sokoban|gorillas|fractals|lightsout|pathfinding|sorting)(\/.*)?$/);
    if (gameMatch) {
      const gameType = gameMatch[1] as "chess" | "tictactoe" | "snake" | "canvas" | "minesweeper" | "sokoban" | "gorillas" | "fractals" | "lightsout" | "pathfinding" | "sorting";
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
        wsUrl: `wss://mcp.mcpchallenge.org/${gameType}/ws?room=${roomId}`,
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

  // WebSocket endpoint for MCP clients
  if (subPath === "/ws") {
    return room.fetch(
      new Request(`https://internal/ws`, {
        headers: request.headers,
      })
    );
  }

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
        ws: `wss://mcp.mcpchallenge.org/${gameType}/ws?room=${roomId}`,
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
      return "Snake MCP Server - Control snake via MCP tools";
    case "canvas":
      return "Canvas MCP Server - Draw on canvas via MCP commands";
    case "minesweeper":
      return "Minesweeper MCP Server - Classic minesweeper game via MCP tools";
    case "sokoban":
      return "Sokoban MCP Server - Classic box-pushing puzzle with 60 DOS levels";
    case "gorillas":
      return "Gorillas MCP Server - Classic DOS artillery game with banana-throwing gorillas";
    case "fractals":
      return "Fractals MCP Server - L-System fractals with turtle graphics";
    case "lightsout":
      return "Lights Out MCP Server - Classic 90s puzzle game with XOR logic";
    case "pathfinding":
      return "Pathfinding MCP Server - A* and Dijkstra pathfinding algorithms on grid mazes";
    case "sorting":
      return "Sorting MCP Server - Sort arrays using only compare and swap operations";
    default:
      return "MCP Game Server";
  }
}
