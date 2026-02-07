"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Lightbulb, LightbulbOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGameCompletion } from "@/lib/game-completion";
import { useReplayShare } from "@/hooks/use-replay-share";
import { ShareButton } from "@/components/games/share-button";

// =============================================================================
// Types
// =============================================================================

type GameStatus = "waiting" | "playing" | "won";
type Difficulty = "easy" | "medium" | "hard";

interface GameState {
  grid: boolean[][];
  size: number;
  toggleCount: number;
  minSolution: number;
  status: GameStatus;
  difficulty: Difficulty;
  startTime: number | null;
}

interface LightsOutProps {
  onComplete?: (state: { toggleCount: number; efficiency: number }) => void;
}

interface LightsOutMove {
  row: number;
  col: number;
}

// =============================================================================
// Constants
// =============================================================================

const DIFFICULTY_CONFIG: Record<Difficulty, { size: number; toggles: number }> = {
  easy: { size: 5, toggles: 5 },
  medium: { size: 5, toggles: 10 },
  hard: { size: 5, toggles: 15 },
};

// Cross pattern: the cell and its 4 neighbors
const NEIGHBORS = [
  [0, 0],   // self
  [-1, 0],  // up
  [1, 0],   // down
  [0, -1],  // left
  [0, 1],   // right
] as const;

// =============================================================================
// Helper Functions
// =============================================================================

function createEmptyGrid(size: number): boolean[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );
}

function cloneGrid(grid: boolean[][]): boolean[][] {
  return grid.map(row => [...row]);
}

function toggleCell(grid: boolean[][], row: number, col: number, size: number): void {
  for (const [dr, dc] of NEIGHBORS) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
      grid[nr][nc] = !grid[nr][nc];
    }
  }
}

function countLightsOn(grid: boolean[][]): number {
  return grid.flat().filter(Boolean).length;
}

function isSolved(grid: boolean[][]): boolean {
  return grid.every(row => row.every(cell => !cell));
}

function generatePuzzle(size: number, toggleCount: number): { grid: boolean[][]; minSolution: number } {
  const grid = createEmptyGrid(size);
  const toggledPositions: Set<string> = new Set();

  for (let i = 0; i < toggleCount; i++) {
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);
    const key = `${row},${col}`;

    toggleCell(grid, row, col, size);

    if (toggledPositions.has(key)) {
      toggledPositions.delete(key);
    } else {
      toggledPositions.add(key);
    }
  }

  // If puzzle is already solved, toggle one more
  if (isSolved(grid)) {
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);
    toggleCell(grid, row, col, size);
    toggledPositions.add(`${row},${col}`);
  }

  return {
    grid,
    minSolution: toggledPositions.size,
  };
}

// =============================================================================
// Component
// =============================================================================

