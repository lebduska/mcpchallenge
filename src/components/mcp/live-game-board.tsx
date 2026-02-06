"use client";

/**
 * LiveGameBoard - Command Center for MCP game viewing
 *
 * Modern game interface:
 * - Large live board on left
 * - Terminal-style command stream on right
 * - Clean room creation flow
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";

// Dynamic import with SSR disabled - react-chessboard uses DOM APIs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Chessboard: any = dynamic(
  () => import("react-chessboard").then((mod) => mod.Chessboard),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse flex items-center justify-center">
        <span className="text-zinc-400">Loading board...</span>
      </div>
    )
  }
);
import {
  Eye,
  RefreshCw,
  Plus,
  Wifi,
  WifiOff,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { MCPCommandLog } from "./mcp-command-log";
import { RoomConfig } from "./room-config";
import { cn } from "@/lib/utils";
import type {
  GameType,
  GameState,
  ChessGameState,
  TicTacToeGameState,
  SnakeGameState,
  CanvasGameState,
  MinesweeperGameState,
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
  const [copied, setCopied] = useState(false);

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
        wsUrl?: string;
      };

      if (data.roomId) {
        setRoomId(data.roomId);
        const info: RoomInfo = {
          roomId: data.roomId,
          gameType,
          mcpUrl: data.mcpUrl || `${mcpBaseUrl}/${gameType}?room=${data.roomId}`,
          sseUrl: data.sseUrl || `${mcpBaseUrl}/${gameType}/sse?room=${data.roomId}`,
          wsUrl: data.wsUrl,
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

  // Copy MCP URL
  const copyMcpUrl = useCallback(() => {
    if (roomInfo?.mcpUrl) {
      navigator.clipboard.writeText(roomInfo.mcpUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [roomInfo]);

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

    setRoomInfo({
      roomId,
      gameType,
      mcpUrl: `${mcpBaseUrl}/${gameType}?room=${roomId}`,
      sseUrl: `${mcpBaseUrl}/${gameType}/sse?room=${roomId}`,
      wsUrl: gameType === "snake" ? `wss://mcp.mcpchallenge.org/${gameType}/ws?room=${roomId}` : undefined,
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
        <div className="aspect-square bg-zinc-100 dark:bg-zinc-900/50 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
          <div className="text-center px-8">
            <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <Eye className="h-8 w-8 text-zinc-400 dark:text-zinc-600" />
            </div>
            <p className="text-zinc-700 dark:text-zinc-400 font-medium">Waiting for game</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-600 mt-1">
              Connect MCP client and call new_game
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
      case "snake":
        return renderSnakeBoard(gameState);
      case "canvas":
        return renderCanvasBoard(gameState);
      case "minesweeper":
        return renderMinesweeperBoard(gameState);
      default:
        return null;
    }
  };

  const renderChessBoard = (state: ChessGameState) => {
    return (
      <div className="relative group">
        {/* Glow effect */}
        <div className="absolute -inset-2 rounded-2xl blur-xl opacity-20 dark:opacity-30 bg-gradient-to-br from-blue-500/30 via-transparent to-purple-500/30 group-hover:opacity-40 dark:group-hover:opacity-50 transition-opacity" />

        <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/20 dark:shadow-black/50 ring-1 ring-zinc-200 dark:ring-white/10">
          <Chessboard
            position={state.fen || "start"}
            boardOrientation={state.playerColor || "white"}
            arePiecesDraggable={false}
            customBoardStyle={{ borderRadius: "12px" }}
            customDarkSquareStyle={{ backgroundColor: "#4a7c59" }}
            customLightSquareStyle={{ backgroundColor: "#ebecd0" }}
          />

          {/* Status overlay */}
          {state.status === "finished" && (
            <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-white/95 dark:bg-zinc-900/90 rounded-xl p-6 text-center border border-zinc-200 dark:border-white/10 shadow-lg">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                  {state.result === "draw"
                    ? "Draw!"
                    : `${state.result === "white" ? "White" : "Black"} wins!`}
                </h3>
              </div>
            </div>
          )}

          {/* Turn indicator */}
          <div className="absolute bottom-2 right-2">
            <Badge
              className={cn(
                "backdrop-blur-md border-0",
                state.turn === "white"
                  ? "bg-white/90 text-zinc-900"
                  : "bg-zinc-900/90 text-white"
              )}
            >
              {state.turn === "white" ? "White" : "Black"} to move
            </Badge>
          </div>

          {/* Spectator badge */}
          <div className="absolute top-2 left-2">
            <Badge variant="outline" className="bg-black/50 backdrop-blur-md border-white/10 text-white gap-1">
              <Eye className="h-3 w-3" />
              Spectating
            </Badge>
          </div>
        </div>
      </div>
    );
  };

  const renderTicTacToeBoard = (state: TicTacToeGameState) => {
    return (
      <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-900/50 rounded-xl p-8 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
        <div className="absolute top-2 left-2">
          <Badge variant="outline" className="bg-white/80 dark:bg-black/50 border-zinc-200 dark:border-white/10 gap-1">
            <Eye className="h-3 w-3" />
            Spectating
          </Badge>
        </div>

        {state.status === "playing" && (
          <div className="absolute top-2 right-2">
            <Badge className={cn(
              "border-0",
              state.currentTurn === "X" ? "bg-blue-500" : "bg-red-500",
              "text-white"
            )}>
              {state.currentTurn}&apos;s turn
            </Badge>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 max-w-[300px]">
          {state.board.map((cell, i) => (
            <div
              key={i}
              className="aspect-square bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center text-4xl font-bold border border-zinc-200 dark:border-zinc-700"
            >
              {cell === "X" && <span className="text-blue-600 dark:text-blue-400">X</span>}
              {cell === "O" && <span className="text-red-600 dark:text-red-400">O</span>}
              {cell === null && <span className="text-zinc-300 dark:text-zinc-700 text-2xl">{i}</span>}
            </div>
          ))}
        </div>

        {state.status === "finished" && (
          <div className="absolute inset-0 bg-white/80 dark:bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <div className="bg-white dark:bg-zinc-900/90 rounded-xl p-6 text-center border border-zinc-200 dark:border-white/10">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                {state.winner === "draw" ? "Draw!" : `${state.winner} wins!`}
              </h3>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSnakeBoard = (state: SnakeGameState) => {
    const gridSize = state.gridSize || 15;

    return (
      <div className="relative aspect-square bg-zinc-900 dark:bg-zinc-950 rounded-xl p-2 border border-zinc-700 dark:border-zinc-800">
        <div className="absolute top-2 left-2 z-10">
          <Badge variant="outline" className="bg-black/50 backdrop-blur-md border-white/10 text-white gap-1">
            <Eye className="h-3 w-3" />
            Spectating
          </Badge>
        </div>

        <div className="absolute top-2 right-2 z-10">
          <Badge className="bg-emerald-600/80 backdrop-blur-md border-0">
            Score: {state.score}
          </Badge>
        </div>

        <div
          className="relative w-full h-full"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`,
            gap: "1px",
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, i) => {
            const x = i % gridSize;
            const y = Math.floor(i / gridSize);
            const isHead = state.snake[0]?.x === x && state.snake[0]?.y === y;
            const isBody = state.snake.slice(1).some((p) => p.x === x && p.y === y);
            const isFood = state.food?.x === x && state.food?.y === y;

            return (
              <div
                key={i}
                className={cn(
                  "rounded-sm",
                  isHead ? "bg-emerald-400" : isBody ? "bg-emerald-600" : isFood ? "bg-red-500" : "bg-zinc-800 dark:bg-zinc-900"
                )}
              />
            );
          })}
        </div>

        {state.gameOver && (
          <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center">
            <div className="bg-zinc-800/95 dark:bg-zinc-900/90 rounded-xl p-6 text-center border border-zinc-600 dark:border-white/10">
              <h3 className="text-xl font-bold text-red-400">Game Over!</h3>
              <p className="text-zinc-300 dark:text-zinc-400 mt-1">Final Score: {state.score}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCanvasBoard = (state: CanvasGameState) => {
    const { width, height, commands } = state;

    return (
      <div className="relative bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
        {/* Spectator badge */}
        <div className="absolute top-2 left-2 z-10">
          <Badge variant="outline" className="bg-white/80 dark:bg-black/50 border-zinc-200 dark:border-white/10 gap-1">
            <Eye className="h-3 w-3" />
            Spectating
          </Badge>
        </div>

        {/* Command counter */}
        <div className="absolute top-2 right-2 z-10">
          <Badge className="bg-pink-500/80 backdrop-blur-md border-0">
            {commands?.length || 0} commands
          </Badge>
        </div>

        {/* Canvas area - rendered by commands */}
        <div className="flex items-center justify-center min-h-[300px]">
          <div
            className="bg-white border-2 border-zinc-300 dark:border-zinc-600 rounded shadow-inner"
            style={{ width: (width || 64) * 5, height: (height || 64) * 5 }}
          >
            <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-sm">
              {commands && commands.length > 0 ? (
                <span className="text-pink-500">{commands.length} drawing commands received</span>
              ) : (
                <span>Waiting for drawing commands...</span>
              )}
            </div>
          </div>
        </div>

        {/* Canvas info */}
        <div className="mt-3 text-center text-xs text-zinc-500 dark:text-zinc-500">
          Canvas: {width || 64}×{height || 64} pixels
        </div>
      </div>
    );
  };

  const renderMinesweeperBoard = (state: MinesweeperGameState) => {
    const { rows, cols, board, revealed, flagged, status, flagsRemaining, elapsedSeconds } = state;

    // Number colors - classic Minesweeper
    const numberColors: Record<number, string> = {
      1: "text-blue-600", 2: "text-green-600", 3: "text-red-600",
      4: "text-purple-800", 5: "text-amber-800", 6: "text-cyan-600",
      7: "text-zinc-800", 8: "text-zinc-600",
    };

    return (
      <div className="relative bg-zinc-200 dark:bg-zinc-800 rounded-xl p-3 border border-zinc-300 dark:border-zinc-700">
        {/* Spectator badge */}
        <div className="absolute top-2 left-2 z-10">
          <Badge variant="outline" className="bg-white/80 dark:bg-black/50 border-zinc-200 dark:border-white/10 gap-1">
            <Eye className="h-3 w-3" />
            Spectating
          </Badge>
        </div>

        {/* Header bar */}
        <div className="flex items-center justify-between gap-4 p-2 bg-zinc-300 dark:bg-zinc-700 rounded-lg mb-2">
          <div className="flex items-center gap-1 bg-black px-2 py-1 rounded font-mono text-red-500 min-w-[50px] justify-center">
            <span>💣</span>
            <span>{String(flagsRemaining).padStart(3, "0")}</span>
          </div>
          <div className="text-2xl">
            {status === "won" ? "😎" : status === "lost" ? "😵" : "🙂"}
          </div>
          <div className="flex items-center gap-1 bg-black px-2 py-1 rounded font-mono text-red-500 min-w-[50px] justify-center">
            <span>⏱️</span>
            <span>{String(Math.min(elapsedSeconds || 0, 999)).padStart(3, "0")}</span>
          </div>
        </div>

        {/* Board */}
        <div
          className="inline-grid gap-0 p-1 bg-zinc-400 dark:bg-zinc-600 rounded"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: rows }, (_, row) =>
            Array.from({ length: cols }, (_, col) => {
              const isRevealed = revealed?.[row]?.[col];
              const isFlagged = flagged?.[row]?.[col];
              const value = board?.[row]?.[col] ?? 0;
              const isMine = value === -1;
              const showMine = status === "lost" && isMine;

              return (
                <div
                  key={`${row}-${col}`}
                  className={cn(
                    "w-5 h-5 flex items-center justify-center text-[10px] font-bold select-none",
                    !isRevealed && !showMine && "bg-zinc-300 dark:bg-zinc-500 border-t border-l border-white/40 border-b border-r border-zinc-500/60",
                    isRevealed && !isMine && "bg-zinc-200 dark:bg-zinc-700 border border-zinc-400 dark:border-zinc-600",
                    isRevealed && isMine && "bg-red-500",
                    showMine && !isRevealed && "bg-zinc-200 dark:bg-zinc-700"
                  )}
                >
                  {isFlagged && !showMine && "🚩"}
                  {showMine && "💣"}
                  {isRevealed && !isMine && value > 0 && (
                    <span className={numberColors[value]}>{value}</span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Game over overlay */}
        {(status === "won" || status === "lost") && (
          <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <div className="bg-white/95 dark:bg-zinc-900/90 rounded-xl p-6 text-center border border-zinc-200 dark:border-white/10">
              <div className="text-4xl mb-2">{status === "won" ? "😎" : "💥"}</div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                {status === "won" ? "Victory!" : "Game Over"}
              </h3>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render preview board based on game type
  const renderPreviewBoard = () => {
    switch (gameType) {
      case "chess":
        return (
          <Chessboard
            position="start"
            arePiecesDraggable={false}
            boardOrientation="white"
            customBoardStyle={{ borderRadius: "16px" }}
            customDarkSquareStyle={{ backgroundColor: "#4a7c59" }}
            customLightSquareStyle={{ backgroundColor: "#ebecd0" }}
          />
        );
      case "tictactoe":
        return (
          <div className="aspect-square p-8 flex items-center justify-center">
            <div className="grid grid-cols-3 gap-2 max-w-[300px] w-full">
              {Array(9).fill(null).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-white dark:bg-zinc-800 rounded-lg flex items-center justify-center text-2xl font-bold border border-zinc-200 dark:border-zinc-700"
                >
                  <span className="text-zinc-300 dark:text-zinc-700">{i}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case "snake":
        return (
          <div className="aspect-square p-2 bg-zinc-900 dark:bg-zinc-950 rounded-xl">
            <div
              className="w-full h-full"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(15, 1fr)",
                gridTemplateRows: "repeat(15, 1fr)",
                gap: "1px",
              }}
            >
              {Array(225).fill(null).map((_, i) => {
                const isSnakeHead = i === 112; // center
                const isFood = i === 100;
                return (
                  <div
                    key={i}
                    className={cn(
                      "rounded-sm",
                      isSnakeHead ? "bg-emerald-400" : isFood ? "bg-red-500" : "bg-zinc-800 dark:bg-zinc-900"
                    )}
                  />
                );
              })}
            </div>
          </div>
        );
      case "canvas":
        return (
          <div className="aspect-square p-4 bg-white dark:bg-zinc-900 rounded-xl flex flex-col items-center justify-center">
            {/* Mini canvas preview */}
            <div className="w-48 h-48 bg-white border-2 border-zinc-300 dark:border-zinc-600 rounded shadow-inner flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">🎨</div>
                <div className="text-xs text-zinc-400">64×64 canvas</div>
              </div>
            </div>
          </div>
        );
      case "minesweeper":
        return (
          <div className="aspect-square p-4 bg-zinc-200 dark:bg-zinc-800 rounded-xl flex flex-col items-center justify-center">
            {/* Mini header */}
            <div className="flex items-center gap-3 mb-3 text-lg">
              <span className="bg-black px-2 py-1 rounded font-mono text-red-500">💣010</span>
              <span className="text-2xl">🙂</span>
              <span className="bg-black px-2 py-1 rounded font-mono text-red-500">⏱️000</span>
            </div>
            {/* Preview grid */}
            <div className="grid grid-cols-9 gap-0 p-1 bg-zinc-400 dark:bg-zinc-600 rounded">
              {Array(81).fill(null).map((_, i) => {
                const revealed = [10, 11, 12, 19, 20, 21, 28, 29, 30].includes(i);
                const flagged = i === 5;
                const number = i === 11 ? 1 : i === 20 ? 2 : 0;
                return (
                  <div
                    key={i}
                    className={cn(
                      "w-4 h-4 flex items-center justify-center text-[8px] font-bold",
                      !revealed && !flagged && "bg-zinc-300 dark:bg-zinc-500 border-t border-l border-white/40",
                      revealed && "bg-zinc-200 dark:bg-zinc-700 border border-zinc-400"
                    )}
                  >
                    {flagged && "🚩"}
                    {revealed && number === 1 && <span className="text-blue-600">1</span>}
                    {revealed && number === 2 && <span className="text-green-600">2</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // ==========================================================================
  // RENDER: No room yet - Board-first 2-column layout
  // ==========================================================================
  if (!roomId) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Preview Board */}
        <div className="lg:col-span-2">
          <div className="relative group">
            {/* Gradient glow */}
            <div
              className={cn(
                "absolute -inset-2 rounded-2xl blur-xl opacity-20 dark:opacity-30 transition-opacity",
                gameType === "chess" ? "bg-gradient-to-br from-emerald-500/30 via-transparent to-amber-500/20" :
                gameType === "tictactoe" ? "bg-gradient-to-br from-purple-500/30 via-transparent to-pink-500/20" :
                gameType === "canvas" ? "bg-gradient-to-br from-pink-500/30 via-transparent to-purple-500/20" :
                gameType === "minesweeper" ? "bg-gradient-to-br from-zinc-500/30 via-transparent to-red-500/20" :
                "bg-gradient-to-br from-green-500/30 via-transparent to-emerald-500/20",
                "group-hover:opacity-40"
              )}
            />

            {/* Board container */}
            <div
              className={cn(
                "relative rounded-2xl overflow-hidden",
                "bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm",
                "shadow-xl shadow-black/10 dark:shadow-black/30",
                "ring-1 ring-black/5 dark:ring-white/10"
              )}
            >
              {renderPreviewBoard()}

              {/* Overlay hint */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent flex items-end justify-center pb-8 pointer-events-none">
                <div className="flex items-center gap-2 text-white/90 text-sm font-medium px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm">
                  <Eye className="h-4 w-4" />
                  Create room to spectate live
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Setup Panel */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Info Card */}
          <div
            className={cn(
              "rounded-xl p-5",
              "bg-white dark:bg-zinc-900/80",
              "border border-zinc-200 dark:border-zinc-800",
              "shadow-lg"
            )}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">Live Spectating</h3>
                <p className="text-xs text-zinc-500">Watch AI play in real-time</p>
              </div>
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Create a room and connect your MCP client (Claude, Cursor, etc.) to play. Watch the game live as moves stream in.
            </p>

            <Button
              onClick={createRoom}
              disabled={isCreatingRoom}
              className={cn(
                "w-full gap-2 h-11",
                "bg-gradient-to-r from-blue-600 to-blue-700",
                "hover:from-blue-500 hover:to-blue-600",
                "shadow-lg shadow-blue-500/20 dark:shadow-blue-900/30"
              )}
            >
              {isCreatingRoom ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create Game Room
            </Button>
          </div>

          {/* How it works */}
          <div
            className={cn(
              "rounded-xl p-4 flex-1",
              "bg-zinc-50 dark:bg-zinc-900/50",
              "border border-zinc-200 dark:border-zinc-800"
            )}
          >
            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">How it works</h4>
            <ol className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">1</span>
                <span>Create a room to get MCP URL</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">2</span>
                <span>Copy URL to your AI client config</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">3</span>
                <span>AI calls MCP tools, watch live!</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: Active room - Command Center layout
  // ==========================================================================
  return (
    <div className="space-y-6">
      {/* Main content - 2-column Command Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Live board (larger) */}
        <div className="lg:col-span-2">
          {/* Header bar above board */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Connection status */}
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                  "border transition-colors",
                  isConnected
                    ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30"
                    : isConnecting
                    ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30"
                    : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30"
                )}
              >
                {isConnecting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isConnected ? (
                  <Wifi className="h-3.5 w-3.5" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5" />
                )}
                {isConnecting ? "Connecting..." : isConnected ? "Live" : "Disconnected"}
              </div>

              {/* Room ID */}
              <code className="text-xs text-zinc-400 dark:text-zinc-600 font-mono">
                {roomId.slice(0, 8)}...
              </code>
            </div>

            {/* Copy URL button */}
            {roomInfo && (
              <Button
                variant="outline"
                size="sm"
                onClick={copyMcpUrl}
                className="gap-2 h-8"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy URL
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Board */}
          {renderBoard()}
        </div>

        {/* Right: MCP Command stream (terminal) */}
        <div className="lg:col-span-1">
          <MCPCommandLog commands={commands} maxHeight="500px" />
        </div>
      </div>

      {/* Room config (collapsible) - outside grid */}
      {roomInfo && <RoomConfig roomInfo={roomInfo} />}
    </div>
  );
}
