"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Footprints,
  Zap,
  Trophy,
  Eye,
} from "lucide-react";
import { useGameCompletion } from "@/lib/game-completion";
import { useReplayShare } from "@/hooks/use-replay-share";
import { ShareButton } from "@/components/games/share-button";

type Direction = "up" | "down" | "left" | "right";
type Position = { x: number; y: number };
type GameMode = "realtime" | "step" | null;
type GameStatus = "waiting" | "playing" | "paused" | "gameover";

interface SnakeMove {
  direction: Direction;
  ate: boolean;
  position: Position;
}

interface LookResult {
  up: "empty" | "food" | "wall" | "body";
  down: "empty" | "food" | "wall" | "body";
  left: "empty" | "food" | "wall" | "body";
  right: "empty" | "food" | "wall" | "body";
}

interface SnakeGameProps {
  onStateChange?: (state: {
    snake: Position[];
    food: Position;
    direction: Direction;
    score: number;
    gameOver: boolean;
    look: LookResult;
  }) => void;
  onGameComplete?: (result: { score: number }) => void;
  gridSize?: number;
}

function getRandomPosition(gridSize: number, exclude: Position[] = []): Position {
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize),
    };
  } while (exclude.some(p => p.x === pos.x && p.y === pos.y));
  return pos;
}

