"use client";

/**
 * AchievementCard - Display card for achievements with rarity styling
 *
 * Features:
 * - Tier-specific visual treatment (glow, borders, backgrounds)
 * - Animated effects for rare+ achievements
 * - Locked/unlocked states
 * - Progress indicators
 */

import { motion } from "framer-motion";
import { Lock, Trophy, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRarityConfig, getRarityGlow } from "@/lib/rarity";
import { RarityBadge } from "./rarity-badge";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: string;
  category?: string;
}

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked?: boolean;
  unlockedAt?: Date | string;
  progress?: number; // 0-100 for partial progress
  totalUnlocks?: number; // Social proof: how many have this
  percentile?: number; // "Top X%" indicator
  onClick?: () => void;
  className?: string;
}

export function AchievementCard({
  achievement,
  isUnlocked = false,
  unlockedAt,
  progress,
  totalUnlocks,
  percentile,
  onClick,
  className,
}: AchievementCardProps) {
  const config = getRarityConfig(achievement.rarity);
  const isLegendary = achievement.rarity === "legendary";
  const isEpic = achievement.rarity === "epic";
  const isRare = achievement.rarity === "rare";
  const hasGlow = isUnlocked && (isLegendary || isEpic || isRare);

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative group rounded-xl border-2 p-4 transition-all duration-300 cursor-pointer",
        // Base styling
        config.bgColor,
        config.borderColor,
        // Glow for unlocked rare+ achievements
        hasGlow && getRarityGlow(achievement.rarity),
        // Locked state
        !isUnlocked && "opacity-60 grayscale",
        className
      )}
    >
      {/* Legendary animated border */}
      {isLegendary && isUnlocked && (
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/30 to-amber-400/0 animate-shimmer-border" />
        </div>
      )}

      {/* Epic glow pulse */}
      {isEpic && isUnlocked && (
        <div className="absolute -inset-1 rounded-xl bg-purple-500/20 blur-md animate-pulse-slow opacity-0 group-hover:opacity-100 transition-opacity" />
      )}

      <div className="relative flex gap-4">
        {/* Icon */}
        <div
          className={cn(
            "flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-3xl",
            config.iconBg,
            !isUnlocked && "grayscale"
          )}
        >
          {isUnlocked ? (
            <span className={cn(isLegendary && "animate-bounce-subtle")}>
              {achievement.icon}
            </span>
          ) : (
            <Lock className="h-6 w-6 text-zinc-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3
              className={cn(
                "font-semibold truncate",
                isUnlocked
                  ? "text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 dark:text-zinc-500"
              )}
            >
              {achievement.name}
            </h3>
            <RarityBadge rarity={achievement.rarity} size="sm" />
          </div>

          {/* Description */}
          <p
            className={cn(
              "text-sm line-clamp-2 mb-2",
              isUnlocked
                ? "text-zinc-600 dark:text-zinc-400"
                : "text-zinc-400 dark:text-zinc-600"
            )}
          >
            {achievement.description}
          </p>

          {/* Footer */}
          <div className="flex items-center gap-3 text-xs">
            {/* Points */}
            <span
              className={cn(
                "flex items-center gap-1 font-medium",
                config.textColor
              )}
            >
              <Trophy className="h-3 w-3" />
              {achievement.points} pts
            </span>

            {/* Unlocked time */}
            {isUnlocked && unlockedAt && (
              <span className="flex items-center gap-1 text-zinc-500">
                <Clock className="h-3 w-3" />
                {formatDate(unlockedAt)}
              </span>
            )}

            {/* Social proof */}
            {totalUnlocks !== undefined && (
              <span className="flex items-center gap-1 text-zinc-500">
                <Users className="h-3 w-3" />
                {totalUnlocks.toLocaleString()}
              </span>
            )}

            {/* Percentile */}
            {isUnlocked && percentile !== undefined && (
              <span className={cn("font-medium", config.textColor)}>
                Top {percentile}%
              </span>
            )}
          </div>

          {/* Progress bar (for locked with partial progress) */}
          {!isUnlocked && progress !== undefined && progress > 0 && (
            <div className="mt-2">
              <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full",
                    `bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo}`
                  )}
                />
              </div>
              <span className="text-[10px] text-zinc-500 mt-0.5">
                {progress}% complete
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
