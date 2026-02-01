"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
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

// Generate winning combinations for any board size
function generateWinningCombinations(size: number, winLength: number): number[][] {
  const combos: number[][] = [];

  // Rows
  for (let row = 0; row < size; row++) {
    for (let col = 0; col <= size - winLength; col++) {
      const combo = [];
      for (let i = 0; i < winLength; i++) {
        combo.push(row * size + col + i);
      }
      combos.push(combo);
    }
  }

  // Columns
  for (let col = 0; col < size; col++) {
    for (let row = 0; row <= size - winLength; row++) {
      const combo = [];
      for (let i = 0; i < winLength; i++) {
        combo.push((row + i) * size + col);
      }
      combos.push(combo);
    }
  }

  // Diagonals (top-left to bottom-right)
  for (let row = 0; row <= size - winLength; row++) {
    for (let col = 0; col <= size - winLength; col++) {
      const combo = [];
      for (let i = 0; i < winLength; i++) {
        combo.push((row + i) * size + col + i);
      }
      combos.push(combo);
    }
  }

  // Diagonals (top-right to bottom-left)
  for (let row = 0; row <= size - winLength; row++) {
    for (let col = winLength - 1; col < size; col++) {
      const combo = [];
      for (let i = 0; i < winLength; i++) {
        combo.push((row + i) * size + col - i);
      }
      combos.push(combo);
    }
  }

  return combos;
}

function checkWinner(board: Board, winCombos: number[][]): { winner: Player; line: number[] | null } {
  for (const combo of winCombos) {
    const first = board[combo[0]];
    if (first && combo.every(idx => board[idx] === first)) {
      return { winner: first, line: combo };
    }
  }
  return { winner: null, line: null };
}

function isDraw(board: Board, winCombos: number[][]): boolean {
  return board.every(cell => cell !== null) && !checkWinner(board, winCombos).winner;
}

// Minimax AI for 3x3 only
function minimax(board: Board, isMaximizing: boolean, aiPlayer: Player, winCombos: number[][]): number {
  const humanPlayer = aiPlayer === "X" ? "O" : "X";
  const { winner } = checkWinner(board, winCombos);

  if (winner === aiPlayer) return 10;
  if (winner === humanPlayer) return -10;
  if (isDraw(board, winCombos)) return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = aiPlayer;
        const score = minimax(board, false, aiPlayer, winCombos);
        board[i] = null;
        bestScore = Math.max(score, bestScore);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        board[i] = humanPlayer;
        const score = minimax(board, true, aiPlayer, winCombos);
        board[i] = null;
        bestScore = Math.min(score, bestScore);
      }
    }
    return bestScore;
  }
}

function getBestMove3x3(board: Board, aiPlayer: Player, winCombos: number[][]): number {
  let bestScore = -Infinity;
  let bestMove = -1;

  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      board[i] = aiPlayer;
      const score = minimax(board, false, aiPlayer, winCombos);
      board[i] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }

  return bestMove;
}

