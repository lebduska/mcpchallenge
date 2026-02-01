"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export type Difficulty = "easy" | "medium" | "hard";

interface StockfishState {
  isReady: boolean;
  isThinking: boolean;
  error: string | null;
}

interface UseStockfishReturn extends StockfishState {
  getBestMove: (fen: string) => Promise<string | null>;
  setDifficulty: (difficulty: Difficulty) => void;
  difficulty: Difficulty;
}

// Difficulty settings (depth and time limits in ms)
const DIFFICULTY_SETTINGS: Record<Difficulty, { depth: number; moveTime: number }> = {
  easy: { depth: 3, moveTime: 300 },
  medium: { depth: 8, moveTime: 800 },
  hard: { depth: 15, moveTime: 1500 },
};

export function useStockfish(): UseStockfishReturn {
  const [state, setState] = useState<StockfishState>({
    isReady: false,
    isThinking: false,
    error: null,
  });
  const [difficulty, setDifficultyState] = useState<Difficulty>("medium");

  const workerRef = useRef<Worker | null>(null);
  const resolveRef = useRef<((move: string | null) => void) | null>(null);

  // Initialize Stockfish worker
  useEffect(() => {
    if (typeof window === "undefined") return;

    let mounted = true;

    const initWorker = () => {
      try {
        // Load stockfish from public directory
        const worker = new Worker("/stockfish/stockfish-17.1-lite-single-03e3232.js");

        worker.onmessage = (event: MessageEvent) => {
          const message = event.data;

          if (typeof message === "string") {
            // Handle multi-line messages
            const lines = message.split("\n");

            for (const line of lines) {
              // UCI ready
              if (line === "uciok") {
                if (mounted) {
                  setState((prev) => ({ ...prev, isReady: true }));
                }
              }

              // Best move found
              if (line.startsWith("bestmove")) {
                const parts = line.split(" ");
                const bestMove = parts[1];

                if (resolveRef.current) {
                  resolveRef.current(bestMove || null);
                  resolveRef.current = null;
                }

                if (mounted) {
                  setState((prev) => ({ ...prev, isThinking: false }));
                }
              }
            }
          }
        };

        worker.onerror = (error) => {
          console.error("Stockfish worker error:", error);
          if (mounted) {
            setState((prev) => ({
              ...prev,
              error: "Failed to load chess engine",
              isReady: false,
            }));
          }
        };

        workerRef.current = worker;

        // Initialize UCI protocol
        worker.postMessage("uci");
      } catch (error) {
        console.error("Failed to initialize Stockfish:", error);
        if (mounted) {
          setState((prev) => ({
            ...prev,
            error: "Failed to initialize chess engine",
          }));
        }
      }
    };

    initWorker();

    return () => {
      mounted = false;
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Get best move for a position
  const getBestMove = useCallback(
    async (fen: string): Promise<string | null> => {
      if (!workerRef.current || !state.isReady) {
        console.warn("Stockfish not ready");
        return null;
      }

      setState((prev) => ({ ...prev, isThinking: true }));

      return new Promise((resolve) => {
        resolveRef.current = resolve;

        const settings = DIFFICULTY_SETTINGS[difficulty];
        const worker = workerRef.current!;

        // Set position
        worker.postMessage(`position fen ${fen}`);

        // Start search with depth and time limits
        worker.postMessage(
          `go depth ${settings.depth} movetime ${settings.moveTime}`
        );

        // Timeout fallback (add extra time for safety)
        setTimeout(() => {
          if (resolveRef.current === resolve) {
            worker.postMessage("stop");
          }
        }, settings.moveTime + 2000);
      });
    },
    [state.isReady, difficulty]
  );

  // Set difficulty
  const setDifficulty = useCallback((newDifficulty: Difficulty) => {
    setDifficultyState(newDifficulty);
  }, []);

  return {
    ...state,
    getBestMove,
    setDifficulty,
    difficulty,
  };
}
