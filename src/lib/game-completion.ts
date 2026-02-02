"use client";

import { useSession } from "next-auth/react";
import { useCallback, useState } from "react";

export interface GameResult {
  score?: number;
  winner?: "player" | "ai" | "engine" | "computer" | "draw";
  moves?: number;
}

export interface CompletionResponse {
  success: boolean;
  pointsEarned: number;
  newAchievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    points: number;
    rarity: string;
  }>;
  stats: {
    totalPoints: number;
    level: number;
    challengesCompleted: number;
  };
}

export function useGameCompletion(challengeId: string) {
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCompletion, setLastCompletion] = useState<CompletionResponse | null>(null);

  const submitCompletion = useCallback(
    async (result: GameResult): Promise<CompletionResponse | null> => {
      // Only submit if user is authenticated
      if (status !== "authenticated" || !session?.user) {
        console.log("User not authenticated, skipping game completion submission");
        return null;
      }

      setIsSubmitting(true);
      try {
        const response = await fetch(`/api/challenges/${challengeId}/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(result),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error("Failed to submit game completion:", error);
          return null;
        }

        const data: CompletionResponse = await response.json();
        setLastCompletion(data);
        return data;
      } catch (error) {
        console.error("Error submitting game completion:", error);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [challengeId, session, status]
  );

  return {
    submitCompletion,
    isSubmitting,
    lastCompletion,
    isAuthenticated: status === "authenticated",
  };
}

// Standalone function for non-hook usage
export async function submitGameCompletion(
  challengeId: string,
  result: GameResult
): Promise<CompletionResponse | null> {
  try {
    const response = await fetch(`/api/challenges/${challengeId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(result),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to submit game completion:", error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error submitting game completion:", error);
    return null;
  }
}
