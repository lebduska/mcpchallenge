"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
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
// QBasic Gorillas - Authentic 1991 Recreation
// =============================================================================

type Difficulty = "easy" | "medium" | "hard";

interface GorillasGameProps {
  onGameComplete?: (result: { won: boolean; level: number; score: number }) => void;
}

// Engine uses 800x500 canvas, we display at 1.2x scale for positioning
const ENGINE_WIDTH = 800;
const ENGINE_HEIGHT = 500;
const SCALE = 1.2;
const CANVAS_WIDTH = ENGINE_WIDTH * SCALE;   // 960
const CANVAS_HEIGHT = ENGINE_HEIGHT * SCALE; // 600
const ANIMATION_SPEED = 20;

// QBasic EGA palette colors (authentic)
const COLORS = {
  black: "#000000",
  blue: "#0000AA",
  green: "#00AA00",
  cyan: "#00AAAA",
  red: "#AA0000",
  magenta: "#AA00AA",
  brown: "#AA5500",
  lightGray: "#AAAAAA",
  darkGray: "#555555",
  lightBlue: "#5555FF",
  lightGreen: "#55FF55",
  lightCyan: "#55FFFF",
  lightRed: "#FF5555",
  lightMagenta: "#FF55FF",
  yellow: "#FFFF55",
  white: "#FFFFFF",
};

// Building colors from original (cycled)
const BUILDING_PALETTE = [
  COLORS.cyan,
  COLORS.red,
  COLORS.lightGray,
  COLORS.magenta,
];

// =============================================================================
// Pixel Art Components (authentic QBasic style)
// =============================================================================

// Sun with face (iconic from original)
function QBasicSun({ x, y, surprised }: { x: number; y: number; surprised: boolean }) {
  // Sun radius - fixed size independent of SCALE
  const r = 30;
  // Face feature scale relative to sun size
  const f = r / 12; // face element multiplier

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Sun rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = Math.cos(rad) * (r + 3);
        const y1 = Math.sin(rad) * (r + 3);
        const x2 = Math.cos(rad) * (r + 12);
        const y2 = Math.sin(rad) * (r + 12);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={COLORS.yellow}
            strokeWidth={3}
          />
        );
      })}

      {/* Sun circle */}
      <circle cx={0} cy={0} r={r} fill={COLORS.yellow} />

      {/* Face */}
      {surprised ? (
        <>
          {/* Surprised eyes (O O) */}
          <circle cx={-4 * f} cy={-2 * f} r={3 * f} fill={COLORS.black} />
          <circle cx={4 * f} cy={-2 * f} r={3 * f} fill={COLORS.black} />
          {/* Surprised mouth (O) */}
          <circle cx={0} cy={5 * f} r={3 * f} fill={COLORS.black} />
        </>
      ) : (
        <>
          {/* Normal eyes */}
          <rect x={-6 * f} y={-4 * f} width={4 * f} height={2 * f} fill={COLORS.black} />
          <rect x={2 * f} y={-4 * f} width={4 * f} height={2 * f} fill={COLORS.black} />
          {/* Smile */}
          <path
            d={`M ${-5 * f} ${3 * f} Q 0 ${8 * f} ${5 * f} ${3 * f}`}
            fill="none"
            stroke={COLORS.black}
            strokeWidth={2}
          />
        </>
      )}
    </g>
  );
}

