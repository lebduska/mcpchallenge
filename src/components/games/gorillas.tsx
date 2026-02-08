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
// QBasic Gorillas - Enhanced Edition with Modern Game Feel
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

// =============================================================================
// Particle System Types
// =============================================================================

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: "debris" | "spark" | "smoke" | "trail" | "dust";
  rotation?: number;
  rotationSpeed?: number;
}

interface ScreenShake {
  intensity: number;
  duration: number;
  startTime: number;
}

// Enhanced color palette (EGA inspired but modernized)
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
  // Enhanced sky colors
  skyTop: "#000033",
  skyMid: "#000066",
  skyBottom: "#0000AA",
  // Enhanced building colors
  buildingDark: "#1a1a2e",
  buildingMid: "#16213e",
  windowGlow: "#FFE066",
  windowDark: "#1a1a1a",
};

// Enhanced building color palette with gradients
const BUILDING_PALETTE = [
  { main: "#1a4a5e", dark: "#0d2830", light: "#2a6a8e" }, // Teal
  { main: "#5e1a2e", dark: "#300d15", light: "#8e2a4e" }, // Crimson
  { main: "#4a4a5a", dark: "#2a2a3a", light: "#6a6a7a" }, // Gray
  { main: "#4a1a5a", dark: "#2a0d30", light: "#6a2a8a" }, // Purple
  { main: "#3a3a1a", dark: "#1a1a0d", light: "#5a5a2a" }, // Olive
  { main: "#1a3a4a", dark: "#0d1a25", light: "#2a5a6a" }, // Navy
];

// Particle colors for different effects
const EXPLOSION_COLORS = [
  COLORS.yellow,
  COLORS.lightRed,
  "#FF8800",
  COLORS.red,
  COLORS.white,
];

const DEBRIS_COLORS = [
  COLORS.brown,
  "#8B4513",
  COLORS.darkGray,
  "#666666",
];

const SMOKE_COLORS = [
  "rgba(100,100,100,0.8)",
  "rgba(80,80,80,0.6)",
  "rgba(60,60,60,0.4)",
];

// =============================================================================
// Particle System Helpers
// =============================================================================

let particleIdCounter = 0;

function createExplosionParticles(x: number, y: number, count: number = 25): Particle[] {
  const particles: Particle[] = [];

  // Sparks - fast moving, bright
  for (let i = 0; i < count * 0.4; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 8;
    particles.push({
      id: particleIdCounter++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2, // slight upward bias
      life: 1,
      maxLife: 1,
      size: 2 + Math.random() * 3,
      color: EXPLOSION_COLORS[Math.floor(Math.random() * EXPLOSION_COLORS.length)],
      type: "spark",
    });
  }

  // Debris - slower, heavier
  for (let i = 0; i < count * 0.3; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    particles.push({
      id: particleIdCounter++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      life: 1,
      maxLife: 1,
      size: 4 + Math.random() * 6,
      color: DEBRIS_COLORS[Math.floor(Math.random() * DEBRIS_COLORS.length)],
      type: "debris",
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 20,
    });
  }

  // Smoke - slow rising
  for (let i = 0; i < count * 0.3; i++) {
    const angle = Math.random() * Math.PI - Math.PI / 2; // upward spread
    const speed = 0.5 + Math.random() * 1.5;
    particles.push({
      id: particleIdCounter++,
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed,
      vy: -Math.abs(Math.sin(angle) * speed) - 0.5,
      life: 1,
      maxLife: 1,
      size: 8 + Math.random() * 12,
      color: SMOKE_COLORS[Math.floor(Math.random() * SMOKE_COLORS.length)],
      type: "smoke",
    });
  }

  return particles;
}

function createDustParticles(x: number, y: number): Particle[] {
  const particles: Particle[] = [];

  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI; // upward arc
    const speed = 1 + Math.random() * 2;
    particles.push({
      id: particleIdCounter++,
      x: x + (Math.random() - 0.5) * 30,
      y,
      vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
      vy: -Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      size: 4 + Math.random() * 8,
      color: "rgba(180,160,140,0.6)",
      type: "dust",
    });
  }

  return particles;
}

