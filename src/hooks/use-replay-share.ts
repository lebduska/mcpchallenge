"use client";

import { useState, useCallback, useRef } from "react";

/**
 * Game result structure for replay saving
 */
export interface GameResult {
  won?: boolean;
  moves?: number;
  pushes?: number;
  timeMs?: number;
  score?: number;
  winner?: string;
}

/**
 * Options for the useReplayShare hook
 */
export interface UseReplayShareOptions {
  challengeId: string;
  levelId?: string;
  seed?: string;
}

/**
 * Return type for the useReplayShare hook
 */
export interface UseReplayShareReturn<T = unknown> {
  // Move tracking
  moves: T[];
  recordMove: (move: T) => void;
  clearMoves: () => void;

  // Replay management
  replayId: string | null;
  saveReplay: (result: GameResult) => Promise<string | null>;

  // Sharing
  isSharing: boolean;
  shareCopied: boolean;
  shareReplay: () => Promise<string | null>;

  // Convenience
  canShare: boolean;
  reset: () => void;
}

/**
 * Universal hook for replay tracking and sharing across all games.
 *
 * Usage:
 * ```tsx
 * const { recordMove, saveReplay, shareReplay, canShare, reset } = useReplayShare<MoveType>({
 *   challengeId: "sokoban",
 *   levelId: "1",
 * });
 *
 * // On each move:
 * recordMove({ direction: "up", pushed: true });
 *
 * // On game end:
 * const replayId = await saveReplay({ won: true, moves: 42 });
 *
 * // On share button click:
 * await shareReplay();
 *
 * // On new game:
 * reset();
 * ```
 */
export function useReplayShare<T = unknown>(
  options: UseReplayShareOptions
): UseReplayShareReturn<T> {
  const { challengeId, levelId, seed } = options;

  const [moves, setMoves] = useState<T[]>([]);
  const [replayId, setReplayId] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Use ref to avoid stale closure issues with moves array
  const movesRef = useRef<T[]>([]);
  movesRef.current = moves;

  /**
   * Record a move during gameplay
   */
  const recordMove = useCallback((move: T) => {
    setMoves((prev) => [...prev, move]);
  }, []);

  /**
   * Clear all recorded moves (for reset/new game)
   */
  const clearMoves = useCallback(() => {
    setMoves([]);
  }, []);

  /**
   * Save replay to server and return replay ID
   */
  const saveReplay = useCallback(
    async (result: GameResult): Promise<string | null> => {
      try {
        const res = await fetch("/api/replays", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            challengeId,
            levelId,
            seed,
            moves: movesRef.current,
            result,
          }),
        });

        const data = (await res.json()) as { id?: string; success?: boolean };

        if (data.id) {
          setReplayId(data.id);
          return data.id;
        }

        return null;
      } catch (error) {
        console.error("Failed to save replay:", error);
        return null;
      }
    },
    [challengeId, levelId, seed]
  );

  /**
   * Create share link and copy to clipboard
   */
  const shareReplay = useCallback(async (): Promise<string | null> => {
    if (!replayId) return null;

    setIsSharing(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replayId }),
      });

      const data = (await res.json()) as { url?: string; code?: string };

      if (data.url) {
        await navigator.clipboard.writeText(data.url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 3000);
        return data.url;
      }

      return null;
    } catch (error) {
      console.error("Failed to share replay:", error);
      return null;
    } finally {
      setIsSharing(false);
    }
  }, [replayId]);

  /**
   * Full reset for new game
   */
  const reset = useCallback(() => {
    setMoves([]);
    setReplayId(null);
    setShareCopied(false);
  }, []);

  return {
    moves,
    recordMove,
    clearMoves,
    replayId,
    saveReplay,
    isSharing,
    shareCopied,
    shareReplay,
    canShare: replayId !== null,
    reset,
  };
}
