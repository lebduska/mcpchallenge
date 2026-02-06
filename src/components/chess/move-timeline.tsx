"use client";

/**
 * MoveTimeline - Vertical timeline for move history
 *
 * Shows moves in a vertical timeline with player/AI icons.
 * Highlights last move with animation.
 */

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { User, Cpu, Crown } from "lucide-react";

interface MoveTimelineProps {
  moves: string[];
  playerColor?: "white" | "black";
  gameMode?: "vs-ai" | "vs-player" | null;
  className?: string;
}

export function MoveTimeline({
  moves,
  playerColor = "white",
  gameMode = "vs-ai",
  className,
}: MoveTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves.length]);

  if (moves.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8", className)}>
        {/* Animated crown with subtle glow */}
        <div className="relative mb-3">
          <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl animate-pulse" />
          <div className="relative p-4 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900">
            <Crown className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
          </div>
        </div>
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">No moves yet</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-0.5">Make the first move!</p>
      </div>
    );
  }

  // Group moves into pairs (white, black)
  const movePairs: { moveNum: number; white: string; black?: string }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      moveNum: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  const isPlayerWhite = playerColor === "white";
  const isVsAI = gameMode === "vs-ai";

  return (
    <div
      ref={scrollRef}
      className={cn(
        "overflow-y-auto pr-2 space-y-1.5",
        "scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent",
        className
      )}
    >
      {movePairs.map((pair, idx) => {
        const isLastPair = idx === movePairs.length - 1;
        const isLastMoveWhite = isLastPair && !pair.black;
        const isLastMoveBlack = isLastPair && !!pair.black;
        const totalPairs = movePairs.length;

        // Calculate opacity for fade effect (older moves fade)
        const age = totalPairs - idx - 1;
        const fadeOpacity = age === 0 ? 1 : age === 1 ? 0.9 : age === 2 ? 0.8 : 0.7;

        return (
          <div
            key={pair.moveNum}
            className="flex items-stretch gap-1.5 transition-opacity duration-300"
            style={{ opacity: fadeOpacity }}
          >
            {/* Move number */}
            <div className="w-8 flex-shrink-0 flex items-center justify-center">
              <span className={cn(
                "text-xs font-mono transition-colors duration-200",
                isLastPair ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-zinc-400 dark:text-zinc-600"
              )}>
                {pair.moveNum}.
              </span>
            </div>

            {/* White move */}
            <MoveItem
              move={pair.white}
              isAI={isVsAI && !isPlayerWhite}
              isLast={isLastMoveWhite}
              isRecent={isLastPair}
              side="white"
            />

            {/* Black move */}
            {pair.black ? (
              <MoveItem
                move={pair.black}
                isAI={isVsAI && isPlayerWhite}
                isLast={isLastMoveBlack}
                isRecent={isLastPair}
                side="black"
              />
            ) : (
              <div className="flex-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface MoveItemProps {
  move: string;
  isAI: boolean;
  isLast: boolean;
  isRecent: boolean;
  side: "white" | "black";
}

function MoveItem({ move, isAI, isLast, isRecent, side }: MoveItemProps) {
  return (
    <div
      className={cn(
        "flex-1 flex items-center gap-2.5 rounded-xl",
        "transition-all duration-300 ease-out",
        // Size - last move is slightly larger
        isLast ? "px-3 py-2.5" : "px-2.5 py-2",
        // Base styles with subtle gradient
        side === "white"
          ? "bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800/50 dark:to-zinc-800/30"
          : "bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900/50 dark:to-zinc-900/30",
        // Last move - premium highlight with glow animation
        isLast && [
          "ring-2 ring-emerald-500/70 dark:ring-emerald-400/60",
          "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-500/20 dark:to-emerald-600/10",
          "shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10",
          "scale-[1.02]",
          "animate-in slide-in-from-right-4 fade-in duration-400"
        ],
        // Recent pair (not last move but same pair)
        !isLast && isRecent && "ring-1 ring-emerald-300/50 dark:ring-emerald-500/30",
        // Hover with lift effect
        !isLast && [
          "hover:bg-gradient-to-br hover:from-zinc-200/90 hover:to-zinc-100/90",
          "dark:hover:from-zinc-700/60 dark:hover:to-zinc-800/60",
          "hover:shadow-md hover:scale-[1.02] hover:-translate-y-0.5"
        ],
        "cursor-default group"
      )}
    >
      {/* Icon with glow effect for last move */}
      <div
        className={cn(
          "relative flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300",
          isLast ? "w-6 h-6" : "w-5 h-5",
          isAI
            ? "bg-gradient-to-br from-amber-100 to-amber-200/50 dark:from-amber-500/30 dark:to-amber-600/20"
            : "bg-gradient-to-br from-emerald-100 to-emerald-200/50 dark:from-emerald-500/30 dark:to-emerald-600/20",
          isLast && "shadow-md",
          isLast && (isAI ? "shadow-amber-400/30" : "shadow-emerald-400/30"),
          "group-hover:scale-110"
        )}
      >
        {/* Pulse ring for last AI move */}
        {isLast && isAI && (
          <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />
        )}
        {isAI ? (
          <Cpu className={cn(
            "text-amber-600 dark:text-amber-400",
            isLast ? "h-3.5 w-3.5" : "h-3 w-3",
            isLast && "animate-pulse"
          )} />
        ) : (
          <User className={cn(
            "text-emerald-600 dark:text-emerald-400",
            isLast ? "h-3.5 w-3.5" : "h-3 w-3"
          )} />
        )}
      </div>

      {/* Move notation */}
      <span
        className={cn(
          "font-mono font-semibold tracking-wide transition-all duration-200",
          isLast ? "text-base text-emerald-700 dark:text-emerald-300" : "text-sm text-zinc-600 dark:text-zinc-400",
          "group-hover:text-zinc-900 dark:group-hover:text-white"
        )}
      >
        {move}
      </span>
    </div>
  );
}

/**
 * Compact timeline variant for smaller spaces
 */
interface CompactTimelineProps {
  moves: string[];
  maxVisible?: number;
  className?: string;
}

export function CompactTimeline({ moves, maxVisible = 6, className }: CompactTimelineProps) {
  const visibleMoves = moves.slice(-maxVisible);
  const hiddenCount = Math.max(0, moves.length - maxVisible);

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {hiddenCount > 0 && (
        <span className="text-xs text-zinc-500 px-2 py-1">+{hiddenCount} more</span>
      )}
      {visibleMoves.map((move, i) => {
        const actualIndex = moves.length - visibleMoves.length + i;
        const isLast = actualIndex === moves.length - 1;
        const moveNum = Math.floor(actualIndex / 2) + 1;
        const isWhite = actualIndex % 2 === 0;

        return (
          <span
            key={actualIndex}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded font-mono text-xs",
              "transition-all duration-200",
              isLast
                ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-300 dark:ring-emerald-500/30"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-300"
            )}
          >
            {isWhite && <span className="text-zinc-400 dark:text-zinc-600">{moveNum}.</span>}
            {move}
          </span>
        );
      })}
    </div>
  );
}