export function SnakeGame({ onStateChange, onGameComplete, gridSize = 15 }: SnakeGameProps) {
  const [snake, setSnake] = useState<Position[]>([{ x: 7, y: 7 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>("right");
  const [nextDirection, setNextDirection] = useState<Direction>("right");
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>("waiting");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(150);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Game completion hook
  const { submitCompletion, isAuthenticated } = useGameCompletion("snake");

  // Replay sharing hook
  const replay = useReplayShare<SnakeMove>({
    challengeId: "snake",
  });

  // Calculate what's in each direction
  const look = useCallback((): LookResult => {
    const head = snake[0];
    const checkPosition = (dx: number, dy: number): "empty" | "food" | "wall" | "body" => {
      const newX = head.x + dx;
      const newY = head.y + dy;

      if (newX < 0 || newX >= gridSize || newY < 0 || newY >= gridSize) {
        return "wall";
      }
      if (newX === food.x && newY === food.y) {
        return "food";
      }
      if (snake.some((s, i) => i > 0 && s.x === newX && s.y === newY)) {
        return "body";
      }
      return "empty";
    };

    return {
      up: checkPosition(0, -1),
      down: checkPosition(0, 1),
      left: checkPosition(-1, 0),
      right: checkPosition(1, 0),
    };
  }, [snake, food, gridSize]);

  // Move snake one step
  const moveSnake = useCallback(() => {
    setSnake(currentSnake => {
      const head = currentSnake[0];
      const dir = nextDirection;
      setDirection(dir);

      const newHead: Position = {
        x: head.x + (dir === "left" ? -1 : dir === "right" ? 1 : 0),
        y: head.y + (dir === "up" ? -1 : dir === "down" ? 1 : 0),
      };

      // Check wall collision
      if (newHead.x < 0 || newHead.x >= gridSize || newHead.y < 0 || newHead.y >= gridSize) {
        setGameStatus("gameover");
        if (score > highScore) setHighScore(score);
        // Save replay on game over
        replay.saveReplay({ score, won: false });
        return currentSnake;
      }

      // Check self collision
      if (currentSnake.some(s => s.x === newHead.x && s.y === newHead.y)) {
        setGameStatus("gameover");
        if (score > highScore) setHighScore(score);
        // Save replay on game over
        replay.saveReplay({ score, won: false });
        return currentSnake;
      }

      const newSnake = [newHead, ...currentSnake];
      const ate = newHead.x === food.x && newHead.y === food.y;

      // Record move
      replay.recordMove({
        direction: dir,
        ate,
        position: newHead,
      });

      // Check food
      if (ate) {
        setScore(s => s + 1);
        setFood(getRandomPosition(gridSize, newSnake));
        // Speed up slightly
        setSpeed(s => Math.max(50, s - 2));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [nextDirection, food, gridSize, score, highScore, replay]);

  // Game loop for realtime mode
  useEffect(() => {
    if (gameMode === "realtime" && gameStatus === "playing") {
      gameLoopRef.current = setInterval(moveSnake, speed);
      return () => {
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      };
    }
  }, [gameMode, gameStatus, moveSnake, speed]);

  // Notify state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        snake,
        food,
        direction,
        score,
        gameOver: gameStatus === "gameover",
        look: look(),
      });
    }
  }, [snake, food, direction, score, gameStatus, look, onStateChange]);

  // Notify game completion
  const completionCalledRef = useRef(false);
  useEffect(() => {
    if (gameStatus === "gameover" && !completionCalledRef.current) {
      completionCalledRef.current = true;

      // Call the onGameComplete callback if provided
      if (onGameComplete) {
        onGameComplete({ score });
      }

      // Submit to database if authenticated
      if (isAuthenticated) {
        submitCompletion({ score });
      }
    }
    if (gameStatus === "waiting") {
      completionCalledRef.current = false;
    }
  }, [gameStatus, score, onGameComplete, isAuthenticated, submitCompletion]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== "playing") return;

      const keyMap: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
      };

      const newDir = keyMap[e.key];
      if (!newDir) return;

      // Prevent 180-degree turns
      const opposites: Record<Direction, Direction> = {
        up: "down",
        down: "up",
        left: "right",
        right: "left",
      };

      if (opposites[newDir] !== direction) {
        setNextDirection(newDir);
        if (gameMode === "step") {
          moveSnake();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameStatus, direction, gameMode, moveSnake]);

  const startGame = (mode: GameMode) => {
    setSnake([{ x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) }]);
    setFood(getRandomPosition(gridSize, [{ x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) }]));
    setDirection("right");
    setNextDirection("right");
    setScore(0);
    setSpeed(150);
    setGameMode(mode);
    setGameStatus("playing");
    replay.reset();
  };

  const resetGame = () => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    setGameMode(null);
    setGameStatus("waiting");
    setSnake([{ x: 7, y: 7 }]);
    setFood({ x: 5, y: 5 });
    setDirection("right");
    setNextDirection("right");
    setScore(0);
    setSpeed(150);
    replay.reset();
  };

  const togglePause = () => {
    setGameStatus(s => s === "playing" ? "paused" : "playing");
  };

  const stepMove = (dir: Direction) => {
    if (gameStatus !== "playing" || gameMode !== "step") return;

    const opposites: Record<Direction, Direction> = {
      up: "down", down: "up", left: "right", right: "left",
    };

    if (opposites[dir] !== direction) {
      setNextDirection(dir);
      setTimeout(moveSnake, 0);
    }
  };

  const currentLook = look();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Game Board */}
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-4">
            {gameMode === null ? (
              // Mode selection
              <div
                className="flex flex-col items-center justify-center gap-6 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-8"
                style={{ aspectRatio: "1" }}
              >
                <h2 className="text-2xl font-bold">Choose Game Mode</h2>
                <p className="text-zinc-500 text-center max-w-sm">
                  Real-time mode plays like classic snake. Step mode lets you (or an AI via MCP) control each move.
                </p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <Button
                    size="lg"
                    className="gap-2 w-full"
                    onClick={() => startGame("realtime")}
                  >
                    <Zap className="h-5 w-5" />
                    Real-time Mode
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 w-full"
                    onClick={() => startGame("step")}
                  >
                    <Footprints className="h-5 w-5" />
                    Step Mode (for MCP)
                  </Button>
                </div>
              </div>
            ) : (
              // Game board
              <div className="relative">
                <div
                  className="grid gap-0 bg-zinc-800 dark:bg-zinc-900 rounded-lg p-2 mx-auto"
                  style={{
                    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                    aspectRatio: "1",
                    maxWidth: "500px",
                  }}
                >
                  {Array(gridSize * gridSize).fill(null).map((_, i) => {
                    const x = i % gridSize;
                    const y = Math.floor(i / gridSize);
                    const isSnakeHead = snake[0].x === x && snake[0].y === y;
                    const isSnakeBody = snake.some((s, idx) => idx > 0 && s.x === x && s.y === y);
                    const isFood = food.x === x && food.y === y;

                    return (
                      <div
                        key={i}
                        className={`
                          aspect-square rounded-sm transition-colors
                          ${isSnakeHead
                            ? "bg-green-500"
                            : isSnakeBody
                              ? "bg-green-600"
                              : isFood
                                ? "bg-red-500"
                                : "bg-zinc-800"
                          }
                        `}
                      />
                    );
                  })}
                </div>

                {/* Game over overlay */}
                {gameStatus === "gameover" && (
                  <div className="absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center">
                    <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 text-center">
                      <Trophy className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                      <h3 className="text-xl font-bold mb-2">Game Over!</h3>
                      <p className="text-2xl font-bold text-green-500 mb-4">Score: {score}</p>
                      {score === highScore && score > 0 && (
                        <Badge className="mb-4">New High Score!</Badge>
                      )}
                      <div className="flex gap-2 justify-center">
                        <Button onClick={() => startGame(gameMode)}>
                          Play Again
                        </Button>
                        <Button variant="outline" onClick={resetGame}>
                          Change Mode
                        </Button>
                        <ShareButton
                          canShare={replay.canShare}
                          isSharing={replay.isSharing}
                          shareCopied={replay.shareCopied}
                          onShare={replay.shareReplay}
                          variant="outline"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Paused overlay */}
                {gameStatus === "paused" && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 text-center">
                      <Pause className="h-12 w-12 mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-4">Paused</h3>
                      <Button onClick={togglePause}>
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Controls & Info Panel */}
      <div className="space-y-4">
        {/* Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{score}</div>
                <div className="text-xs text-zinc-500">Current</div>
              </div>
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <div className="text-3xl font-bold">{highScore}</div>
                <div className="text-xs text-zinc-500">High Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Look (what's around) */}
        {gameMode && gameStatus !== "waiting" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Snake Vision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-1 text-center text-xs max-w-[150px] mx-auto">
                <div />
                <div className={`p-2 rounded ${
                  currentLook.up === "food" ? "bg-red-200 dark:bg-red-900" :
                  currentLook.up === "wall" || currentLook.up === "body" ? "bg-zinc-300 dark:bg-zinc-600" :
                  "bg-green-100 dark:bg-green-900/30"
                }`}>
                  {currentLook.up}
                </div>
                <div />
                <div className={`p-2 rounded ${
                  currentLook.left === "food" ? "bg-red-200 dark:bg-red-900" :
                  currentLook.left === "wall" || currentLook.left === "body" ? "bg-zinc-300 dark:bg-zinc-600" :
                  "bg-green-100 dark:bg-green-900/30"
                }`}>
                  {currentLook.left}
                </div>
                <div className="p-2 bg-green-500 rounded text-white font-bold">
                  HEAD
                </div>
                <div className={`p-2 rounded ${
                  currentLook.right === "food" ? "bg-red-200 dark:bg-red-900" :
                  currentLook.right === "wall" || currentLook.right === "body" ? "bg-zinc-300 dark:bg-zinc-600" :
                  "bg-green-100 dark:bg-green-900/30"
                }`}>
                  {currentLook.right}
                </div>
                <div />
                <div className={`p-2 rounded ${
                  currentLook.down === "food" ? "bg-red-200 dark:bg-red-900" :
                  currentLook.down === "wall" || currentLook.down === "body" ? "bg-zinc-300 dark:bg-zinc-600" :
                  "bg-green-100 dark:bg-green-900/30"
                }`}>
                  {currentLook.down}
                </div>
                <div />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step Controls */}
        {gameMode === "step" && gameStatus === "playing" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Step Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-1 max-w-[150px] mx-auto">
                <div />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => stepMove("up")}
                  disabled={direction === "down"}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <div />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => stepMove("left")}
                  disabled={direction === "right"}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center justify-center">
                  <Badge variant="outline" className="text-xs">
                    {direction}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => stepMove("right")}
                  disabled={direction === "left"}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <div />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => stepMove("down")}
                  disabled={direction === "up"}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <div />
              </div>
              <p className="text-xs text-zinc-500 text-center mt-3">
                Or use arrow keys / WASD
              </p>
            </CardContent>
          </Card>
        )}

        {/* Game Controls */}
        {gameMode && gameStatus !== "gameover" && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex gap-2">
                {gameMode === "realtime" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={togglePause}
                  >
                    {gameStatus === "paused" ? (
                      <><Play className="h-4 w-4 mr-1" /> Resume</>
                    ) : (
                      <><Pause className="h-4 w-4 mr-1" /> Pause</>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={resetGame}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {gameMode === null && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">How to Play</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
              <p><strong>Real-time:</strong> Classic snake with arrow keys or WASD.</p>
              <p><strong>Step mode:</strong> Game waits for your input. Perfect for MCP integration - each move is a tool call!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
