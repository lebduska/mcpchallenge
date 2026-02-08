"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Hint {
  id: string;
  title: string;
  content: string;
  trigger?: "immediate" | "delay" | "action";
  delay?: number; // ms
  icon?: React.ReactNode;
}

interface HintsSystemProps {
  challengeId: string;
  hints: Hint[];
  className?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  autoShow?: boolean;
  showOnlyOnce?: boolean;
}

const STORAGE_KEY_PREFIX = "mcp-hints-seen-";

// Helper to get seen hints from localStorage (called during render, not in effect)
function getSeenHintsFromStorage(storageKey: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch {
    // Invalid data
  }
  return new Set();
}

export function HintsSystem({
  challengeId,
  hints,
  className,
  position = "bottom-right",
  autoShow = true,
  showOnlyOnce = true,
}: HintsSystemProps) {
  const storageKey = `${STORAGE_KEY_PREFIX}${challengeId}`;

  // Use lazy initial state to load from localStorage
  const [seenHints, setSeenHints] = useState<Set<string>>(() =>
    showOnlyOnce ? getSeenHintsFromStorage(storageKey) : new Set()
  );

  // Compute initial dismissed state based on seen hints
  const initiallyDismissed = useMemo(() => {
    if (!showOnlyOnce) return false;
    return hints.every((h) => seenHints.has(h.id));
  }, [hints, seenHints, showOnlyOnce]);

  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(initiallyDismissed);

  // Auto-show first hint after delay
  useEffect(() => {
    if (!autoShow || isDismissed) return;

    const firstHint = hints[0];
    if (!firstHint) return;

    const delay = firstHint.trigger === "delay" ? firstHint.delay || 2000 : 1500;

    const timer = setTimeout(() => {
      if (!seenHints.has(firstHint.id) || !showOnlyOnce) {
        setIsVisible(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [autoShow, hints, isDismissed, seenHints, showOnlyOnce]);

  const markHintAsSeen = useCallback(
    (hintId: string) => {
      if (!showOnlyOnce) return;

      const newSeen = new Set([...seenHints, hintId]);
      setSeenHints(newSeen);
      localStorage.setItem(storageKey, JSON.stringify(Array.from(newSeen)));
    },
    [seenHints, storageKey, showOnlyOnce]
  );

  const handleNext = useCallback(() => {
    markHintAsSeen(hints[currentHintIndex].id);

    if (currentHintIndex < hints.length - 1) {
      setCurrentHintIndex(currentHintIndex + 1);
    } else {
      setIsVisible(false);
      setIsDismissed(true);
    }
  }, [currentHintIndex, hints, markHintAsSeen]);

  const handlePrevious = useCallback(() => {
    if (currentHintIndex > 0) {
      setCurrentHintIndex(currentHintIndex - 1);
    }
  }, [currentHintIndex]);

  const handleDismiss = useCallback(() => {
    markHintAsSeen(hints[currentHintIndex].id);
    setIsVisible(false);
    setIsDismissed(true);
  }, [hints, currentHintIndex, markHintAsSeen]);

  const handleShowAgain = useCallback(() => {
    setCurrentHintIndex(0);
    setIsVisible(true);
    setIsDismissed(false);
  }, []);

  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  };

  const currentHint = hints[currentHintIndex];

  if (!currentHint) return null;

  return (
    <>
      {/* Floating hint button (when dismissed) */}
      {isDismissed && !isVisible && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            "fixed z-40 p-3 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 shadow-lg hover:scale-110 transition-transform",
            positionClasses[position],
            className
          )}
          onClick={handleShowAgain}
          title="Show hints"
        >
          <Lightbulb className="h-5 w-5" />
        </motion.button>
      )}

      {/* Hint card */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed z-50 w-80 max-w-[calc(100vw-2rem)]",
              positionClasses[position],
              className
            )}
          >
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-b border-amber-100 dark:border-amber-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                    {currentHint.icon || <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
                  </div>
                  <span className="font-medium text-amber-800 dark:text-amber-200 text-sm">
                    {currentHint.title}
                  </span>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-1 rounded-md text-amber-600/60 hover:text-amber-800 dark:hover:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {currentHint.content}
                </p>
              </div>

              {/* Footer with navigation */}
              <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                {/* Progress dots */}
                <div className="flex items-center gap-1.5">
                  {hints.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-colors",
                        index === currentHintIndex
                          ? "bg-amber-500"
                          : index < currentHintIndex
                          ? "bg-amber-300 dark:bg-amber-700"
                          : "bg-zinc-200 dark:bg-zinc-700"
                      )}
                    />
                  ))}
                  <span className="ml-2 text-xs text-zinc-400">
                    {currentHintIndex + 1}/{hints.length}
                  </span>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-2">
                  {currentHintIndex > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrevious}
                      className="h-7 px-2 text-zinc-500"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="h-7 gap-1 bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    {currentHintIndex === hints.length - 1 ? (
                      <>
                        Got it
                        <Sparkles className="h-3.5 w-3.5" />
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Pre-defined hint sets for common challenges
export const tictactoeHints: Hint[] = [
  {
    id: "welcome",
    title: "Welcome!",
    content: "This is Tic-Tac-Toe with MCP integration. You can play manually or connect your AI agent to play through the MCP protocol.",
    trigger: "delay",
    delay: 2000,
  },
  {
    id: "mcp-tab",
    title: "MCP Mode",
    content: "Switch to the MCP tab to see connection details and watch your AI agent play in real-time.",
  },
  {
    id: "tools",
    title: "Available Tools",
    content: "Your agent can use tools like get_board, make_move, and get_legal_moves to interact with the game.",
  },
  {
    id: "first-win",
    title: "Pro Tip",
    content: "X should start in a corner for the best winning chances. The center is a common but suboptimal opening!",
  },
];

export const chessHints: Hint[] = [
  {
    id: "welcome",
    title: "Chess Challenge",
    content: "Play chess against an AI or connect your MCP agent. The board shows real-time updates from all connected clients.",
    trigger: "delay",
    delay: 2000,
  },
  {
    id: "notation",
    title: "Move Notation",
    content: "Use standard algebraic notation for moves: e2e4 (pawn), Nf3 (knight), O-O (castle kingside).",
  },
  {
    id: "fen",
    title: "FEN Support",
    content: "The get_board tool returns FEN notation - a standard way to describe chess positions that your agent can parse.",
  },
];

export const snakeHints: Hint[] = [
  {
    id: "welcome",
    title: "Snake Challenge",
    content: "Guide the snake to eat food and grow without hitting walls or yourself. Perfect for testing pathfinding algorithms!",
    trigger: "delay",
    delay: 2000,
  },
  {
    id: "vision",
    title: "Vision System",
    content: "Your agent receives a 'vision' object showing what's in each direction - great for neural network inputs.",
  },
  {
    id: "speed",
    title: "Game Speed",
    content: "The game runs in real-time. Your agent needs to respond quickly! Each move is processed immediately.",
  },
];
