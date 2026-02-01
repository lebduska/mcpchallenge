"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RotateCcw,
  Bot,
  Users,
  Loader2,
  Trophy,
  Circle,
  X,
} from "lucide-react";

type Player = "X" | "O" | null;
type Board = Player[];
type GameMode = "vs-ai" | "vs-player" | null;
type GameStatus = "waiting" | "playing" | "won" | "draw";

interface TicTacToeProps {
  onMoveForMCP?: (position: number, player: string, board: string) => void;
}

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6], // Diagonals
];

function checkWinner(board: Board): { winner: Player; line: number[] | null } {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: combo };
    }
  }
  return { winner: null, line: null };
}

function isDraw(board: Board): boolean {
  return board.every(cell => cell !== null) && !checkWinner(board).winner;
}

// Minimax AI
function minimax(board: Board, isMaximizing: boolean, aiPlayer: Player): number {
  const humanPlayer = aiPlayer === "X" ? "O" : "X";
  const { winner } = checkWinner(board);

  if (winner === aiPlayer) return 10;
  if (winner === humanPlayer) return -10;
  if (isDraw(board)) return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = aiPlayer;
        const score = minimax(board, false, aiPlayer);
        board[i] = null;
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = humanPlayer;
        const score = minimax(board, true, aiPlayer);
        board[i] = null;
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}

function getBestMove(board: Board, aiPlayer: Player): number {
  let bestScore = -Infinity;
  let bestMove = -1;

  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = aiPlayer;
      const score = minimax(board, false, aiPlayer);
      board[i] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }

  return bestMove;
}

function boardToString(board: Board): string {
  return board.map(cell => cell || ".").join("");
}

