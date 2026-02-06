"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RotateCcw, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trophy, Undo2, Play, Pause, SkipBack, SkipForward, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGameCompletion } from "@/lib/game-completion";
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
 * Check if a position is a corner (walls on two adjacent sides)
 */
function isCorner(board: CellType[][], pos: Position): boolean {
  const { row, col } = pos;
  const up = isWall(board, { row: row - 1, col });
  const down = isWall(board, { row: row + 1, col });
  const left = isWall(board, { row, col: col - 1 });
  const right = isWall(board, { row, col: col + 1 });

  return (up && left) || (up && right) || (down && left) || (down && right);
}

/**
 * Check if a box is in a simple deadlock position
 * A box is deadlocked if it's in a corner that's not a goal
 */
function isSimpleDeadlock(board: CellType[][], pos: Position, goals: Position[]): boolean {
  // If box is on a goal, it's not deadlocked
  if (posInList(pos, goals)) return false;

  // Corner deadlock - box in a corner with walls on two adjacent sides
  if (isCorner(board, pos)) return true;

  return false;
}

/**
 * Check if a box is in an edge deadlock (against wall with no goals on that line)
 */
function isEdgeDeadlock(board: CellType[][], pos: Position, goals: Position[]): boolean {
  if (posInList(pos, goals)) return false;

  const { row, col } = pos;
  const rows = board.length;
  const cols = board[0].length;

  // Check if against top/bottom wall
  const againstTopWall = isWall(board, { row: row - 1, col });
  const againstBottomWall = isWall(board, { row: row + 1, col });

  if (againstTopWall || againstBottomWall) {
    // Check if any goal exists on this row that's reachable (not blocked by wall)
    const wallRow = againstTopWall ? row - 1 : row + 1;
    let hasGoalOnRow = false;

    // Scan left and right from current position
    for (let c = col; c >= 0 && !isWall(board, { row, col: c }); c--) {
      if (goals.some(g => g.row === row && g.col === c)) {
        hasGoalOnRow = true;
        break;
      }
    }
    for (let c = col; c < cols && !isWall(board, { row, col: c }); c++) {
      if (goals.some(g => g.row === row && g.col === c)) {
        hasGoalOnRow = true;
        break;
      }
    }

    if (!hasGoalOnRow) return true;
  }

  // Check if against left/right wall
  const againstLeftWall = isWall(board, { row, col: col - 1 });
  const againstRightWall = isWall(board, { row, col: col + 1 });

  if (againstLeftWall || againstRightWall) {
    let hasGoalOnCol = false;

    for (let r = row; r >= 0 && !isWall(board, { row: r, col }); r--) {
      if (goals.some(g => g.row === r && g.col === col)) {
        hasGoalOnCol = true;
        break;
      }
    }
    for (let r = row; r < rows && !isWall(board, { row: r, col }); r++) {
      if (goals.some(g => g.row === r && g.col === col)) {
        hasGoalOnCol = true;
        break;
      }
    }

    if (!hasGoalOnCol) return true;
  }

  return false;
}

/**
 * Get all deadlocked box positions
 */
function getDeadlockedBoxes(board: CellType[][], boxes: Position[], goals: Position[]): Set<string> {
  const deadlocked = new Set<string>();

  for (const box of boxes) {
    const key = `${box.row},${box.col}`;
    if (isSimpleDeadlock(board, box, goals) || isEdgeDeadlock(board, box, goals)) {
      deadlocked.add(key);
    }
  }

  return deadlocked;
}

// =============================================================================
// Valid Moves Heatmap
// =============================================================================

type HeatmapCell = "reachable" | "pushable" | "blocked" | "none";

/**
 * Calculate reachable positions for the player using flood fill
 */
