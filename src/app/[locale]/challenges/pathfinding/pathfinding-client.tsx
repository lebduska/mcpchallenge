"use client";

export const runtime = "edge";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Pause,
  RotateCcw,
  Trash2,
  SkipForward,
  Compass,
  Grid3x3,
  Droplets,
  Mountain,
  Eraser,
  Flag,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
type CellType = "empty" | "wall" | "start" | "goal" | "mud" | "water";
type Algorithm = "bfs" | "dijkstra" | "astar";
type Tool = "wall" | "start" | "goal" | "mud" | "water" | "erase";
type Direction = 4 | 8;

interface Cell {
  type: CellType;
  visited: boolean;
  inFrontier: boolean;
  inPath: boolean;
  gCost: number;
  fCost: number;
  parent: { x: number; y: number } | null;
}

interface Position {
  x: number;
  y: number;
}

interface Stats {
  pathFound: boolean | null;
  pathLength: number;
  pathCost: number;
  nodesExpanded: number;
  runtime: number;
  score: number;
}

// Constants
const GRID_WIDTH = 30;
const GRID_HEIGHT = 20;
const CELL_SIZE = 24;

const COST: Record<CellType, number> = {
  empty: 1,
  wall: Infinity,
  start: 1,
  goal: 1,
  mud: 5,
  water: 10,
};

// Helper functions
function createEmptyGrid(): Cell[][] {
  return Array(GRID_HEIGHT)
    .fill(null)
    .map(() =>
      Array(GRID_WIDTH)
        .fill(null)
        .map(() => ({
          type: "empty" as CellType,
          visited: false,
          inFrontier: false,
          inPath: false,
          gCost: Infinity,
          fCost: Infinity,
          parent: null,
        }))
    );
}

function getNeighbors(
  x: number,
  y: number,
  grid: Cell[][],
  directions: Direction
): Position[] {
  const neighbors: Position[] = [];
  const dirs4 = [
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
  ];
  const dirs8 = [
    ...dirs4,
    { dx: 1, dy: -1 },
    { dx: 1, dy: 1 },
    { dx: -1, dy: 1 },
    { dx: -1, dy: -1 },
  ];

  const dirList = directions === 4 ? dirs4 : dirs8;

  for (const { dx, dy } of dirList) {
    const nx = x + dx;
    const ny = y + dy;

    if (nx >= 0 && nx < GRID_WIDTH && ny >= 0 && ny < GRID_HEIGHT) {
      if (grid[ny][nx].type !== "wall") {
        // For diagonal movement, check corner-cutting
        if (dx !== 0 && dy !== 0) {
          const adj1 = grid[y][nx];
          const adj2 = grid[ny][x];
          if (adj1.type === "wall" || adj2.type === "wall") {
            continue; // Prevent diagonal corner-cutting
          }
        }
        neighbors.push({ x: nx, y: ny });
      }
    }
  }

  return neighbors;
}

function heuristic(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  directions: Direction
): number {
  if (directions === 4) {
    // Manhattan distance
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  } else {
    // Octile distance
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
  }
}

function moveCost(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  grid: Cell[][]
): number {
  const targetCost = COST[grid[y2][x2].type];
  const isDiagonal = x1 !== x2 && y1 !== y2;
  return isDiagonal ? targetCost * Math.SQRT2 : targetCost;
}

