/**
 * Rarity System - Visual identity and styling for achievement tiers
 *
 * Drop rates:
 * - Common: 60% - Basic accomplishments
 * - Rare: 25% - Notable achievements
 * - Epic: 10% - Impressive feats
 * - Legendary: 5% - Exceptional mastery
 */

export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface RarityConfig {
  name: string;
  label: string;
  dropRate: string;
  // Colors
  textColor: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  gradientFrom: string;
  gradientTo: string;
  // Badge styling
  badgeBg: string;
  badgeText: string;
  // Icon background
  iconBg: string;
  // Animation intensity (1-4)
  animationLevel: number;
}

export const RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  common: {
    name: "common",
    label: "Common",
    dropRate: "60%",
    textColor: "text-zinc-600 dark:text-zinc-400",
    bgColor: "bg-zinc-50 dark:bg-zinc-900",
    borderColor: "border-zinc-200 dark:border-zinc-700",
    glowColor: "shadow-zinc-200/50 dark:shadow-zinc-800/50",
    gradientFrom: "from-zinc-100",
    gradientTo: "to-zinc-200",
    badgeBg: "bg-zinc-100 dark:bg-zinc-800",
    badgeText: "text-zinc-600 dark:text-zinc-400",
    iconBg: "bg-zinc-100 dark:bg-zinc-800",
    animationLevel: 1,
  },
  rare: {
    name: "rare",
    label: "Rare",
    dropRate: "25%",
    textColor: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
    borderColor: "border-blue-300 dark:border-blue-500/50",
    glowColor: "shadow-blue-400/30 dark:shadow-blue-500/30",
    gradientFrom: "from-blue-100",
    gradientTo: "to-blue-200",
    badgeBg: "bg-blue-100 dark:bg-blue-500/20",
    badgeText: "text-blue-700 dark:text-blue-300",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    animationLevel: 2,
  },
  epic: {
    name: "epic",
    label: "Epic",
    dropRate: "10%",
    textColor: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/50",
    borderColor: "border-purple-300 dark:border-purple-500/50",
    glowColor: "shadow-purple-400/40 dark:shadow-purple-500/40",
    gradientFrom: "from-purple-100",
    gradientTo: "to-fuchsia-200",
    badgeBg: "bg-purple-100 dark:bg-purple-500/20",
    badgeText: "text-purple-700 dark:text-purple-300",
    iconBg: "bg-gradient-to-br from-purple-100 to-fuchsia-100 dark:from-purple-900/50 dark:to-fuchsia-900/50",
    animationLevel: 3,
  },
  legendary: {
    name: "legendary",
    label: "Legendary",
    dropRate: "5%",
    textColor: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/50 dark:via-yellow-950/50 dark:to-orange-950/50",
    borderColor: "border-amber-400 dark:border-amber-500/70",
    glowColor: "shadow-amber-400/50 dark:shadow-amber-500/50",
    gradientFrom: "from-amber-200",
    gradientTo: "to-orange-300",
    badgeBg: "bg-gradient-to-r from-amber-200 via-yellow-200 to-orange-200 dark:from-amber-500/30 dark:via-yellow-500/30 dark:to-orange-500/30",
    badgeText: "text-amber-800 dark:text-amber-200",
    iconBg: "bg-gradient-to-br from-amber-200 via-yellow-100 to-orange-200 dark:from-amber-800/50 dark:via-yellow-800/50 dark:to-orange-800/50",
    animationLevel: 4,
  },
};

/**
 * Get rarity config with fallback to common
 */
export function getRarityConfig(rarity: string): RarityConfig {
  return RARITY_CONFIG[rarity as Rarity] || RARITY_CONFIG.common;
}

/**
 * Get rarity order for sorting (legendary = highest)
 */
export function getRarityOrder(rarity: string): number {
  const order: Record<string, number> = {
    legendary: 4,
    epic: 3,
    rare: 2,
    common: 1,
  };
  return order[rarity] || 0;
}

/**
 * CSS classes for rarity glow effect
 */
export function getRarityGlow(rarity: string): string {
  const config = getRarityConfig(rarity);
  return `shadow-lg ${config.glowColor}`;
}

/**
 * CSS classes for animated rarity border
 */
export function getRarityBorder(rarity: string, animated = false): string {
  const config = getRarityConfig(rarity);
  const base = `border-2 ${config.borderColor}`;

  if (!animated) return base;

  // Add animation class based on rarity
  switch (rarity) {
    case "legendary":
      return `${base} animate-pulse-border-gold`;
    case "epic":
      return `${base} animate-pulse-border-purple`;
    case "rare":
      return `${base} animate-shimmer`;
    default:
      return base;
  }
}

/**
 * Confetti configuration based on rarity
 */
export function getConfettiConfig(rarity: string) {
  const baseConfig = {
    particleCount: 30,
    spread: 60,
    startVelocity: 20,
    decay: 0.95,
    gravity: 1,
  };

  switch (rarity) {
    case "legendary":
      return {
        ...baseConfig,
        particleCount: 150,
        spread: 180,
        startVelocity: 45,
        colors: ["#f59e0b", "#fbbf24", "#fcd34d", "#fef3c7", "#ff6b35"],
        scalar: 1.2,
      };
    case "epic":
      return {
        ...baseConfig,
        particleCount: 100,
        spread: 120,
        startVelocity: 35,
        colors: ["#a855f7", "#c084fc", "#d8b4fe", "#e879f9", "#f0abfc"],
        scalar: 1.1,
      };
    case "rare":
      return {
        ...baseConfig,
        particleCount: 60,
        spread: 90,
        startVelocity: 25,
        colors: ["#3b82f6", "#60a5fa", "#93c5fd", "#38bdf8"],
        scalar: 1,
      };
    default:
      return {
        ...baseConfig,
        colors: ["#71717a", "#a1a1aa", "#d4d4d8"],
        scalar: 0.9,
      };
  }
}
