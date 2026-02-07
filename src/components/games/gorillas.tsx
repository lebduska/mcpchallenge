"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, ChevronLeft, ChevronRight, Trophy, Wind, Target, Zap, Bot, User, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGameCompletion } from "@/lib/game-completion";
import {
  GorillasEngine,
  GORILLAS_LEVELS,
  type GorillasState,
  type GorillasMove,
  type Trajectory,
} from "@mcpchallenge/game-engines";

// =============================================================================
// Types
// =============================================================================

type Difficulty = "easy" | "medium" | "hard";

interface GorillasGameProps {
  onGameComplete?: (result: { won: boolean; level: number; score: number }) => void;
}

// =============================================================================
// Constants
// =============================================================================

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500; // Must match engine's CANVAS_HEIGHT
const ANIMATION_SPEED = 16; // ms per frame

// Building color palette (like original DOS game)
const BUILDING_COLORS = [
  "#8B0000", // Dark red
  "#4A4A4A", // Gray
  "#1E3A5F", // Navy blue
  "#2F4F4F", // Dark slate
  "#3D3D3D", // Charcoal
  "#5C3317", // Brown
];

// =============================================================================
// Helper Components
// =============================================================================

function Building({ x, width, height, color, windowSeed }: {
  x: number;
  width: number;
  height: number;
  color: string;
  windowSeed: number;
}) {
  const windowRows = Math.floor(height / 35);
  const windowCols = Math.floor(width / 28);

  // Deterministic window lighting based on seed
  const isWindowLit = (row: number, col: number) => {
    const hash = ((windowSeed + row * 17 + col * 31) % 100);
    return hash > 35;
  };

  return (
    <g>
      {/* Building shadow */}
      <rect
        x={x + 4}
        y={CANVAS_HEIGHT - height + 4}
        width={width}
        height={height}
        fill="rgba(0,0,0,0.3)"
      />
      {/* Building body */}
      <rect
        x={x}
        y={CANVAS_HEIGHT - height}
        width={width}
        height={height}
        fill={color}
        stroke="#1a1a1a"
        strokeWidth={2}
      />
      {/* Building edge highlight */}
      <rect
        x={x}
        y={CANVAS_HEIGHT - height}
        width={4}
        height={height}
        fill="rgba(255,255,255,0.1)"
      />
      {/* Roof detail */}
      <rect
        x={x}
        y={CANVAS_HEIGHT - height}
        width={width}
        height={6}
        fill="rgba(0,0,0,0.3)"
      />
      {/* Windows */}
      {Array.from({ length: windowRows }).map((_, row) =>
        Array.from({ length: windowCols }).map((_, col) => {
          const lit = isWindowLit(row, col);
          return (
            <g key={`${row}-${col}`}>
              {/* Window frame */}
              <rect
                x={x + 10 + col * 28}
                y={CANVAS_HEIGHT - height + 20 + row * 35}
                width={16}
                height={22}
                fill="#1a1a1a"
              />
              {/* Window glass */}
              <rect
                x={x + 12 + col * 28}
                y={CANVAS_HEIGHT - height + 22 + row * 35}
                width={12}
                height={18}
                fill={lit ? "#FFEB3B" : "#2a2a3a"}
                opacity={lit ? 0.95 : 0.8}
              />
              {/* Window glow */}
              {lit && (
                <rect
                  x={x + 12 + col * 28}
                  y={CANVAS_HEIGHT - height + 22 + row * 35}
                  width={12}
                  height={18}
                  fill="url(#windowGlow)"
                  opacity={0.3}
                />
              )}
            </g>
          );
        })
      )}
    </g>
  );
}