function createTrailParticle(x: number, y: number): Particle {
  return {
    id: particleIdCounter++,
    x,
    y,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    life: 1,
    maxLife: 1,
    size: 3 + Math.random() * 2,
    color: COLORS.yellow,
    type: "trail",
  };
}

function updateParticles(particles: Particle[], deltaTime: number = 0.05): Particle[] {
  return particles
    .map((p) => {
      const gravity = p.type === "smoke" ? -0.05 : p.type === "spark" ? 0.15 : 0.2;
      const drag = p.type === "smoke" ? 0.98 : p.type === "spark" ? 0.99 : 0.97;
      const lifeDecay = p.type === "smoke" ? 0.02 : p.type === "trail" ? 0.08 : 0.04;

      return {
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vx: p.vx * drag,
        vy: p.vy * drag + gravity,
        life: p.life - lifeDecay,
        rotation: p.rotation !== undefined ? p.rotation + (p.rotationSpeed || 0) : undefined,
      };
    })
    .filter((p) => p.life > 0);
}

function getShakeOffset(shake: ScreenShake | null, currentTime: number): { x: number; y: number } {
  if (!shake) return { x: 0, y: 0 };

  const elapsed = currentTime - shake.startTime;
  if (elapsed > shake.duration) return { x: 0, y: 0 };

  const progress = elapsed / shake.duration;
  const decay = 1 - progress;
  const intensity = shake.intensity * decay;

  // High frequency shake with decay
  const frequency = 30;
  const x = Math.sin(elapsed * frequency) * intensity * (Math.random() * 0.5 + 0.5);
  const y = Math.cos(elapsed * frequency * 1.3) * intensity * (Math.random() * 0.5 + 0.5);

  return { x, y };
}

// =============================================================================
// Pixel Art Components (authentic QBasic style)
// =============================================================================

// Night sky with stars
function NightSky() {
  // Generate consistent stars based on seed
  const stars: { x: number; y: number; size: number; brightness: number }[] = [];
  for (let i = 0; i < 50; i++) {
    const seed = i * 1337;
    stars.push({
      x: (seed % CANVAS_WIDTH),
      y: ((seed * 7) % (CANVAS_HEIGHT * 0.4)),
      size: 1 + (seed % 3) * 0.5,
      brightness: 0.3 + (seed % 7) / 10,
    });
  }

  return (
    <g>
      {/* Sky gradient */}
      <defs>
        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={COLORS.skyTop} />
          <stop offset="50%" stopColor={COLORS.skyMid} />
          <stop offset="100%" stopColor={COLORS.skyBottom} />
        </linearGradient>
      </defs>
      <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="url(#skyGradient)" />

      {/* Stars */}
      {stars.map((star, i) => (
        <circle
          key={i}
          cx={star.x}
          cy={star.y}
          r={star.size}
          fill={COLORS.white}
          opacity={star.brightness}
        />
      ))}
    </g>
  );
}