// QBasic style building (blocky with windows, supports damage)
function QBasicBuilding({ x, width, height, colorIndex, damage }: {
  x: number; width: number; height: number; colorIndex: number; damage: number[];
}) {
  const color = BUILDING_PALETTE[colorIndex % BUILDING_PALETTE.length];
  const windowColor = COLORS.yellow;
  const darkColor = COLORS.black;
  const safetyDamage = damage || [];

  // Window grid parameters (in scaled coords)
  const windowW = 4 * SCALE;
  const windowH = 6 * SCALE;
  const windowGapX = 8 * SCALE;
  const windowGapY = 10 * SCALE;

  // Build the building column by column to show damage (like original QBasic)
  // Use 2px wide columns for efficiency
  const colWidth = 2;
  const numCols = Math.ceil(width / colWidth);
  const columns: React.ReactElement[] = [];

  for (let i = 0; i < numCols; i++) {
    const screenX = x + i * colWidth;
    // Map screen column to engine damage array
    const engineCol = Math.floor((i * colWidth) / SCALE);
    const colDamage = (safetyDamage[engineCol] || 0) * SCALE;
    const effectiveHeight = Math.max(0, height - colDamage);

    if (effectiveHeight > 0) {
      columns.push(
        <rect
          key={`col-${i}`}
          x={screenX}
          y={CANVAS_HEIGHT - effectiveHeight}
          width={colWidth + 0.5}
          height={effectiveHeight}
          fill={color}
        />
      );
    }
  }

  // Windows - only draw if building section not damaged
  const windows: JSX.Element[] = [];
  const windowCols = Math.floor((width - 4 * SCALE) / windowGapX);
  const windowRows = Math.floor((height - 6 * SCALE) / windowGapY);

  for (let row = 0; row < windowRows; row++) {
    for (let col = 0; col < windowCols; col++) {
      const windowX = x + 3 * SCALE + col * windowGapX;
      const windowY = CANVAS_HEIGHT - height + 4 * SCALE + row * windowGapY;

      // Check if window center is above damaged area
      const engineCol = Math.floor((3 * SCALE + col * windowGapX) / SCALE);
      const colDamage = (safetyDamage[engineCol] || 0) * SCALE;
      const effectiveTop = CANVAS_HEIGHT - (height - colDamage);

      // Only draw window if it's below the damage line
      if (windowY >= effectiveTop) {
        const lit = ((row + col) % 3) !== 0;
        windows.push(
          <rect
            key={`win-${row}-${col}`}
            x={windowX}
            y={windowY}
            width={windowW}
            height={windowH}
            fill={lit ? windowColor : darkColor}
          />
        );
      }
    }
  }

  return (
    <g>
      {columns}
      {windows}
    </g>
  );
}

