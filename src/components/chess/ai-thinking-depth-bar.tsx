"use client";

/**
 * AiThinkingDepthBar - Animated depth indicator for Stockfish analysis
 *
 * Shows a fake but realistic depth progress while AI is thinking.
 * Animation cycles between ~10-75% with occasional jumps.
 * On completion, quickly fills to 100% then fades out.
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Cpu } from "lucide-react";

interface AiThinkingDepthBarProps {
  isThinking: boolean;
  className?: string;
}

// Easing function for smooth oscillation
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

export function AiThinkingDepthBar({ isThinking, className }: AiThinkingDepthBarProps) {
  const [progress, setProgress] = useState(0);
  const [showBar, setShowBar] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastJumpRef = useRef<number>(0);
  const prevThinkingRef = useRef(false);

  // Handle phase transitions
  useEffect(() => {
    const wasThinking = prevThinkingRef.current;
    prevThinkingRef.current = isThinking;

    if (isThinking && !wasThinking) {
      // Start thinking - use queueMicrotask to avoid sync setState warning
      queueMicrotask(() => {
        setShowBar(true);
        setIsFadingOut(false);
        setProgress(10);
      });
    } else if (!isThinking && wasThinking) {
      // Complete - fill to 100% and fade
      queueMicrotask(() => {
        setIsFadingOut(true);
        setProgress(100);
      });
    }
  }, [isThinking]);

  // Animation loop - only runs while thinking
  useEffect(() => {
    if (!isThinking || !showBar) return;

    startTimeRef.current = 0;
    lastJumpRef.current = 0;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
        lastJumpRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const cycleDuration = 3000;
      const cycleProgress = (elapsed % cycleDuration) / cycleDuration;

      // Base oscillation between 10% and 65%
      const oscillation = easeInOutSine(cycleProgress);
      let newProgress = 10 + 55 * oscillation;

      // Occasional jumps (every 800-1500ms)
      const timeSinceJump = timestamp - lastJumpRef.current;
      if (timeSinceJump > 800 + Math.random() * 700) {
        newProgress = Math.min(75, newProgress + 5 + Math.random() * 10);
        lastJumpRef.current = timestamp;
      }

      // Add micro-noise
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
  }, [isThinking, showBar]);

  // Fade out timer
  useEffect(() => {
    if (!isFadingOut) return;

    const timer = setTimeout(() => {
      setShowBar(false);
      setIsFadingOut(false);
      setProgress(0);
    }, 400);

    return () => clearTimeout(timer);
  }, [isFadingOut]);

  // Calculate depth from progress (6-20 range)
  const depth = Math.floor(6 + (progress / 100) * 14);

  if (!showBar) return null;

  return (
    <div
      className={cn(
        "w-full transition-opacity duration-300",
        isFadingOut ? "opacity-0" : "opacity-100",
        className
      )}
    >
      {/* Header with icon and labels */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Cpu className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 animate-spin" />
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
            Stockfish calculating...
          </span>
        </div>
        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
          Depth ~{depth}
        </span>
      </div>

      {/* Progress bar container */}
      <div className="relative h-1.5 bg-zinc-200/80 dark:bg-zinc-800 rounded-full overflow-hidden">
        {/* Progress fill */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            "bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500",
            isFadingOut
              ? "transition-all duration-200 ease-out"
              : "transition-[width] duration-75 ease-linear"
          )}
          style={{ width: `${progress}%` }}
        />

        {/* Shimmer overlay - only while actively thinking */}
        {!isFadingOut && (
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
            style={{ backgroundSize: "200% 100%" }}
          />
        )}

        {/* Glow effect at progress edge */}
        {!isFadingOut && (
          <div
            className="absolute top-0 bottom-0 w-4 bg-gradient-to-r from-transparent to-amber-300/50 dark:to-amber-400/40 blur-sm"
            style={{ left: `calc(${progress}% - 1rem)` }}
          />
        )}
      </div>
    </div>
  );
}
