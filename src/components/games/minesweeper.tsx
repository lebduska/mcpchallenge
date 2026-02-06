"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGameCompletion } from "@/lib/game-completion";
import { useReplayShare } from "@/hooks/use-replay-share";
import { ShareButton } from "@/components/games/share-button";

// =============================================================================
// Types
// =============================================================================

type CellValue = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type GameStatus = "waiting" | "playing" | "won" | "lost";
type Difficulty = "easy" | "medium" | "hard";

interface GameState {
  board: CellValue[][];
  revealed: boolean[][];
  flagged: boolean[][];
  rows: number;
  cols: number;
  mineCount: number;
  status: GameStatus;
  startTime: number | null;
  firstMove: boolean;
}

interface MinesweeperProps {
  onGameComplete?: (result: { won: boolean; time: number; difficulty: Difficulty }) => void;
}

interface MinesweeperMove {
  action: "reveal" | "flag";
  row: number;
  col: number;
  result?: "safe" | "mine";
}

// =============================================================================
// Constants
// =============================================================================

const DIFFICULTY_CONFIG: Record<Difficulty, { rows: number; cols: number; mines: number }> = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 30, cols: 16, mines: 99 },  // Vertical layout for larger cells
};

const NEIGHBORS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],          [0, 1],
  [1, -1], [1, 0], [1, 1],
] as const;

// Number colors - classic Minesweeper style
const NUMBER_COLORS: Record<number, string> = {
  1: "text-blue-600 dark:text-blue-400",
  2: "text-green-600 dark:text-green-400",
  3: "text-red-600 dark:text-red-400",
  4: "text-purple-800 dark:text-purple-400",
  5: "text-amber-800 dark:text-amber-400",
  6: "text-cyan-600 dark:text-cyan-400",
  7: "text-zinc-800 dark:text-zinc-300",
  8: "text-zinc-600 dark:text-zinc-400",
};

// =============================================================================
// Helper Functions
// =============================================================================

function createEmptyBoard<T>(rows: number, cols: number, value: T): T[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => value)
  );
}

function placeMines(
  rows: number,
  cols: number,
  mineCount: number,
  excludeRow: number,
  excludeCol: number
): CellValue[][] {
  const board = createEmptyBoard<CellValue>(rows, cols, 0);

  // Create valid positions excluding clicked area
  const validPositions: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isExcluded = Math.abs(r - excludeRow) <= 1 && Math.abs(c - excludeCol) <= 1;
      if (!isExcluded) {
        validPositions.push([r, c]);
      }
    }
  }

  // Shuffle
  for (let i = validPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [validPositions[i], validPositions[j]] = [validPositions[j], validPositions[i]];
  }

  // Place mines
  const minePositions = validPositions.slice(0, Math.min(mineCount, validPositions.length));
  for (const [r, c] of minePositions) {
    board[r][c] = -1;
  }

  // Calculate adjacent counts
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] === -1) continue;
      let count = 0;
      for (const [dr, dc] of NEIGHBORS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc] === -1) {
          count++;
        }
      }
      board[r][c] = count as CellValue;
    }
  }

  return board;
}

function floodReveal(
  board: CellValue[][],
  revealed: boolean[][],
  row: number,
  col: number,
  rows: number,
  cols: number
): void {
  if (row < 0 || row >= rows || col < 0 || col >= cols) return;
  if (revealed[row][col]) return;

  revealed[row][col] = true;

  if (board[row][col] === 0) {
    for (const [dr, dc] of NEIGHBORS) {
      floodReveal(board, revealed, row + dr, col + dc, rows, cols);
    }
  }
}

function countRevealed(revealed: boolean[][]): number {
  return revealed.flat().filter(Boolean).length;
}

function countFlagged(flagged: boolean[][]): number {
  return flagged.flat().filter(Boolean).length;
}

function checkWin(state: GameState): boolean {
  const { revealed, rows, cols, mineCount } = state;
  const totalCells = rows * cols;
  const revealedCount = countRevealed(revealed);
  return revealedCount === totalCells - mineCount;
}

// =============================================================================
// Component
// =============================================================================