export function PathfindingClientPage() {
  const t = useTranslations("challenges.pathfinding");
  const [grid, setGrid] = useState<Cell[][]>(createEmptyGrid);
  const [algorithm, setAlgorithm] = useState<Algorithm>("astar");
  const [directions, setDirections] = useState<Direction>(4);
  const [tool, setTool] = useState<Tool>("wall");
  const [speed, setSpeed] = useState(50);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startPos, setStartPos] = useState<Position | null>(null);
  const [goalPos, setGoalPos] = useState<Position | null>(null);
  const [stats, setStats] = useState<Stats>({
    pathFound: null,
    pathLength: 0,
    pathCost: 0,
    nodesExpanded: 0,
    runtime: 0,
    score: 0,
  });
  const [isMouseDown, setIsMouseDown] = useState(false);

  const animationRef = useRef<number | null>(null);
  const frontierRef = useRef<Position[]>([]);
  const visitedRef = useRef<Set<string>>(new Set());
  const stepCountRef = useRef(0);
  const startTimeRef = useRef(0);

  const handleCellInteraction = useCallback(
    (x: number, y: number) => {
      if (isRunning) return;

      setGrid((prev) => {
        const newGrid = prev.map((row) => row.map((cell) => ({ ...cell })));

        if (tool === "start") {
          // Remove existing start
          if (startPos) {
            newGrid[startPos.y][startPos.x].type = "empty";
          }
          newGrid[y][x].type = "start";
          setStartPos({ x, y });
        } else if (tool === "goal") {
          // Remove existing goal
          if (goalPos) {
            newGrid[goalPos.y][goalPos.x].type = "empty";
          }
          newGrid[y][x].type = "goal";
          setGoalPos({ x, y });
        } else if (tool === "wall") {
          if (newGrid[y][x].type !== "start" && newGrid[y][x].type !== "goal") {
            newGrid[y][x].type = "wall";
          }
        } else if (tool === "mud") {
          if (newGrid[y][x].type !== "start" && newGrid[y][x].type !== "goal") {
            newGrid[y][x].type = "mud";
          }
        } else if (tool === "water") {
          if (newGrid[y][x].type !== "start" && newGrid[y][x].type !== "goal") {
            newGrid[y][x].type = "water";
          }
        } else if (tool === "erase") {
          if (newGrid[y][x].type === "start") {
            setStartPos(null);
          } else if (newGrid[y][x].type === "goal") {
            setGoalPos(null);
          }
          newGrid[y][x].type = "empty";
        }

        return newGrid;
      });
    },
    [tool, startPos, goalPos, isRunning]
  );

  const handleMouseDown = (x: number, y: number) => {
    setIsMouseDown(true);
    handleCellInteraction(x, y);
  };

  const handleMouseEnter = (x: number, y: number) => {
    if (isMouseDown) {
      handleCellInteraction(x, y);
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  const handleReset = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(false);
    frontierRef.current = [];
    visitedRef.current = new Set();
    stepCountRef.current = 0;

    setGrid((prev) =>
      prev.map((row) =>
        row.map((cell) => ({
          ...cell,
          visited: false,
          inFrontier: false,
          inPath: false,
          gCost: Infinity,
          fCost: Infinity,
          parent: null,
        }))
      )
    );
    setStats({
      pathFound: null,
      pathLength: 0,
      pathCost: 0,
      nodesExpanded: 0,
      runtime: 0,
      score: 0,
    });
  }, []);

  const handleClearAll = useCallback(() => {
    handleReset();
    setGrid(createEmptyGrid());
    setStartPos(null);
    setGoalPos(null);
  }, [handleReset]);

  const handleClearWalls = useCallback(() => {
    handleReset();
    setGrid((prev) =>
      prev.map((row) =>
        row.map((cell) => ({
          ...cell,
          type: cell.type === "wall" ? "empty" : cell.type,
        }))
      )
    );
  }, [handleReset]);

  const handleClearWeights = useCallback(() => {
    handleReset();
    setGrid((prev) =>
      prev.map((row) =>
        row.map((cell) => ({
          ...cell,
          type: cell.type === "mud" || cell.type === "water" ? "empty" : cell.type,
        }))
      )
    );
  }, [handleReset]);

  const reconstructPath = useCallback((endX: number, endY: number) => {
    const path: Position[] = [];
    let current: Position | null = { x: endX, y: endY };

    setGrid((prev) => {
      const newGrid = prev.map((row) => row.map((cell) => ({ ...cell })));

      while (current) {
        path.push(current);
        newGrid[current.y][current.x].inPath = true;
        const cell = newGrid[current.y][current.x];
        current = cell.parent;
      }

      return newGrid;
    });

    return path;
  }, []);

  const runStep = useCallback(() => {
    if (!startPos || !goalPos) return false;

    const frontier = frontierRef.current;
    if (frontier.length === 0) return false;

    // Sort frontier for priority queue behavior
    if (algorithm === "dijkstra" || algorithm === "astar") {
      frontier.sort((a, b) => {
        const cellA = grid[a.y][a.x];
        const cellB = grid[b.y][b.x];
        const costA = algorithm === "astar" ? cellA.fCost : cellA.gCost;
        const costB = algorithm === "astar" ? cellB.fCost : cellB.gCost;
        return costA - costB;
      });
    }

    const current = frontier.shift()!;
    stepCountRef.current++;

    // Check if we reached the goal
    if (current.x === goalPos.x && current.y === goalPos.y) {
      const path = reconstructPath(current.x, current.y);
      const runtime = performance.now() - startTimeRef.current;

      let pathCost = 0;
      for (let i = 0; i < path.length - 1; i++) {
        pathCost += moveCost(path[i].x, path[i].y, path[i + 1].x, path[i + 1].y, grid);
      }

      const score = Math.max(
        0,
        1000 - stepCountRef.current * 2 - pathCost * 3 - runtime / 50
      );

      setStats({
        pathFound: true,
        pathLength: path.length,
        pathCost: Math.round(pathCost * 100) / 100,
        nodesExpanded: stepCountRef.current,
        runtime: Math.round(runtime),
        score: Math.round(score),
      });

      setIsRunning(false);
      return false;
    }

    // Mark as visited
    setGrid((prev) => {
      const newGrid = prev.map((row) => row.map((cell) => ({ ...cell })));
      newGrid[current.y][current.x].visited = true;
      newGrid[current.y][current.x].inFrontier = false;

      // Expand neighbors
      const neighbors = getNeighbors(current.x, current.y, newGrid, directions);

      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (visitedRef.current.has(key)) continue;

        const currentCell = newGrid[current.y][current.x];
        const neighborCell = newGrid[neighbor.y][neighbor.x];
        const cost = moveCost(current.x, current.y, neighbor.x, neighbor.y, newGrid);

        let newGCost: number;
        if (algorithm === "bfs") {
          newGCost = currentCell.gCost + 1; // BFS ignores weights
        } else {
          newGCost = currentCell.gCost + cost;
        }

        if (newGCost < neighborCell.gCost) {
          neighborCell.gCost = newGCost;
          neighborCell.parent = { x: current.x, y: current.y };

          if (algorithm === "astar") {
            neighborCell.fCost =
              newGCost + heuristic(neighbor.x, neighbor.y, goalPos.x, goalPos.y, directions);
          } else {
            neighborCell.fCost = newGCost;
          }

          if (!neighborCell.inFrontier) {
            neighborCell.inFrontier = true;
            frontier.push(neighbor);
          }
        }
      }

      visitedRef.current.add(key);
      return newGrid;
    });

    const key = `${current.x},${current.y}`;
    visitedRef.current.add(key);

    return true;
  }, [algorithm, directions, goalPos, grid, reconstructPath, startPos]);

  const handleRun = useCallback(() => {
    if (!startPos || !goalPos) return;
    if (isRunning && !isPaused) return;

    if (!isRunning) {
      handleReset();
      startTimeRef.current = performance.now();

      // Initialize
      setGrid((prev) => {
        const newGrid = prev.map((row) => row.map((cell) => ({ ...cell })));
        newGrid[startPos.y][startPos.x].gCost = 0;
        newGrid[startPos.y][startPos.x].fCost = heuristic(
          startPos.x,
          startPos.y,
          goalPos.x,
          goalPos.y,
          directions
        );
        newGrid[startPos.y][startPos.x].inFrontier = true;
        return newGrid;
      });

      frontierRef.current = [{ ...startPos }];
      visitedRef.current = new Set();
      stepCountRef.current = 0;
    }

    setIsRunning(true);
    setIsPaused(false);

    const animate = () => {
      if (!runStep()) {
        // No more steps or found goal
        if (frontierRef.current.length === 0 && stats.pathFound === null) {
          const runtime = performance.now() - startTimeRef.current;
          setStats({
            pathFound: false,
            pathLength: 0,
            pathCost: 0,
            nodesExpanded: stepCountRef.current,
            runtime: Math.round(runtime),
            score: Math.max(0, 500 - stepCountRef.current),
          });
          setIsRunning(false);
        }
        return;
      }

      const delay = Math.max(10, 200 - speed * 2);
      animationRef.current = window.setTimeout(() => {
        requestAnimationFrame(animate);
      }, delay) as unknown as number;
    };

    requestAnimationFrame(animate);
  }, [startPos, goalPos, isRunning, isPaused, handleReset, directions, runStep, speed, stats.pathFound]);

  const handleStep = useCallback(() => {
    if (!startPos || !goalPos) return;

    if (!isRunning) {
      handleReset();
      startTimeRef.current = performance.now();

      setGrid((prev) => {
        const newGrid = prev.map((row) => row.map((cell) => ({ ...cell })));
        newGrid[startPos.y][startPos.x].gCost = 0;
        newGrid[startPos.y][startPos.x].fCost = heuristic(
          startPos.x,
          startPos.y,
          goalPos.x,
          goalPos.y,
          directions
        );
        newGrid[startPos.y][startPos.x].inFrontier = true;
        return newGrid;
      });

      frontierRef.current = [{ ...startPos }];
      visitedRef.current = new Set();
      stepCountRef.current = 0;
      setIsRunning(true);
      setIsPaused(true);
    }

    runStep();
  }, [startPos, goalPos, isRunning, handleReset, directions, runStep]);

  const handlePause = useCallback(() => {
    setIsPaused(true);
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          if (isRunning) {
            setIsPaused((p) => !p);
          } else {
            handleRun();
          }
          break;
        case "r":
          handleReset();
          break;
        case "c":
          handleClearAll();
          break;
        case "1":
          setAlgorithm("bfs");
          break;
        case "2":
          setAlgorithm("dijkstra");
          break;
        case "3":
          setAlgorithm("astar");
          break;
        case "w":
          setTool("wall");
          break;
        case "s":
          setTool("start");
          break;
        case "g":
          setTool("goal");
          break;
        case "m":
          setTool("mud");
          break;
        case "e":
          setTool("erase");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRunning, handleRun, handleReset, handleClearAll]);

  const canRun = startPos !== null && goalPos !== null;

  const getCellColor = (cell: Cell): string => {
    if (cell.type === "wall") return "bg-zinc-800 dark:bg-zinc-900";
    if (cell.type === "start") return "bg-emerald-500";
    if (cell.type === "goal") return "bg-red-500";
    if (cell.type === "mud") return "bg-amber-600/70";
    if (cell.type === "water") return "bg-blue-500/70";
    if (cell.inPath) return "bg-yellow-400";
    if (cell.inFrontier) return "bg-cyan-300 dark:bg-cyan-500/50";
    if (cell.visited) return "bg-blue-200 dark:bg-blue-800/50";
    return "bg-zinc-100 dark:bg-zinc-800/30";
  };

  const tools: { id: Tool; icon: typeof Grid3x3; label: string; shortcut: string }[] = [
    { id: "wall", icon: Grid3x3, label: "Wall", shortcut: "W" },
    { id: "mud", icon: Mountain, label: "Mud (5)", shortcut: "M" },
    { id: "water", icon: Droplets, label: "Water (10)", shortcut: "U" },
    { id: "start", icon: MapPin, label: "Start", shortcut: "S" },
    { id: "goal", icon: Flag, label: "Goal", shortcut: "G" },
    { id: "erase", icon: Eraser, label: "Erase", shortcut: "E" },
  ];

  return (
    <div
      className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center justify-center gap-3">
            <Compass className="h-8 w-8 text-cyan-500" />
            {t("title")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">{t("description")}</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Controls */}
          <Card className="lg:w-72 p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <div className="space-y-4">
              {/* Algorithm */}
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-2">
                  {t("algorithm")}
                </label>
                <Select value={algorithm} onValueChange={(v) => setAlgorithm(v as Algorithm)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bfs">BFS (1)</SelectItem>
                    <SelectItem value="dijkstra">Dijkstra (2)</SelectItem>
                    <SelectItem value="astar">A* (3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Directions */}
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-2">
                  {t("movement")}
                </label>
                <Select
                  value={directions.toString()}
                  onValueChange={(v) => setDirections(parseInt(v) as Direction)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4-way (Cardinal)</SelectItem>
                    <SelectItem value="8">8-way (+ Diagonal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Speed */}
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-2">
                  {t("speed")}: {speed}%
                </label>
                <Slider
                  value={[speed]}
                  onValueChange={([v]) => setSpeed(v)}
                  min={10}
                  max={100}
                  step={10}
                />
              </div>

              {/* Tools */}
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-2">
                  {t("tools")}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {tools.map(({ id, icon: Icon, label, shortcut }) => (
                    <button
                      key={id}
                      onClick={() => setTool(id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-lg border transition-all",
                        tool === id
                          ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300"
                          : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                      )}
                      title={`${label} (${shortcut})`}
                    >
                      <Icon className="h-4 w-4 mb-1" />
                      <span className="text-xs">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  {!isRunning || isPaused ? (
                    <Button
                      onClick={handleRun}
                      disabled={!canRun}
                      className="flex-1 gap-2"
                    >
                      <Play className="h-4 w-4" />
                      {t("run")}
                    </Button>
                  ) : (
                    <Button onClick={handlePause} variant="secondary" className="flex-1 gap-2">
                      <Pause className="h-4 w-4" />
                      {t("pause")}
                    </Button>
                  )}
                  <Button
                    onClick={handleStep}
                    variant="outline"
                    disabled={!canRun}
                    title="Step"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleReset} variant="outline" className="flex-1 gap-2">
                    <RotateCcw className="h-4 w-4" />
                    {t("reset")}
                  </Button>
                  <Button onClick={handleClearAll} variant="outline" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2 text-xs">
                  <Button onClick={handleClearWalls} variant="ghost" size="sm" className="flex-1">
                    {t("clearWalls")}
                  </Button>
                  <Button onClick={handleClearWeights} variant="ghost" size="sm" className="flex-1">
                    {t("clearWeights")}
                  </Button>
                </div>
              </div>

              {/* Warning if no start/goal */}
              {!canRun && (
                <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
                  {t("placeStartGoal")}
                </div>
              )}
            </div>
          </Card>

          {/* Grid */}
          <Card className="flex-1 p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 overflow-auto">
            <div
              className="grid gap-px bg-zinc-300 dark:bg-zinc-700 p-px rounded-lg mx-auto"
              style={{
                gridTemplateColumns: `repeat(${GRID_WIDTH}, ${CELL_SIZE}px)`,
                width: "fit-content",
              }}
            >
              {grid.map((row, y) =>
                row.map((cell, x) => (
                  <div
                    key={`${x}-${y}`}
                    className={cn(
                      "transition-colors duration-100 cursor-pointer select-none flex items-center justify-center text-xs font-bold",
                      getCellColor(cell)
                    )}
                    style={{ width: CELL_SIZE, height: CELL_SIZE }}
                    onMouseDown={() => handleMouseDown(x, y)}
                    onMouseEnter={() => handleMouseEnter(x, y)}
                  >
                    {cell.type === "start" && <span className="text-white">S</span>}
                    {cell.type === "goal" && <span className="text-white">G</span>}
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Stats */}
          <Card className="lg:w-64 p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">{t("statistics")}</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">{t("pathFound")}</span>
                <span
                  className={cn(
                    "font-medium",
                    stats.pathFound === true
                      ? "text-emerald-500"
                      : stats.pathFound === false
                      ? "text-red-500"
                      : "text-zinc-400"
                  )}
                >
                  {stats.pathFound === null ? "-" : stats.pathFound ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">{t("pathLength")}</span>
                <span className="font-medium text-zinc-900 dark:text-white">
                  {stats.pathLength || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">{t("pathCost")}</span>
                <span className="font-medium text-zinc-900 dark:text-white">
                  {stats.pathCost || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">{t("nodesExpanded")}</span>
                <span className="font-medium text-zinc-900 dark:text-white">
                  {stats.nodesExpanded || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">{t("runtime")}</span>
                <span className="font-medium text-zinc-900 dark:text-white">
                  {stats.runtime ? `${stats.runtime}ms` : "-"}
                </span>
              </div>
              <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-zinc-900 dark:text-white font-semibold">{t("score")}</span>
                  <span className="font-bold text-xl text-cyan-500">{stats.score || "-"}</span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-6">
              <h4 className="font-medium text-zinc-900 dark:text-white mb-3">{t("legend")}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-emerald-500" />
                  <span className="text-zinc-600 dark:text-zinc-400">Start</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500" />
                  <span className="text-zinc-600 dark:text-zinc-400">Goal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-zinc-800" />
                  <span className="text-zinc-600 dark:text-zinc-400">Wall</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-amber-600/70" />
                  <span className="text-zinc-600 dark:text-zinc-400">Mud (5)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-500/70" />
                  <span className="text-zinc-600 dark:text-zinc-400">Water (10)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-200 dark:bg-blue-800/50" />
                  <span className="text-zinc-600 dark:text-zinc-400">Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-cyan-300" />
                  <span className="text-zinc-600 dark:text-zinc-400">Frontier</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-400" />
                  <span className="text-zinc-600 dark:text-zinc-400">Path</span>
                </div>
              </div>
            </div>

            {/* Shortcuts */}
            <div className="mt-6 text-xs text-zinc-500 dark:text-zinc-500">
              <p className="font-medium mb-1">{t("shortcuts")}</p>
              <p>Space: Run/Pause</p>
              <p>R: Reset | C: Clear</p>
              <p>1-3: Algorithm</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
