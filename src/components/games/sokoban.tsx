"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RotateCcw, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trophy, Undo2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGameCompletion } from "@/lib/game-completion";
import { useReplayShare } from "@/hooks/use-replay-share";
import { ShareButton } from "@/components/games/share-button";
import { SOKOBAN_LEVELS } from "@mcpchallenge/game-engines";

// =============================================================================
// Types
// =============================================================================

type CellType = "floor" | "wall" | "goal";
type Direction = "up" | "down" | "left" | "right";
type GameStatus = "playing" | "won";

interface Position {
  row: number;
  col: number;
}

interface GameState {
  board: CellType[][];
  player: Position;
  boxes: Position[];
  goals: Position[];
  rows: number;
  cols: number;
  moveCount: number;
  pushCount: number;
  status: GameStatus;
}

interface HistoryEntry {
  player: Position;
  boxes: Position[];
  moveCount: number;
  pushCount: number;
}

interface MoveRecord {
  direction: Direction;
  pushed: boolean;
}

interface SokobanProps {
  onGameComplete?: (result: { won: boolean; level: number; moves: number; pushes: number }) => void;
}

// =============================================================================
// Level Data - imported from game engine (60 classic DOS levels)
// =============================================================================

const LEVEL_DATA = SOKOBAN_LEVELS;

// =============================================================================
// Level Parser
// =============================================================================