// QBasic Gorilla sprite (authentic pixel art)
// Engine places anchor at gorilla CENTER (GORILLA_SIZE/2 above building top)
// Sprite must be vertically centered on anchor point
function QBasicGorilla({ x, y, isLeft, armUp, frame }: {
  x: number; y: number; isLeft: boolean; armUp: boolean; frame: number;
}) {
  // Engine GORILLA_SIZE = 30, anchor at center
  // Sprite should span from y - 15*SCALE to y + 15*SCALE
  const s = 1.2; // Match SCALE for proper sizing
  const brown = COLORS.brown;
  const tan = "#D2B48C";

  // Mirror for right-side gorilla
  const dir = isLeft ? 1 : -1;

  // Vertical offset to center sprite on anchor (shift everything down by ~16*s)
  const yOff = 16 * s;

  return (
    <g transform={`translate(${x}, ${y}) scale(${dir}, 1)`}>
      {/* Body - was y-20 to y-2, now y-20+yOff to y-2+yOff = y-0.8 to y+17.2 */}
      <rect x={-7 * s} y={-20 * s + yOff} width={14 * s} height={18 * s} fill={brown} />

      {/* Head - was y-32 to y-20, now y-12.8 to y-0.8 */}
      <rect x={-6 * s} y={-32 * s + yOff} width={12 * s} height={12 * s} fill={brown} />

      {/* Face */}
      <rect x={-4 * s} y={-28 * s + yOff} width={8 * s} height={6 * s} fill={tan} />

      {/* Eyes */}
      <rect x={-3 * s} y={-27 * s + yOff} width={2 * s} height={2 * s} fill={COLORS.white} />
      <rect x={1 * s} y={-27 * s + yOff} width={2 * s} height={2 * s} fill={COLORS.white} />
      <rect x={-2 * s} y={-26 * s + yOff} width={1 * s} height={1 * s} fill={COLORS.black} />
      <rect x={2 * s} y={-26 * s + yOff} width={1 * s} height={1 * s} fill={COLORS.black} />

      {/* Nostrils */}
      <rect x={-2 * s} y={-23 * s + yOff} width={1 * s} height={1 * s} fill={COLORS.black} />
      <rect x={1 * s} y={-23 * s + yOff} width={1 * s} height={1 * s} fill={COLORS.black} />

      {/* Arms */}
      {armUp ? (
        <>
          {/* Left arm raised */}
          <rect x={-12 * s} y={-28 * s + yOff} width={5 * s} height={4 * s} fill={brown} />
          <rect x={-14 * s} y={-32 * s + yOff} width={4 * s} height={6 * s} fill={brown} />
          {/* Right arm down */}
          <rect x={7 * s} y={-18 * s + yOff} width={5 * s} height={4 * s} fill={brown} />
          <rect x={10 * s} y={-16 * s + yOff} width={4 * s} height={8 * s} fill={brown} />
        </>
      ) : (
        <>
          {/* Both arms down */}
          <rect x={-12 * s} y={-18 * s + yOff} width={5 * s} height={4 * s} fill={brown} />
          <rect x={-14 * s} y={-16 * s + yOff} width={4 * s} height={8 * s} fill={brown} />
          <rect x={7 * s} y={-18 * s + yOff} width={5 * s} height={4 * s} fill={brown} />
          <rect x={10 * s} y={-16 * s + yOff} width={4 * s} height={8 * s} fill={brown} />
        </>
      )}

      {/* Legs - was y-4 to y, now y+15.2 to y+19.2 (feet on building) */}
      <rect x={-6 * s} y={-4 * s + yOff} width={5 * s} height={4 * s} fill={brown} />
      <rect x={1 * s} y={-4 * s + yOff} width={5 * s} height={4 * s} fill={brown} />

      {/* Chest highlight */}
      <rect x={-3 * s} y={-16 * s + yOff} width={6 * s} height={8 * s} fill={tan} />
    </g>
  );
}

// QBasic banana (rotating yellow arc)
function QBasicBanana({ x, y, rotation }: { x: number; y: number; rotation: number }) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      <ellipse cx={0} cy={0} rx={8} ry={4} fill={COLORS.yellow} />
      <ellipse cx={-5} cy={0} rx={2} ry={2} fill={COLORS.brown} />
    </g>
  );
}

