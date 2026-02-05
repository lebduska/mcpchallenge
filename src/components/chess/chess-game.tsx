"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import dynamic from "next/dynamic";
import type { PieceDropHandlerArgs } from "react-chessboard";

// Dynamic import with SSR disabled - react-chessboard uses DOM APIs
const Chessboard = dynamic(
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RotateCcw,
  Flag,
  Users,
  Trophy,
  Cpu,
  Play,
  Sparkles,
} from "lucide-react";
import { useStockfish, type Difficulty } from "@/hooks/use-stockfish";
import { useGameCompletion } from "@/lib/game-completion";
import { GameHUDBar } from "./game-hud";
import { MoveTimeline } from "./move-timeline";
import { cn } from "@/lib/utils";

type GameMode = "vs-ai" | "vs-player" | null;
type GameStatus = "waiting" | "playing" | "checkmate" | "draw" | "resigned";
type HUDState = "your-turn" | "ai-thinking" | "opponent-turn" | "checkmate" | "draw" | "resigned" | "check";

interface ChessGameProps {
  onMoveForMCP?: (move: string, fen: string) => void;
  onGameComplete?: (result: { winner: "player" | "engine" | "draw"; moves: number }) => void;
}

export function ChessGame({ onMoveForMCP, onGameComplete }: ChessGameProps) {
  const [game, setGame] = useState(new Chess());
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>("waiting");
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  // Stockfish engine
  const {
    isReady: stockfishReady,
    isThinking,
    getBestMove,
    difficulty,
    setDifficulty,
    error: stockfishError
  } = useStockfish();

  // Track if completion was called
  const completionCalledRef = useRef(false);

  // Game completion hook
  const { submitCompletion, isAuthenticated } = useGameCompletion("chess");

  // Derive HUD state
  const getHUDState = useCallback((): HUDState => {
    if (gameStatus === "checkmate") return "checkmate";
    if (gameStatus === "draw") return "draw";
    if (gameStatus === "resigned") return "resigned";
    if (game.isCheck()) return "check";
    if (isThinking) return "ai-thinking";

    const isPlayerTurn =
      (playerColor === "white" && game.turn() === "w") ||
      (playerColor === "black" && game.turn() === "b");

    if (gameMode === "vs-ai") {
      return isPlayerTurn ? "your-turn" : "ai-thinking";
    }
    return isPlayerTurn ? "your-turn" : "opponent-turn";
  }, [gameStatus, game, isThinking, playerColor, gameMode]);

  // Get winner color
  const getWinner = useCallback((): "white" | "black" | null => {
    if (gameStatus === "checkmate" || gameStatus === "resigned") {
      return game.turn() === "w" ? "black" : "white";
    }
    return null;
  }, [gameStatus, game]);

  // Check game state
  const checkGameState = useCallback((currentGame: Chess) => {
    if (currentGame.isCheckmate()) {
      setGameStatus("checkmate");
    } else if (currentGame.isDraw()) {
      setGameStatus("draw");
    }
  }, []);

  // Notify game completion
  useEffect(() => {
    if (
      (gameStatus === "checkmate" || gameStatus === "draw") &&
      !completionCalledRef.current &&
      gameMode === "vs-ai"
    ) {
      completionCalledRef.current = true;

      let winner: "player" | "engine" | "draw" = "draw";
      if (gameStatus === "checkmate") {
        const winnerColor = game.turn() === "w" ? "black" : "white";
        winner = winnerColor === playerColor ? "player" : "engine";
      }

      if (onGameComplete) {
        onGameComplete({
          winner,
          moves: moveHistory.length,
        });
      }

      if (isAuthenticated) {
        submitCompletion({
          winner,
          moves: moveHistory.length,
        });
      }
    }
    if (gameStatus === "waiting") {
      completionCalledRef.current = false;
    }
  }, [gameStatus, gameMode, onGameComplete, game, playerColor, moveHistory.length, isAuthenticated, submitCompletion]);

  // Make engine move using Stockfish
  const makeEngineMove = useCallback(async (currentGame: Chess) => {
    if (currentGame.isGameOver()) return;
    if (!stockfishReady) return;

    try {
      const bestMoveUCI = await getBestMove(currentGame.fen());
      if (!bestMoveUCI) return;

      const from = bestMoveUCI.slice(0, 2);
      const to = bestMoveUCI.slice(2, 4);
      const promotion = bestMoveUCI.length > 4 ? bestMoveUCI[4] : undefined;

      const gameCopy = new Chess(currentGame.fen());
      const result = gameCopy.move({ from, to, promotion });

      if (result) {
        setGame(gameCopy);
        setMoveHistory(prev => [...prev, result.san]);
        setLastMove({ from, to });
        checkGameState(gameCopy);
        onMoveForMCP?.(result.san, gameCopy.fen());
      }
    } catch (error) {
      console.error("Engine move error:", error);
    }
  }, [checkGameState, onMoveForMCP, getBestMove, stockfishReady]);

  // Handle player move
  const onDrop = useCallback(
    ({ sourceSquare, targetSquare, piece }: PieceDropHandlerArgs) => {
      if (gameStatus !== "playing") return false;
      if (isThinking) return false;
      if (!targetSquare) return false;

      if (gameMode === "vs-ai") {
        const isWhiteTurn = game.turn() === "w";
        if ((playerColor === "white" && !isWhiteTurn) ||
            (playerColor === "black" && isWhiteTurn)) {
          return false;
        }
      }

      const gameCopy = new Chess(game.fen());
      const pieceType = piece.pieceType;
      const isPawn = pieceType[1] === "P";
      const isWhitePiece = pieceType[0] === "w";
      const isPromotion = isPawn &&
        ((isWhitePiece && targetSquare[1] === "8") ||
         (!isWhitePiece && targetSquare[1] === "1"));

      try {
        const result = gameCopy.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: isPromotion ? "q" : undefined,
        });

        if (result === null) return false;

        setGame(gameCopy);
        setMoveHistory(prev => [...prev, result.san]);
        setLastMove({ from: sourceSquare, to: targetSquare });
        checkGameState(gameCopy);
        onMoveForMCP?.(result.san, gameCopy.fen());

        if (gameMode === "vs-ai" && !gameCopy.isGameOver()) {
          const isEngineTurn =
            (playerColor === "white" && gameCopy.turn() === "b") ||
            (playerColor === "black" && gameCopy.turn() === "w");

          if (isEngineTurn) {
            setTimeout(() => makeEngineMove(gameCopy), 300);
          }
        }

        return true;
      } catch {
        return false;
      }
    },
    [game, gameMode, gameStatus, isThinking, playerColor, checkGameState, makeEngineMove, onMoveForMCP]
  );

  // Start new game
  const startGame = (mode: GameMode, color: "white" | "black" = "white") => {
    const newGame = new Chess();
    setGame(newGame);
    setGameMode(mode);
    setGameStatus("playing");
    setMoveHistory([]);
    setPlayerColor(color);
    setLastMove(null);

    if (mode === "vs-ai" && color === "black") {
      setTimeout(() => makeEngineMove(newGame), 500);
    }
  };

  // Reset game
  const resetGame = () => {
    setGame(new Chess());
    setGameMode(null);
    setGameStatus("waiting");
    setMoveHistory([]);
    setLastMove(null);
  };

  // Resign
  const resign = () => {
    setGameStatus("resigned");
  };

  // Custom square styles for last move highlight
  const customSquareStyles = lastMove
    ? {
        [lastMove.from]: { backgroundColor: "rgba(16, 185, 129, 0.3)" },
        [lastMove.to]: { backgroundColor: "rgba(16, 185, 129, 0.4)" },
      }
    : {};

  // ==========================================================================
  // RENDER: Game Mode Selection (Start Screen) - Board-first 2-column layout
  // ==========================================================================
  if (gameMode === null) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Chess Board Preview */}
        <div className="lg:col-span-2">
          <div className="relative group">
            {/* Gradient glow behind board */}
            <div
              className={cn(
                "absolute -inset-2 rounded-2xl blur-xl opacity-20 dark:opacity-30 transition-opacity duration-500",
                "bg-gradient-to-br from-emerald-500/30 via-transparent to-amber-500/30",
                "group-hover:opacity-40 dark:group-hover:opacity-50"
              )}
            />

            {/* Board container with glassmorphism */}
            <div
              className={cn(
                "relative rounded-2xl overflow-hidden",
                "bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm",
                "shadow-xl shadow-black/10 dark:shadow-black/30",
                "ring-1 ring-black/5 dark:ring-white/10"
              )}
            >
              <Chessboard
                position="start"
                arePiecesDraggable={false}
                boardOrientation="white"
                customBoardStyle={{ borderRadius: "16px" }}
                customDarkSquareStyle={{ backgroundColor: "#4a7c59" }}
                customLightSquareStyle={{ backgroundColor: "#ebecd0" }}
              />

              {/* Overlay hint */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex items-end justify-center pb-8 pointer-events-none">
                <span className="text-white/80 text-sm font-medium px-4 py-2 rounded-full bg-black/30 backdrop-blur-sm">
                  Select game mode to start →
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Setup Panel */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Engine Status Card */}
          <div
            className={cn(
              "rounded-xl p-4",
              "bg-white dark:bg-zinc-900/80",
              "border border-zinc-200 dark:border-zinc-800",
              "shadow-lg"
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Engine
              </h3>
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
                  stockfishReady
                    ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                    : stockfishError
                    ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                )}
              >
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  stockfishReady ? "bg-emerald-500" : stockfishError ? "bg-red-500" : "bg-zinc-400 animate-pulse"
                )} />
                {stockfishReady ? "Ready" : stockfishError ? "Error" : "Loading"}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Cpu className="h-8 w-8 text-zinc-400 dark:text-zinc-600" />
              <div>
                <p className="font-semibold text-zinc-900 dark:text-white">Stockfish 17</p>
                <p className="text-xs text-zinc-500">NNUE / 3200+ ELO</p>
              </div>
            </div>
          </div>

          {/* Difficulty Card */}
          <div
            className={cn(
              "rounded-xl p-4",
              "bg-white dark:bg-zinc-900/80",
              "border border-zinc-200 dark:border-zinc-800",
              "shadow-lg"
            )}
          >
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
              Difficulty
            </h3>
            <Select value={difficulty} onValueChange={(val) => setDifficulty(val as Difficulty)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy (800 ELO)</SelectItem>
                <SelectItem value="medium">Medium (1500 ELO)</SelectItem>
                <SelectItem value="hard">Hard (2200 ELO)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Game Card */}
          <div
            className={cn(
              "rounded-xl p-4 flex-1",
              "bg-white dark:bg-zinc-900/80",
              "border border-zinc-200 dark:border-zinc-800",
              "shadow-lg"
            )}
          >
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
              Start Game
            </h3>

            <div className="space-y-3">
              <Button
                onClick={() => startGame("vs-ai", "white")}
                disabled={!stockfishReady}
                className={cn(
                  "w-full gap-2 h-11",
                  "bg-gradient-to-r from-emerald-600 to-emerald-700",
                  "hover:from-emerald-500 hover:to-emerald-600",
                  "shadow-lg shadow-emerald-500/20 dark:shadow-emerald-900/30",
                  "disabled:opacity-50"
                )}
              >
                <Play className="h-4 w-4" />
                Play as White
              </Button>

              <Button
                variant="outline"
                onClick={() => startGame("vs-ai", "black")}
                disabled={!stockfishReady}
                className="w-full gap-2 h-11"
              >
                <Play className="h-4 w-4" />
                Play as Black
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white dark:bg-zinc-900 px-2 text-xs text-zinc-400">or</span>
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={() => startGame("vs-player")}
                className="w-full gap-2 h-10 text-zinc-600 dark:text-zinc-400"
              >
                <Users className="h-4 w-4" />
                2 Players (Local)
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: Active Game - Board-first 2-column layout
  // ==========================================================================
  const hudState = getHUDState();
  const winner = getWinner();
  const isGameOver = gameStatus === "checkmate" || gameStatus === "draw" || gameStatus === "resigned";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Chess Board - Hero Element */}
      <div className="lg:col-span-2">
        <div className="relative group">
          {/* Gradient glow behind board */}
          <div
            className={cn(
              "absolute -inset-3 rounded-2xl blur-2xl transition-opacity duration-500",
              isThinking
                ? "opacity-50 dark:opacity-70 bg-gradient-to-br from-amber-500/30 via-transparent to-amber-600/20"
                : "opacity-20 dark:opacity-30 bg-gradient-to-br from-emerald-500/30 via-transparent to-amber-500/20",
              "group-hover:opacity-40 dark:group-hover:opacity-50"
            )}
          />

          {/* Board container with glassmorphism */}
          <div
            className={cn(
              "relative rounded-2xl overflow-hidden",
              "bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm",
              "shadow-2xl shadow-black/15 dark:shadow-black/40",
              "ring-1 ring-black/5 dark:ring-white/10"
            )}
          >
            <Chessboard
              position={game.fen()}
              onPieceDrop={onDrop}
              boardOrientation={playerColor}
              customBoardStyle={{ borderRadius: "16px" }}
              customDarkSquareStyle={{ backgroundColor: "#4a7c59" }}
              customLightSquareStyle={{ backgroundColor: "#ebecd0" }}
              customSquareStyles={customSquareStyles}
            />

            {/* AI Thinking overlay */}
            {isThinking && !isGameOver && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-2 rounded-full bg-amber-500/90 backdrop-blur-sm text-white text-sm font-medium shadow-lg animate-pulse">
                  <Cpu className="h-4 w-4 animate-spin" />
                  AI thinking...
                </div>
              </div>
            )}

            {/* Game over overlay */}
            {isGameOver && (
              <div className="absolute inset-0 bg-white/80 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-white dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl p-8 text-center border border-zinc-200 dark:border-white/10 shadow-2xl max-w-sm mx-4 animate-in slide-in-from-bottom-4 duration-500">
                  <div
                    className={cn(
                      "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
                      winner === playerColor
                        ? "bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-amber-500/30"
                        : winner
                        ? "bg-gradient-to-br from-zinc-500 to-zinc-600"
                        : "bg-gradient-to-br from-blue-500 to-blue-600"
                    )}
                  >
                    {winner === playerColor ? (
                      <Trophy className="h-8 w-8 text-white" />
                    ) : winner ? (
                      <Flag className="h-8 w-8 text-white" />
                    ) : (
                      <Sparkles className="h-8 w-8 text-white" />
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
                    {winner === playerColor ? "Victory!" : winner ? "Defeat" : "Draw!"}
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-sm">
                    {gameStatus === "checkmate"
                      ? "Checkmate!"
                      : gameStatus === "resigned"
                      ? "Game resigned"
                      : "Game ended in a draw"}
                  </p>

                  <Button
                    onClick={resetGame}
                    className="gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-lg shadow-emerald-500/20"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Play Again
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Sidebar - Status, Moves, Controls */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        {/* Game Status HUD */}
        <GameHUDBar
          state={hudState}
          winner={winner}
          playerColor={playerColor}
          turn={game.turn()}
          moveCount={moveHistory.length}
          className="rounded-xl"
        />

        {/* Move Timeline */}
        <div
          className={cn(
            "rounded-xl p-4 flex-1 min-h-0",
            "bg-white dark:bg-zinc-900/80",
            "border border-zinc-200 dark:border-zinc-800",
            "shadow-lg"
          )}
        >
          <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-3 flex items-center justify-between">
            Move History
            <span className="text-zinc-400 dark:text-zinc-600 font-mono">{moveHistory.length}</span>
          </h3>
          <MoveTimeline
            moves={moveHistory}
            playerColor={playerColor}
            gameMode={gameMode}
            className="h-72 lg:h-[calc(100%-2rem)]"
          />
        </div>

        {/* Controls */}
        {gameStatus === "playing" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 h-10 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={resetGame}
            >
              <RotateCcw className="h-4 w-4" />
              New Game
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "flex-1 gap-1.5 h-10 transition-colors",
                "border-red-200 dark:border-red-900/50",
                "text-red-600 dark:text-red-400",
                "hover:bg-red-50 dark:hover:bg-red-900/20",
                "hover:border-red-300 dark:hover:border-red-800"
              )}
              onClick={resign}
            >
              <Flag className="h-4 w-4" />
              Resign
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