// Heuristic AI for larger boards
function getBestMoveLarge(board: Board, aiPlayer: Player, size: number, winLength: number, winCombos: number[][]): number {
  const humanPlayer = aiPlayer === "X" ? "O" : "X";

  // Score each empty cell
  let bestMove = -1;
  let bestScore = -Infinity;

  const emptyCells = board.map((cell, idx) => cell === null ? idx : -1).filter(idx => idx !== -1);

  for (const idx of emptyCells) {
    let score = 0;

    // Check each winning combo that includes this cell
    for (const combo of winCombos) {
      if (!combo.includes(idx)) continue;

      const aiCount = combo.filter(i => board[i] === aiPlayer).length;
      const humanCount = combo.filter(i => board[i] === humanPlayer).length;
      const emptyCount = combo.filter(i => board[i] === null).length;

      // If combo is blocked, skip
      if (aiCount > 0 && humanCount > 0) continue;

      // Offensive scoring
      if (humanCount === 0) {
        if (aiCount === winLength - 1) score += 10000; // Win!
        else if (aiCount === winLength - 2) score += 100;
        else score += aiCount * 10;
      }

      // Defensive scoring
      if (aiCount === 0) {
        if (humanCount === winLength - 1) score += 5000; // Block win
        else if (humanCount === winLength - 2) score += 50;
        else score += humanCount * 5;
      }
    }

    // Prefer center and near-center positions
    const row = Math.floor(idx / size);
    const col = idx % size;
    const centerDist = Math.abs(row - size / 2) + Math.abs(col - size / 2);
    score += (size - centerDist) * 2;

    if (score > bestScore) {
      bestScore = score;
      bestMove = idx;
    }
  }

  // Fallback to random empty cell
  if (bestMove === -1 && emptyCells.length > 0) {
    bestMove = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  return bestMove;
}

function boardToString(board: Board): string {
  return board.map(cell => cell || ".").join("");
}

export function TicTacToe({ onMoveForMCP }: TicTacToeProps) {
  const [boardSize, setBoardSize] = useState(3);
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>("waiting");
  const [winner, setWinner] = useState<Player>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [playerSymbol, setPlayerSymbol] = useState<Player>("X");
  const [scores, setScores] = useState({ player: 0, ai: 0, draws: 0 });

  // Win length: 3 for 3x3, 5 for larger boards
  const winLength = boardSize === 3 ? 3 : 5;

  // Memoize winning combinations
  const winCombos = useMemo(
    () => generateWinningCombinations(boardSize, winLength),
    [boardSize, winLength]
  );

  const makeAIMove = useCallback((currentBoard: Board, aiSymbol: Player) => {
    setIsThinking(true);

    setTimeout(() => {
      const move = boardSize === 3
        ? getBestMove3x3([...currentBoard], aiSymbol, winCombos)
        : getBestMoveLarge([...currentBoard], aiSymbol, boardSize, winLength, winCombos);

      if (move !== -1) {
        const newBoard = [...currentBoard];
        newBoard[move] = aiSymbol;
        setBoard(newBoard);

        const { winner: w, line } = checkWinner(newBoard, winCombos);
        if (w) {
          setWinner(w);
          setWinningLine(line);
          setGameStatus("won");
          setScores(prev => ({ ...prev, ai: prev.ai + 1 }));
        } else if (isDraw(newBoard, winCombos)) {
          setGameStatus("draw");
          setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
        } else {
          setCurrentPlayer(aiSymbol === "X" ? "O" : "X");
        }

        onMoveForMCP?.(move, aiSymbol!, boardToString(newBoard));
      }

      setIsThinking(false);
    }, 300 + Math.random() * 400);
  }, [boardSize, winLength, winCombos, onMoveForMCP]);

  const handleCellClick = useCallback((index: number) => {
    if (gameStatus !== "playing" || board[index] || isThinking) return;

    // In vs-ai mode, check if it's player's turn
    if (gameMode === "vs-ai" && currentPlayer !== playerSymbol) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    onMoveForMCP?.(index, currentPlayer!, boardToString(newBoard));

    const { winner: w, line } = checkWinner(newBoard, winCombos);
    if (w) {
      setWinner(w);
      setWinningLine(line);
      setGameStatus("won");
      if (gameMode === "vs-ai") {
        setScores(prev => ({ ...prev, player: prev.player + 1 }));
      }
    } else if (isDraw(newBoard, winCombos)) {
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
  }, [board, currentPlayer, gameMode, gameStatus, isThinking, playerSymbol, makeAIMove, onMoveForMCP, winCombos]);

  const startGame = (mode: GameMode, symbol: Player = "X") => {
    const newBoard = Array(boardSize * boardSize).fill(null);
    setBoard(newBoard);
    setCurrentPlayer("X");
    setGameMode(mode);
    setGameStatus("playing");
    setWinner(null);
    setWinningLine(null);
    setPlayerSymbol(symbol);

    // If playing as O against AI, let AI move first
    if (mode === "vs-ai" && symbol === "O") {
      makeAIMove(newBoard, "X");
    }
  };

  const resetGame = () => {
    setBoard(Array(boardSize * boardSize).fill(null));
    setCurrentPlayer("X");
    setGameMode(null);
    setGameStatus("waiting");
    setWinner(null);
    setWinningLine(null);
  };

  const playAgain = () => {
    const newBoard = Array(boardSize * boardSize).fill(null);
    setBoard(newBoard);
    setCurrentPlayer("X");
    setGameStatus("playing");
    setWinner(null);
    setWinningLine(null);

    if (gameMode === "vs-ai" && playerSymbol === "O") {
      makeAIMove(newBoard, "X");
    }
  };

  const handleBoardSizeChange = (value: number[]) => {
    const newSize = value[0];
    setBoardSize(newSize);
    setBoard(Array(newSize * newSize).fill(null));
    setCurrentPlayer("X");
    setWinner(null);
    setWinningLine(null);
  };

  const renderCell = (index: number) => {
    const value = board[index];
    const isWinningCell = winningLine?.includes(index);
    const row = Math.floor(index / boardSize);
    const col = index % boardSize;

    // Adjust icon size based on board size
    const iconSize = boardSize <= 3 ? "h-12 w-12" : boardSize <= 5 ? "h-8 w-8" : boardSize <= 7 ? "h-6 w-6" : "h-4 w-4";

    return (
      <button
        key={index}
        onClick={() => handleCellClick(index)}
        disabled={gameStatus !== "playing" || !!value || isThinking}
        className={`
          aspect-square flex items-center justify-center font-bold
          border border-zinc-300 dark:border-zinc-600
          transition-all duration-200
          ${!value && gameStatus === "playing" && !isThinking
            ? "hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
            : "cursor-default"
          }
          ${isWinningCell ? "bg-green-100 dark:bg-green-900/30" : "bg-white dark:bg-zinc-800"}
          ${row === 0 ? "" : "border-t-0"}
          ${col === 0 ? "" : "border-l-0"}
        `}
      >
        {value === "X" && (
          <X className={`${iconSize} ${isWinningCell ? "text-green-600" : "text-blue-500"}`} />
        )}
        {value === "O" && (
          <Circle className={`${iconSize} ${isWinningCell ? "text-green-600" : "text-red-500"}`} />
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
              <div className="max-w-md mx-auto flex flex-col items-center justify-center gap-6 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-8">
                <h2 className="text-2xl font-bold">Choose Game Mode</h2>

                {/* Board size selector */}
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Board Size: <strong>{boardSize}x{boardSize}</strong></span>
                    <span className="text-zinc-500">
                      {boardSize === 3 ? "3 in a row" : "5 in a row"}
                    </span>
                  </div>
                  <Slider
                    value={[boardSize]}
                    onValueChange={handleBoardSizeChange}
                    min={3}
                    max={9}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>3x3</span>
                    <span>9x9</span>
                  </div>
                </div>

                <div className="flex flex-col gap-4 w-full">
                  <div className="flex gap-2">
                    <Button
                      size="lg"
                      className="gap-2 flex-1"
                      onClick={() => startGame("vs-ai", "X")}
                    >
                      <Bot className="h-5 w-5" />
                      Play as X
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="gap-2 flex-1"
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
              <div className="relative max-w-lg mx-auto">
                <div
                  className="grid"
                  style={{ gridTemplateColumns: `repeat(${boardSize}, 1fr)` }}
                >
                  {Array(boardSize * boardSize).fill(null).map((_, i) => renderCell(i))}
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
                    <span className="text-sm text-zinc-500">Board:</span>
                    <Badge variant="secondary">
                      {boardSize}x{boardSize}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">To win:</span>
                    <Badge variant="outline">
                      {winLength} in a row
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