function Gorilla({ x, y, isPlayer1, isActive, score, angle }: {
  x: number;
  y: number;
  isPlayer1: boolean;
  isActive: boolean;
  score: number;
  angle?: number;
}) {
  // Classic DOS-style gorilla - blocky and simple
  // y=0 is at the FEET level (bottom of gorilla)
  // Throwing arm angle based on current aim
  const armAngle = isActive && angle !== undefined ? -(angle + 20) : 20;

  // Offset so that feet are at y=0
  const offsetY = -40;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Body - brown rectangle */}
      <rect x={-12} y={offsetY - 5} width={24} height={35} fill="#8B4513" rx={3} />

      {/* Head */}
      <rect x={-10} y={offsetY - 30} width={20} height={25} fill="#8B4513" rx={4} />

      {/* Face area */}
      <rect x={-7} y={offsetY - 22} width={14} height={14} fill="#D2B48C" rx={2} />

      {/* Eyes */}
      <rect x={-5} y={offsetY - 20} width={3} height={4} fill="white" />
      <rect x={2} y={offsetY - 20} width={3} height={4} fill="white" />
      <rect x={-4} y={offsetY - 19} width={2} height={2} fill="black" />
      <rect x={3} y={offsetY - 19} width={2} height={2} fill="black" />

      {/* Nose/mouth */}
      <rect x={-3} y={offsetY - 14} width={6} height={4} fill="#654321" rx={1} />

      {/* Left arm */}
      <g transform={`rotate(${isPlayer1 ? 20 : armAngle}, -12, ${offsetY + 5})`}>
        <rect x={-22} y={offsetY} width={12} height={8} fill="#8B4513" rx={2} />
      </g>

      {/* Right arm */}
      <g transform={`rotate(${isPlayer1 ? armAngle : 20}, 12, ${offsetY + 5})`}>
        <rect x={10} y={offsetY} width={12} height={8} fill="#8B4513" rx={2} />
      </g>

      {/* Legs - bottom at y=0 */}
      <rect x={-10} y={-12} width={8} height={12} fill="#8B4513" rx={2} />
      <rect x={2} y={-12} width={8} height={12} fill="#8B4513" rx={2} />

      {/* Player indicator */}
      <rect
        x={-14}
        y={offsetY - 50}
        width={28}
        height={14}
        rx={3}
        fill={isPlayer1 ? "#2196F3" : "#f44336"}
      />
      <text
        x={0}
        y={offsetY - 40}
        textAnchor="middle"
        fill="white"
        fontSize={10}
        fontWeight="bold"
      >
        {isPlayer1 ? "P1" : "AI"}
      </text>

      {/* Score */}
      <text
        x={0}
        y={offsetY - 58}
        textAnchor="middle"
        fill={isActive ? "#FFD700" : "#888"}
        fontSize={12}
        fontWeight="bold"
      >
        {score}
      </text>

      {/* Active indicator */}
      {isActive && (
        <rect
          x={-15}
          y={offsetY - 32}
          width={30}
          height={72}
          fill="none"
          stroke="#4CAF50"
          strokeWidth={2}
          strokeDasharray="4,2"
          rx={4}
          className="animate-pulse"
        />
      )}
    </g>
  );
}

function Banana({ x, y, rotation }: { x: number; y: number; rotation: number }) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      {/* Banana shape - larger and more detailed */}
      <path
        d="M -15 0 Q -12 -15, 0 -18 Q 12 -15, 15 0 Q 12 8, 0 12 Q -12 8, -15 0"
        fill="#FFD700"
        stroke="#FFA000"
        strokeWidth={2}
      />
      {/* Banana tip */}
      <ellipse cx={0} cy={-16} rx={3} ry={4} fill="#8D6E63" />
      {/* Banana stripe */}
      <path
        d="M -10 0 Q -8 -10, 0 -12 Q 8 -10, 10 0"
        fill="none"
        stroke="#FFEB3B"
        strokeWidth={2}
        opacity={0.5}
      />
    </g>
  );
}

