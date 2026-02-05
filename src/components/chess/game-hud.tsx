"use client";

/**
 * GameHUD - Floating overlay HUD for game status
 *
 * Shows current turn, game state with animations.
 * Designed as glassmorphism overlay.
 */

import { cn } from "@/lib/utils";
import { Loader2, Crown, Handshake, Flag, Sparkles } from "lucide-react";

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
  animate?: boolean;
  pulse?: boolean;
}> = {
  "your-turn": {
    label: "Your Move",
    icon: Sparkles,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "from-emerald-100 dark:from-emerald-500/20 to-emerald-50 dark:to-emerald-600/10",
    pulse: true,
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
    pulse: true,
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
        config.pulse && "animate-pulse",
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
 * GameHUDBar - Full width HUD bar variant
 */
interface GameHUDBarProps {
  state: GameState;
  winner?: "white" | "black" | null;
  playerColor?: "white" | "black";
  turn?: "w" | "b";
  moveCount?: number;
  className?: string;
}

export function GameHUDBar({
  state,
  winner,
  playerColor,
  turn,
  moveCount = 0,
  className,
}: GameHUDBarProps) {
  const config = stateConfig[state];
  const Icon = config.icon;

  let displayLabel = config.label;
  if (state === "checkmate" && winner && playerColor) {
    displayLabel = winner === playerColor ? "Victory!" : "Defeat";
  }

  return (
    <div
      className={cn(
        // Glassmorphism bar
        "flex items-center justify-between px-4 py-3 rounded-xl",
        "bg-gradient-to-r border border-zinc-200 dark:border-white/10",
        "shadow-lg shadow-black/10 dark:shadow-black/20",
        config.bgColor,
        className
      )}
    >
      {/* Left: Status */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full",
            "bg-white/50 dark:bg-black/20",
            config.pulse && "animate-pulse"
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4",
              config.color,
              config.animate && "animate-spin"
            )}
          />
        </div>
        <div>
          <span className={cn("text-sm font-semibold tracking-wide", config.color)}>
            {displayLabel}
          </span>
          {turn && state !== "checkmate" && state !== "draw" && state !== "resigned" && (
            <p className="text-xs text-zinc-500 dark:text-white/50">
              {turn === "w" ? "White" : "Black"} to move
            </p>
          )}
        </div>
      </div>

      {/* Right: Move counter */}
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="text-xs text-zinc-500 dark:text-white/50 uppercase tracking-wider">Moves</p>
          <p className="text-lg font-mono font-bold text-zinc-700 dark:text-white/80">{moveCount}</p>
        </div>
      </div>
    </div>
  );
}