function getReachablePositions(
  board: CellType[][],
  player: Position,
  boxes: Position[]
): Set<string> {
  const reachable = new Set<string>();
  const visited = new Set<string>();
  const queue: Position[] = [player];

  while (queue.length > 0) {
    const pos = queue.shift()!;
    const key = `${pos.row},${pos.col}`;

    if (visited.has(key)) continue;
    visited.add(key);

    if (isWall(board, pos)) continue;
    if (posInList(pos, boxes)) continue;

    reachable.add(key);

    // Add neighbors
    const directions: Direction[] = ["up", "down", "left", "right"];
    for (const dir of directions) {
      const delta = getDirection(dir);
      queue.push(addPos(pos, delta));
    }
  }

  return reachable;
}

/**
 * Get positions where boxes can be pushed to
 */
function getPushablePositions(
  board: CellType[][],
  player: Position,
  boxes: Position[],
  reachable: Set<string>
): Set<string> {
  const pushable = new Set<string>();

  for (const box of boxes) {
    const directions: Direction[] = ["up", "down", "left", "right"];

    for (const dir of directions) {
      const delta = getDirection(dir);
      const pushFrom = { row: box.row - delta.row, col: box.col - delta.col };
      const pushTo = addPos(box, delta);

      // Player must be able to reach the push position
      const pushFromKey = `${pushFrom.row},${pushFrom.col}`;
      if (!reachable.has(pushFromKey)) continue;

      // Destination must not be wall or another box
      if (isWall(board, pushTo)) continue;
      if (posInList(pushTo, boxes)) continue;

      pushable.add(`${pushTo.row},${pushTo.col}`);
    }
  }

  return pushable;
}

/**
 * Calculate full heatmap for the board
 */
