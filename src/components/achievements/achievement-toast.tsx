"use client";

/**
 * AchievementToast - Animated unlock notification with tier-specific effects
 *
 * Visual treatment by rarity:
 * - Common: Simple slide-in, subtle confetti
 * - Rare: Shimmer effect, blue glow
 * - Epic: Purple aurora, particle burst
 * - Legendary: Full golden reveal, screen flash, epic entrance
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trophy, X, Share2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRarityConfig, getConfettiConfig } from "@/lib/rarity";
import { RarityBadge } from "./rarity-badge";

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
  replayId?: string;
  onShare?: () => void;
}

export function AchievementToast({
  achievements,
  onClose,
  replayId,
  onShare,
}: AchievementToastProps) {
  const [visible, setVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showContent, setShowContent] = useState(false);

  const achievement = achievements[currentIndex];
  const config = getRarityConfig(achievement?.rarity || "common");
  const isLegendary = achievement?.rarity === "legendary";
  const isEpic = achievement?.rarity === "epic";
  const isRare = achievement?.rarity === "rare";

  // Trigger confetti
  const triggerConfetti = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      const confetti = (await import("canvas-confetti")).default;
      const confettiConfig = getConfettiConfig(achievement?.rarity || "common");

      // Center burst
      confetti({
        ...confettiConfig,
        origin: { x: 0.9, y: 0.9 },
      });

      // Extra bursts for higher tiers
      if (isEpic || isLegendary) {
        setTimeout(() => {
          confetti({
            ...confettiConfig,
            particleCount: confettiConfig.particleCount * 0.5,
            origin: { x: 0.85, y: 0.85 },
          });
        }, 200);
      }

      if (isLegendary) {
        setTimeout(() => {
          confetti({
            ...confettiConfig,
            particleCount: confettiConfig.particleCount * 0.3,
            origin: { x: 0.95, y: 0.95 },
          });
        }, 400);
      }
    } catch {
      // Confetti not available, continue without it
    }
  }, [achievement?.rarity, isEpic, isLegendary]);

  // Show content after initial animation
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), isLegendary ? 400 : 100);
    return () => clearTimeout(timer);
  }, [currentIndex, isLegendary]);

  // Trigger confetti on mount and index change
  useEffect(() => {
    if (visible && achievement) {
      triggerConfetti();
    }
  }, [currentIndex, visible, achievement, triggerConfetti]);

  // Auto-advance through achievements
  useEffect(() => {
    if (achievements.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((i) => {
          if (i >= achievements.length - 1) {
            clearInterval(timer);
            return i;
          }
          setShowContent(false);
          return i + 1;
        });
      }, isLegendary ? 5000 : 4000);
      return () => clearInterval(timer);
    }
  }, [achievements.length, isLegendary]);

  // Auto-close after showing all
  useEffect(() => {
    const baseTime = isLegendary ? 5000 : 4000;
    const timeout = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, baseTime * achievements.length + 1000);
    return () => clearTimeout(timeout);
  }, [achievements.length, onClose, isLegendary]);

  if (achievements.length === 0 || !visible || !achievement) return null;

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Screen flash for legendary */}
          {isLegendary && (
            <motion.div
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="fixed inset-0 z-40 bg-amber-300/30 pointer-events-none"
            />
          )}

          {/* Toast container */}
          <motion.div
            initial={
              isLegendary
                ? { scale: 0.5, opacity: 0, y: 100, rotate: -10 }
                : isEpic
                  ? { scale: 0.8, opacity: 0, y: 50 }
                  : { opacity: 0, y: 20, x: 20 }
            }
            animate={
              isLegendary
                ? { scale: 1, opacity: 1, y: 0, rotate: 0 }
                : { scale: 1, opacity: 1, y: 0, x: 0 }
            }
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={
              isLegendary
                ? { type: "spring", damping: 15, stiffness: 200 }
                : { type: "spring", damping: 20, stiffness: 300 }
            }
            className="fixed bottom-4 right-4 z-50 max-w-sm"
          >
            {/* Glow effect */}
            {(isLegendary || isEpic) && (
              <div
                className={cn(
                  "absolute -inset-2 rounded-2xl blur-xl",
                  isLegendary && "bg-amber-400/40 animate-pulse-slow",
                  isEpic && "bg-purple-500/30 animate-pulse-slow"
                )}
              />
            )}

            {/* Main card */}
            <div
              className={cn(
                "relative rounded-xl border-2 p-4 shadow-2xl overflow-hidden",
                config.bgColor,
                config.borderColor,
                isLegendary && "animate-glow-gold",
                isEpic && "animate-glow-purple"
              )}
            >
              {/* Animated border for legendary */}
              {isLegendary && (
                <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/40 to-amber-400/0 animate-shimmer-border" />
                </div>
              )}

              {/* Shimmer overlay for rare */}
              {isRare && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/10 to-blue-400/0 animate-shimmer pointer-events-none" />
              )}

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 z-10"
              >
                <X className="h-4 w-4" />
              </button>

              <AnimatePresence mode="wait">
                {showContent && (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-start gap-4"
                  >
                    {/* Icon */}
                    <motion.div
                      initial={isLegendary ? { scale: 0, rotate: -180 } : { scale: 0.5 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={
                        isLegendary
                          ? { type: "spring", damping: 10, delay: 0.2 }
                          : { type: "spring", damping: 15 }
                      }
                      className={cn(
                        "flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-3xl",
                        config.iconBg,
                        isLegendary && "animate-bounce-subtle"
                      )}
                    >
                      {achievement.icon}
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-1">
                        {isLegendary ? (
                          <Sparkles className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Trophy className="h-4 w-4 text-amber-500" />
                        )}
                        <span
                          className={cn(
                            "text-xs font-semibold uppercase tracking-wide",
                            config.textColor
                          )}
                        >
                          {isLegendary
                            ? "Legendary Achievement!"
                            : isEpic
                              ? "Epic Achievement!"
                              : "Achievement Unlocked!"}
                        </span>
                      </div>

                      {/* Name */}
                      <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 truncate">
                        {achievement.name}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
                        {achievement.description}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center gap-3">
                        <RarityBadge
                          rarity={achievement.rarity}
                          size="sm"
                          showIcon={isLegendary || isEpic}
                        />
                        <span
                          className={cn("text-sm font-bold", config.textColor)}
                        >
                          +{achievement.points} pts
                        </span>
                      </div>

                      {/* Share button */}
                      {(replayId || onShare) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "mt-3 w-full gap-2 text-xs",
                            isLegendary &&
                              "border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onShare) {
                              onShare();
                            } else if (replayId) {
                              window.open(`/s/${replayId}`, "_blank");
                            }
                          }}
                        >
                          <Share2 className="h-3 w-3" />
                          Share Achievement
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress dots */}
              {achievements.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-4">
                  {achievements.map((a, i) => (
                    <div
                      key={a.id}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        i === currentIndex
                          ? cn("w-4", config.badgeBg)
                          : "bg-zinc-300 dark:bg-zinc-600"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
