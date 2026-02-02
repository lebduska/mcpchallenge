"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, LogIn, Trophy, Loader2 } from "lucide-react";
import { AchievementToast } from "@/components/achievements/achievement-toast";

interface Step {
  id: string;
  title: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: string;
}

interface ChallengeCompletionProps {
  challengeId: string;
  steps: Step[];
  onComplete?: () => void;
}

const STORAGE_KEY_PREFIX = "mcp-challenge-progress-";

export function ChallengeCompletion({
  challengeId,
  steps,
  onComplete,
}: ChallengeCompletionProps) {
  const { data: session, status } = useSession();
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [showToast, setShowToast] = useState(false);

  // Load progress from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${challengeId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCompletedSteps(new Set(parsed.completedSteps || []));
        setIsCompleted(parsed.isCompleted || false);
      } catch {
        // Invalid data, ignore
      }
    }
  }, [challengeId]);

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${challengeId}`,
      JSON.stringify({
        completedSteps: Array.from(completedSteps),
        isCompleted,
      })
    );
  }, [challengeId, completedSteps, isCompleted]);

  const toggleStep = useCallback((stepId: string) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  }, []);

  const handleMarkComplete = async () => {
    if (status !== "authenticated" || !session?.user) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/challenges/${challengeId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "tutorial" }),
      });

      if (response.ok) {
        const data = await response.json() as {
          success: boolean;
          newAchievements?: Achievement[];
          pointsEarned?: number;
        };
        setIsCompleted(true);

        if (data.newAchievements && data.newAchievements.length > 0) {
          setUnlockedAchievements(data.newAchievements);
          setShowToast(true);
        }

        onComplete?.();
      }
    } catch (error) {
      console.error("Error marking challenge complete:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const allStepsCompleted = completedSteps.size === steps.length;
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  return (
    <>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Track Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step checklist */}
          <div className="space-y-2">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => toggleStep(step.id)}
                disabled={isCompleted}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                  completedSteps.has(step.id)
                    ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                    : "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800"
                } ${isCompleted ? "cursor-default" : "cursor-pointer"}`}
              >
                {completedSteps.has(step.id) ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-zinc-400 flex-shrink-0" />
                )}
                <span
                  className={
                    completedSteps.has(step.id)
                      ? "text-green-700 dark:text-green-300"
                      : "text-zinc-700 dark:text-zinc-300"
                  }
                >
                  {step.title}
                </span>
              </button>
            ))}
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <span>Progress</span>
              <span>
                {completedSteps.size}/{steps.length} steps
              </span>
            </div>
            <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{
                  width: `${(completedSteps.size / steps.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Completion section */}
          {isCompleted ? (
            <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <Trophy className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-700 dark:text-green-300">
                Challenge Completed!
              </span>
              <Badge className="ml-auto bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                Done
              </Badge>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
          ) : !isAuthenticated ? (
            <div className="space-y-3">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Sign in to track your progress and earn achievements
              </p>
              <Button onClick={() => signIn()} variant="outline" className="w-full">
                <LogIn className="h-4 w-4 mr-2" />
                Sign in to save progress
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleMarkComplete}
              disabled={!allStepsCompleted || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : allStepsCompleted ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark as Complete
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4 mr-2" />
                  Complete all steps first
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Achievement toast */}
      {showToast && unlockedAchievements.length > 0 && (
        <AchievementToast
          achievements={unlockedAchievements}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}