function parseLevel(levelIndex: number): GameState | null {
  const level = LEVEL_DATA[levelIndex];
  if (!level) return null;

  return {
    board: level.board.map(row => [...row]),
    player: { ...level.player },
    boxes: level.boxes.map(b => ({ ...b })),
    goals: level.goals.map(g => ({ ...g })),
    rows: level.rows,
    cols: level.cols,
    moveCount: 0,
    pushCount: 0,
    status: "playing",
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

function posEquals(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

function posInList(pos: Position, list: Position[]): boolean {
  return list.some((p) => posEquals(p, pos));
}

function getDirection(dir: Direction): Position {
  switch (dir) {
    case "up":
      return { row: -1, col: 0 };
    case "down":
      return { row: 1, col: 0 };
    case "left":
      return { row: 0, col: -1 };
    case "right":
      return { row: 0, col: 1 };
  }
}

function addPos(a: Position, b: Position): Position {
  return { row: a.row + b.row, col: a.col + b.col };
}

function isWall(board: CellType[][], pos: Position): boolean {
  if (pos.row < 0 || pos.row >= board.length) return true;
  if (pos.col < 0 || pos.col >= board[0].length) return true;
  return board[pos.row][pos.col] === "wall";
}

function checkWin(boxes: Position[], goals: Position[]): boolean {
  return boxes.every((box) => posInList(box, goals));
}

// =============================================================================
// Deadlock Detection
// =============================================================================

/**
 * Check if a box is in a corner deadlock position.
 * A box in a corner (walls on 2 adjacent sides) that's not on a goal
 * can NEVER be moved again - this is always a deadlock.
 */
function isCornerDeadlock(board: CellType[][], pos: Position, goals: Position[]): boolean {
  // If box is on a goal, it's not deadlocked
  if (posInList(pos, goals)) return false;

  const { row, col } = pos;
  const up = isWall(board, { row: row - 1, col });
  const down = isWall(board, { row: row + 1, col });
  const left = isWall(board, { row, col: col - 1 });
  const right = isWall(board, { row, col: col + 1 });

  // Corner: walls on two adjacent sides
  return (up && left) || (up && right) || (down && left) || (down && right);
}

/**
 * Get all deadlocked box positions.
 * Currently only detects corner deadlocks (100% accurate, no false positives).
 */
function getDeadlockedBoxes(board: CellType[][], boxes: Position[], goals: Position[]): Set<string> {
  const deadlocked = new Set<string>();

  for (const box of boxes) {
    const key = `${box.row},${box.col}`;
    if (isCornerDeadlock(board, box, goals)) {
      deadlocked.add(key);
    }
  }

  return deadlocked;
}


// =============================================================================
// Cell Component
// =============================================================================

interface CellProps {
  type: CellType;
  isPlayer: boolean;
  isBox: boolean;
  isGoal: boolean;
  isBoxOnGoal: boolean;
  isPlayerOnGoal: boolean;
  isDeadlocked: boolean;
  size: number;
}

function Cell({
  type,
  isPlayer,
  isBox,
  isGoal,
  isBoxOnGoal,
  isPlayerOnGoal,
  isDeadlocked,
  size,
}: CellProps) {
  const baseStyle = {
    width: size,
    height: size,
  };

  // Wall - brick pattern
  if (type === "wall") {
    return (
      <div
        style={baseStyle}
        className="relative bg-gradient-to-br from-red-900 to-red-950 border-2 border-red-950 shadow-inner overflow-hidden"
      >
        {/* Brick pattern */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-0 left-0 right-0 h-[45%] border-b border-red-700/50 flex">
            <div className="w-1/2 border-r border-red-700/50" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[45%] flex">
            <div className="w-1/4 border-r border-red-700/50" />
            <div className="w-1/2 border-r border-red-700/50" />
          </div>
        </div>
        {/* Highlight */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
      </div>
    );
  }

  const bgClass =
    type === "goal" || isGoal
      ? "bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30"
      : "bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900";

  const boxContent = isBox && (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "w-[80%] h-[80%] rounded-sm shadow-md flex items-center justify-center transition-all duration-100 relative",
              isBoxOnGoal
                ? "bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-emerald-700"
                : isDeadlocked
                  ? "bg-gradient-to-br from-red-500 to-red-700 border-2 border-red-800 animate-pulse"
                  : "bg-gradient-to-br from-amber-500 to-orange-600 border-2 border-orange-700"
            )}
          >
            <div className="w-[60%] h-[60%] border-2 border-white/30 rounded-sm" />
            {/* Deadlock warning icon */}
            {isDeadlocked && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </TooltipTrigger>
        {isDeadlocked && (
          <TooltipContent side="top" className="bg-red-600 text-white border-red-700">
            <p className="text-xs font-medium">Deadlock! Press Undo or Reset</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div
      style={baseStyle}
      className={cn(
        bgClass,
        "relative flex items-center justify-center border border-stone-300/50 dark:border-stone-700/50"
      )}
    >
      {/* Goal marker */}
      {(type === "goal" || isGoal) && !isBox && !isPlayer && (
        <div className="absolute w-3 h-3 rounded-full bg-amber-500/60 dark:bg-amber-400/60 border-2 border-amber-600 dark:border-amber-500 z-10" />
      )}

      {/* Box */}
      {boxContent}

      {/* Player */}
      {isPlayer && (
        <div
          className={cn(
            "w-[70%] h-[70%] rounded-full shadow-lg flex items-center justify-center z-10",
            isPlayerOnGoal
              ? "bg-gradient-to-br from-blue-400 to-blue-600 ring-2 ring-amber-400"
              : "bg-gradient-to-br from-blue-500 to-blue-700"
          )}
        >
          {/* Face */}
          <div className="relative w-full h-full">
            {/* Eyes */}
            <div className="absolute top-[30%] left-[25%] w-[15%] h-[15%] bg-white rounded-full" />
            <div className="absolute top-[30%] right-[25%] w-[15%] h-[15%] bg-white rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function SokobanGame({ onGameComplete }: SokobanProps) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [gameState, setGameState] = useState<GameState | null>(() => parseLevel(0));
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [startTime, setStartTime] = useState<number>(() => Date.now());
  const { submitCompletion } = useGameCompletion("sokoban");

  // Replay sharing hook
  const replay = useReplayShare<MoveRecord>({
    challengeId: "sokoban",
    levelId: String(levelIndex + 1),
  });

  const totalLevels = LEVEL_DATA.length;

  // Calculate deadlocked boxes (always on)
  const deadlockedBoxes = useMemo(() => {
    if (!gameState) return new Set<string>();
    return getDeadlockedBoxes(gameState.board, gameState.boxes, gameState.goals);
  }, [gameState]);

  // Check if game is unwinnable
  const isUnwinnable = deadlockedBoxes.size > 0;

  // Change level with state reset
  const changeLevel = useCallback((newIndex: number) => {
    const clampedIndex = Math.max(0, Math.min(totalLevels - 1, newIndex));
    setLevelIndex(clampedIndex);
    setGameState(parseLevel(clampedIndex));
    setHistory([]);
    setStartTime(Date.now());
    replay.reset();
  }, [totalLevels, replay]);

  // Reset current level
  const resetLevel = useCallback(() => {
    setGameState(parseLevel(levelIndex));
    setHistory([]);
    setStartTime(Date.now());
    replay.reset();
  }, [levelIndex, replay]);

  // Handle move
  const move = useCallback(
    (direction: Direction) => {
      if (!gameState || gameState.status === "won") return;

      const delta = getDirection(direction);
      const newPlayerPos = addPos(gameState.player, delta);

      // Check wall
      if (isWall(gameState.board, newPlayerPos)) return;

      // Check box
      const boxIndex = gameState.boxes.findIndex((b) => posEquals(b, newPlayerPos));
      const newBoxes = gameState.boxes.map((b) => ({ ...b }));
      let pushed = false;

      if (boxIndex !== -1) {
        const boxNewPos = addPos(newPlayerPos, delta);
        // Can't push into wall or another box
        if (isWall(gameState.board, boxNewPos)) return;
        if (posInList(boxNewPos, newBoxes)) return;

        newBoxes[boxIndex] = boxNewPos;
        pushed = true;
      }

      // Save history for undo
      setHistory((prev) => [
        ...prev,
        {
          player: gameState.player,
          boxes: gameState.boxes,
          moveCount: gameState.moveCount,
          pushCount: gameState.pushCount,
        },
      ]);

      // Track move for replay
      replay.recordMove({ direction, pushed });

      const won = checkWin(newBoxes, gameState.goals);

      setGameState({
        ...gameState,
        player: newPlayerPos,
        boxes: newBoxes,
        moveCount: gameState.moveCount + 1,
        pushCount: gameState.pushCount + (pushed ? 1 : 0),
        status: won ? "won" : "playing",
      });

      if (won) {
        const timeMs = Date.now() - startTime;
        const finalMoves = gameState.moveCount + 1;
        const finalPushes = gameState.pushCount + (pushed ? 1 : 0);

        submitCompletion({
          winner: "player",
          moves: finalMoves,
        });

        // Save replay using hook
        replay.saveReplay({
          won: true,
          moves: finalMoves,
          pushes: finalPushes,
          timeMs,
        });

        onGameComplete?.({
          won: true,
          level: levelIndex + 1,
          moves: finalMoves,
          pushes: finalPushes,
        });
      }
    },
    [gameState, levelIndex, submitCompletion, onGameComplete, startTime, replay]
  );

  // Undo
  const undo = useCallback(() => {
    if (history.length === 0 || !gameState) return;

    const prev = history[history.length - 1];
    setGameState({
      ...gameState,
      player: prev.player,
      boxes: prev.boxes,
      moveCount: prev.moveCount,
      pushCount: prev.pushCount,
      status: "playing",
    });
    setHistory((h) => h.slice(0, -1));
    // Note: We don't remove from replay.moves - the final result stats are from gameState
  }, [history, gameState]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          move("up");
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          move("down");
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          move("left");
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          move("right");
          break;
        case "z":
        case "Z":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            undo();
          }
          break;
        case "u":
        case "U":
          e.preventDefault();
          undo();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move, undo]);

  if (!gameState) return null;

  const { board, player, boxes, goals, rows, cols, moveCount, pushCount, status } = gameState;
  const boxesOnGoals = boxes.filter((b) => posInList(b, goals)).length;

  // Calculate cell size based on board dimensions
  const maxWidth = 600;
  const maxHeight = 500;
  const cellSize = Math.min(Math.floor(maxWidth / cols), Math.floor(maxHeight / rows), 40);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-xl">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            Level {levelIndex + 1}/{totalLevels}
          </Badge>
          {status === "won" && (
            <Badge className="bg-emerald-500 text-white animate-pulse">
              <Trophy className="w-3 h-3 mr-1" /> Complete!
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          <span>Moves: {moveCount}</span>
          <span>Pushes: {pushCount}</span>
          <span>
            {boxesOnGoals}/{goals.length}
          </span>
        </div>
      </div>

      {/* Game Board */}
      <div
        className="border-4 border-stone-700 dark:border-stone-500 rounded-lg shadow-2xl overflow-hidden"
        style={{ backgroundColor: "#1a1a1a" }}
      >
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="flex">
            {Array.from({ length: cols }, (_, c) => {
              const pos = { row: r, col: c };
              const key = `${r},${c}`;
              const isPlayerHere = posEquals(pos, player);
              const isBoxHere = posInList(pos, boxes);
              const isGoalHere = posInList(pos, goals);
              const cellType = board[r][c];

              return (
                <Cell
                  key={c}
                  type={cellType}
                  isPlayer={isPlayerHere}
                  isBox={isBoxHere}
                  isGoal={isGoalHere}
                  isBoxOnGoal={isBoxHere && isGoalHere}
                  isPlayerOnGoal={isPlayerHere && isGoalHere}
                  isDeadlocked={isBoxHere && deadlockedBoxes.has(key)}
                  size={cellSize}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Deadlock Warning Banner */}
      {isUnwinnable && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm font-medium">Level cannot be completed! Press Undo or Reset.</span>
        </div>
      )}

      {/* Win Panel with Share */}
      {status === "won" && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/20 border border-emerald-500/50 rounded-lg">
          <Trophy className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">
            Level completed in {moveCount} moves!
          </span>
          <div className="ml-auto">
            <ShareButton
              canShare={replay.canShare}
              isSharing={replay.isSharing}
              shareCopied={replay.shareCopied}
              onShare={replay.shareReplay}
              size="sm"
              className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20"
            />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => changeLevel(levelIndex - 1)}
          disabled={levelIndex === 0}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <Button variant="outline" size="sm" onClick={resetLevel}>
          <RotateCcw className="w-4 h-4 mr-1" />
          Reset
        </Button>

        <Button variant="outline" size="sm" onClick={undo} disabled={history.length === 0}>
          <Undo2 className="w-4 h-4 mr-1" />
          Undo
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => changeLevel(levelIndex + 1)}
          disabled={levelIndex === totalLevels - 1}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      
      {/* Mobile Controls */}
      <div className="grid grid-cols-3 gap-1 md:hidden">
        <div />
        <Button variant="secondary" size="lg" onClick={() => move("up")}>
          <ArrowUp className="w-6 h-6" />
        </Button>
        <div />
        <Button variant="secondary" size="lg" onClick={() => move("left")}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <Button variant="secondary" size="lg" onClick={() => move("down")}>
          <ArrowDown className="w-6 h-6" />
        </Button>
        <Button variant="secondary" size="lg" onClick={() => move("right")}>
          <ArrowRight className="w-6 h-6" />
        </Button>
      </div>

      {/* Instructions */}
      <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
        Arrow keys or WASD to move | U to undo | Push all boxes to goals
      </p>
    </div>
  );
}