// Enhanced sun with glow effect
function QBasicSun({ x, y, surprised }: { x: number; y: number; surprised: boolean }) {
  const r = 30;
  const f = r / 12;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Outer glow */}
      <circle cx={0} cy={0} r={r + 25} fill="rgba(255,200,50,0.15)" />
      <circle cx={0} cy={0} r={r + 15} fill="rgba(255,220,100,0.2)" />

      {/* Animated rays with gradient */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = Math.cos(rad) * (r + 2);
        const y1 = Math.sin(rad) * (r + 2);
        const x2 = Math.cos(rad) * (r + (i % 2 === 0 ? 15 : 10));
        const y2 = Math.sin(rad) * (r + (i % 2 === 0 ? 15 : 10));
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={COLORS.yellow}
            strokeWidth={i % 2 === 0 ? 4 : 2}
            strokeLinecap="round"
            opacity={0.9}
          />
        );
      })}

      {/* Sun body with gradient */}
      <defs>
        <radialGradient id="sunGradient">
          <stop offset="0%" stopColor="#FFFFAA" />
          <stop offset="60%" stopColor={COLORS.yellow} />
          <stop offset="100%" stopColor="#FFCC00" />
        </radialGradient>
      </defs>
      <circle cx={0} cy={0} r={r} fill="url(#sunGradient)" />
      <circle cx={0} cy={0} r={r} fill="none" stroke="#FFAA00" strokeWidth={2} />

      {/* Face */}
      {surprised ? (
        <>
          {/* Surprised eyes */}
          <circle cx={-4 * f} cy={-2 * f} r={3.5 * f} fill="white" />
          <circle cx={4 * f} cy={-2 * f} r={3.5 * f} fill="white" />
          <circle cx={-4 * f} cy={-2 * f} r={2 * f} fill={COLORS.black} />
          <circle cx={4 * f} cy={-2 * f} r={2 * f} fill={COLORS.black} />
          {/* Surprised mouth */}
          <ellipse cx={0} cy={5 * f} rx={3 * f} ry={4 * f} fill={COLORS.black} />
        </>
      ) : (
        <>
          {/* Happy eyes */}
          <ellipse cx={-4 * f} cy={-3 * f} rx={3 * f} ry={2 * f} fill="white" />
          <ellipse cx={4 * f} cy={-3 * f} rx={3 * f} ry={2 * f} fill="white" />
          <circle cx={-4 * f} cy={-2.5 * f} r={1.5 * f} fill={COLORS.black} />
          <circle cx={4 * f} cy={-2.5 * f} r={1.5 * f} fill={COLORS.black} />
          {/* Cheeks */}
          <circle cx={-7 * f} cy={1 * f} r={2 * f} fill="rgba(255,150,100,0.4)" />
          <circle cx={7 * f} cy={1 * f} r={2 * f} fill="rgba(255,150,100,0.4)" />
          {/* Smile */}
          <path
            d={`M ${-5 * f} ${3 * f} Q 0 ${9 * f} ${5 * f} ${3 * f}`}
            fill="none"
            stroke={COLORS.black}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </>
      )}
    </g>
  );
}

