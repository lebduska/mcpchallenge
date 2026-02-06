"use client";

/**
 * GameHUD - Floating overlay HUD for game status
 *
 * Shows current turn, game state with animations.
 * Designed as glassmorphism overlay.
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Crown, Handshake, Flag, Sparkles, Cpu } from "lucide-react";

// Easing function for smooth oscillation
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

type GameState = "your-turn" | "ai-thinking" | "opponent-turn" | "checkmate" | "draw" | "resigned" | "check";

interface GameHUDProps {
  state: GameState;
  winner?: "white" | "black" | null;
  playerColor?: "white" | "black";
  className?: string;
}

const stateConfig: Record<GameState, {
  label: string;
  icon: typeof Crown;
  color: string;
  bgColor: string;
  animate?: boolean;  // Only for ai-thinking (spinner)
}> = {
  "your-turn": {
    label: "Your Move",
    icon: Sparkles,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "from-emerald-100 dark:from-emerald-500/20 to-emerald-50 dark:to-emerald-600/10",
  },
  "ai-thinking": {
    label: "AI Thinking",
    icon: Loader2,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "from-amber-100 dark:from-amber-500/20 to-amber-50 dark:to-amber-600/10",
    animate: true,
  },
  "opponent-turn": {
    label: "Opponent's Turn",
    icon: Crown,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "from-blue-100 dark:from-blue-500/20 to-blue-50 dark:to-blue-600/10",
  },
  "checkmate": {
    label: "Checkmate!",
    icon: Crown,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "from-yellow-100 dark:from-yellow-500/30 to-amber-50 dark:to-amber-600/20",
  },
  "draw": {
    label: "Draw",
    icon: Handshake,
    color: "text-zinc-600 dark:text-zinc-300",
    bgColor: "from-zinc-100 dark:from-zinc-500/20 to-zinc-50 dark:to-zinc-600/10",
  },
  "resigned": {
    label: "Resigned",
    icon: Flag,
    color: "text-red-600 dark:text-red-400",
    bgColor: "from-red-100 dark:from-red-500/20 to-red-50 dark:to-red-600/10",
  },
  "check": {
    label: "Check!",
    icon: Sparkles,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "from-orange-100 dark:from-orange-500/20 to-orange-50 dark:to-orange-600/10",
  },
};

export function GameHUD({ state, winner, playerColor, className }: GameHUDProps) {
  const config = stateConfig[state];
  const Icon = config.icon;

  // Determine win/lose message
  let displayLabel = config.label;
  if (state === "checkmate" && winner && playerColor) {
    displayLabel = winner === playerColor ? "Victory!" : "Defeat";
  }

  return (
    <div
      className={cn(
        // Glassmorphism base
        "inline-flex items-center gap-2 px-4 py-2 rounded-full",
        "bg-gradient-to-r border border-zinc-200 dark:border-white/10",
        "shadow-lg shadow-black/10 dark:shadow-black/20",
        "transition-all duration-300",
        config.bgColor,
        className
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4",
          config.color,
          config.animate && "animate-spin"
        )}
      />
      <span className={cn("text-sm font-medium tracking-wide", config.color)}>
        {displayLabel}
      </span>
    </div>
  );
}

/**
 * GameHUDBar - Full width HUD bar variant with integrated AI depth bar
 */
interface GameHUDBarProps {
  state: GameState;
  winner?: "white" | "black" | null;
  playerColor?: "white" | "black";
  turn?: "w" | "b";
  moveCount?: number;
  isThinking?: boolean;
  className?: string;
}