// QBasic explosion (simple expanding circles)
function QBasicExplosion({ x, y, frame }: { x: number; y: number; frame: number }) {
  const colors = [COLORS.white, COLORS.yellow, COLORS.lightRed, COLORS.red];
  const radius = (frame + 1) * 6;

  return (
    <g>
      {colors.slice(0, Math.min(frame + 1, 4)).map((color, i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={radius - i * 4}
          fill={color}
        />
      ))}
    </g>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function GorillasGame({ onGameComplete }: GorillasGameProps) {
  const [gameState, setGameState] = useState<GorillasState | null>(null);
  const [levelIndex, setLevelIndex] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [isVsAI] = useState(true);

  // QBasic style input
  const [angleInput, setAngleInput] = useState("45");
  const [velocityInput, setVelocityInput] = useState("50");
  const [inputFocus, setInputFocus] = useState<"angle" | "velocity">("angle");

  const [isAnimating, setIsAnimating] = useState(false);
  const [trajectoryIndex, setTrajectoryIndex] = useState(0);
  const [explosionFrame, setExplosionFrame] = useState(-1);
  const [explosionPos, setExplosionPos] = useState<{ x: number; y: number } | null>(null);
  const [sunSurprised, setSunSurprised] = useState(false);
  const [gorillaFrame, setGorillaFrame] = useState(0);
  const [message, setMessage] = useState("Player 1, enter angle and velocity");

  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const currentTrajectoryRef = useRef<Trajectory | null>(null);
  const angleInputRef = useRef<HTMLInputElement>(null);
  const velocityInputRef = useRef<HTMLInputElement>(null);
  const { submitCompletion } = useGameCompletion("gorillas");
  const totalLevels = GORILLAS_LEVELS.length;

  const initGame = useCallback((level: number, vsAI: boolean, diff: Difficulty) => {
    const state = GorillasEngine.newGame({ levelIndex: level, vsAI, aiDifficulty: diff });
    setGameState(state);
    setAngleInput("45");
    setVelocityInput("50");
    setInputFocus("angle");
    setIsAnimating(false);
    setTrajectoryIndex(0);
    setExplosionFrame(-1);
    setExplosionPos(null);
    setSunSurprised(false);
    setMessage("Player 1 (Left) - Enter angle:");
  }, []);

  useEffect(() => { initGame(levelIndex, isVsAI, difficulty); }, []);

  const changeLevel = useCallback((newIndex: number) => {
    const idx = Math.max(0, Math.min(totalLevels - 1, newIndex));
    setLevelIndex(idx);
    initGame(idx, isVsAI, difficulty);
  }, [totalLevels, isVsAI, difficulty, initGame]);

  const resetLevel = useCallback(() => {
    initGame(levelIndex, isVsAI, difficulty);
  }, [levelIndex, isVsAI, difficulty, initGame]);

  const animateTrajectory = useCallback((trajectory: Trajectory, callback: () => void) => {
    currentTrajectoryRef.current = trajectory;
    setIsAnimating(true);
    setTrajectoryIndex(0);
    setSunSurprised(false);
    setGorillaFrame(1); // Arm up for throw

    let index = 0;
    const animate = () => {
      if (index < trajectory.points.length) {
        setTrajectoryIndex(index);

        // Check if banana passes near sun
        const pt = trajectory.points[index];
        const sunX = CANVAS_WIDTH - 60;
        const sunY = 45;
        const dist = Math.sqrt((pt.x * SCALE - sunX) ** 2 + (pt.y * SCALE - sunY) ** 2);
        if (dist < 50) {
          setSunSurprised(true);
        }

        index++;
        animationRef.current = setTimeout(animate, ANIMATION_SPEED);
      } else {
        setGorillaFrame(0); // Arm down

        if (trajectory.hitPosition) {
          setExplosionPos({
            x: trajectory.hitPosition.x * SCALE,
            y: trajectory.hitPosition.y * SCALE
          });
          // Animate explosion
          let frame = 0;
          const explode = () => {
            setExplosionFrame(frame);
            frame++;
            if (frame < 6) {
              setTimeout(explode, 80);
            } else {
              setExplosionFrame(-1);
              setIsAnimating(false);
              currentTrajectoryRef.current = null;
              setSunSurprised(false);
              callback();
            }
          };
          explode();
        } else {
          setIsAnimating(false);
          currentTrajectoryRef.current = null;
          setSunSurprised(false);
          callback();
        }
      }
    };
    animate();
  }, []);

  const makeAIMove = useCallback((state: GorillasState) => {
    if (!state || state.status !== "playing" || state.turn !== "opponent") return;

    setMessage("Player 2 (Computer) is thinking...");

    setTimeout(() => {
      const aiMove = GorillasEngine.getAIMove(state);
      if (!aiMove) return;

      setMessage(`Player 2: Angle=${Math.round(aiMove.angle)}  Velocity=${Math.round(aiMove.velocity)}`);

      setTimeout(() => {
        const result = GorillasEngine.makeMove(state, aiMove);
        if (!result.valid) return;

        if (result.state.lastTrajectory) {
          animateTrajectory(result.state.lastTrajectory, () => {
            setGameState(result.state);
            const hitType = result.state.lastTrajectory?.hit;

            if (result.state.status === "won" || result.state.status === "lost") {
              const playerWon = result.state.status === "won";
              setMessage(playerWon ? "Player 1 Wins!  Press SPACE to continue" : "Player 2 Wins!  Press SPACE to continue");
              submitCompletion({ winner: playerWon ? "player" : "ai", moves: result.state.player1.score + result.state.player2.score });
              onGameComplete?.({ won: playerWon, level: levelIndex + 1, score: result.state.player1.score });
            } else if (hitType === "gorilla") {
              // AI hit player!
              setMessage(`*** OUCH! AI HIT YOU! *** Score: ${result.state.player1.score} - ${result.state.player2.score}`);
              setTimeout(() => {
                setMessage("Player 1 (Left) - Enter angle:");
                setInputFocus("angle");
                angleInputRef.current?.focus();
              }, 1500);
            } else {
              setMessage("Player 1 (Left) - Enter angle:");
              setInputFocus("angle");
              setTimeout(() => angleInputRef.current?.focus(), 100);
            }
          });
        } else {
          setGameState(result.state);
        }
      }, 500);
    }, 800);
  }, [animateTrajectory, submitCompletion, onGameComplete, levelIndex]);

  const makeThrow = useCallback(() => {
    if (!gameState || isAnimating || gameState.status !== "playing") return;

    const angle = parseInt(angleInput) || 45;
    const velocity = parseInt(velocityInput) || 50;

    // Validate QBasic style
    if (angle < 0 || angle > 90) {
      setMessage("Angle must be 0-90. Try again:");
      return;
    }
    if (velocity < 1 || velocity > 200) {
      setMessage("Velocity must be 1-200. Try again:");
      return;
    }

    const move: GorillasMove = { angle, velocity };
    const result = GorillasEngine.makeMove(gameState, move);
    if (!result.valid) return;

    setMessage(`Player 1: Angle=${angle}  Velocity=${velocity}`);

    if (result.state.lastTrajectory) {
      animateTrajectory(result.state.lastTrajectory, () => {
        setGameState(result.state);

        // Check for hit type and show appropriate message
        const hitType = result.state.lastTrajectory?.hit;

        if (result.state.status === "won" || result.state.status === "lost") {
          const playerWon = result.state.status === "won";
          setMessage(playerWon ? "Player 1 Wins!  Press SPACE to continue" : "Player 2 Wins!  Press SPACE to continue");
          submitCompletion({ winner: playerWon ? "player" : "ai", moves: result.state.player1.score + result.state.player2.score });
          onGameComplete?.({ won: playerWon, level: levelIndex + 1, score: result.state.player1.score });
        } else if (hitType === "gorilla") {
          // Hit opponent! Show score and continue
          setMessage(`*** DIRECT HIT! *** Score: ${result.state.player1.score} - ${result.state.player2.score}  (First to ${result.state.pointsToWin} wins)`);
          // AI's turn after delay
          if (isVsAI && result.state.turn === "opponent") {
            setTimeout(() => makeAIMove(result.state), 1500);
          }
        } else {
          // Missed or hit building
          if (isVsAI && result.state.turn === "opponent") {
            makeAIMove(result.state);
          } else {
            setMessage("Player 1 (Left) - Enter angle:");
            setInputFocus("angle");
            setTimeout(() => angleInputRef.current?.focus(), 100);
          }
        }
      });
    } else {
      setGameState(result.state);
    }
  }, [gameState, isAnimating, angleInput, velocityInput, animateTrajectory, submitCompletion, onGameComplete, levelIndex, makeAIMove, isVsAI]);

  useEffect(() => { return () => { if (animationRef.current) clearTimeout(animationRef.current); }; }, []);

  const currentBananaPos = useMemo(() => {
    if (!isAnimating || !currentTrajectoryRef.current?.points) return null;
    const pt = currentTrajectoryRef.current.points[trajectoryIndex];
    return pt ? { x: pt.x * SCALE, y: pt.y * SCALE } : null;
  }, [isAnimating, trajectoryIndex]);

  const bananaRotation = useMemo(() => trajectoryIndex * 30, [trajectoryIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (inputFocus === "angle") {
        setInputFocus("velocity");
        setMessage("Player 1 (Left) - Enter velocity:");
        velocityInputRef.current?.focus();
      } else {
        makeThrow();
      }
    } else if (e.key === " " && (gameState?.status === "won" || gameState?.status === "lost")) {
      if (gameState.status === "won" && levelIndex < totalLevels - 1) {
        changeLevel(levelIndex + 1);
      } else {
        resetLevel();
      }
    }
  }, [inputFocus, makeThrow, gameState, levelIndex, totalLevels, changeLevel, resetLevel]);

  if (!gameState) return null;

  const { buildings, player1, player2, wind, turn, status, pointsToWin } = gameState;
  const isPlayerTurn = turn === "player";
  const canInput = !isAnimating && status === "playing" && isPlayerTurn;

  return (
    <div
      className="flex flex-col items-center gap-0 font-mono"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* QBasic title bar */}
      <div
        className="w-full text-center py-1"
        style={{
          backgroundColor: COLORS.blue,
          color: COLORS.white,
          fontSize: `${14 * SCALE / 2}px`,
          fontFamily: "monospace"
        }}
      >
        Q B a s i c   G O R I L L A S
      </div>

      {/* Score display (authentic style) */}
      <div
        className="w-full flex justify-between px-4 py-1"
        style={{
          backgroundColor: COLORS.black,
          color: COLORS.white,
          fontSize: `${12 * SCALE / 2}px`
        }}
      >
        <span>Player 1: {player1.score}</span>
        <span>Game to {pointsToWin}</span>
        <span>Player 2: {player2.score}</span>
      </div>

      {/* Wind display */}
      <div
        className="w-full text-center py-1"
        style={{
          backgroundColor: COLORS.black,
          color: COLORS.lightCyan,
          fontSize: `${12 * SCALE / 2}px`
        }}
      >
        Wind: {wind > 0 ? ">>>" : wind < 0 ? "<<<" : "---"} {Math.abs(wind).toFixed(1)} mph
      </div>

      {/* Game canvas */}
      <div
        className="relative border-4"
        style={{ borderColor: COLORS.blue }}
      >
        <svg
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{ backgroundColor: COLORS.black }}
        >
          {/* Sky gradient (QBasic used solid blue) */}
          <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill={COLORS.blue} />

          {/* Ground */}
          <rect
            x={0}
            y={CANVAS_HEIGHT - 2 * SCALE}
            width={CANVAS_WIDTH}
            height={2 * SCALE}
            fill={COLORS.green}
          />

          {/* Sun - positioned using engine coords scaled */}
          <QBasicSun
            x={CANVAS_WIDTH - 60}
            y={45}
            surprised={sunSurprised}
          />

          {/* Buildings */}
          {buildings.map((b, i) => (
            <QBasicBuilding
              key={i}
              x={b.x * SCALE}
              width={b.width * SCALE}
              height={b.height * SCALE}
              colorIndex={i}
              damage={b.damage}
            />
          ))}

          {/* Gorillas */}
          <QBasicGorilla
            x={player1.position.x * SCALE}
            y={player1.position.y * SCALE}
            isLeft={true}
            armUp={isAnimating && isPlayerTurn && gorillaFrame === 1}
            frame={gorillaFrame}
          />
          <QBasicGorilla
            x={player2.position.x * SCALE}
            y={player2.position.y * SCALE}
            isLeft={false}
            armUp={isAnimating && !isPlayerTurn && gorillaFrame === 1}
            frame={gorillaFrame}
          />

          {/* Banana in flight */}
          {isAnimating && currentBananaPos && (
            <QBasicBanana
              x={currentBananaPos.x}
              y={currentBananaPos.y}
              rotation={bananaRotation}
            />
          )}

          {/* Explosion */}
          {explosionFrame >= 0 && explosionPos && (
            <QBasicExplosion
              x={explosionPos.x}
              y={explosionPos.y}
              frame={explosionFrame}
            />
          )}
        </svg>
      </div>

      {/* Message display */}
      <div
        className="w-full text-center py-2"
        style={{
          backgroundColor: COLORS.black,
          color: COLORS.yellow,
          fontSize: `${14 * SCALE / 2}px`,
          minHeight: `${24 * SCALE / 2}px`
        }}
      >
        {message}
      </div>

      {/* Input area (QBasic style) */}
      <div
        className="w-full flex gap-8 justify-center py-2 px-4"
        style={{
          backgroundColor: COLORS.black,
          fontSize: `${14 * SCALE / 2}px`
        }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: COLORS.white }}>Angle (0-90):</span>
          <input
            ref={angleInputRef}
            type="text"
            value={angleInput}
            onChange={(e) => setAngleInput(e.target.value.replace(/[^0-9]/g, ""))}
            disabled={!canInput}
            onFocus={() => setInputFocus("angle")}
            className={cn(
              "w-16 px-2 py-1 text-center outline-none",
              inputFocus === "angle" ? "animate-pulse" : ""
            )}
            style={{
              backgroundColor: COLORS.black,
              color: COLORS.lightGreen,
              border: `2px solid ${inputFocus === "angle" ? COLORS.yellow : COLORS.darkGray}`,
              fontFamily: "monospace"
            }}
            maxLength={2}
          />
        </div>

        <div className="flex items-center gap-2">
          <span style={{ color: COLORS.white }}>Velocity (1-200):</span>
          <input
            ref={velocityInputRef}
            type="text"
            value={velocityInput}
            onChange={(e) => setVelocityInput(e.target.value.replace(/[^0-9]/g, ""))}
            disabled={!canInput}
            onFocus={() => setInputFocus("velocity")}
            className={cn(
              "w-16 px-2 py-1 text-center outline-none",
              inputFocus === "velocity" ? "animate-pulse" : ""
            )}
            style={{
              backgroundColor: COLORS.black,
              color: COLORS.lightGreen,
              border: `2px solid ${inputFocus === "velocity" ? COLORS.yellow : COLORS.darkGray}`,
              fontFamily: "monospace"
            }}
            maxLength={3}
          />
        </div>

        <button
          onClick={makeThrow}
          disabled={!canInput}
          className="px-4 py-1 transition-colors"
          style={{
            backgroundColor: canInput ? COLORS.green : COLORS.darkGray,
            color: COLORS.white,
            border: `2px solid ${COLORS.lightGreen}`
          }}
        >
          THROW!
        </button>
      </div>

      {/* Level/Options bar */}
      <div
        className="w-full flex justify-between items-center px-4 py-1"
        style={{
          backgroundColor: COLORS.blue,
          color: COLORS.white,
          fontSize: `${12 * SCALE / 2}px`
        }}
      >
        <span>Level {levelIndex + 1}/{totalLevels}</span>

        <div className="flex gap-4">
          <span>Difficulty:</span>
          {(["easy", "medium", "hard"] as const).map((d) => (
            <button
              key={d}
              onClick={() => { setDifficulty(d); initGame(levelIndex, isVsAI, d); }}
              style={{
                color: difficulty === d ? COLORS.yellow : COLORS.lightGray,
                textDecoration: difficulty === d ? "underline" : "none"
              }}
            >
              {d.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          onClick={resetLevel}
          style={{ color: COLORS.lightCyan }}
        >
          [R]estart
        </button>
      </div>

      {/* Instructions */}
      <div
        className="w-full text-center py-1"
        style={{
          backgroundColor: COLORS.black,
          color: COLORS.darkGray,
          fontSize: `${10 * SCALE / 2}px`
        }}
      >
        Enter angle, TAB to velocity, ENTER to throw  |  Arrow keys: ↑↓ angle  ←→ velocity
      </div>
    </div>
  );
}