// Enhanced building with gradient facade and animated windows
function QBasicBuilding({ x, width, height, colorIndex, damage }: {
  x: number; width: number; height: number; colorIndex: number; damage: number[];
}) {
  const palette = BUILDING_PALETTE[colorIndex % BUILDING_PALETTE.length];
  const safetyDamage = damage || [];
  const buildingId = `building-${x}-${colorIndex}`;

  // Window grid parameters (in scaled coords)
  const windowW = 4 * SCALE;
  const windowH = 6 * SCALE;
  const windowGapX = 8 * SCALE;
  const windowGapY = 10 * SCALE;

  // Build the building column by column to show damage
  const colWidth = 2;
  const numCols = Math.ceil(width / colWidth);
  const columns: React.ReactElement[] = [];

  for (let i = 0; i < numCols; i++) {
    const screenX = x + i * colWidth;
    const engineCol = Math.floor((i * colWidth) / SCALE);
    const colDamage = (safetyDamage[engineCol] || 0) * SCALE;
    const effectiveHeight = Math.max(0, height - colDamage);

    if (effectiveHeight > 0) {
      // Gradient from left to right for 3D effect
      const gradientProgress = i / numCols;
      const colorLerp = gradientProgress < 0.3 ? palette.light :
                        gradientProgress > 0.7 ? palette.dark : palette.main;

      columns.push(
        <rect
          key={`col-${i}`}
          x={screenX}
          y={CANVAS_HEIGHT - effectiveHeight}
          width={colWidth + 0.5}
          height={effectiveHeight}
          fill={colorLerp}
        />
      );
    }
  }

  // Rooftop detail
  const roofElements: React.ReactElement[] = [];
  const avgDamage = safetyDamage.length > 0
    ? safetyDamage.reduce((a, b) => a + b, 0) / safetyDamage.length
    : 0;
  const roofY = CANVAS_HEIGHT - height + avgDamage * SCALE;

  if (avgDamage < height * 0.3) {
    // Add rooftop trim
    roofElements.push(
      <rect
        key="roof-trim"
        x={x}
        y={roofY - 3}
        width={width}
        height={3}
        fill={palette.light}
      />
    );
    // Small antenna or structure on some buildings
    if (colorIndex % 3 === 0 && width > 50 * SCALE) {
      roofElements.push(
        <rect
          key="antenna"
          x={x + width / 2 - 2}
          y={roofY - 15}
          width={4}
          height={12}
          fill={palette.dark}
        />
      );
    }
  }

  // Windows with glow effect
  const windows: React.ReactElement[] = [];
  const windowCols = Math.floor((width - 4 * SCALE) / windowGapX);
  const windowRows = Math.floor((height - 6 * SCALE) / windowGapY);

  for (let row = 0; row < windowRows; row++) {
    for (let col = 0; col < windowCols; col++) {
      const windowX = x + 3 * SCALE + col * windowGapX;
      const windowY = CANVAS_HEIGHT - height + 4 * SCALE + row * windowGapY;

      const engineCol = Math.floor((3 * SCALE + col * windowGapX) / SCALE);
      const colDamage = (safetyDamage[engineCol] || 0) * SCALE;
      const effectiveTop = CANVAS_HEIGHT - (height - colDamage);

      if (windowY >= effectiveTop) {
        // Pseudo-random lighting pattern based on position
        const lightSeed = (row * 17 + col * 31 + colorIndex * 7) % 10;
        const lit = lightSeed > 3;
        const brightness = lit ? (lightSeed > 7 ? 1 : 0.7) : 0;

        if (lit) {
          // Glow effect for lit windows
          windows.push(
            <rect
              key={`win-glow-${row}-${col}`}
              x={windowX - 1}
              y={windowY - 1}
              width={windowW + 2}
              height={windowH + 2}
              fill={COLORS.windowGlow}
              opacity={0.3}
            />
          );
        }
        windows.push(
          <rect
            key={`win-${row}-${col}`}
            x={windowX}
            y={windowY}
            width={windowW}
            height={windowH}
            fill={lit ? COLORS.windowGlow : COLORS.windowDark}
            opacity={brightness > 0 ? brightness : 1}
          />
        );
      }
    }
  }

  return (
    <g>
      {columns}
      {roofElements}
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

// Enhanced banana with glow effect
function QBasicBanana({ x, y, rotation }: { x: number; y: number; rotation: number }) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      {/* Motion glow */}
      <ellipse cx={0} cy={0} rx={14} ry={8} fill="rgba(255,255,100,0.3)" />

      {/* Banana body */}
      <path
        d="M -10 0 Q -8 -5 0 -4 Q 8 -3 10 0 Q 8 4 0 5 Q -8 4 -10 0"
        fill={COLORS.yellow}
        stroke="#CCAA00"
        strokeWidth={1}
      />

      {/* Banana highlight */}
      <path
        d="M -6 -2 Q 0 -4 6 -2"
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* Stem */}
      <ellipse cx={-9} cy={0} rx={3} ry={2} fill={COLORS.brown} />
      <rect x={-11} y={-1} width={2} height={2} fill="#5a3a1a" />
    </g>
  );
}

// QBasic explosion (simple expanding circles) - enhanced with glow
function QBasicExplosion({ x, y, frame }: { x: number; y: number; frame: number }) {
  const colors = [COLORS.white, COLORS.yellow, COLORS.lightRed, COLORS.red];
  const radius = (frame + 1) * 8;
  const opacity = Math.max(0, 1 - frame / 6);

  return (
    <g style={{ filter: "url(#glow)" }}>
      {/* Outer glow */}
      <circle
        cx={x}
        cy={y}
        r={radius + 10}
        fill={`rgba(255,200,100,${opacity * 0.3})`}
      />
      {/* Main explosion rings */}
      {colors.slice(0, Math.min(frame + 1, 4)).map((color, i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={Math.max(0, radius - i * 5)}
          fill={color}
          opacity={opacity}
        />
      ))}
    </g>
  );
}