export function LightsOut({ onComplete }: LightsOutProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const completionCalledRef = useRef(false);

  const { submitCompletion, isAuthenticated } = useGameCompletion("lightsout");

  const replay = useReplayShare<LightsOutMove>({
    challengeId: "lightsout",
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
    if (gameState?.status === "won" && !completionCalledRef.current) {
      completionCalledRef.current = true;

      const efficiency = Math.round((gameState.minSolution / gameState.toggleCount) * 100);
      onComplete?.({ toggleCount: gameState.toggleCount, efficiency });

      if (isAuthenticated) {
        submitCompletion({
          winner: "player",
          moves: gameState.toggleCount,
        });
      }
    }

    if (!gameState || gameState.status === "waiting") {
      completionCalledRef.current = false;
    }
  }, [gameState, onComplete, isAuthenticated, submitCompletion]);

  const startGame = useCallback((diff: Difficulty) => {
    const config = DIFFICULTY_CONFIG[diff];
    const { grid, minSolution } = generatePuzzle(config.size, config.toggles);

    setDifficulty(diff);
    setElapsedTime(0);
    replay.reset();
    setGameState({
      grid,
      size: config.size,
      toggleCount: 0,
      minSolution,
      status: "playing",
      difficulty: diff,
      startTime: Date.now(),
    });
  }, [replay]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (!gameState || gameState.status !== "playing") return;

    const newGrid = cloneGrid(gameState.grid);
    toggleCell(newGrid, row, col, gameState.size);

    replay.recordMove({ row, col });

    const hasWon = isSolved(newGrid);

    if (hasWon) {
      replay.saveReplay({ won: true, timeMs: elapsedTime * 1000 });
    }

    setGameState({
      ...gameState,
      grid: newGrid,
      toggleCount: gameState.toggleCount + 1,
      status: hasWon ? "won" : "playing",
    });
  }, [gameState, replay, elapsedTime]);

  const resetGame = useCallback(() => {
    setGameState(null);
    setElapsedTime(0);
    replay.reset();
  }, [replay]);

  const lightsOn = gameState ? countLightsOn(gameState.grid) : 0;
  const totalCells = gameState ? gameState.size * gameState.size : 0;

  // Render cell with neon LED effect
  const renderCell = (row: number, col: number) => {
    if (!gameState) return null;

    const isOn = gameState.grid[row][col];

    return (
      <button
        key={`${row}-${col}`}
        onClick={() => handleCellClick(row, col)}
        disabled={gameState.status !== "playing"}
        className={cn(
          "w-12 h-12 sm:w-14 sm:h-14 rounded-lg transition-all duration-150 relative",
          "border-2 flex items-center justify-center",
          // ON state - bright yellow/white with glow
          isOn && [
            "bg-yellow-300 dark:bg-yellow-400",
            "border-yellow-400 dark:border-yellow-300",
            "shadow-[0_0_15px_rgba(250,204,21,0.8),inset_0_0_10px_rgba(255,255,255,0.5)]",
            "dark:shadow-[0_0_20px_rgba(250,204,21,0.9),inset_0_0_10px_rgba(255,255,255,0.3)]",
            "hover:shadow-[0_0_20px_rgba(250,204,21,1),inset_0_0_15px_rgba(255,255,255,0.6)]",
          ],
          // OFF state - dark with subtle border
          !isOn && [
            "bg-zinc-800 dark:bg-zinc-900",
            "border-zinc-600 dark:border-zinc-700",
            "hover:bg-zinc-700 dark:hover:bg-zinc-800",
            "hover:border-zinc-500",
          ],
          // Pressed effect
          "active:scale-95",
        )}
      >
        {/* Inner LED indicator */}
        <div
          className={cn(
            "w-6 h-6 sm:w-7 sm:h-7 rounded-full transition-all",
            isOn && [
              "bg-gradient-to-br from-yellow-100 via-yellow-200 to-yellow-400",
              "shadow-inner",
            ],
            !isOn && [
              "bg-gradient-to-br from-zinc-700 to-zinc-900",
              "border border-zinc-600",
            ],
          )}
        />
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
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Lightbulb className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-bold text-white">Lights Out</h2>
            </div>
            <p className="text-sm text-zinc-400 text-center mb-6">
              Turn off all the lights! Each click toggles the light and its 4 neighbors.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full justify-between bg-yellow-500 hover:bg-yellow-600 text-black"
                onClick={() => startGame("easy")}
              >
                <span>Easy</span>
                <Badge variant="secondary" className="bg-yellow-200 text-yellow-800">~5 moves</Badge>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full justify-between border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                onClick={() => startGame("medium")}
              >
                <span>Medium</span>
                <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">~10 moves</Badge>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full justify-between border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                onClick={() => startGame("hard")}
              >
                <span>Hard</span>
                <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">~15 moves</Badge>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Board */}
      {gameState && (
        <>
          {/* Header Stats */}
          <div className="flex items-center gap-6 p-3 bg-zinc-900 rounded-lg border border-zinc-800">
            {/* Lights remaining */}
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              <span className="font-mono text-lg text-white">
                {lightsOn}/{totalCells}
              </span>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-zinc-700" />

            {/* Moves */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 text-sm">Moves:</span>
              <span className="font-mono text-lg text-white">{gameState.toggleCount}</span>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 text-sm">Time:</span>
              <span className="font-mono text-lg text-white">{elapsedTime}s</span>
            </div>
          </div>

          {/* Grid */}
          <div
            className="inline-grid gap-2 p-4 bg-zinc-950 rounded-xl border-2 border-zinc-800"
            style={{
              gridTemplateColumns: `repeat(${gameState.size}, 1fr)`,
            }}
          >
            {Array.from({ length: gameState.size }, (_, row) =>
              Array.from({ length: gameState.size }, (_, col) => renderCell(row, col))
            )}
          </div>

          {/* Win State */}
          {gameState.status === "won" && (
            <Card className="w-full max-w-sm bg-zinc-900 border-zinc-800">
              <CardContent className="p-6 text-center">
                <div className="text-5xl mb-4">
                  <LightbulbOff className="w-16 h-16 mx-auto text-green-400" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">All Lights Out!</h3>
                <p className="text-sm text-zinc-400 mb-1">
                  Solved in {gameState.toggleCount} moves
                </p>
                <p className="text-sm text-zinc-500 mb-4">
                  Efficiency: {Math.round((gameState.minSolution / gameState.toggleCount) * 100)}%
                  (optimal: ~{gameState.minSolution} moves)
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button
                    onClick={() => startGame(difficulty)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Play Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetGame}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    Change Difficulty
                  </Button>
                  <ShareButton
                    canShare={replay.canShare}
                    isSharing={replay.isSharing}
                    shareCopied={replay.shareCopied}
                    onShare={replay.shareReplay}
                    variant="outline"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Controls during play */}
          {gameState.status === "playing" && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetGame}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                New Puzzle
              </Button>
            </div>
          )}

          {/* Hint */}
          {gameState.status === "playing" && (
            <p className="text-xs text-zinc-500 text-center max-w-xs">
              Tip: Each click toggles a + pattern. Try to find which lights cause the most change!
            </p>
          )}
        </>
      )}
    </div>
  );
}

export { LightsOut as LightsOutGame };
