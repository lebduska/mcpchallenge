"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";

interface CompletionResult {
  score?: number;
  winner?: string;
  moves?: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: string;
}

interface CompletionResponse {
  success: boolean;
  pointsEarned: number;
  newAchievements: Achievement[];
  stats: {
    totalPoints: number;
    level: number;
    challengesCompleted: number;
  };
}

export function useGameCompletion(challengeId: string) {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<CompletionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitCompletion = useCallback(
    async (result: CompletionResult): Promise<CompletionResponse | null> => {
      if (!session?.user) {
        // User not logged in, silently skip
        return null;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch(`/api/challenges/${challengeId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result),
        });

        if (!response.ok) {
          throw new Error("Failed to submit completion");
        }

        const data = (await response.json()) as CompletionResponse;
        setLastResult(data);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [session, challengeId]
  );

  return {
    submitCompletion,
    isSubmitting,
    lastResult,
    error,
    isLoggedIn: !!session?.user,
  };
}