// Particle renderer
function ParticleRenderer({ particles }: { particles: Particle[] }) {
  return (
    <g>
      {particles.map((p) => {
        const opacity = p.life / p.maxLife;

        if (p.type === "smoke") {
          return (
            <circle
              key={p.id}
              cx={p.x}
              cy={p.y}
              r={p.size * (2 - p.life)} // grows as it fades
              fill={p.color.replace(/[\d.]+\)$/, `${opacity * 0.6})`)}
            />
          );
        }

        if (p.type === "debris") {
          return (
            <rect
              key={p.id}
              x={p.x - p.size / 2}
              y={p.y - p.size / 2}
              width={p.size}
              height={p.size}
              fill={p.color}
              opacity={opacity}
              transform={`rotate(${p.rotation || 0} ${p.x} ${p.y})`}
            />
          );
        }

        if (p.type === "spark") {
          return (
            <g key={p.id}>
              <circle
                cx={p.x}
                cy={p.y}
                r={p.size * 1.5}
                fill={`rgba(255,255,200,${opacity * 0.3})`}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={p.size}
                fill={p.color}
                opacity={opacity}
              />
            </g>
          );
        }

        if (p.type === "trail") {
          return (
            <circle
              key={p.id}
              cx={p.x}
              cy={p.y}
              r={p.size * opacity}
              fill={COLORS.yellow}
              opacity={opacity * 0.7}
            />
          );
        }

        // dust
        return (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={p.size * (1.5 - opacity * 0.5)}
            fill={p.color}
            opacity={opacity * 0.5}
          />
        );
      })}
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

  // Mobile drag-to-aim state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const [previewTrajectory, setPreviewTrajectory] = useState<{ x: number; y: number }[] | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [isAnimating, setIsAnimating] = useState(false);
  const [trajectoryIndex, setTrajectoryIndex] = useState(0);
  const [explosionFrame, setExplosionFrame] = useState(-1);
  const [explosionPos, setExplosionPos] = useState<{ x: number; y: number } | null>(null);
  const [sunSurprised, setSunSurprised] = useState(false);
  const [gorillaFrame, setGorillaFrame] = useState(0);
  const [message, setMessage] = useState("Player 1, enter angle and velocity");

  // Particle system state
  const [particles, setParticles] = useState<Particle[]>([]);
  const [screenShake, setScreenShake] = useState<ScreenShake | null>(null);
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 });
  const [gorillaHitFlash, setGorillaHitFlash] = useState<"player" | "opponent" | null>(null);

  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const particleAnimRef = useRef<number | null>(null);
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
    setParticles([]);
    setScreenShake(null);
    setShakeOffset({ x: 0, y: 0 });
    setGorillaHitFlash(null);
    setMessage("Player 1 (Left) - Enter angle:");
  }, []);

  useEffect(() => { initGame(levelIndex, isVsAI, difficulty); }, []);

  // Particle animation loop
  useEffect(() => {
    let lastTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      setParticles((prev) => updateParticles(prev, delta));

      // Update screen shake
      if (screenShake) {
        const offset = getShakeOffset(screenShake, now);
        setShakeOffset(offset);
        if (now - screenShake.startTime > screenShake.duration) {
          setScreenShake(null);
          setShakeOffset({ x: 0, y: 0 });
        }
      }

      particleAnimRef.current = requestAnimationFrame(animate);
    };

    particleAnimRef.current = requestAnimationFrame(animate);

    return () => {
      if (particleAnimRef.current) {
        cancelAnimationFrame(particleAnimRef.current);
      }
    };
  }, [screenShake]);

  const changeLevel = useCallback((newIndex: number) => {
    const idx = Math.max(0, Math.min(totalLevels - 1, newIndex));
    setLevelIndex(idx);
    initGame(idx, isVsAI, difficulty);
  }, [totalLevels, isVsAI, difficulty, initGame]);

  const resetLevel = useCallback(() => {
    initGame(levelIndex, isVsAI, difficulty);
  }, [levelIndex, isVsAI, difficulty, initGame]);

  const animateTrajectory = useCallback((trajectory: Trajectory, thrownByPlayer: boolean, callback: () => void) => {
    currentTrajectoryRef.current = trajectory;
    setIsAnimating(true);
    setTrajectoryIndex(0);
    setSunSurprised(false);
    setGorillaFrame(1); // Arm up for throw
    setParticles([]); // Clear old particles

    let index = 0;
    let trailCounter = 0;

    const animate = () => {
      if (index < trajectory.points.length) {
        setTrajectoryIndex(index);

        // Add trail particle every few frames
        const pt = trajectory.points[index];
        const screenX = pt.x * SCALE;
        const screenY = pt.y * SCALE;

        trailCounter++;
        if (trailCounter % 3 === 0) {
          setParticles((prev) => [...prev, createTrailParticle(screenX, screenY)]);
        }

        // Check if banana passes near sun
        const sunX = CANVAS_WIDTH - 60;
        const sunY = 45;
        const dist = Math.sqrt((screenX - sunX) ** 2 + (screenY - sunY) ** 2);
        if (dist < 50) {
          setSunSurprised(true);
        }

        index++;
        animationRef.current = setTimeout(animate, ANIMATION_SPEED);
      } else {
        setGorillaFrame(0); // Arm down

        if (trajectory.hitPosition) {
          const hitX = trajectory.hitPosition.x * SCALE;
          const hitY = trajectory.hitPosition.y * SCALE;

          setExplosionPos({ x: hitX, y: hitY });

          // Create explosion particles
          const explosionParticles = createExplosionParticles(hitX, hitY, 35);
          setParticles((prev) => [...prev, ...explosionParticles]);

          // Trigger screen shake - stronger for gorilla hit
          const isGorillaHit = trajectory.hit === "gorilla";
          setScreenShake({
            intensity: isGorillaHit ? 15 : 8,
            duration: isGorillaHit ? 400 : 250,
            startTime: performance.now(),
          });

          // Flash hit gorilla - opponent of whoever threw
          if (isGorillaHit) {
            setGorillaHitFlash(thrownByPlayer ? "opponent" : "player");
            setTimeout(() => setGorillaHitFlash(null), 300);
          }

          // Add dust/debris for building hit
          if (trajectory.hit === "building") {
            const dustParticles = createDustParticles(hitX, hitY);
            setParticles((prev) => [...prev, ...dustParticles]);
          }

          // Animate explosion
          let frame = 0;
          const explode = () => {
            setExplosionFrame(frame);
            frame++;
            if (frame < 8) {
              setTimeout(explode, 60);
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
          animateTrajectory(result.state.lastTrajectory, false, () => {
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
      animateTrajectory(result.state.lastTrajectory, true, () => {
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

  useEffect(() => {
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
      if (particleAnimRef.current) cancelAnimationFrame(particleAnimRef.current);
    };
  }, []);

  // Calculate angle and velocity from drag gesture
  const calculateDragParams = useCallback((start: { x: number; y: number }, current: { x: number; y: number }) => {
    const dx = start.x - current.x; // Drag back = positive
    const dy = start.y - current.y; // Drag up = positive

    // Calculate angle (0-90 degrees)
    const rawAngle = Math.atan2(dy, Math.abs(dx)) * (180 / Math.PI);
    const angle = Math.max(0, Math.min(90, rawAngle));

    // Calculate velocity from drag distance
    const distance = Math.sqrt(dx * dx + dy * dy);
    const velocity = Math.min(200, Math.max(10, distance * 1.5));

    return { angle: Math.round(angle), velocity: Math.round(velocity) };
  }, []);

  // Generate preview trajectory for aiming
  const generatePreviewTrajectory = useCallback((angle: number, velocity: number) => {
    if (!gameState) return [];

    const thrower = gameState.player1;
    const radians = (angle * Math.PI) / 180;
    let vx = velocity * Math.cos(radians);
    let vy = -velocity * Math.sin(radians);
    let x = thrower.position.x;
    let y = thrower.position.y - 15; // Gorilla arm height

    const points: { x: number; y: number }[] = [];
    const maxPoints = 30;
    const timeStep = 0.1;

    for (let i = 0; i < maxPoints; i++) {
      points.push({ x: x * SCALE, y: y * SCALE });

      // Physics simulation (simplified)
      vx += gameState.wind * timeStep * 0.5;
      vy += gameState.gravity * timeStep;
      x += vx * timeStep;
      y += vy * timeStep;

      // Stop if out of bounds or hit ground
      if (y > gameState.height || x < 0 || x > gameState.width) break;
    }

    return points;
  }, [gameState]);

  // Convert screen coordinates to SVG coordinates (accounting for viewBox scaling)
  const screenToSvgCoords = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };

    const rect = svg.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  // Pointer event handlers for drag-to-aim
  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!gameState || isAnimating || gameState.status !== "playing" || gameState.turn !== "player") return;

    const svg = svgRef.current;
    if (!svg) return;

    const { x, y } = screenToSvgCoords(e.clientX, e.clientY);

    // Only start drag if clicking near the player's gorilla
    const gorillaX = gameState.player1.position.x * SCALE;
    const gorillaY = gameState.player1.position.y * SCALE;
    const dist = Math.sqrt(Math.pow(x - gorillaX, 2) + Math.pow(y - gorillaY, 2));

    if (dist < 100) {
      setIsDragging(true);
      setDragStart({ x, y });
      setDragCurrent({ x, y });
      svg.setPointerCapture(e.pointerId);
    }
  }, [gameState, isAnimating, screenToSvgCoords]);

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging || !dragStart) return;

    const { x, y } = screenToSvgCoords(e.clientX, e.clientY);
    setDragCurrent({ x, y });

    // Update input fields and preview
    const { angle, velocity } = calculateDragParams(dragStart, { x, y });
    setAngleInput(angle.toString());
    setVelocityInput(velocity.toString());

    // Generate preview trajectory
    const preview = generatePreviewTrajectory(angle, velocity);
    setPreviewTrajectory(preview);
  }, [isDragging, dragStart, calculateDragParams, generatePreviewTrajectory, screenToSvgCoords]);

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging || !dragStart || !dragCurrent) {
      setIsDragging(false);
      setDragStart(null);
      setDragCurrent(null);
      setPreviewTrajectory(null);
      return;
    }

    const svg = svgRef.current;
    if (svg) {
      svg.releasePointerCapture(e.pointerId);
    }

    // Calculate final params and throw
    const { angle, velocity } = calculateDragParams(dragStart, dragCurrent);

    // Only throw if there's meaningful drag distance
    const dx = dragStart.x - dragCurrent.x;
    const dy = dragStart.y - dragCurrent.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 20) {
      setAngleInput(angle.toString());
      setVelocityInput(velocity.toString());
      // Delay slightly to update state, then throw
      setTimeout(() => makeThrow(), 50);
    }

    setIsDragging(false);
    setDragStart(null);
    setDragCurrent(null);
    setPreviewTrajectory(null);
  }, [isDragging, dragStart, dragCurrent, calculateDragParams, makeThrow]);

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
      className="flex flex-col items-center gap-0 font-mono w-full max-w-[1400px] mx-auto"
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

      {/* Game canvas - responsive container, scales to fit screen */}
      <div
        className="relative border-4 overflow-hidden w-full max-w-[1400px] mx-auto"
        style={{
          borderColor: COLORS.blue,
          aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
          className="w-full h-full"
          style={{
            backgroundColor: COLORS.black,
            transform: `translate(${shakeOffset.x}px, ${shakeOffset.y}px)`,
            transition: screenShake ? "none" : "transform 0.1s ease-out",
            touchAction: "none", // Prevent browser gestures
            cursor: canInput ? "crosshair" : "default",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* SVG Filters for glow effects */}
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="gorillaHit" x="-50%" y="-50%" width="200%" height="200%">
              <feFlood floodColor="white" floodOpacity="0.8" result="flood" />
              <feComposite in="flood" in2="SourceGraphic" operator="in" result="mask" />
              <feMerge>
                <feMergeNode in="mask" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Enhanced night sky with stars */}
          <NightSky />

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

          {/* Drag-to-aim trajectory preview */}
          {isDragging && previewTrajectory && previewTrajectory.length > 1 && (
            <g>
              {/* Trajectory line */}
              <path
                d={`M ${previewTrajectory.map(p => `${p.x},${p.y}`).join(' L ')}`}
                fill="none"
                stroke="rgba(255,255,100,0.6)"
                strokeWidth={3}
                strokeDasharray="8,4"
                strokeLinecap="round"
              />
              {/* Trajectory dots */}
              {previewTrajectory.filter((_, i) => i % 3 === 0).map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={4 - i * 0.15}
                  fill={COLORS.yellow}
                  opacity={0.8 - i * 0.02}
                />
              ))}
            </g>
          )}

          {/* Drag indicator arrow */}
          {isDragging && dragStart && dragCurrent && (
            <g>
              {/* Power indicator line */}
              <line
                x1={dragStart.x}
                y1={dragStart.y}
                x2={dragCurrent.x}
                y2={dragCurrent.y}
                stroke="rgba(255,100,100,0.8)"
                strokeWidth={4}
                strokeLinecap="round"
              />
              {/* Start circle */}
              <circle
                cx={dragStart.x}
                cy={dragStart.y}
                r={8}
                fill="rgba(255,200,100,0.8)"
                stroke={COLORS.white}
                strokeWidth={2}
              />
              {/* Current position */}
              <circle
                cx={dragCurrent.x}
                cy={dragCurrent.y}
                r={12}
                fill="rgba(255,100,100,0.6)"
                stroke={COLORS.white}
                strokeWidth={2}
              />
            </g>
          )}

          {/* Gorillas */}
          <g style={gorillaHitFlash === "player" ? { filter: "url(#gorillaHit)" } : undefined}>
            <QBasicGorilla
              x={player1.position.x * SCALE}
              y={player1.position.y * SCALE}
              isLeft={true}
              armUp={isAnimating && isPlayerTurn && gorillaFrame === 1}
              frame={gorillaFrame}
            />
          </g>
          <g style={gorillaHitFlash === "opponent" ? { filter: "url(#gorillaHit)" } : undefined}>
            <QBasicGorilla
              x={player2.position.x * SCALE}
              y={player2.position.y * SCALE}
              isLeft={false}
              armUp={isAnimating && !isPlayerTurn && gorillaFrame === 1}
              frame={gorillaFrame}
            />
          </g>

          {/* Banana in flight */}
          {isAnimating && currentBananaPos && (
            <QBasicBanana
              x={currentBananaPos.x}
              y={currentBananaPos.y}
              rotation={bananaRotation}
            />
          )}

          {/* Particles */}
          <ParticleRenderer particles={particles} />

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

      {/* Input area (QBasic style) - responsive */}
      <div
        className="w-full flex flex-wrap gap-4 sm:gap-8 justify-center py-2 px-2 sm:px-4"
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

      {/* Instructions - desktop and mobile */}
      <div
        className="w-full text-center py-1 hidden sm:block"
        style={{
          backgroundColor: COLORS.black,
          color: COLORS.darkGray,
          fontSize: `${10 * SCALE / 2}px`
        }}
      >
        Enter angle, TAB to velocity, ENTER to throw  |  Arrow keys: ↑↓ angle  ←→ velocity
      </div>
      <div
        className="w-full text-center py-1 sm:hidden"
        style={{
          backgroundColor: COLORS.black,
          color: COLORS.lightCyan,
          fontSize: `${10 * SCALE / 2}px`
        }}
      >
        🎯 Drag from your gorilla to aim & throw  |  Pull back for power
      </div>
    </div>
  );
}
