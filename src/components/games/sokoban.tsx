"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Trophy, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGameCompletion } from "@/lib/game-completion";

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
// Level Data (10 Classic DOS Levels)
// =============================================================================

const LEVEL_DATA = [
  // Level 1 - Simple introduction
  {
    map: `
    #####
    #   #
    #$  #
  ###  $###
  #  $  $ #
### # ## #   ######
#   # ## #####  ..#
# $  $          ..#
##### ### #@##  ..#
    #     #########
    #######
`,
  },
  // Level 2
  {
    map: `
############
#..  #     ###
#..  # $  $  #
#..  #$####  #
#..    @ ##  #
#..  # #  $ ##
###### ##$ $ #
  # $  $ $ $ #
  #    #     #
  ############
`,
  },
  // Level 3
  {
    map: `
        ########
        #     @#
        # $#$ ##
        # $  $#
        ##$ $ #
######### $ # ###
#....  ## $  $  #
##...    $  $   #
#....  ##########
########
`,
  },
  // Level 4
  {
    map: `
              ########
              #  ....#
   ############  ....#
   #    #  $ $   ....#
   # $$$#$  $ #  ....#
   #  $     $ #  ....#
   # $$ #$ $ $########
####  $ #     #
#   # #########
#    $  ##
# $$#$$ @#
#   #   ##
#########
`,
  },
  // Level 5
  {
    map: `
        #####
        #   #####
        # #$##  #
        #     $ #
######### ###   #
#....  ## $  $###
#....    $ $$ ##
#....  ##$  $ @#
#########  $  ##
        # $ $  #
        ### ## #
          #    #
          ######
`,
  },
  // Level 6
  {
    map: `
######  ###
#..  # ##@##
#..  ###   #
#..     $$ #
#..  # # $ #
#..### # $ #
#### $ #$  #
   #  $# $ #
   # $  $  #
   #  ##   #
   #########
`,
  },
  // Level 7
  {
    map: `
       #####
 #######   ##
## # @## $$ #
#    $      #
#  $  ###   #
### ####$####
# $  ### ..#
# $ $ $ ...#
#    ###...#
###### #####
`,
  },
  // Level 8
  {
    map: `
  ####
  #  #########
  #    $  $  #
  # $ #  # $ #
  #  $###$  @#
###$###  # ###
#  $  #  #  #
#    $#  $  #
####  #  $  #
   #### ### #
  #....# #  #
  #....#    #
  ######### #
          ###
`,
  },
  // Level 9
  {
    map: `
          #####
          #   ##
          # $  #
  ####### #$   #
###     ###  $ #
#  $ ###  $ $$ #
#  @$       ####
###### ###$ #
     #     $#
     ### #  #
   #...###  #
   #...    ##
   #... ####
   #####
`,
  },
  // Level 10
  {
    map: `
     #######
     #  ...#
    ##  ...#
   ##  #...#
   #  # #..#
####$ # ##.#
#   $ # ####
#  $$ #$   #
###    $  @#
  ##### $ ##
      #  ##
      ####
`,
  },
];

// =============================================================================
// Level Parser
// =============================================================================

function parseLevel(levelData: { map: string }): GameState | null {
  const lines = levelData.map.split("\n").filter((line) => line.trim());
  if (lines.length === 0) return null;

  const rows = lines.length;
  const cols = Math.max(...lines.map((l) => l.length));

  const board: CellType[][] = [];
  let player: Position = { row: 0, col: 0 };
  const boxes: Position[] = [];
  const goals: Position[] = [];

  for (let r = 0; r < rows; r++) {
    const row: CellType[] = [];
    const line = lines[r].padEnd(cols, " ");

    for (let c = 0; c < cols; c++) {
      const char = line[c];

      switch (char) {
        case "#":
          row.push("wall");
          break;
        case ".":
          row.push("goal");
          goals.push({ row: r, col: c });
          break;
        case "$":
          row.push("floor");
          boxes.push({ row: r, col: c });
          break;
        case "@":
          row.push("floor");
          player = { row: r, col: c };
          break;
        case "+": // Player on goal
          row.push("goal");
          goals.push({ row: r, col: c });
          player = { row: r, col: c };
          break;
        case "*": // Box on goal
          row.push("goal");
          goals.push({ row: r, col: c });
          boxes.push({ row: r, col: c });
          break;
        default:
          row.push("floor");
      }
    }
    board.push(row);
  }

  return {
    board,
    player,
    boxes,
    goals,
    rows,
    cols,
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
// Cell Component
// =============================================================================

function Cell({
  type,
  isPlayer,
  isBox,
  isGoal,
  isBoxOnGoal,
  isPlayerOnGoal,
  size,
}: {
  type: CellType;
  isPlayer: boolean;
  isBox: boolean;
  isGoal: boolean;
  isBoxOnGoal: boolean;
  isPlayerOnGoal: boolean;
  size: number;
}) {
  const baseStyle = {
    width: size,
    height: size,
  };

  // Wall
  if (type === "wall") {
    return (
      <div
        style={baseStyle}
        className="bg-gradient-to-br from-stone-600 to-stone-800 border border-stone-900 shadow-inner"
      />
    );
  }

  // Floor/Goal background
  const bgClass =
    type === "goal" || isGoal
      ? "bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40"
      : "bg-gradient-to-br from-stone-200 to-stone-300 dark:from-stone-700 dark:to-stone-800";

  return (
    <div
      style={baseStyle}
      className={cn(
        bgClass,
        "relative flex items-center justify-center border border-stone-300 dark:border-stone-600"
      )}
    >
      {/* Goal marker */}
      {(type === "goal" || isGoal) && !isBox && !isPlayer && (
        <div className="absolute w-3 h-3 rounded-full bg-amber-500/60 dark:bg-amber-400/60 border-2 border-amber-600 dark:border-amber-500" />
      )}

      {/* Box */}
      {isBox && (
        <div
          className={cn(
            "w-[80%] h-[80%] rounded-sm shadow-md flex items-center justify-center transition-all duration-100",
            isBoxOnGoal
              ? "bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-emerald-700"
              : "bg-gradient-to-br from-amber-500 to-orange-600 border-2 border-orange-700"
          )}
        >
          <div className="w-[60%] h-[60%] border-2 border-white/30 rounded-sm" />
        </div>
      )}

      {/* Player */}
      {isPlayer && (
        <div
          className={cn(
            "w-[70%] h-[70%] rounded-full shadow-lg flex items-center justify-center",
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
  const [gameState, setGameState] = useState<GameState | null>(() => parseLevel(LEVEL_DATA[0]));
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const { submitCompletion } = useGameCompletion("sokoban");

  const totalLevels = LEVEL_DATA.length;

  // Change level with state reset
  const changeLevel = useCallback((newIndex: number) => {
    const clampedIndex = Math.max(0, Math.min(totalLevels - 1, newIndex));
    setLevelIndex(clampedIndex);
    setGameState(parseLevel(LEVEL_DATA[clampedIndex]));
    setHistory([]);
  }, [totalLevels]);

  // Reset current level
  const resetLevel = useCallback(() => {
    setGameState(parseLevel(LEVEL_DATA[levelIndex]));
    setHistory([]);
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
    setGameState({
      ...gameState,
      player: prev.player,
      boxes: prev.boxes,
      moveCount: prev.moveCount,
      pushCount: prev.pushCount,
      status: "playing",
    });
    setHistory((h) => h.slice(0, -1));
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
                  size={cellSize}
                />
              );
            })}
          </div>
        ))}
      </div>

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