export function Minesweeper({ onGameComplete }: MinesweeperProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const completionCalledRef = useRef(false);

  const { submitCompletion, isAuthenticated } = useGameCompletion("minesweeper");

  // Replay sharing hook
  const replay = useReplayShare<MinesweeperMove>({
    challengeId: "minesweeper",
  });

  // Timer effect
  useEffect(() => {
    if (gameState?.status === "playing" && gameState.startTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - gameState.startTime!) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState?.status, gameState?.startTime]);

  // Game completion effect
  useEffect(() => {
    if (
      gameState &&
      (gameState.status === "won" || gameState.status === "lost") &&
      !completionCalledRef.current
    ) {
      completionCalledRef.current = true;

      const result = {
        won: gameState.status === "won",
        time: elapsedTime,
        difficulty,
      };

      onGameComplete?.(result);

      if (isAuthenticated && gameState.status === "won") {
        submitCompletion({
          winner: "player",
          moves: countRevealed(gameState.revealed),
        });
      }
    }

    if (!gameState || gameState.status === "waiting") {
      completionCalledRef.current = false;
    }
  }, [gameState, elapsedTime, difficulty, onGameComplete, isAuthenticated, submitCompletion]);

  const startGame = useCallback((diff: Difficulty) => {
    const config = DIFFICULTY_CONFIG[diff];
    setDifficulty(diff);
    setElapsedTime(0);
    replay.reset();
    setGameState({
      board: createEmptyBoard(config.rows, config.cols, 0),
      revealed: createEmptyBoard(config.rows, config.cols, false),
      flagged: createEmptyBoard(config.rows, config.cols, false),
      rows: config.rows,
      cols: config.cols,
      mineCount: config.mines,
      status: "playing",
      startTime: null,
      firstMove: true,
    });
  }, [replay]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (!gameState || gameState.status !== "playing") return;
    if (gameState.revealed[row][col] || gameState.flagged[row][col]) return;

    let newBoard = gameState.board.map(r => [...r]) as CellValue[][];
    const newRevealed = gameState.revealed.map(r => [...r]);
    let newStartTime = gameState.startTime;
    let newFirstMove = gameState.firstMove;

    // First click - place mines
    if (gameState.firstMove) {
      newBoard = placeMines(gameState.rows, gameState.cols, gameState.mineCount, row, col);
      newStartTime = Date.now();
      newFirstMove = false;
    }

    // Check if hit mine
    if (newBoard[row][col] === -1) {
      newRevealed[row][col] = true;
      // Record move and save replay
      replay.recordMove({ action: "reveal", row, col, result: "mine" });
      replay.saveReplay({ won: false, timeMs: elapsedTime * 1000 });
      setGameState({
        ...gameState,
        board: newBoard,
        revealed: newRevealed,
        status: "lost",
        startTime: newStartTime,
        firstMove: newFirstMove,
      });
      return;
    }

    // Record safe reveal
    replay.recordMove({ action: "reveal", row, col, result: "safe" });

    // Safe reveal with flood fill
    floodReveal(newBoard, newRevealed, row, col, gameState.rows, gameState.cols);

    const newState: GameState = {
      ...gameState,
      board: newBoard,
      revealed: newRevealed,
      startTime: newStartTime,
      firstMove: newFirstMove,
      status: "playing",
    };

    // Check win
    if (checkWin(newState)) {
      newState.status = "won";
      // Save replay on win
      replay.saveReplay({ won: true, timeMs: elapsedTime * 1000 });
    }

    setGameState(newState);
  }, [gameState, replay, elapsedTime]);

  const handleRightClick = useCallback((e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    if (!gameState || gameState.status !== "playing") return;
    if (gameState.revealed[row][col]) return;

    const newFlagged = gameState.flagged.map(r => [...r]);
    newFlagged[row][col] = !newFlagged[row][col];

    // Record flag action
    replay.recordMove({ action: "flag", row, col });

    setGameState({
      ...gameState,
      flagged: newFlagged,
    });
  }, [gameState, replay]);

  const resetGame = useCallback(() => {
    setGameState(null);
    setElapsedTime(0);
    replay.reset();
  }, [replay]);

  const flagsRemaining = gameState
    ? gameState.mineCount - countFlagged(gameState.flagged)
    : 0;

  // Render cell
  const renderCell = (row: number, col: number) => {
    if (!gameState) return null;

    const { board, revealed, flagged, status } = gameState;
    const isRevealed = revealed[row][col];
    const isFlagged = flagged[row][col];
    const value = board[row][col];
    const isMine = value === -1;
    const isExploded = isRevealed && isMine;

    // Show all mines on loss
    const showMine = status === "lost" && isMine;

    // Calculate cell size based on difficulty (hard now vertical = can use larger cells)
    const cellSize = difficulty === "hard" ? "w-6 h-6 text-xs" : difficulty === "medium" ? "w-6 h-6 text-xs" : "w-7 h-7 text-sm";

    return (
      <button
        key={`${row}-${col}`}
        onClick={() => handleCellClick(row, col)}
        onContextMenu={(e) => handleRightClick(e, row, col)}
        disabled={status !== "playing"}
        className={cn(
          cellSize,
          "flex items-center justify-center font-bold select-none transition-all",
          // Hidden cell - XP-style raised button
          !isRevealed && !showMine && [
            "bg-gradient-to-b from-zinc-200 to-zinc-300 dark:from-zinc-600 dark:to-zinc-700",
            "border-t-2 border-l-2 border-white/60 dark:border-white/20",
            "border-b-2 border-r-2 border-zinc-400 dark:border-zinc-800",
            "hover:from-zinc-300 hover:to-zinc-400 dark:hover:from-zinc-500 dark:hover:to-zinc-600",
            "active:border-t-zinc-400 active:border-l-zinc-400 active:border-b-white/60 active:border-r-white/60",
          ],
          // Revealed cell - sunken look
          isRevealed && !isMine && [
            "bg-zinc-100 dark:bg-zinc-800",
            "border border-zinc-300 dark:border-zinc-600",
          ],
          // Exploded mine
          isExploded && "bg-red-500 dark:bg-red-600",
          // Shown mine (on loss)
          showMine && !isExploded && "bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600",
          // Flagged
          isFlagged && !showMine && "cursor-pointer",
        )}
      >
        {isFlagged && !showMine && (
          <span className="text-[0.7em]">🚩</span>
        )}
        {showMine && (
          <span className="text-[0.7em]">💣</span>
        )}
        {isRevealed && !isMine && value > 0 && (
          <span className={NUMBER_COLORS[value]}>{value}</span>
        )}
      </button>
    );
  };

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Difficulty Selection */}
      {!gameState && (
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-center mb-6">Minesweeper</h2>
            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full justify-between"
                onClick={() => startGame("easy")}
              >
                <span>Easy</span>
                <Badge variant="secondary">9×9 • 10 mines</Badge>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full justify-between"
                onClick={() => startGame("medium")}
              >
                <span>Medium</span>
                <Badge variant="secondary">16×16 • 40 mines</Badge>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full justify-between"
                onClick={() => startGame("hard")}
              >
                <span>Hard</span>
                <Badge variant="secondary">30×16 • 99 mines</Badge>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Board */}
      {gameState && (
        <>
          {/* Header Bar - XP style */}
          <div className="flex items-center justify-between gap-4 p-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg border-2 border-zinc-300 dark:border-zinc-700 w-fit">
            {/* Mine Counter */}
            <div className="flex items-center gap-1 bg-black px-2 py-1 rounded font-mono text-red-500 min-w-[60px] justify-center text-lg">
              <span>💣</span>
              <span>{String(flagsRemaining).padStart(3, "0")}</span>
            </div>

            {/* Face Button - Classic XP smiley */}
            <button
              onClick={resetGame}
              className="h-10 w-10 flex items-center justify-center text-2xl bg-zinc-300 dark:bg-zinc-600 rounded border-2 border-t-white border-l-white border-b-zinc-500 border-r-zinc-500 dark:border-t-zinc-400 dark:border-l-zinc-400 dark:border-b-zinc-800 dark:border-r-zinc-800 hover:bg-zinc-400 dark:hover:bg-zinc-500 active:border-t-zinc-500 active:border-l-zinc-500 active:border-b-white active:border-r-white"
            >
              {gameState.status === "won" ? "😎" : gameState.status === "lost" ? "😵" : "🙂"}
            </button>

            {/* Timer */}
            <div className="flex items-center gap-1 bg-black px-2 py-1 rounded font-mono text-red-500 min-w-[60px] justify-center text-lg">
              <span>⏱️</span>
              <span>{String(Math.min(elapsedTime, 999)).padStart(3, "0")}</span>
            </div>
          </div>

          {/* Board */}
          <div
            className="inline-grid gap-0 p-1 bg-zinc-300 dark:bg-zinc-700 rounded border-2 border-t-zinc-400 border-l-zinc-400 border-b-white dark:border-b-zinc-500 border-r-white dark:border-r-zinc-500"
            style={{
              gridTemplateColumns: `repeat(${gameState.cols}, 1fr)`,
            }}
          >
            {Array.from({ length: gameState.rows }, (_, row) =>
              Array.from({ length: gameState.cols }, (_, col) => renderCell(row, col))
            )}
          </div>

          {/* Game Over Overlay */}
          {(gameState.status === "won" || gameState.status === "lost") && (
            <Card className="w-full max-w-sm">
              <CardContent className="p-6 text-center">
                {gameState.status === "won" ? (
                  <>
                    <div className="text-5xl mb-4">😎</div>
                    <h3 className="text-xl font-bold mb-2">You Win!</h3>
                    <p className="text-sm text-zinc-500 mb-4">
                      Time: {elapsedTime}s
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-5xl mb-4">💥</div>
                    <h3 className="text-xl font-bold mb-2">Game Over</h3>
                    <p className="text-sm text-zinc-500 mb-4">
                      You hit a mine!
                    </p>
                  </>
                )}
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button onClick={() => startGame(difficulty)}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Play Again
                  </Button>
                  <Button variant="outline" onClick={resetGame}>
                    Change Difficulty
                  </Button>
                  <ShareButton
                    canShare={replay.canShare}
                    isSharing={replay.isSharing}
                    shareCopied={replay.shareCopied}
                    onShare={replay.shareReplay}
                    variant="outline"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Controls */}
          {gameState.status === "playing" && (
            <Button variant="outline" size="sm" onClick={resetGame}>
              <RotateCcw className="w-4 h-4 mr-2" />
              New Game
            </Button>
          )}
        </>
      )}
    </div>
  );
}
