"use client";

export const runtime = "edge";

import { useState, useCallback } from "react";
import { Bomb, ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { Minesweeper } from "@/components/games/minesweeper";
import { useGameCompletion } from "@/hooks/use-game-completion";
import { AchievementToast } from "@/components/achievements/achievement-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: string;
}

export default function MinesweeperChallengePage() {
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const { submitCompletion } = useGameCompletion("minesweeper");

  const handleGameComplete = useCallback(
    async (result: { won: boolean; time: number; difficulty: string }) => {
      if (result.won) {
        const response = await submitCompletion({
          winner: "player",
          moves: result.time, // Use time as "score" for minesweeper
        });
        if (response?.newAchievements && response.newAchievements.length > 0) {
          setUnlockedAchievements(response.newAchievements);
        }
      }
    },
    [submitCompletion]
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/challenges"
              className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Challenges
            </Link>
            <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
            <div className="flex items-center gap-2">
              <Bomb className="h-5 w-5 text-red-500" />
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">Minesweeper</h1>
            </div>
          </div>
        </div>

        {/* Game */}
        <div className="flex flex-col items-center">
          <Minesweeper onGameComplete={handleGameComplete} />
        </div>

        {/* How to Play */}
        <Accordion type="single" collapsible className="w-full mt-8">
          <AccordionItem value="howto" className="border border-zinc-200 dark:border-zinc-800 rounded-xl px-4">
            <AccordionTrigger className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:no-underline">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                How to Play
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pb-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                <p>
                  <strong className="text-zinc-900 dark:text-white">Goal:</strong> Reveal all cells without hitting a mine.
                </p>
                <p>
                  <strong className="text-zinc-900 dark:text-white">Left-click:</strong> Reveal a cell. Numbers indicate how many adjacent mines there are.
                </p>
                <p>
                  <strong className="text-zinc-900 dark:text-white">Right-click:</strong> Place or remove a flag to mark suspected mines.
                </p>
                <p>
                  <strong className="text-zinc-900 dark:text-white">Tip:</strong> The first click is always safe! Use logic to deduce mine locations.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Achievement notification */}
      {unlockedAchievements.length > 0 && (
        <AchievementToast
          achievements={unlockedAchievements}
          onClose={() => setUnlockedAchievements([])}
        />
      )}
    </div>
  );
}
