"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Chess } from "chess.js";
import dynamic from "next/dynamic";

// Types for react-chessboard callbacks
type Square = string;
type Piece = string;

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
import { AiThinkingDepthBar } from "./ai-thinking-depth-bar";
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
  const [fen, setFen] = useState("start");
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>("waiting");
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [legalMoveSquares, setLegalMoveSquares] = useState<string[]>([]);

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
        setFen(gameCopy.fen());
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
    (sourceSquare: Square, targetSquare: Square, piece: Piece) => {
      if (gameStatus !== "playing") return false;
      if (isThinking) return false;

      if (gameMode === "vs-ai") {
        const isWhiteTurn = game.turn() === "w";
        if ((playerColor === "white" && !isWhiteTurn) ||
            (playerColor === "black" && isWhiteTurn)) {
          return false;
        }
      }

      const gameCopy = new Chess(game.fen());
      // piece is like "wP", "bK" etc - first char is color, second is piece type
      const isPawn = piece[1] === "P";
      const isWhitePiece = piece[0] === "w";
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
        setFen(gameCopy.fen());
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

  // Handle piece drag begin - show legal moves
  const onPieceDragBegin = useCallback(
    (_piece: Piece, sourceSquare: Square) => {
      const moves = game.moves({ square: sourceSquare as never, verbose: true });
      const squares = moves.map(m => m.to);
      setLegalMoveSquares(squares);
    },
    [game]
  );

  // Handle piece drag end - clear legal moves
  const onPieceDragEnd = useCallback(() => {
    setLegalMoveSquares([]);
  }, []);

  // Start new game
  const startGame = (mode: GameMode, color: "white" | "black" = "white") => {
    const newGame = new Chess();
    setGame(newGame);
    setFen("start");
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
    setFen("start");
    setGameMode(null);
    setGameStatus("waiting");
    setMoveHistory([]);
    setLastMove(null);
  };

  // Resign
  const resign = () => {
    setGameStatus("resigned");
  };

  // Custom square styles for last move and legal moves highlight
  const customSquareStyles = useMemo(() => {
    const styles: Record<string, { backgroundColor: string; boxShadow?: string }> = {};

    // Last move highlight with soft inner glow
    if (lastMove) {
      styles[lastMove.from] = {
        backgroundColor: "rgba(16, 185, 129, 0.35)",
        boxShadow: "inset 0 0 12px rgba(16, 185, 129, 0.4)",
      };
      styles[lastMove.to] = {
        backgroundColor: "rgba(16, 185, 129, 0.45)",
        boxShadow: "inset 0 0 16px rgba(16, 185, 129, 0.5), 0 0 8px rgba(16, 185, 129, 0.3)",
      };
    }

    // Legal moves highlight with subtle pulse effect
    legalMoveSquares.forEach(square => {
      styles[square] = {
        backgroundColor: "rgba(59, 130, 246, 0.4)",
        boxShadow: "inset 0 0 8px rgba(59, 130, 246, 0.5)",
      };
    });

    return styles;
  }, [lastMove, legalMoveSquares]);

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
        {/* Ambient gradient background */}
        <div className="relative">
          {/* Soft ambient glow behind board */}
          <div
            className={cn(
              "absolute -inset-4 rounded-3xl blur-2xl opacity-40 dark:opacity-30",
              "bg-gradient-to-br from-emerald-500/20 via-transparent to-amber-500/20",
              "transition-opacity duration-700",
              isThinking && "opacity-60 dark:opacity-50",
              isGameOver && "opacity-20 dark:opacity-10"
            )}
          />

          {/* Board container */}
          <div
            className={cn(
              "relative rounded-2xl",
              "bg-white dark:bg-zinc-900",
              "shadow-2xl shadow-black/20 dark:shadow-black/50",
              "ring-1 ring-black/5 dark:ring-white/10",
              "transition-all duration-500"
            )}
          >
            <Chessboard
              id="PlayBoard"
              position={fen}
              onPieceDrop={onDrop}
              onPieceDragBegin={onPieceDragBegin}
              onPieceDragEnd={onPieceDragEnd}
              arePiecesDraggable={true}
              boardOrientation={playerColor}
              customBoardStyle={{ borderRadius: "16px" }}
              customDarkSquareStyle={{ backgroundColor: "#4a7c59" }}
              customLightSquareStyle={{ backgroundColor: "#ebecd0" }}
              customSquareStyles={customSquareStyles}
            />

            {/* Premium AI Thinking overlay */}
            {isThinking && !isGameOver && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Subtle pulsing border glow */}
                <div className="absolute inset-0 rounded-2xl animate-pulse ring-2 ring-amber-400/30 dark:ring-amber-500/20" />

                {/* Premium thinking badge */}
                <div className="absolute bottom-4 left-4 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 animate-in slide-in-from-left-2 duration-300">
                  {/* Animated spinner ring */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
                    <Cpu className="h-5 w-5 animate-spin" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold tracking-wide">Stockfish calculating…</span>
                    <span className="text-xs text-white/70">Analyzing position</span>
                  </div>
                </div>
              </div>
            )}

            {/* Game over overlay - Premium celebration */}
            {isGameOver && (
              <div className="absolute inset-0 bg-white/85 dark:bg-black/70 flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                {/* Victory accent dots - static */}
                {winner === playerColor && (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-yellow-400 rounded-full opacity-60" />
                    <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-amber-400 rounded-full opacity-50" />
                    <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-yellow-300 rounded-full opacity-60" />
                  </div>
                )}

                <div className="bg-white dark:bg-zinc-900/95 rounded-2xl p-8 text-center border border-zinc-200 dark:border-white/10 shadow-2xl max-w-sm mx-4 animate-in slide-in-from-bottom-4 zoom-in-95 duration-500">
                  {/* Glowing icon container */}
                  <div
                    className={cn(
                      "w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center relative",
                      winner === playerColor
                        ? "bg-gradient-to-br from-yellow-400 to-amber-500 shadow-xl shadow-amber-500/40"
                        : winner
                        ? "bg-gradient-to-br from-zinc-500 to-zinc-600 shadow-xl shadow-zinc-500/30"
                        : "bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl shadow-blue-500/30"
                    )}
                  >
                    {/* Glow ring for victory - static */}
                    {winner === playerColor && (
                      <div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-sm" />
                    )}
                    {winner === playerColor ? (
                      <Trophy className="h-10 w-10 text-white drop-shadow-lg" />
                    ) : winner ? (
                      <Flag className="h-10 w-10 text-white drop-shadow-lg" />
                    ) : (
                      <Sparkles className="h-10 w-10 text-white drop-shadow-lg" />
                    )}
                  </div>

                  <h3 className={cn(
                    "text-3xl font-bold mb-2",
                    winner === playerColor
                      ? "text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600"
                      : "text-zinc-900 dark:text-white"
                  )}>
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
                    className={cn(
                      "gap-2 shadow-lg transition-all duration-300 hover:scale-105",
                      winner === playerColor
                        ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 shadow-amber-500/30"
                        : "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-emerald-500/20"
                    )}
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

        {/* AI Thinking Depth Bar */}
        <AiThinkingDepthBar isThinking={isThinking} />

        {/* Move Timeline - Premium Card */}
        <div
          className={cn(
            "rounded-xl p-4 flex-1 min-h-0",
            "bg-gradient-to-b from-white to-zinc-50/50 dark:from-zinc-900/90 dark:to-zinc-950/80",
            "border border-zinc-200/80 dark:border-zinc-800/80",
            "shadow-lg shadow-black/5 dark:shadow-black/30",
            "transition-shadow duration-300 hover:shadow-xl"
          )}
        >
          <h3 className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center justify-between">
            <span>Move History</span>
            <span className={cn(
              "text-xs font-mono font-bold px-2 py-0.5 rounded-full transition-all duration-300",
              moveHistory.length > 0
                ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600"
            )}>
              {moveHistory.length}
            </span>
          </h3>
          <MoveTimeline
            moves={moveHistory}
            playerColor={playerColor}
            gameMode={gameMode}
            className="h-72 lg:h-[calc(100%-2rem)]"
          />
        </div>

        {/* Controls - Premium buttons with micro-animations */}
        {gameStatus === "playing" && (
          <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "flex-1 gap-2 h-11 font-medium",
                "bg-white dark:bg-zinc-900",
                "hover:bg-zinc-50 dark:hover:bg-zinc-800",
                "border-zinc-200 dark:border-zinc-700",
                "hover:border-zinc-300 dark:hover:border-zinc-600",
                "shadow-sm hover:shadow-md",
                "transition-all duration-200 hover:-translate-y-0.5"
              )}
              onClick={resetGame}
            >
              <RotateCcw className="h-4 w-4 transition-transform group-hover:rotate-180 duration-300" />
              New Game
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "flex-1 gap-2 h-11 font-medium",
                "bg-white dark:bg-zinc-900",
                "border-red-200 dark:border-red-900/50",
                "text-red-600 dark:text-red-400",
                "hover:bg-red-50 dark:hover:bg-red-950/50",
                "hover:border-red-300 dark:hover:border-red-800",
                "shadow-sm hover:shadow-md hover:shadow-red-500/10",
                "transition-all duration-200 hover:-translate-y-0.5"
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
