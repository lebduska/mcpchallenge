/**
 * Challenge Cover Images Configuration
 *
 * Style: 3D Clay Minimal
 * - Soft matte plasticine texture
 * - Diffused ambient lighting
 * - Neutral backgrounds
 * - Muted pastel colors
 */

export interface ChallengeCover {
  /** Primary image (AI-generated or curated) */
  image: string;
  /** Unsplash fallback URL */
  unsplashFallback: string;
  /** Unsplash photographer credit */
  unsplashCredit?: string;
  /** Gradient overlay classes for text readability */
  overlayGradient: string;
  /** Dominant color for accents */
  dominantColor: string;
  /** Alt text for accessibility */
  alt: string;
}

export const challengeCovers: Record<string, ChallengeCover> = {
  chess: {
    image: "/images/challenges/chess-cover.jpg",
    unsplashFallback: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=1200&h=800&fit=crop&q=80",
    unsplashCredit: "Felix Mittermeier",
    overlayGradient: "from-amber-950/90 via-orange-950/70 to-transparent",
    dominantColor: "amber",
    alt: "Chess pieces in 3D clay style",
  },
  "tic-tac-toe": {
    image: "/images/challenges/tictactoe-cover.jpg",
    unsplashFallback: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=1200&h=800&fit=crop&q=80",
    unsplashCredit: "Milad Fakurian",
    overlayGradient: "from-purple-950/90 via-violet-950/70 to-transparent",
    dominantColor: "purple",
    alt: "X and O symbols in 3D clay style",
  },
  minesweeper: {
    image: "/images/challenges/minesweeper-cover.jpg",
    unsplashFallback: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1200&h=800&fit=crop&q=80",
    unsplashCredit: "Scott Webb",
    overlayGradient: "from-zinc-950/90 via-slate-950/70 to-transparent",
    dominantColor: "zinc",
    alt: "Bomb and flag icons in 3D clay style",
  },
  sokoban: {
    image: "/images/challenges/sokoban-cover.jpg",
    unsplashFallback: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=800&fit=crop&q=80",
    unsplashCredit: "Ruchindra Gunasekara",
    overlayGradient: "from-amber-950/90 via-yellow-950/70 to-transparent",
    dominantColor: "amber",
    alt: "Wooden crates in 3D clay style",
  },
  "canvas-draw": {
    image: "/images/challenges/canvas-cover.jpg",
    unsplashFallback: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1200&h=800&fit=crop&q=80",
    unsplashCredit: "Lucas Kapla",
    overlayGradient: "from-pink-950/90 via-rose-950/70 to-transparent",
    dominantColor: "pink",
    alt: "Paintbrush and palette in 3D clay style",
  },
  gorillas: {
    image: "/images/challenges/gorillas-cover.jpg",
    unsplashFallback: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1200&h=800&fit=crop&q=80",
    unsplashCredit: "AI Generated",
    overlayGradient: "from-yellow-950/90 via-amber-950/70 to-transparent",
    dominantColor: "yellow",
    alt: "Two gorillas on city buildings throwing bananas in 3D clay style",
  },
  fractals: {
    image: "/images/challenges/fractals-cover.jpg",
    unsplashFallback: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=800&fit=crop&q=80",
    unsplashCredit: "AI Generated",
    overlayGradient: "from-purple-950/90 via-fuchsia-950/70 to-transparent",
    dominantColor: "purple",
    alt: "Fractal tree patterns in 3D clay style",
  },
  lightsout: {
    image: "/images/challenges/lightsout-cover.jpg",
    unsplashFallback: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=800&fit=crop&q=80",
    unsplashCredit: "AI Generated",
    overlayGradient: "from-yellow-950/90 via-amber-950/70 to-transparent",
    dominantColor: "yellow",
    alt: "Retro electronic puzzle game with glowing LED buttons",
  },
  pathfinding: {
    image: "/images/challenges/pathfinding-cover.jpg",
    unsplashFallback: "https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?w=1200&h=800&fit=crop&q=80",
    unsplashCredit: "AI Generated",
    overlayGradient: "from-teal-950/90 via-cyan-950/70 to-transparent",
    dominantColor: "teal",
    alt: "Grid maze with pathfinding visualization in 3D clay style",
  },
};

/**
 * Get cover config for a challenge
 */
export function getChallengeCover(challengeId: string): ChallengeCover | null {
  return challengeCovers[challengeId] || null;
}

/**
 * Get image URL with fallback logic
 * Returns Unsplash URL if local image doesn't exist
 */
export function getCoverImageUrl(challengeId: string, useLocal = true): string {
  const cover = challengeCovers[challengeId];
  if (!cover) return "";

  // In production, prefer local images
  // Fallback to Unsplash if local not available
  return useLocal ? cover.image : cover.unsplashFallback;
}
