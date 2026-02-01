"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Trophy, X } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: string;
}

interface AchievementToastProps {
  achievements: Achievement[];
  onClose: () => void;
}

const rarityColors: Record<string, string> = {
  common: "border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900",
  rare: "border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950",
  epic: "border-purple-400 bg-purple-50 dark:border-purple-600 dark:bg-purple-950",
  legendary: "border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-950",
};

const rarityBadgeColors: Record<string, string> = {
  common: "bg-zinc-200 text-zinc-800",
  rare: "bg-blue-200 text-blue-800",
  epic: "bg-purple-200 text-purple-800",
  legendary: "bg-amber-200 text-amber-800",
};

export function AchievementToast({ achievements, onClose }: AchievementToastProps) {
  const [visible, setVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Auto-advance through achievements
    if (achievements.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((i) => {
          if (i >= achievements.length - 1) {
            clearInterval(timer);
            return i;
          }
          return i + 1;
        });
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [achievements.length]);

  useEffect(() => {
    // Auto-close after showing all achievements
    const timeout = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 3000 * achievements.length + 2000);
    return () => clearTimeout(timeout);
  }, [achievements.length, onClose]);

  if (achievements.length === 0 || !visible) return null;

  const achievement = achievements[currentIndex];

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transform transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div
        className={`relative rounded-lg border-2 p-4 shadow-lg max-w-sm ${
          rarityColors[achievement.rarity]
        }`}
      >
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 300);
          }}
          className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-600"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-2xl">
              {achievement.icon}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Achievement Unlocked!
              </span>
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {achievement.name}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
              {achievement.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={rarityBadgeColors[achievement.rarity]}>
                {achievement.rarity}
              </Badge>
              <span className="text-sm font-medium text-amber-600">
                +{achievement.points} pts
              </span>
            </div>
          </div>
        </div>

        {achievements.length > 1 && (
          <div className="flex justify-center gap-1 mt-3">
            {achievements.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex
                    ? "bg-amber-500"
                    : "bg-zinc-300 dark:bg-zinc-600"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
