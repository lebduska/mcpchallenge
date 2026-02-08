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
  Users,
  Bot,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MCPCommandLog } from "./mcp-command-log";
import { RoomConfig } from "./room-config";
import { ConnectionStatus, deriveConnectionState } from "./connection-status";
import { ClientSelector } from "./client-selector";
import type { AgentIdentity } from "./agent-chip";
import { PvPAgents, type PvPPlayersState } from "./pvp-agents";
import { cn } from "@/lib/utils";
import { formatRoomId } from "@/lib/room-name";
import { SuccessCelebration } from "@/components/onboarding";
import type {
  GameType,
  GameState,
  ChessGameState,
  TicTacToeGameState,
  SnakeGameState,
  CanvasGameState,
  MinesweeperGameState,
  SokobanGameState,
  FractalsGameState,
  LightsOutGameState,
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
  const [agentIdentity, setAgentIdentity] = useState<AgentIdentity | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  // PvP mode state
  const [gameMode, setGameMode] = useState<"ai" | "pvp">("ai");
  const [pvpPlayers, setPvpPlayers] = useState<PvPPlayersState>({ white: null, black: null });
  // Selected mode for room creation
  const [selectedMode, setSelectedMode] = useState<"ai" | "pvp">("ai");
  // Advanced drawer state
  const [advancedOpen, setAdvancedOpen] = useState(false);
  // First command celebration
  const [showFirstCommandCelebration, setShowFirstCommandCelebration] = useState(false);
  const [hasShownCelebration, setHasShownCelebration] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`mcp-first-command-${gameType}`) === "true";
  });

  const mcpBaseUrl =
    process.env.NEXT_PUBLIC_MCP_URL || "https://mcp.mcpchallenge.org";

  // Create a new room
  const createRoom = useCallback(async () => {
    setIsCreatingRoom(true);
    try {
      const response = await fetch(`${mcpBaseUrl}/${gameType}/room/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: selectedMode }),
      });
      const data = (await response.json()) as {
        roomId?: string;
        mcpUrl?: string;
        sseUrl?: string;
        wsUrl?: string;
        sessionNonce?: string;
        gameMode?: "ai" | "pvp";
      };

      if (data.roomId) {
        setRoomId(data.roomId);
        // Set game mode from response
        if (data.gameMode) {
          setGameMode(data.gameMode);
        }
        const info: RoomInfo = {
          roomId: data.roomId,
          gameType,
          mcpUrl: data.mcpUrl || `${mcpBaseUrl}/${gameType}?room=${data.roomId}`,
          sseUrl: data.sseUrl || `${mcpBaseUrl}/${gameType}/sse?room=${data.roomId}`,
          wsUrl: data.wsUrl,
          sessionNonce: data.sessionNonce,
          gameMode: data.gameMode,
        };
        setRoomInfo(info);
        onRoomCreated?.(info);
      }
    } catch (error) {
      console.error("Failed to create room:", error);
    } finally {
      setIsCreatingRoom(false);
    }
  }, [gameType, mcpBaseUrl, onRoomCreated, selectedMode]);

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
        const data = JSON.parse(event.data) as RoomState & {
          agentIdentity?: AgentIdentity;
          gameMode?: "ai" | "pvp";
          players?: PvPPlayersState;
        };
        setGameState(data.gameState);
        // Update game mode if present
        if (data.gameMode) {
          setGameMode(data.gameMode);
        }
        // Update PvP players if present
        if (data.players) {
          setPvpPlayers(data.players);
        }
        // Also update agent identity if present in state (AI mode)
        if (data.agentIdentity) {
          setAgentIdentity(data.agentIdentity);
        }
      } catch (error) {
        console.error("Failed to parse state:", error);
      }
    });

    eventSource.addEventListener("command", (event) => {
      try {
        const cmd = JSON.parse(event.data) as CommandLogEntry;
        setCommands((prev) => {
          // Trigger celebration on first command (if not shown before)
          if (prev.length === 0) {
            const celebrationKey = `mcp-first-command-${gameType}`;
            if (localStorage.getItem(celebrationKey) !== "true") {
              localStorage.setItem(celebrationKey, "true");
              setHasShownCelebration(true);
              setShowFirstCommandCelebration(true);
            }
          }
          return [...prev.slice(-99), cmd];
        });
      } catch (error) {
        console.error("Failed to parse command:", error);
      }
    });

    eventSource.addEventListener("agent", (event) => {
      try {
        const data = JSON.parse(event.data) as { identity: AgentIdentity };
        setAgentIdentity(data.identity);
      } catch (error) {
        console.error("Failed to parse agent:", error);
      }
    });

    // PvP players update
    eventSource.addEventListener("players", (event) => {
      try {
        const data = JSON.parse(event.data) as PvPPlayersState;
        setPvpPlayers(data);
        // If we have players, we're in PvP mode
        if (data.white || data.black) {
          setGameMode("pvp");
        }
      } catch (error) {
        console.error("Failed to parse players:", error);
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
      setAgentIdentity(null);
      setGameMode("ai");
      setPvpPlayers({ white: null, black: null });
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
      case "sokoban":
        return renderSokobanBoard(gameState as SokobanGameState);
      case "fractals":
        return renderFractalsBoard(gameState as FractalsGameState);
      case "lightsout":
        return renderLightsOutBoard(gameState as LightsOutGameState);
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

  const renderSokobanBoard = (state: SokobanGameState) => {
    const { rows, cols, board, player, boxes, goals, levelIndex, totalLevels, moveCount, pushCount, status } = state;

    // Helper to check if position has item
    const isPlayer = (r: number, c: number) => player?.row === r && player?.col === c;
    const isBox = (r: number, c: number) => boxes?.some(b => b.row === r && b.col === c);
    const isGoal = (r: number, c: number) => goals?.some(g => g.row === r && g.col === c);
    const boxesOnGoals = boxes?.filter(b => goals?.some(g => g.row === b.row && g.col === b.col)).length || 0;

    return (
      <div className="relative bg-stone-800 dark:bg-stone-900 rounded-xl p-3 border border-stone-600 dark:border-stone-700">
        {/* Spectator badge */}
        <div className="absolute top-2 left-2 z-10">
          <Badge variant="outline" className="bg-black/50 backdrop-blur-md border-white/10 text-white gap-1">
            <Eye className="h-3 w-3" />
            Spectating
          </Badge>
        </div>

        {/* Header bar */}
        <div className="flex items-center justify-between gap-4 p-2 bg-stone-700 dark:bg-stone-800 rounded-lg mb-2">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-sm">
            <span>📦</span>
            <span>{boxesOnGoals}/{goals?.length || 0}</span>
          </div>
          <div className="text-amber-100 text-sm font-medium">
            Level {(levelIndex || 0) + 1}/{totalLevels || 60}
          </div>
          <div className="flex items-center gap-2 text-stone-300 font-mono text-sm">
            <span>Moves: {moveCount || 0}</span>
          </div>
        </div>

        {/* Board */}
        <div
          className="inline-grid gap-0 p-1 bg-stone-900 rounded"
          style={{ gridTemplateColumns: `repeat(${cols || 10}, 1fr)` }}
        >
          {Array.from({ length: rows || 10 }, (_, row) =>
            Array.from({ length: cols || 10 }, (_, col) => {
              const cell = board?.[row]?.[col];
              const hasPlayer = isPlayer(row, col);
              const hasBox = isBox(row, col);
              const hasGoal = isGoal(row, col);
              const isWall = cell === "wall";
              const boxOnGoal = hasBox && hasGoal;

              return (
                <div
                  key={`${row}-${col}`}
                  className={cn(
                    "w-5 h-5 flex items-center justify-center text-[10px] font-bold select-none",
                    isWall && "bg-red-900 border border-red-950",
                    !isWall && hasGoal && "bg-amber-200 dark:bg-amber-900/30",
                    !isWall && !hasGoal && "bg-stone-200 dark:bg-stone-700"
                  )}
                >
                  {hasPlayer && <div className="w-3.5 h-3.5 rounded-full bg-blue-500" />}
                  {hasBox && !hasPlayer && (
                    <div className={cn(
                      "w-3.5 h-3.5 rounded-sm",
                      boxOnGoal ? "bg-emerald-500" : "bg-amber-500"
                    )} />
                  )}
                  {hasGoal && !hasBox && !hasPlayer && (
                    <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Win overlay */}
        {status === "won" && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <div className="bg-stone-800/95 rounded-xl p-6 text-center border border-amber-500/30">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-xl font-bold text-amber-400">Level Complete!</h3>
              <p className="text-stone-400 mt-1">Moves: {moveCount} | Pushes: {pushCount}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFractalsBoard = (state: FractalsGameState) => {
    const { axiom, rules, iterations, angle, preset, colorScheme, stats } = state;

    return (
      <div className="relative bg-zinc-900 dark:bg-zinc-950 rounded-xl p-4 border border-purple-500/30">
        {/* Spectator badge */}
        <div className="absolute top-2 left-2 z-10">
          <Badge variant="outline" className="bg-black/50 backdrop-blur-md border-white/10 text-white gap-1">
            <Eye className="h-3 w-3" />
            Spectating
          </Badge>
        </div>

        {/* Preset badge */}
        {preset && (
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-purple-600/80 backdrop-blur-md border-0">
              {preset}
            </Badge>
          </div>
        )}

        {/* Canvas placeholder */}
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-6xl mb-4">🌳</div>
            <div className="text-purple-400 font-medium">L-System Fractal</div>
            <div className="text-zinc-500 text-sm mt-2">
              Axiom: <code className="text-purple-300">{axiom}</code>
            </div>
            <div className="text-zinc-500 text-sm">
              Rules: {rules?.length || 0} | Iterations: {iterations} | Angle: {angle}°
            </div>
            {stats && (
              <div className="text-zinc-600 text-xs mt-2">
                Segments: {stats.segmentsDrawn} | Depth: {stats.maxDepth}
              </div>
            )}
          </div>
        </div>

        {/* Color scheme indicator */}
        <div className="absolute bottom-2 right-2">
          <Badge variant="outline" className="bg-black/50 backdrop-blur-md border-purple-500/30 text-purple-300 text-xs">
            {colorScheme || "monochrome"}
          </Badge>
        </div>
      </div>
    );
  };

  const renderLightsOutBoard = (state: LightsOutGameState) => {
    const { grid, size, toggleCount, status } = state;
    const lightsOn = grid?.flat().filter(Boolean).length || 0;

    return (
      <div className="relative bg-zinc-950 rounded-xl p-4 border border-yellow-500/30">
        {/* Spectator badge */}
        <div className="absolute top-2 left-2 z-10">
          <Badge variant="outline" className="bg-black/50 backdrop-blur-md border-white/10 text-white gap-1">
            <Eye className="h-3 w-3" />
            Spectating
          </Badge>
        </div>

        {/* Status badge */}
        <div className="absolute top-2 right-2 z-10">
          <Badge className={cn(
            "backdrop-blur-md border-0",
            status === "won" ? "bg-green-600/80" : "bg-yellow-600/80"
          )}>
            {status === "won" ? "Solved!" : `${lightsOn} lights on`}
          </Badge>
        </div>

        {/* Grid */}
        <div className="flex items-center justify-center min-h-[400px]">
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${size || 5}, 1fr)`,
            }}
          >
            {grid?.flat().map((isOn, i) => (
              <div
                key={i}
                className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center border-2",
                  isOn ? [
                    "bg-yellow-300",
                    "border-yellow-400",
                    "shadow-[0_0_15px_rgba(250,204,21,0.8)]",
                  ] : [
                    "bg-zinc-800",
                    "border-zinc-600",
                  ]
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full",
                    isOn
                      ? "bg-gradient-to-br from-yellow-100 via-yellow-200 to-yellow-400"
                      : "bg-gradient-to-br from-zinc-700 to-zinc-900"
                  )}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Toggle counter */}
        <div className="absolute bottom-2 right-2">
          <Badge variant="outline" className="bg-black/50 backdrop-blur-md border-yellow-500/30 text-yellow-300 text-xs">
            Toggles: {toggleCount || 0}
          </Badge>
        </div>
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
      case "sokoban":
        return (
          <div className="aspect-square p-4 bg-stone-800 dark:bg-stone-900 rounded-xl flex flex-col items-center justify-center">
            {/* Mini header */}
            <div className="flex items-center gap-3 mb-3 text-sm">
              <span className="text-amber-400">📦 0/3</span>
              <span className="text-stone-300">Level 1/60</span>
            </div>
            {/* Preview grid - simple sokoban pattern */}
            <div className="grid grid-cols-7 gap-0 p-1 bg-stone-900 rounded">
              {Array(49).fill(null).map((_, i) => {
                const walls = [0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,47,48];
                const player = i === 23;
                const box = i === 24;
                const goal = i === 31;
                const isWall = walls.includes(i);
                return (
                  <div
                    key={i}
                    className={cn(
                      "w-4 h-4 flex items-center justify-center",
                      isWall && "bg-red-900",
                      !isWall && goal && "bg-amber-200/30",
                      !isWall && !goal && "bg-stone-700"
                    )}
                  >
                    {player && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                    {box && <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" />}
                    {goal && !box && <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />}
                  </div>
                );
              })}
            </div>
          </div>
        );
      case "fractals":
        return (
          <div className="aspect-square p-4 bg-zinc-900 dark:bg-zinc-950 rounded-xl flex flex-col items-center justify-center">
            {/* Fractal preview */}
            <div className="text-center">
              <div className="text-6xl mb-4">🌳</div>
              <div className="text-purple-400 font-medium">L-System Fractals</div>
              <div className="text-zinc-500 text-sm mt-2">
                Define rules, generate patterns
              </div>
              <div className="flex gap-2 mt-4 justify-center">
                <Badge className="bg-purple-600/50 text-purple-200 text-xs">tree</Badge>
                <Badge className="bg-green-600/50 text-green-200 text-xs">plant</Badge>
                <Badge className="bg-red-600/50 text-red-200 text-xs">dragon</Badge>
              </div>
            </div>
          </div>
        );
      case "lightsout":
        return (
          <div className="aspect-square p-4 bg-zinc-950 rounded-xl flex flex-col items-center justify-center">
            {/* Lights Out preview */}
            <div className="text-center">
              <div className="grid grid-cols-5 gap-2 mb-4">
                {Array(25).fill(null).map((_, i) => {
                  const isOn = [2, 7, 11, 12, 13, 17, 22].includes(i); // Cross pattern
                  return (
                    <div
                      key={i}
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center border-2",
                        isOn ? [
                          "bg-yellow-300",
                          "border-yellow-400",
                          "shadow-[0_0_10px_rgba(250,204,21,0.6)]",
                        ] : [
                          "bg-zinc-800",
                          "border-zinc-700",
                        ]
                      )}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full",
                          isOn
                            ? "bg-gradient-to-br from-yellow-100 to-yellow-400"
                            : "bg-gradient-to-br from-zinc-700 to-zinc-900"
                        )}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="text-yellow-400 font-medium">Lights Out</div>
              <div className="text-zinc-500 text-sm mt-2">
                Toggle lights to turn them all off
              </div>
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
                gameType === "sokoban" ? "bg-gradient-to-br from-amber-500/30 via-transparent to-stone-500/20" :
                gameType === "gorillas" ? "bg-gradient-to-br from-yellow-500/30 via-transparent to-amber-500/20" :
                gameType === "fractals" ? "bg-gradient-to-br from-purple-500/30 via-transparent to-fuchsia-500/20" :
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
              Create a room, connect your AI agent, and watch the game live.
            </p>

            {/* Mode dropdown - only for competitive games (chess, tictactoe) */}
            {(gameType === "chess" || gameType === "tictactoe") && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-zinc-500">Mode:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-8">
                      {selectedMode === "ai" ? (
                        <>
                          <Bot className="h-3.5 w-3.5" />
                          vs AI
                        </>
                      ) : (
                        <>
                          <Users className="h-3.5 w-3.5" />
                          MCP vs MCP
                        </>
                      )}
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => setSelectedMode("ai")}>
                      <Bot className="h-4 w-4 mr-2" />
                      vs AI
                      <span className="text-xs text-zinc-500 ml-2">Single agent</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedMode("pvp")}>
                      <Users className="h-4 w-4 mr-2" />
                      MCP vs MCP
                      <span className="text-xs text-zinc-500 ml-2">Two agents</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

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
  // RENDER: Active room - Simplified 2-step onboarding
  // ==========================================================================

  // MCP URL for this room
  const mcpUrl = roomInfo?.mcpUrl || `${mcpBaseUrl}/${gameType}?room=${roomId}`;

  // Derive connection state for the new animated status component
  const hasAgent = !!(agentIdentity || pvpPlayers.white || pvpPlayers.black);
  const hasCommands = commands.length > 0;
  const connectionState = deriveConnectionState({
    isConnecting,
    isConnected,
    hasAgent,
    hasCommands,
  });

  // Get agent name for display
  const currentAgentName = gameMode === "pvp"
    ? (pvpPlayers.white?.name || pvpPlayers.black?.name)
    : agentIdentity?.name;

  // Human-readable room name
  const roomDisplay = roomId ? formatRoomId(roomId) : null;

  return (
    <div className="space-y-4">
      {/* 2-Step Onboarding Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Step 1: Room Created ✓ */}
        <div className="rounded-xl p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">
              ✓
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">Room Created</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  {roomDisplay?.name}
                </span>
                <code className="text-xs text-emerald-500 dark:text-emerald-500 font-mono opacity-60">
                  ({roomDisplay?.shortId})
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Connect Agent */}
        <div className="rounded-xl p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
              2
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">Connect your agent</h3>
          </div>

          {/* URL-first client selector */}
          <ClientSelector mcpUrl={mcpUrl} />
        </div>
      </div>

      {/* Main content - 2-column Command Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Live board (larger) */}
        <div className="lg:col-span-2">
          {/* Header bar above board */}
          <div className="flex items-center justify-between mb-3">
            {/* Connection status chip - animated multi-stage */}
            <ConnectionStatus state={connectionState} agentName={currentAgentName} />

            {/* Agent display - PvP mode */}
            {gameMode === "pvp" && (pvpPlayers.white || pvpPlayers.black) && (
              <PvPAgents
                players={pvpPlayers}
                currentTurn={(gameState as ChessGameState)?.turn || "white"}
              />
            )}

            {/* Room actions */}
            <div className="flex items-center gap-2">
              {gameMode === "pvp" && (
                <Badge variant="outline" className="gap-1 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-500/50">
                  <Users className="h-3 w-3" />
                  PvP
                </Badge>
              )}
              <span className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
                {roomDisplay?.name}
              </span>
            </div>
          </div>

          {/* Board */}
          {renderBoard()}
        </div>

        {/* Right: MCP Command stream (terminal) */}
        <div className="lg:col-span-1">
          <MCPCommandLog commands={commands} maxHeight="500px" />
        </div>
      </div>

      {/* Advanced Config Drawer */}
      {roomInfo && (
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="h-3.5 w-3.5" />
                Advanced config
              </span>
              {advancedOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <RoomConfig roomInfo={roomInfo} />
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* First command celebration */}
      <SuccessCelebration
        challengeId={gameType}
        challengeName={gameType.charAt(0).toUpperCase() + gameType.slice(1)}
        isFirstCompletion={true}
        pointsEarned={25}
        show={showFirstCommandCelebration}
        onClose={() => setShowFirstCommandCelebration(false)}
      />
    </div>
  );
}