export function GameHUDBar({
  state,
  winner,
  playerColor,
  turn,
  moveCount = 0,
  isThinking = false,
  className,
}: GameHUDBarProps) {
  const config = stateConfig[state];
  const Icon = config.icon;

  // AI depth bar animation state
  const [progress, setProgress] = useState(0);
  const [showDepth, setShowDepth] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastJumpRef = useRef<number>(0);
  const prevThinkingRef = useRef(false);

  // Derive actual thinking state from both props
  const isActuallyThinking = isThinking && state === "ai-thinking";

  // Handle thinking state transitions
  useEffect(() => {
    const wasThinking = prevThinkingRef.current;
    prevThinkingRef.current = isActuallyThinking;

    if (isActuallyThinking && !wasThinking) {
      queueMicrotask(() => {
        setShowDepth(true);
        setProgress(10);
      });
    } else if (!isActuallyThinking && wasThinking) {
      // Immediately hide - no delay to avoid showing in wrong state
      queueMicrotask(() => {
        setShowDepth(false);
        setProgress(0);
      });
    }
  }, [isActuallyThinking]);

  // Animation loop
  useEffect(() => {
    if (!isActuallyThinking || !showDepth) return;

    startTimeRef.current = 0;
    lastJumpRef.current = 0;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
        lastJumpRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const cycleProgress = (elapsed % 3000) / 3000;
      const oscillation = easeInOutSine(cycleProgress);
      let newProgress = 10 + 55 * oscillation;

      // Occasional jumps
      if (timestamp - lastJumpRef.current > 800 + Math.random() * 700) {
        newProgress = Math.min(75, newProgress + 5 + Math.random() * 10);
        lastJumpRef.current = timestamp;
      }

      // Micro-noise
      newProgress += (Math.random() - 0.5) * 2;
      newProgress = Math.max(8, Math.min(78, newProgress));

      setProgress(newProgress);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isActuallyThinking, showDepth]);

  const depth = Math.floor(6 + (progress / 100) * 14);

  let displayLabel = config.label;
  if (state === "checkmate" && winner && playerColor) {
    displayLabel = winner === playerColor ? "Victory!" : "Defeat";
  }

  return (
    <div
      className={cn(
        // Premium glassmorphism bar
        "relative flex flex-col rounded-xl overflow-hidden",
        "bg-gradient-to-r border border-zinc-200/80 dark:border-white/10",
        "shadow-lg shadow-black/10 dark:shadow-black/30",
        "transition-all duration-500",
        config.bgColor,
        className
      )}
    >
      {/* Subtle animated gradient overlay - ONLY for AI thinking */}
      {state === "ai-thinking" && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      )}

      {/* Main status row */}
      <div className="relative flex items-center justify-between px-5 py-4">
        {/* Left: Status */}
        <div className="relative flex items-center gap-3">
          <div
            className={cn(
              "relative flex items-center justify-center w-10 h-10 rounded-xl",
              "bg-white/60 dark:bg-black/30",
              "shadow-inner transition-all duration-300",
              state === "ai-thinking" && "ring-2 ring-amber-400/50 animate-pulse"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 relative z-10",
                config.color,
                config.animate && "animate-spin"
              )}
            />
          </div>
          <div>
            <span className={cn(
              "text-sm font-bold tracking-wide",
              config.color,
              "transition-colors duration-300"
            )}>
              {displayLabel}
            </span>
            {turn && state !== "checkmate" && state !== "draw" && state !== "resigned" && (
              <p className="text-xs text-zinc-500 dark:text-white/50 font-medium">
                {turn === "w" ? "White" : "Black"} to move
              </p>
            )}
          </div>
        </div>

        {/* Right: Move counter with premium styling */}
        <div className="relative flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-zinc-400 dark:text-white/40 uppercase tracking-widest font-semibold">Moves</p>
            <p className={cn(
              "text-2xl font-mono font-black tabular-nums",
              "text-zinc-700 dark:text-white/90",
              "transition-all duration-300"
            )}>
              {moveCount}
            </p>
          </div>
        </div>
      </div>

      {/* AI Depth Bar - Fixed height, opacity toggle for no layout shift */}
      <div
        className={cn(
          "h-8 px-5 pb-3 transition-opacity duration-200",
          showDepth ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Cpu className="h-3 w-3 text-amber-500 dark:text-amber-400 animate-spin" />
            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
              Stockfish calculating...
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
            Depth ~{depth}
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative h-1 bg-zinc-200/80 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full",
              "bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500",
              !isActuallyThinking ? "transition-all duration-200 ease-out" : "transition-[width] duration-75 ease-linear"
            )}
            style={{ width: `${progress}%` }}
          />
          {/* Shimmer */}
          {isActuallyThinking && showDepth && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
              style={{ backgroundSize: "200% 100%" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