// Aiming indicator - simple line showing direction
function AimingIndicator({
  x, y, angle, velocity, isPlayer1
}: {
  x: number;
  y: number;
  angle: number;
  velocity: number;
  isPlayer1: boolean;
  canvasHeight: number;
}) {
  const direction = isPlayer1 ? 1 : -1;
  const angleRad = (angle * Math.PI) / 180;

  // Line length based on velocity
  const lineLength = 40 + (velocity / 200) * 80;
  const endX = x + direction * Math.cos(angleRad) * lineLength;
  const endY = y - Math.sin(angleRad) * lineLength;

  return (
    <g>
      {/* Simple aiming line */}
      <line
        x1={x}
        y1={y}
        x2={endX}
        y2={endY}
        stroke="#4CAF50"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray="8,4"
      />

      {/* Arrow head */}
      <g transform={`translate(${endX}, ${endY}) rotate(${isPlayer1 ? -angle : 180 + angle})`}>
        <polygon
          points="0,-5 10,0 0,5"
          fill="#4CAF50"
        />
      </g>

      {/* Angle display */}
      <text
        x={x + direction * 25}
        y={y - 10}
        textAnchor={isPlayer1 ? "start" : "end"}
        fill="#4CAF50"
        fontSize={12}
        fontWeight="bold"
      >
        {angle}°
      </text>
    </g>
  );
}

function Explosion({ x, y, radius }: { x: number; y: number; radius: number }) {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill="url(#explosionGradient)"
        className="animate-ping"
        style={{ animationDuration: "0.5s" }}
      />
      <circle
        cx={x}
        cy={y}
        r={radius * 0.6}
        fill="#FF5722"
        className="animate-ping"
        style={{ animationDuration: "0.3s" }}
      />
    </g>
  );
}

