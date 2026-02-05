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
        <Crown className="h-8 w-8 text-zinc-400 dark:text-zinc-600 mb-2" />
        <p className="text-sm text-zinc-500">No moves yet</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-600">Make the first move!</p>
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
        "overflow-y-auto pr-2 space-y-1",
        "scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent",
        className
      )}
    >
      {movePairs.map((pair, idx) => {
        const isLastPair = idx === movePairs.length - 1;
        const isLastMoveWhite = isLastPair && !pair.black;
        const isLastMoveBlack = isLastPair && !!pair.black;

        return (
          <div key={pair.moveNum} className="flex items-stretch gap-1">
            {/* Move number */}
            <div className="w-8 flex-shrink-0 flex items-center justify-center">
              <span className="text-xs font-mono text-zinc-500">{pair.moveNum}.</span>
            </div>

            {/* White move */}
            <MoveItem
              move={pair.white}
              isAI={isVsAI && !isPlayerWhite}
              isLast={isLastMoveWhite}
              side="white"
            />

            {/* Black move */}
            {pair.black ? (
              <MoveItem
                move={pair.black}
                isAI={isVsAI && isPlayerWhite}
                isLast={isLastMoveBlack}
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
  side: "white" | "black";
}

function MoveItem({ move, isAI, isLast, side }: MoveItemProps) {
  return (
    <div
      className={cn(
        "flex-1 flex items-center gap-2 px-2.5 py-2 rounded-lg",
        "transition-all duration-200",
        // Base styles
        side === "white"
          ? "bg-zinc-100/80 dark:bg-zinc-800/40"
          : "bg-zinc-50/80 dark:bg-zinc-900/40",
        // Last move highlight with animation
        isLast && [
          "ring-2 ring-emerald-500/60 dark:ring-emerald-400/50",
          "bg-emerald-50 dark:bg-emerald-500/15",
          "shadow-sm shadow-emerald-500/10",
          "animate-in slide-in-from-right-2 duration-300"
        ],
        // Hover
        !isLast && "hover:bg-zinc-200/80 dark:hover:bg-zinc-700/50 hover:scale-[1.02]",
        "cursor-default group"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-transform",
          isAI ? "bg-amber-100 dark:bg-amber-500/20" : "bg-emerald-100 dark:bg-emerald-500/20",
          isLast && "scale-110",
          "group-hover:scale-110"
        )}
      >
        {isAI ? (
          <Cpu className={cn("h-3 w-3 text-amber-600 dark:text-amber-400", isLast && "animate-pulse")} />
        ) : (
          <User className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
        )}
      </div>

      {/* Move */}
      <span
        className={cn(
          "font-mono text-sm font-semibold tracking-wide",
          isLast ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-600 dark:text-zinc-400",
          "group-hover:text-zinc-900 dark:group-hover:text-white transition-colors"
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
