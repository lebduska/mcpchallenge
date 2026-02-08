"use client";

/**
 * RarityBadge - Visual indicator for achievement rarity
 *
 * Displays rarity with tier-appropriate styling:
 * - Common: Subtle gray
 * - Rare: Blue with shimmer
 * - Epic: Purple with glow
 * - Legendary: Gold with animated gradient
 */

import { cn } from "@/lib/utils";
import { getRarityConfig, type Rarity } from "@/lib/rarity";
import { Sparkles } from "lucide-react";

interface RarityBadgeProps {
  rarity: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function RarityBadge({
  rarity,
  size = "md",
  showIcon = false,
  className,
}: RarityBadgeProps) {
  const config = getRarityConfig(rarity);

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5 gap-0.5",
    md: "text-xs px-2 py-1 gap-1",
    lg: "text-sm px-3 py-1.5 gap-1.5",
  };

  const iconSizes = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  const isLegendary = rarity === "legendary";
  const isEpic = rarity === "epic";

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-full uppercase tracking-wider",
        sizeClasses[size],
        config.badgeBg,
        config.badgeText,
        // Legendary gets animated gradient
        isLegendary && "animate-shimmer-gold bg-[length:200%_100%]",
        // Epic gets subtle pulse
        isEpic && "animate-pulse-subtle",
        className
      )}
    >
      {showIcon && (isLegendary || isEpic) && (
        <Sparkles className={cn(iconSizes[size], isLegendary && "text-amber-500")} />
      )}
      {config.label}
    </span>
  );
}