function TrajectoryPath({ points, isAnimating, currentIndex }: {
  points: Array<{ x: number; y: number }>;
  isAnimating: boolean;
  currentIndex: number;
}) {
  if (!points || points.length === 0) return null;

  const displayPoints = isAnimating
    ? points.slice(0, currentIndex + 1)
    : points;

  if (displayPoints.length < 2) return null;

  const pathData = displayPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <path
      d={pathData}
      fill="none"
      stroke="rgba(255, 255, 255, 0.3)"
      strokeWidth={2}
      strokeDasharray="5,5"
    />
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function GorillasGame({ onGameComplete }: GorillasGameProps) {
  // Game state
  const [gameState, setGameState] = useState<GorillasState | null>(null);
  const [levelIndex, setLevelIndex] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [isVsAI] = useState(true);

  // Input state
  const [angle, setAngle] = useState(45);
  const [velocity, setVelocity] = useState(100);

  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [trajectoryIndex, setTrajectoryIndex] = useState(0);
  const [showExplosion, setShowExplosion] = useState(false);
  const [explosionPos, setExplosionPos] = useState<{ x: number; y: number } | null>(null);

  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const currentTrajectoryRef = useRef<Trajectory | null>(null);
  const { submitCompletion } = useGameCompletion("gorillas");

  const totalLevels = GORILLAS_LEVELS.length;

  // Initialize game
  const initGame = useCallback((level: number, vsAI: boolean, diff: Difficulty) => {
    const state = GorillasEngine.newGame({
      levelIndex: level,
      vsAI: vsAI,
      aiDifficulty: diff,
    });
    setGameState(state);
    setAngle(45);
    setVelocity(100);
    setIsAnimating(false);
    setTrajectoryIndex(0);
    setShowExplosion(false);
    setExplosionPos(null);
  }, []);

  // Initialize on mount
  useEffect(() => {
    initGame(levelIndex, isVsAI, difficulty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Change level
  const changeLevel = useCallback((newIndex: number) => {
    const clampedIndex = Math.max(0, Math.min(totalLevels - 1, newIndex));
    setLevelIndex(clampedIndex);
    initGame(clampedIndex, isVsAI, difficulty);
  }, [totalLevels, isVsAI, difficulty, initGame]);

  // Reset current level
  const resetLevel = useCallback(() => {
    initGame(levelIndex, isVsAI, difficulty);
  }, [levelIndex, isVsAI, difficulty, initGame]);

  // Animate trajectory
  const animateTrajectory = useCallback((trajectory: Trajectory, callback: () => void) => {
    currentTrajectoryRef.current = trajectory;  // Store for rendering
    setIsAnimating(true);
    setTrajectoryIndex(0);

    let index = 0;
    const animate = () => {
      if (index < trajectory.points.length) {
        setTrajectoryIndex(index);
        index++;
        animationRef.current = setTimeout(animate, ANIMATION_SPEED);
      } else {
        // Show explosion if hit something
        if (trajectory.hitPosition) {
          setExplosionPos(trajectory.hitPosition);
          setShowExplosion(true);
          setTimeout(() => {
            setShowExplosion(false);
            setIsAnimating(false);
            currentTrajectoryRef.current = null;
            callback();
          }, 500);
        } else {
          setIsAnimating(false);
          currentTrajectoryRef.current = null;
          callback();
        }
      }
    };

    animate();
  }, []);

  // AI move (defined before makeThrow since makeThrow calls it)
  const makeAIMove = useCallback((state: GorillasState) => {
    if (!state || state.status !== "playing" || state.turn !== "opponent") return;

    const aiMove = GorillasEngine.getAIMove(state);
    if (!aiMove) return;

    const result = GorillasEngine.makeMove(state, aiMove);
    if (!result.valid) return;

    // Animate AI trajectory
    if (result.state.lastTrajectory) {
      animateTrajectory(result.state.lastTrajectory, () => {
        setGameState(result.state);

        // Check for game over
        if (result.state.status === "won" || result.state.status === "lost") {
          const playerWon = result.state.status === "won";
          submitCompletion({
            winner: playerWon ? "player" : "ai",
            moves: result.state.player1.score + result.state.player2.score,
          });
          onGameComplete?.({
            won: playerWon,
            level: levelIndex + 1,
            score: result.state.player1.score,
          });
        }
      });
    } else {
      setGameState(result.state);
    }
  }, [animateTrajectory, submitCompletion, onGameComplete, levelIndex]);

  // Make a throw
  const makeThrow = useCallback(() => {
    if (!gameState || isAnimating || gameState.status !== "playing") return;

    const move: GorillasMove = { angle, velocity };
    const result = GorillasEngine.makeMove(gameState, move);

    if (!result.valid) {
      console.error(result.error);
      return;
    }

    // Animate the trajectory
    if (result.state.lastTrajectory) {
      animateTrajectory(result.state.lastTrajectory, () => {
        setGameState(result.state);

        // Check for game over
        if (result.state.status === "won" || result.state.status === "lost") {
          const playerWon = result.state.status === "won";
          submitCompletion({
            winner: playerWon ? "player" : "ai",
            moves: result.state.player1.score + result.state.player2.score,
          });
          onGameComplete?.({
            won: playerWon,
            level: levelIndex + 1,
            score: result.state.player1.score,
          });
        }
        // If vs AI and it's AI's turn, make AI move
        else if (isVsAI && result.state.turn === "opponent") {
          setTimeout(() => {
            makeAIMove(result.state);
          }, 500);
        }
      });
    } else {
      setGameState(result.state);
    }
  }, [gameState, isAnimating, angle, velocity, animateTrajectory, submitCompletion, onGameComplete, levelIndex, makeAIMove, isVsAI]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  // Current banana position during animation - use ref to get correct trajectory
  const currentBananaPos = useMemo(() => {
    if (!isAnimating || !currentTrajectoryRef.current?.points) return null;
    const point = currentTrajectoryRef.current.points[trajectoryIndex];
    return point || null;
  }, [isAnimating, trajectoryIndex]);

  // Banana rotation for animation
  const bananaRotation = useMemo(() => {
    return trajectoryIndex * 30; // Spin as it flies
  }, [trajectoryIndex]);

  // Pre-compute stars for stable rendering
  const stars = useMemo(() => {
    const starCount = 60;
    return Array.from({ length: starCount }).map((_, i) => {
      // Use deterministic seed based on index
      const seed1 = ((i * 17 + 31) % 100) / 100;
      const seed2 = ((i * 23 + 47) % 100) / 100;
      const seed3 = ((i * 37 + 13) % 100) / 100;
      const seed4 = ((i * 41 + 7) % 100) / 100;
      return {
        x: seed1 * CANVAS_WIDTH,
        y: seed2 * (CANVAS_HEIGHT * 0.5),
        r: seed3 * 1.5 + 0.5,
        opacity: seed4 * 0.5 + 0.3,
      };
    });
  }, []);

  // Computed values for controls
  const isPlayerTurn = gameState?.turn === "player";
  const canThrow = !isAnimating && gameState?.status === "playing" && isPlayerTurn;

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canThrow) return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          setAngle((prev) => Math.min(90, prev + (e.shiftKey ? 1 : 5)));
          break;
        case "ArrowDown":
          e.preventDefault();
          setAngle((prev) => Math.max(0, prev - (e.shiftKey ? 1 : 5)));
          break;
        case "ArrowRight":
          e.preventDefault();
          setVelocity((prev) => Math.min(200, prev + (e.shiftKey ? 1 : 10)));
          break;
        case "ArrowLeft":
          e.preventDefault();
          setVelocity((prev) => Math.max(10, prev - (e.shiftKey ? 1 : 10)));
          break;
        case " ":
          e.preventDefault();
          makeThrow();
          break;
        case "Enter":
          e.preventDefault();
          makeThrow();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canThrow, makeThrow]);

  if (!gameState) return null;

  const { buildings, player1, player2, wind, turn, status, pointsToWin } = gameState;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-3xl">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            Level {levelIndex + 1}/{totalLevels}
          </Badge>
          <Badge variant="outline" className="text-sm">
            First to {pointsToWin}
          </Badge>
          {status === "won" && (
            <Badge className="bg-emerald-500 text-white animate-pulse">
              <Trophy className="w-3 h-3 mr-1" /> You Win!
            </Badge>
          )}
          {status === "lost" && (
            <Badge className="bg-red-500 text-white">
              Game Over
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-blue-400">
            <User className="w-4 h-4" />
            <span>{player1.score}</span>
          </div>
          <span className="text-zinc-500">vs</span>
          <div className="flex items-center gap-1 text-red-400">
            <Bot className="w-4 h-4" />
            <span>{player2.score}</span>
          </div>
        </div>
      </div>

      {/* Wind indicator */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-2 rounded-lg",
        "bg-zinc-800/60 border border-zinc-700",
        Math.abs(wind) > 3 && "border-amber-500/50"
      )}>
        <Wind className={cn(
          "w-5 h-5",
          wind > 0 ? "text-cyan-400" : wind < 0 ? "text-cyan-400 scale-x-[-1]" : "text-zinc-500"
        )} />
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">Wind:</span>
          {wind !== 0 ? (
            <>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, Math.ceil(Math.abs(wind))) }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-2 h-2 rounded-full",
                      Math.abs(wind) > 3 ? "bg-amber-400" : "bg-cyan-400"
                    )}
                    style={{ opacity: 0.4 + (i * 0.15) }}
                  />
                ))}
              </div>
              <span className={cn(
                "font-mono font-bold",
                Math.abs(wind) > 3 ? "text-amber-400" : "text-cyan-400"
              )}>
                {wind > 0 ? "→" : "←"} {Math.abs(wind).toFixed(1)}
              </span>
            </>
          ) : (
            <span className="text-zinc-500 font-mono">None</span>
          )}
        </div>
      </div>

      {/* Game Canvas */}
      <div className="border-4 border-zinc-700 rounded-xl overflow-hidden shadow-2xl shadow-black/50">
        <svg
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
        >
          {/* Background */}
          <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="url(#nightSky)" />
          {/* Gradient definitions */}
          <defs>
            <radialGradient id="explosionGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFEB3B" />
              <stop offset="50%" stopColor="#FF9800" />
              <stop offset="100%" stopColor="#F44336" stopOpacity="0" />
            </radialGradient>
            {/* Moon */}
            <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF9C4" />
              <stop offset="70%" stopColor="#FFF59D" />
              <stop offset="100%" stopColor="#FFF176" />
            </radialGradient>
            {/* Window glow */}
            <radialGradient id="windowGlow" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#FFEB3B" />
              <stop offset="100%" stopColor="#FF9800" stopOpacity="0" />
            </radialGradient>
            {/* Sky gradient for night */}
            <linearGradient id="nightSky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0a0a1a" />
              <stop offset="40%" stopColor="#1a1a3a" />
              <stop offset="70%" stopColor="#2a2a4a" />
              <stop offset="100%" stopColor="#3a3a5a" />
            </linearGradient>
          </defs>

          {/* Stars - pre-computed for stability */}
          {stars.map((star, i) => (
            <circle
              key={i}
              cx={star.x}
              cy={star.y}
              r={star.r}
              fill="white"
              opacity={star.opacity}
            />
          ))}

          {/* Moon */}
          <circle cx={CANVAS_WIDTH - 80} cy={60} r={30} fill="url(#moonGlow)" />

          {/* Buildings */}
          {buildings.map((b, i) => (
            <Building
              key={i}
              x={b.x}
              width={b.width}
              height={b.height}
              color={BUILDING_COLORS[i % BUILDING_COLORS.length]}
              windowSeed={i * 42 + levelIndex * 13}
            />
          ))}

          {/* Gorillas - position.y is already in SVG coords (center of gorilla) */}
          <Gorilla
            x={player1.position.x}
            y={player1.position.y + 15}
            isPlayer1={true}
            isActive={turn === "player"}
            score={player1.score}
            angle={angle}
          />
          <Gorilla
            x={player2.position.x}
            y={player2.position.y + 15}
            isPlayer1={false}
            isActive={turn === "opponent"}
            score={player2.score}
          />

          {/* Aiming indicator (only when it's player's turn and not animating) */}
          {canThrow && (
            <AimingIndicator
              x={player1.position.x}
              y={player1.position.y - 20}
              angle={angle}
              velocity={velocity}
              isPlayer1={true}
              canvasHeight={CANVAS_HEIGHT}
            />
          )}

          {/* Trajectory path - use ref for current animation, gameState for history */}
          {(isAnimating ? currentTrajectoryRef.current : gameState.lastTrajectory) && (
            <TrajectoryPath
              points={(isAnimating ? currentTrajectoryRef.current : gameState.lastTrajectory)?.points || []}
              isAnimating={isAnimating}
              currentIndex={trajectoryIndex}
            />
          )}

          {/* Flying banana */}
          {isAnimating && currentBananaPos && (
            <Banana
              x={currentBananaPos.x}
              y={currentBananaPos.y}
              rotation={bananaRotation}
            />
          )}

          {/* Explosion */}
          {showExplosion && explosionPos && (
            <Explosion
              x={explosionPos.x}
              y={explosionPos.y}
              radius={30}
            />
          )}
        </svg>
      </div>

      {/* Controls */}
      {status === "playing" && (
        <div className="flex flex-col gap-4 w-full max-w-lg p-5 bg-zinc-800/80 rounded-xl border border-zinc-700 shadow-xl">
          {/* Turn indicator */}
          <div className="flex items-center justify-center gap-2">
            {isPlayerTurn ? (
              <Badge className="bg-blue-500 px-4 py-1.5 text-sm">
                <User className="w-4 h-4 mr-2" />
                Your Turn - Aim and Throw!
              </Badge>
            ) : (
              <Badge className="bg-orange-500 animate-pulse px-4 py-1.5 text-sm">
                <Bot className="w-4 h-4 mr-2" />
                AI is calculating...
              </Badge>
            )}
          </div>

          {/* Angle control */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-20">
              <Target className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium text-zinc-300">Angle</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setAngle(Math.max(0, angle - 5))}
              disabled={!canThrow}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Slider
              value={[angle]}
              onValueChange={([v]) => setAngle(v)}
              min={0}
              max={90}
              step={1}
              disabled={!canThrow}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setAngle(Math.min(90, angle + 5))}
              disabled={!canThrow}
            >
              <Plus className="w-4 h-4" />
            </Button>
            <div className="w-16 text-right">
              <span className="text-lg font-mono font-bold text-emerald-400">{angle}°</span>
            </div>
          </div>

          {/* Velocity control */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-20">
              <Zap className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-medium text-zinc-300">Power</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setVelocity(Math.max(10, velocity - 10))}
              disabled={!canThrow}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Slider
              value={[velocity]}
              onValueChange={([v]) => setVelocity(v)}
              min={10}
              max={200}
              step={1}
              disabled={!canThrow}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setVelocity(Math.min(200, velocity + 10))}
              disabled={!canThrow}
            >
              <Plus className="w-4 h-4" />
            </Button>
            <div className="w-16 text-right">
              <span className={cn(
                "text-lg font-mono font-bold",
                velocity < 80 ? "text-emerald-400" : velocity < 150 ? "text-amber-400" : "text-red-400"
              )}>{velocity}</span>
            </div>
          </div>

          {/* Keyboard hints */}
          <div className="flex items-center justify-center gap-4 text-xs text-zinc-500">
            <span>↑↓ Angle</span>
            <span>←→ Power</span>
            <span>Space = Throw</span>
          </div>

          {/* Throw button */}
          <Button
            onClick={makeThrow}
            disabled={!canThrow}
            className={cn(
              "w-full font-bold text-lg py-6 transition-all",
              canThrow
                ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-lg shadow-amber-500/30"
                : "bg-zinc-700 text-zinc-400"
            )}
            size="lg"
          >
            🍌 Throw Banana!
          </Button>
        </div>
      )}

      {/* Game Over controls */}
      {(status === "won" || status === "lost") && (
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            "px-6 py-3 rounded-lg text-center",
            status === "won" ? "bg-emerald-500/20 border border-emerald-500/50" : "bg-red-500/20 border border-red-500/50"
          )}>
            <Trophy className={cn("w-8 h-8 mx-auto mb-2", status === "won" ? "text-emerald-400" : "text-red-400")} />
            <p className={cn("text-lg font-bold", status === "won" ? "text-emerald-400" : "text-red-400")}>
              {status === "won" ? "Victory!" : "Defeated!"}
            </p>
            <p className="text-sm text-zinc-400 mt-1">
              Final Score: {player1.score} - {player2.score}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={resetLevel}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Play Again
            </Button>
            {status === "won" && levelIndex < totalLevels - 1 && (
              <Button onClick={() => changeLevel(levelIndex + 1)}>
                Next Level
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Level navigation */}
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

        <Select
          value={difficulty}
          onValueChange={(v) => {
            setDifficulty(v as Difficulty);
            initGame(levelIndex, isVsAI, v as Difficulty);
          }}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => changeLevel(levelIndex + 1)}
          disabled={levelIndex === totalLevels - 1}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Instructions */}
      <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center max-w-md">
        Adjust angle and power to throw bananas at your opponent.
        Account for wind! First to {pointsToWin} points wins.
      </p>
    </div>
  );
}
