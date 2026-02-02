"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import type { PieceDropHandlerArgs } from "react-chessboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Loader2,
  Trophy,
  Swords,
  Cpu,
} from "lucide-react";
import { useStockfish, type Difficulty } from "@/hooks/use-stockfish";
import { useGameCompletion } from "@/lib/game-completion";

type GameMode = "vs-ai" | "vs-player" | null;
type GameStatus = "waiting" | "playing" | "checkmate" | "draw" | "resigned";

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
  const [statusMessage, setStatusMessage] = useState("");

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

  // Check game state
  const checkGameState = useCallback((currentGame: Chess) => {
    if (currentGame.isCheckmate()) {
      setGameStatus("checkmate");
      const winner = currentGame.turn() === "w" ? "Black" : "White";
      setStatusMessage(`Checkmate! ${winner} wins!`);
    } else if (currentGame.isDraw()) {
      setGameStatus("draw");
      setStatusMessage("Game ended in a draw!");
    } else if (currentGame.isCheck()) {
      setStatusMessage("Check!");
    } else {
      setStatusMessage("");
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
        // If it's white's turn, black won (and vice versa)
        const winnerColor = game.turn() === "w" ? "black" : "white";
        winner = winnerColor === playerColor ? "player" : "engine";
      }

      // Call the onGameComplete callback if provided
      if (onGameComplete) {
        onGameComplete({
          winner,
          moves: moveHistory.length,
        });
      }

      // Submit to database if authenticated
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
    if (!stockfishReady) {
      console.warn("Stockfish not ready yet");
      return;
    }

    try {
      // Get best move from Stockfish (returns UCI format like "e2e4")
      const bestMoveUCI = await getBestMove(currentGame.fen());

      if (!bestMoveUCI) {
        console.error("No move returned from Stockfish");
        return;
      }

      // Convert UCI to move object
      const from = bestMoveUCI.slice(0, 2);
      const to = bestMoveUCI.slice(2, 4);
      const promotion = bestMoveUCI.length > 4 ? bestMoveUCI[4] : undefined;

      const gameCopy = new Chess(currentGame.fen());
      const result = gameCopy.move({
        from,
        to,
        promotion,
      });

      if (result) {
        setGame(gameCopy);
        setMoveHistory(prev => [...prev, result.san]);
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

      // In vs-engine mode, only allow moves on player's turn
      if (gameMode === "vs-ai") {
        const isWhiteTurn = game.turn() === "w";
        if ((playerColor === "white" && !isWhiteTurn) ||
            (playerColor === "black" && isWhiteTurn)) {
          return false;
        }
      }

      const gameCopy = new Chess(game.fen());

      // Check for promotion (pieceType is like "wP" or "bP")
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
        checkGameState(gameCopy);
        onMoveForMCP?.(result.san, gameCopy.fen());

        // If playing against engine and it's now engine's turn
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
    setStatusMessage("");

    // If playing as black against engine, let engine move first
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
    setStatusMessage("");
  };

  // Resign
  const resign = () => {
    setGameStatus("resigned");
    const winner = game.turn() === "w" ? "Black" : "White";
    setStatusMessage(`${game.turn() === "w" ? "White" : "Black"} resigned. ${winner} wins!`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chess Board */}
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-4">
            {gameMode === null ? (
              // Game mode selection
              <div className="aspect-square flex flex-col items-center justify-center gap-6 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold">Choose Game Mode</h2>

                {/* Stockfish status */}
                <div className="flex items-center gap-2 text-sm">
                  <Cpu className="h-4 w-4" />
                  <span>Stockfish 17:</span>
                  {stockfishReady ? (
                    <Badge variant="default" className="bg-green-500">Ready</Badge>
                  ) : stockfishError ? (
                    <Badge variant="destructive">Error</Badge>
                  ) : (
                    <Badge variant="secondary">Loading...</Badge>
                  )}
                </div>

                {/* Difficulty selector */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Difficulty:</span>
                  <Select value={difficulty} onValueChange={(val) => setDifficulty(val as Difficulty)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="gap-2"
                    onClick={() => startGame("vs-ai", "white")}
                    disabled={!stockfishReady}
                  >
                    <Cpu className="h-5 w-5" />
                    Play vs Stockfish (White)
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2"
                    onClick={() => startGame("vs-ai", "black")}
                    disabled={!stockfishReady}
                  >
                    <Cpu className="h-5 w-5" />
                    Play vs Stockfish (Black)
                  </Button>
                </div>
                <div className="flex gap-4">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="gap-2"
                    onClick={() => startGame("vs-player")}
                  >
                    <Users className="h-5 w-5" />
                    2 Players (Local)
                  </Button>
                </div>
              </div>
            ) : (
              // Chess board
              <div className="relative">
                <Chessboard
                  options={{
                    position: game.fen(),
                    onPieceDrop: onDrop,
                    boardOrientation: playerColor,
                    boardStyle: {
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    },
                    darkSquareStyle: { backgroundColor: "#779952" },
                    lightSquareStyle: { backgroundColor: "#edeed1" },
                  }}
                />

                {/* Thinking overlay */}
                {isThinking && (
                  <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                    <div className="bg-white dark:bg-zinc-800 rounded-lg px-4 py-2 flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Stockfish is thinking...</span>
                    </div>
                  </div>
                )}

                {/* Game over overlay */}
                {(gameStatus === "checkmate" || gameStatus === "draw" || gameStatus === "resigned") && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 text-center">
                      <Trophy className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                      <h3 className="text-xl font-bold mb-2">{statusMessage}</h3>
                      <Button onClick={resetGame} className="mt-4">
                        Play Again
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Game Info Panel */}
      <div className="space-y-4">
        {/* Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Swords className="h-5 w-5" />
              Game Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gameMode && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">Mode:</span>
                    <Badge variant="secondary">
                      {gameMode === "vs-ai" ? `vs Stockfish (${difficulty})` : "2 Players"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">Turn:</span>
                    <Badge variant={game.turn() === "w" ? "default" : "outline"}>
                      {game.turn() === "w" ? "White" : "Black"}
                    </Badge>
                  </div>
                  {statusMessage && (
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded text-sm text-center">
                      {statusMessage}
                    </div>
                  )}
                </>
              )}

              {gameMode === null && (
                <p className="text-sm text-zinc-500 text-center py-4">
                  Select a game mode to start playing
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Move History */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Move History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 overflow-y-auto">
              {moveHistory.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">
                  No moves yet
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-1 text-sm font-mono">
                  {moveHistory.map((move, i) => (
                    <div
                      key={i}
                      className={`px-2 py-1 rounded ${
                        i % 2 === 0
                          ? "bg-zinc-100 dark:bg-zinc-800"
                          : ""
                      }`}
                    >
                      {i % 2 === 0 && (
                        <span className="text-zinc-400 mr-1">
                          {Math.floor(i / 2) + 1}.
                        </span>
                      )}
                      {move}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        {gameMode && gameStatus === "playing" && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={resetGame}
                >
                  <RotateCcw className="h-4 w-4" />
                  New Game
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={resign}
                >
                  <Flag className="h-4 w-4" />
                  Resign
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