export function TicTacToe({ onMoveForMCP }: TicTacToeProps) {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>("waiting");
  const [winner, setWinner] = useState<Player>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [playerSymbol, setPlayerSymbol] = useState<Player>("X");
  const [scores, setScores] = useState({ player: 0, ai: 0, draws: 0 });

  const makeAIMove = useCallback((currentBoard: Board, aiSymbol: Player) => {
    setIsThinking(true);

    setTimeout(() => {
      const move = getBestMove([...currentBoard], aiSymbol);

      if (move !== -1) {
        const newBoard = [...currentBoard];
        newBoard[move] = aiSymbol;
        setBoard(newBoard);

        const { winner: w, line } = checkWinner(newBoard);
        if (w) {
          setWinner(w);
          setWinningLine(line);
          setGameStatus("won");
          setScores(prev => ({ ...prev, ai: prev.ai + 1 }));
        } else if (isDraw(newBoard)) {
          setGameStatus("draw");
          setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
        } else {
          setCurrentPlayer(aiSymbol === "X" ? "O" : "X");
        }

        onMoveForMCP?.(move, aiSymbol!, boardToString(newBoard));
      }

      setIsThinking(false);
    }, 300 + Math.random() * 400);
  }, [onMoveForMCP]);

  const handleCellClick = useCallback((index: number) => {
    if (gameStatus !== "playing" || board[index] || isThinking) return;

    // In vs-ai mode, check if it's player's turn
    if (gameMode === "vs-ai" && currentPlayer !== playerSymbol) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    onMoveForMCP?.(index, currentPlayer!, boardToString(newBoard));

    const { winner: w, line } = checkWinner(newBoard);
    if (w) {
      setWinner(w);
      setWinningLine(line);
      setGameStatus("won");
      if (gameMode === "vs-ai") {
        setScores(prev => ({ ...prev, player: prev.player + 1 }));
      }
    } else if (isDraw(newBoard)) {
      setGameStatus("draw");
      setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
    } else {
      const nextPlayer = currentPlayer === "X" ? "O" : "X";
      setCurrentPlayer(nextPlayer);

      // AI's turn
      if (gameMode === "vs-ai") {
        makeAIMove(newBoard, nextPlayer);
      }
    }
  }, [board, currentPlayer, gameMode, gameStatus, isThinking, playerSymbol, makeAIMove, onMoveForMCP]);

  const startGame = (mode: GameMode, symbol: Player = "X") => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setGameMode(mode);
    setGameStatus("playing");
    setWinner(null);
    setWinningLine(null);
    setPlayerSymbol(symbol);

    // If playing as O against AI, let AI move first
    if (mode === "vs-ai" && symbol === "O") {
      makeAIMove(Array(9).fill(null), "X");
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setGameMode(null);
    setGameStatus("waiting");
    setWinner(null);
    setWinningLine(null);
  };

  const playAgain = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setGameStatus("playing");
    setWinner(null);
    setWinningLine(null);

    if (gameMode === "vs-ai" && playerSymbol === "O") {
      makeAIMove(Array(9).fill(null), "X");
    }
  };

  const renderCell = (index: number) => {
    const value = board[index];
    const isWinningCell = winningLine?.includes(index);

    return (
      <button
        key={index}
        onClick={() => handleCellClick(index)}
        disabled={gameStatus !== "playing" || !!value || isThinking}
        className={`
          aspect-square flex items-center justify-center text-4xl font-bold
          border-2 border-zinc-300 dark:border-zinc-600
          transition-all duration-200
          ${!value && gameStatus === "playing" && !isThinking
            ? "hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
            : "cursor-default"
          }
          ${isWinningCell ? "bg-green-100 dark:bg-green-900/30" : "bg-white dark:bg-zinc-800"}
          ${index < 3 ? "" : "border-t-0"}
          ${index % 3 === 0 ? "" : "border-l-0"}
        `}
      >
        {value === "X" && (
          <X className={`h-12 w-12 ${isWinningCell ? "text-green-600" : "text-blue-500"}`} />
        )}
        {value === "O" && (
          <Circle className={`h-10 w-10 ${isWinningCell ? "text-green-600" : "text-red-500"}`} />
        )}
      </button>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Game Board */}
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-6">
            {gameMode === null ? (
              // Game mode selection
              <div className="aspect-square max-w-md mx-auto flex flex-col items-center justify-center gap-6 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <h2 className="text-2xl font-bold">Choose Game Mode</h2>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2">
                    <Button
                      size="lg"
                      className="gap-2"
                      onClick={() => startGame("vs-ai", "X")}
                    >
                      <Bot className="h-5 w-5" />
                      Play as X (first)
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="gap-2"
                      onClick={() => startGame("vs-ai", "O")}
                    >
                      <Bot className="h-5 w-5" />
                      Play as O
                    </Button>
                  </div>
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
              // Game board
              <div className="relative max-w-md mx-auto">
                <div className="grid grid-cols-3">
                  {Array(9).fill(null).map((_, i) => renderCell(i))}
                </div>

                {/* Thinking overlay */}
                {isThinking && (
                  <div className="absolute inset-0 bg-black/10 rounded flex items-center justify-center">
                    <div className="bg-white dark:bg-zinc-800 rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>AI is thinking...</span>
                    </div>
                  </div>
                )}

                {/* Game over overlay */}
                {(gameStatus === "won" || gameStatus === "draw") && (
                  <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center">
                    <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 text-center shadow-xl">
                      <Trophy className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                      <h3 className="text-xl font-bold mb-2">
                        {gameStatus === "draw"
                          ? "It's a Draw!"
                          : gameMode === "vs-ai"
                            ? winner === playerSymbol
                              ? "You Win!"
                              : "AI Wins!"
                            : `${winner} Wins!`
                        }
                      </h3>
                      <div className="flex gap-2 mt-4">
                        <Button onClick={playAgain}>
                          Play Again
                        </Button>
                        <Button variant="outline" onClick={resetGame}>
                          Change Mode
                        </Button>
                      </div>
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
              {gameMode === "vs-ai" ? <Bot className="h-5 w-5" /> : <Users className="h-5 w-5" />}
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
                      {gameMode === "vs-ai" ? "vs AI" : "2 Players"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">Current Turn:</span>
                    <Badge variant={currentPlayer === "X" ? "default" : "outline"}>
                      {currentPlayer === "X" ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <Circle className="h-3 w-3" />
                      )}
                    </Badge>
                  </div>
                  {gameMode === "vs-ai" && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500">You are:</span>
                      <Badge variant="outline">
                        {playerSymbol === "X" ? (
                          <X className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Circle className="h-3 w-3 text-red-500" />
                        )}
                      </Badge>
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

        {/* Scores */}
        {gameMode === "vs-ai" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{scores.player}</div>
                  <div className="text-xs text-zinc-500">You</div>
                </div>
                <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <div className="text-2xl font-bold">{scores.draws}</div>
                  <div className="text-xs text-zinc-500">Draws</div>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{scores.ai}</div>
                  <div className="text-xs text-zinc-500">AI</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controls */}
        {gameMode && gameStatus === "playing" && (
          <Card>
            <CardContent className="pt-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1"
                onClick={resetGame}
              >
                <RotateCcw className="h-4 w-4" />
                New Game
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
