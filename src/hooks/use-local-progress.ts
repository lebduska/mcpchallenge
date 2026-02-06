"use client";

import { useState, useEffect, useCallback } from "react";

interface LocalLevelBest {
  bestMoves: number | null;
  bestPushes: number | null;
  bestTimeMs: number | null;
}

interface LocalProgress {
  maxLevelUnlocked: number;
  lastLevel: number;
  levelBests: Record<string, LocalLevelBest>;
  updatedAt: number;
}

const STORAGE_KEY_PREFIX = "mcp_progress_";

/**
 * Hook for managing local progress storage for guest users.
 * Progress is stored in localStorage and can be synced to server on login.
 */
export function useLocalProgress(challengeId: string) {
  const [progress, setProgress] = useState<LocalProgress | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const storageKey = `${STORAGE_KEY_PREFIX}${challengeId}`;

  // Load progress from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    let isMounted = true;

    // Use microtask to avoid synchronous setState in effect
    queueMicrotask(() => {
      if (!isMounted) return;
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          setProgress(JSON.parse(stored));
        }
      } catch (error) {
        console.error("Failed to load local progress:", error);
      }
      setIsLoaded(true);
    });

    return () => { isMounted = false; };
  }, [storageKey]);

  // Save progress to localStorage
  const saveProgress = useCallback(
    (newProgress: LocalProgress) => {
      if (typeof window === "undefined") return;

      try {
        localStorage.setItem(storageKey, JSON.stringify(newProgress));
        setProgress(newProgress);
      } catch (error) {
        console.error("Failed to save local progress:", error);
      }
    },
    [storageKey]
  );

  // Update progress after completing a level
  const updateProgress = useCallback(
    (levelId: string, result: { won: boolean; moves?: number; pushes?: number; timeMs?: number }) => {
      const levelNum = parseInt(levelId, 10) || 1;
      const currentProgress = progress || {
        maxLevelUnlocked: 1,
        lastLevel: 1,
        levelBests: {},
        updatedAt: Date.now(),
      };

      const newProgress = { ...currentProgress };

      // Update max level if won
      if (result.won && levelNum >= currentProgress.maxLevelUnlocked) {
        newProgress.maxLevelUnlocked = levelNum + 1;
      }

      // Update last level
      newProgress.lastLevel = levelNum;
      newProgress.updatedAt = Date.now();

      // Update level best
      if (result.won) {
        const existing = currentProgress.levelBests[levelId];
        const isBetterMoves = !existing?.bestMoves || (result.moves && result.moves < existing.bestMoves);
        const isBetterPushes = !existing?.bestPushes || (result.pushes && result.pushes < existing.bestPushes);
        const isBetterTime = !existing?.bestTimeMs || (result.timeMs && result.timeMs < existing.bestTimeMs);

        if (!existing || isBetterMoves || isBetterPushes || isBetterTime) {
          newProgress.levelBests = {
            ...currentProgress.levelBests,
            [levelId]: {
              bestMoves: isBetterMoves && result.moves ? result.moves : existing?.bestMoves || null,
              bestPushes: isBetterPushes && result.pushes ? result.pushes : existing?.bestPushes || null,
              bestTimeMs: isBetterTime && result.timeMs ? result.timeMs : existing?.bestTimeMs || null,
            },
          };
        }
      }

      saveProgress(newProgress);
      return newProgress;
    },
    [progress, saveProgress]
  );

  // Clear local progress (after syncing to server)
  const clearProgress = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(storageKey);
      setProgress(null);
    } catch (error) {
      console.error("Failed to clear local progress:", error);
    }
  }, [storageKey]);

  // Get all local progress for syncing
  const getAllLocalProgress = useCallback(() => {
    if (typeof window === "undefined") return {};

    const allProgress: Record<string, LocalProgress> = {};

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_KEY_PREFIX)) {
          const challengeId = key.replace(STORAGE_KEY_PREFIX, "");
          const value = localStorage.getItem(key);
          if (value) {
            allProgress[challengeId] = JSON.parse(value);
          }
        }
      }
    } catch (error) {
      console.error("Failed to get all local progress:", error);
    }

    return allProgress;
  }, []);

  return {
    progress,
    isLoaded,
    updateProgress,
    clearProgress,
    getAllLocalProgress,
    hasLocalProgress: progress !== null && progress.maxLevelUnlocked > 1,
  };
}

/**
 * Get the count of levels completed locally (across all challenges)
 */
export function getLocalProgressStats(): { totalLevels: number; challenges: number } {
  if (typeof window === "undefined") return { totalLevels: 0, challenges: 0 };

  let totalLevels = 0;
  let challenges = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEY_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          const progress: LocalProgress = JSON.parse(value);
          totalLevels += progress.maxLevelUnlocked - 1;
          challenges++;
        }
      }
    }
  } catch (error) {
    console.error("Failed to get local progress stats:", error);
  }

  return { totalLevels, challenges };
}
