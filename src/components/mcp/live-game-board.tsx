"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Chessboard } from "react-chessboard";
import { Eye, RefreshCw, Plus, Clock } from "lucide-react";
import { MCPCommandLog } from "./mcp-command-log";
import { ConnectionStatus } from "./connection-status";
import { RoomConfig } from "./room-config";
import type {
  GameType,
  GameState,
  ChessGameState,
  TicTacToeGameState,
  CommandLogEntry,
  RoomInfo,
  RoomState,
} from "./types";

interface LiveGameBoardProps {
  gameType: GameType;
  roomId?: string;
  onRoomCreated?: (roomInfo: RoomInfo) => void;
}

export function LiveGameBoard({
  gameType,
  roomId: initialRoomId,
  onRoomCreated,
}: LiveGameBoardProps) {
  const [roomId, setRoomId] = useState<string | null>(initialRoomId || null);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [commands, setCommands] = useState<CommandLogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [lastActivity, setLastActivity] = useState<number | null>(null);

  const mcpBaseUrl =
    process.env.NEXT_PUBLIC_MCP_URL || "https://mcp.mcpchallenge.org";

  // Create a new room
  const createRoom = useCallback(async () => {
    setIsCreatingRoom(true);
    try {
      const response = await fetch(`${mcpBaseUrl}/${gameType}/room/create`, {
        method: "POST",
      });
      const data = (await response.json()) as {
        roomId?: string;
        mcpUrl?: string;
        sseUrl?: string;
      };

      if (data.roomId) {
        setRoomId(data.roomId);
        const info: RoomInfo = {
          roomId: data.roomId,
          gameType,
          mcpUrl: data.mcpUrl || `${mcpBaseUrl}/${gameType}?room=${data.roomId}`,
          sseUrl: data.sseUrl || `${mcpBaseUrl}/${gameType}/sse?room=${data.roomId}`,
        };
        setRoomInfo(info);
        onRoomCreated?.(info);
      }
    } catch (error) {
      console.error("Failed to create room:", error);
    } finally {
      setIsCreatingRoom(false);
    }
  }, [gameType, mcpBaseUrl, onRoomCreated]);

  // Connect to SSE stream
  useEffect(() => {
    if (!roomId) return;

    setIsConnecting(true);
    const eventSource = new EventSource(
      `${mcpBaseUrl}/${gameType}/sse?room=${roomId}`
    );

    eventSource.onopen = () => {
      setIsConnected(true);
      setIsConnecting(false);
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      setIsConnecting(false);
    };

    eventSource.addEventListener("state", (event) => {
      try {
        const data = JSON.parse(event.data) as RoomState;
        setGameState(data.gameState);
        setLastActivity(data.lastActivity);
      } catch (error) {
        console.error("Failed to parse state:", error);
      }
    });

    eventSource.addEventListener("command", (event) => {
      try {
        const cmd = JSON.parse(event.data) as CommandLogEntry;
        setCommands((prev) => [...prev.slice(-99), cmd]);
      } catch (error) {
        console.error("Failed to parse command:", error);
      }
    });

    // Set room info
    setRoomInfo({
      roomId,
      gameType,
      mcpUrl: `${mcpBaseUrl}/${gameType}?room=${roomId}`,
      sseUrl: `${mcpBaseUrl}/${gameType}/sse?room=${roomId}`,
    });

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [roomId, gameType, mcpBaseUrl]);

  // Render game-specific board
  const renderBoard = () => {
    if (!gameState) {
      return (
        <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
          <div className="text-center text-zinc-500">
            <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Waiting for game to start...</p>
            <p className="text-sm mt-1">
              Connect your MCP client and call new_game
            </p>
          </div>
        </div>
      );
    }

    switch (gameState.gameType) {
      case "chess":
        return renderChessBoard(gameState);
      case "tictactoe":
        return renderTicTacToeBoard(gameState);
      default:
        return (
          <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
            <p className="text-zinc-500">
              {gameState.gameType} viewer coming soon...
            </p>
          </div>
        );
    }
  };

  const renderChessBoard = (state: ChessGameState) => {
    return (
      <div className="relative">
        <Chessboard
          options={{
            position: state.fen || "start",
            boardOrientation: state.playerColor || "white",
            allowDragging: false,
            boardStyle: {
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            },
            darkSquareStyle: { backgroundColor: "#779952" },
            lightSquareStyle: { backgroundColor: "#edeed1" },
          }}
        />

        {/* Status overlay */}
        {state.status === "finished" && (
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
            <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 text-center">
              <h3 className="text-lg font-bold">
                {state.result === "draw"
                  ? "Draw!"
                  : `${state.result === "white" ? "White" : "Black"} wins!`}
              </h3>
            </div>
          </div>
        )}

        {/* Turn indicator */}
        <div className="absolute bottom-2 right-2">
          <Badge variant={state.turn === "white" ? "default" : "secondary"}>
            {state.turn === "white" ? "White" : "Black"} to move
          </Badge>
        </div>

        {/* Spectator indicator */}
        <div className="absolute top-2 left-2">
          <Badge variant="outline" className="bg-white/80 dark:bg-zinc-900/80 gap-1">
            <Eye className="h-3 w-3" />
            Spectating
          </Badge>
        </div>
      </div>
    );
  };

  const renderTicTacToeBoard = (state: TicTacToeGameState) => {
    return (
      <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-lg p-8 flex items-center justify-center">
        {/* Spectator indicator */}
        <div className="absolute top-2 left-2">
          <Badge variant="outline" className="bg-white/80 dark:bg-zinc-900/80 gap-1">
            <Eye className="h-3 w-3" />
            Spectating
          </Badge>
        </div>

        {/* Turn indicator */}
        {state.status === "playing" && (
          <div className="absolute top-2 right-2">
            <Badge variant={state.currentTurn === "X" ? "default" : "secondary"}>
              {state.currentTurn}&apos;s turn
            </Badge>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 max-w-[300px]">
          {state.board.map((cell, i) => (
            <div
              key={i}
              className="aspect-square bg-white dark:bg-zinc-700 rounded-lg flex items-center justify-center text-4xl font-bold border-2 border-zinc-200 dark:border-zinc-600"
            >
              {cell === "X" && <span className="text-blue-500">X</span>}
              {cell === "O" && <span className="text-red-500">O</span>}
              {cell === null && (
                <span className="text-zinc-300 text-2xl">{i}</span>
              )}
            </div>
          ))}
        </div>

        {/* Status overlay */}
        {state.status === "finished" && (
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
            <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 text-center">
              <h3 className="text-lg font-bold">
                {state.winner === "draw"
                  ? "Draw!"
                  : `${state.winner} wins!`}
              </h3>
            </div>
          </div>
        )}
      </div>
    );
  };

  // No room yet - show create room UI
  if (!roomId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Live Game Board
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Eye className="h-16 w-16 mx-auto mb-4 text-zinc-300" />
            <h3 className="text-lg font-semibold mb-2">
              Create a Game Room
            </h3>
            <p className="text-zinc-500 mb-6 max-w-md mx-auto">
              Create a room to get a unique MCP URL. Connect your MCP client
              (Claude, Cursor, etc.) and watch the game live here.
            </p>
            <Button
              onClick={createRoom}
              disabled={isCreatingRoom}
              size="lg"
              className="gap-2"
            >
              {isCreatingRoom ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create Game Room
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with connection status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          <span className="font-semibold">Live Game Board</span>
          <ConnectionStatus
            isConnected={isConnected}
            isConnecting={isConnecting}
          />
        </div>
        {lastActivity && (
          <div className="flex items-center gap-1 text-sm text-zinc-500">
            <Clock className="h-4 w-4" />
            Last activity:{" "}
            {new Date(lastActivity).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Game board */}
        <Card>
          <CardContent className="p-4">{renderBoard()}</CardContent>
        </Card>

        {/* Command log */}
        <MCPCommandLog commands={commands} maxHeight="400px" />
      </div>

      {/* Room config */}
      {roomInfo && <RoomConfig roomInfo={roomInfo} />}
    </div>
  );
}