function calculateHeatmap(
  board: CellType[][],
  player: Position,
  boxes: Position[]
): Map<string, HeatmapCell> {
  const heatmap = new Map<string, HeatmapCell>();
  const reachable = getReachablePositions(board, player, boxes);
  const pushable = getPushablePositions(board, player, boxes, reachable);

  const rows = board.length;
  const cols = board[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      const cell = board[r][c];

      if (cell === "wall") {
        heatmap.set(key, "blocked");
      } else if (posInList({ row: r, col: c }, boxes)) {
        heatmap.set(key, "blocked");
      } else if (pushable.has(key)) {
        heatmap.set(key, "pushable");
      } else if (reachable.has(key)) {
        heatmap.set(key, "reachable");
      } else {
        heatmap.set(key, "none");
      }
    }
  }

  return heatmap;
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
  heatmapType: HeatmapCell;
  showHeatmap: boolean;
  showDeadlocks: boolean;
  isHighlighted: boolean;
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
  heatmapType,
  showHeatmap,
  showDeadlocks,
  isHighlighted,
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

  // Determine background based on heatmap
  let bgClass =
    type === "goal" || isGoal
      ? "bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30"
      : "bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900";

  // Heatmap overlay colors
  let heatmapOverlay = "";
  if (showHeatmap && !isPlayer && !isBox) {
    switch (heatmapType) {
      case "reachable":
        heatmapOverlay = "bg-emerald-400/30 dark:bg-emerald-500/30";
        break;
      case "pushable":
        heatmapOverlay = "bg-amber-400/40 dark:bg-amber-500/40";
        break;
      case "blocked":
        heatmapOverlay = "bg-red-400/20 dark:bg-red-500/20";
        break;
    }
  }

  // Highlight for replay
  const highlightClass = isHighlighted
    ? "ring-2 ring-blue-400 ring-inset animate-pulse"
    : "";

  const boxContent = isBox && (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "w-[80%] h-[80%] rounded-sm shadow-md flex items-center justify-center transition-all duration-100 relative",
              isBoxOnGoal
                ? "bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-emerald-700"
                : isDeadlocked && showDeadlocks
                  ? "bg-gradient-to-br from-red-500 to-red-700 border-2 border-red-800"
                  : "bg-gradient-to-br from-amber-500 to-orange-600 border-2 border-orange-700"
            )}
          >
            <div className="w-[60%] h-[60%] border-2 border-white/30 rounded-sm" />
            {/* Deadlock warning icon */}
            {isDeadlocked && showDeadlocks && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </TooltipTrigger>
        {isDeadlocked && showDeadlocks && (
          <TooltipContent side="top" className="bg-red-600 text-white border-red-700">
            <p className="text-xs font-medium">Deadlock: Box cannot reach any goal</p>
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
        "relative flex items-center justify-center border border-stone-300/50 dark:border-stone-700/50",
        highlightClass
      )}
    >
      {/* Heatmap overlay */}
      {heatmapOverlay && (
        <div className={cn("absolute inset-0", heatmapOverlay)} />
      )}

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
  const { submitCompletion } = useGameCompletion("sokoban");

  // New feature states
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showDeadlocks, setShowDeadlocks] = useState(true);
  const [replayIndex, setReplayIndex] = useState<number | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [highlightedCells, setHighlightedCells] = useState<Set<string>>(new Set());

  const totalLevels = LEVEL_DATA.length;

  // Calculate deadlocked boxes
  const deadlockedBoxes = useMemo(() => {
    if (!gameState) return new Set<string>();
    return getDeadlockedBoxes(gameState.board, gameState.boxes, gameState.goals);
  }, [gameState]);

  // Calculate heatmap
  const heatmap = useMemo(() => {
    if (!gameState || !showHeatmap) return new Map<string, HeatmapCell>();
    return calculateHeatmap(gameState.board, gameState.player, gameState.boxes);
  }, [gameState, showHeatmap]);

  // Change level with state reset
  const changeLevel = useCallback((newIndex: number) => {
    const clampedIndex = Math.max(0, Math.min(totalLevels - 1, newIndex));
    setLevelIndex(clampedIndex);
    setGameState(parseLevel(clampedIndex));
    setHistory([]);
    setReplayIndex(null);
    setIsReplaying(false);
    setHighlightedCells(new Set());
  }, [totalLevels]);

  // Reset current level
  const resetLevel = useCallback(() => {
    setGameState(parseLevel(levelIndex));
    setHistory([]);
    setReplayIndex(null);
    setIsReplaying(false);
    setHighlightedCells(new Set());
  }, [levelIndex]);

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
        submitCompletion({
          winner: "player",
          moves: gameState.moveCount + 1,
        });
        onGameComplete?.({
          won: true,
          level: levelIndex + 1,
          moves: gameState.moveCount + 1,
          pushes: gameState.pushCount + (pushed ? 1 : 0),
        });
      }
    },
    [gameState, levelIndex, submitCompletion, onGameComplete]
  );

  // Undo
  const undo = useCallback(() => {
    if (history.length === 0 || !gameState) return;

    const prev = history[history.length - 1];

    // Highlight changed cells
    const changed = new Set<string>();
    changed.add(`${gameState.player.row},${gameState.player.col}`);
    changed.add(`${prev.player.row},${prev.player.col}`);
    gameState.boxes.forEach(b => changed.add(`${b.row},${b.col}`));
    prev.boxes.forEach(b => changed.add(`${b.row},${b.col}`));
    setHighlightedCells(changed);
    setTimeout(() => setHighlightedCells(new Set()), 300);

    setGameState({
      ...gameState,
      player: prev.player,
      boxes: prev.boxes,
      moveCount: prev.moveCount,
      pushCount: prev.pushCount,
      status: "playing",
    });
    setHistory((h) => h.slice(0, -1));
    setReplayIndex(null);
  }, [history, gameState]);

  // Replay navigation
  const goToHistoryStep = useCallback((index: number) => {
    if (!history.length || index < 0 || index >= history.length) return;

    const step = history[index];
    const initialState = parseLevel(levelIndex);
    if (!initialState) return;

    // Highlight changes
    if (gameState) {
      const changed = new Set<string>();
      changed.add(`${gameState.player.row},${gameState.player.col}`);
      changed.add(`${step.player.row},${step.player.col}`);
      gameState.boxes.forEach(b => changed.add(`${b.row},${b.col}`));
      step.boxes.forEach(b => changed.add(`${b.row},${b.col}`));
      setHighlightedCells(changed);
      setTimeout(() => setHighlightedCells(new Set()), 500);
    }

    setGameState({
      ...initialState,
      player: step.player,
      boxes: step.boxes.map(b => ({ ...b })),
      moveCount: step.moveCount,
      pushCount: step.pushCount,
      status: "playing",
    });
    setReplayIndex(index);
  }, [history, gameState, levelIndex]);

  const replayStepBack = useCallback(() => {
    if (replayIndex === null) {
      // Start replay from current position
      if (history.length > 0) {
        goToHistoryStep(history.length - 2);
      }
    } else if (replayIndex > 0) {
      goToHistoryStep(replayIndex - 1);
    } else {
      // Go to initial state
      const initialState = parseLevel(levelIndex);
      if (initialState) {
        setGameState(initialState);
        setReplayIndex(-1);
      }
    }
  }, [replayIndex, history, goToHistoryStep, levelIndex]);

  const replayStepForward = useCallback(() => {
    if (replayIndex === null || replayIndex === history.length - 1) {
      setReplayIndex(null);
      return;
    }
    goToHistoryStep(replayIndex + 1);
  }, [replayIndex, history, goToHistoryStep]);

  const toggleReplay = useCallback(() => {
    if (isReplaying) {
      setIsReplaying(false);
    } else if (history.length > 0) {
      setIsReplaying(true);
      // Start from beginning
      const initialState = parseLevel(levelIndex);
      if (initialState) {
        setGameState(initialState);
        setReplayIndex(-1);
      }
    }
  }, [isReplaying, history, levelIndex]);

  // Auto-play replay
  useEffect(() => {
    if (!isReplaying) return;

    const timer = setInterval(() => {
      setReplayIndex(prev => {
        if (prev === null) return null;
        const next = prev + 1;
        if (next >= history.length) {
          setIsReplaying(false);
          return null;
        }
        goToHistoryStep(next);
        return next;
      });
    }, 500);

    return () => clearInterval(timer);
  }, [isReplaying, history, goToHistoryStep]);

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
                  heatmapType={heatmap.get(key) || "none"}
                  showHeatmap={showHeatmap}
                  showDeadlocks={showDeadlocks}
                  isHighlighted={highlightedCells.has(key)}
                  size={cellSize}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Feature Toggles */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <Switch
            id="deadlocks"
            checked={showDeadlocks}
            onCheckedChange={setShowDeadlocks}
          />
          <label
            htmlFor="deadlocks"
            className="cursor-pointer flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            Deadlocks
          </label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="heatmap"
            checked={showHeatmap}
            onCheckedChange={setShowHeatmap}
          />
          <label
            htmlFor="heatmap"
            className="cursor-pointer flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400"
          >
            {showHeatmap ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Heatmap
          </label>
        </div>
      </div>

      {/* Heatmap Legend */}
      {showHeatmap && (
        <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-400/50" />
            <span>Reachable</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-400/60" />
            <span>Push target</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-400/30" />
            <span>Blocked</span>
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

      {/* Replay Controls */}
      {history.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={replayStepBack}
            disabled={replayIndex === -1}
            className="h-8 w-8 p-0"
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            variant={isReplaying ? "secondary" : "ghost"}
            size="sm"
            onClick={toggleReplay}
            className="h-8 px-3"
          >
            {isReplaying ? (
              <><Pause className="w-4 h-4 mr-1" /> Pause</>
            ) : (
              <><Play className="w-4 h-4 mr-1" /> Replay</>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={replayStepForward}
            disabled={replayIndex === null || replayIndex >= history.length - 1}
            className="h-8 w-8 p-0"
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">
            {replayIndex !== null ? `${replayIndex + 1}/${history.length}` : `${history.length} moves`}
          </span>
        </div>
      )}

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
