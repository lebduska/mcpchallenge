/**
 * Achievement Evaluator
 *
 * Centralized achievement rules and evaluation logic.
 * Rules can check game results, user stats, and challenge-specific data.
 */

// =============================================================================
// Types
// =============================================================================

export interface GameResult {
  won?: boolean;
  winner?: "player" | "ai" | "engine" | "computer" | "draw";
  score?: number;
  moves?: number;
  pushes?: number;
  timeMs?: number;
}

export interface UserStatsData {
  totalPoints: number;
  level: number;
  challengesCompleted: number;
  chessWins: number;
  snakeHighScore: number;
  ticTacToeWins: number;
  canvasDrawCompleted: boolean;
  sokobanLevelsCompleted: number;
}

export interface AchievementContext {
  challengeId: string;
  levelId?: string;
  result: GameResult;
  userStats: UserStatsData;
}

export interface AchievementRule {
  id: string;
  check: (ctx: AchievementContext) => boolean;
}

export interface AchievementInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  rarity: string;
}

// =============================================================================
// Achievement Rules
// =============================================================================

/**
 * All achievement rules.
 * Each rule has an ID (matching the `achievements` table) and a check function.
 */
export const achievementRules: AchievementRule[] = [
  // ---------------------------------------------------------------------------
  // General / Milestone
  // ---------------------------------------------------------------------------
  {
    id: "first-challenge",
    check: (ctx) => ctx.userStats.challengesCompleted === 1,
  },
  {
    id: "level-5",
    check: (ctx) => ctx.userStats.level >= 5,
  },
  {
    id: "level-10",
    check: (ctx) => ctx.userStats.level >= 10,
  },

  // ---------------------------------------------------------------------------
  // Chess
  // ---------------------------------------------------------------------------
  {
    id: "chess-win",
    check: (ctx) => ctx.challengeId === "chess" && ctx.result.winner === "player",
  },
  {
    id: "chess-master",
    check: (ctx) => ctx.userStats.chessWins >= 10,
  },

  // ---------------------------------------------------------------------------
  // Snake
  // ---------------------------------------------------------------------------
  {
    id: "snake-10",
    check: (ctx) => ctx.challengeId === "snake" && (ctx.result.score || 0) >= 10,
  },
  {
    id: "snake-25",
    check: (ctx) => ctx.challengeId === "snake" && (ctx.result.score || 0) >= 25,
  },
  {
    id: "snake-50",
    check: (ctx) => ctx.challengeId === "snake" && (ctx.result.score || 0) >= 50,
  },

  // ---------------------------------------------------------------------------
  // Tic-Tac-Toe
  // ---------------------------------------------------------------------------
  {
    id: "ttt-win",
    check: (ctx) => ctx.challengeId === "tic-tac-toe" && ctx.result.winner === "player",
  },
  {
    id: "ttt-master",
    check: (ctx) => ctx.userStats.ticTacToeWins >= 5,
  },

  // ---------------------------------------------------------------------------
  // Canvas Draw
  // ---------------------------------------------------------------------------
  {
    id: "canvas-artist",
    check: (ctx) => ctx.challengeId === "canvas-draw",
  },

  // ---------------------------------------------------------------------------
  // Sokoban
  // ---------------------------------------------------------------------------
  {
    id: "sokoban-first",
    check: (ctx) => ctx.challengeId === "sokoban" && ctx.result.won === true,
  },
  {
    id: "sokoban-10",
    check: (ctx) => ctx.userStats.sokobanLevelsCompleted >= 10,
  },
  {
    id: "sokoban-30",
    check: (ctx) => ctx.userStats.sokobanLevelsCompleted >= 30,
  },
  {
    id: "sokoban-all",
    check: (ctx) => ctx.userStats.sokobanLevelsCompleted >= 60,
  },
  {
    id: "sokoban-perfect",
    check: (ctx) =>
      ctx.challengeId === "sokoban" &&
      ctx.result.won === true &&
      ctx.result.moves !== undefined &&
      ctx.result.pushes !== undefined &&
      ctx.result.moves === ctx.result.pushes, // All moves were pushes
  },
  {
    id: "sokoban-speedrun",
    check: (ctx) =>
      ctx.challengeId === "sokoban" &&
      ctx.result.won === true &&
      (ctx.result.timeMs || Infinity) < 30000, // Under 30 seconds
  },
];

// =============================================================================
// Evaluation Functions
// =============================================================================

/**
 * Evaluate which achievements the user has earned.
 *
 * @param ctx - The achievement context (challenge, result, stats)
 * @param existingAchievementIds - Set of already-earned achievement IDs
 * @returns Array of newly earned achievement IDs
 */
export function evaluateAchievements(
  ctx: AchievementContext,
  existingAchievementIds: Set<string>
): string[] {
  const newAchievements: string[] = [];

  for (const rule of achievementRules) {
    // Skip if already earned
    if (existingAchievementIds.has(rule.id)) {
      continue;
    }

    // Check if the rule passes
    try {
      if (rule.check(ctx)) {
        newAchievements.push(rule.id);
      }
    } catch {
      // Rule threw an error, skip it
      console.error(`Achievement rule ${rule.id} threw an error`);
    }
  }

  return newAchievements;
}

/**
 * Get default user stats (for new users or when stats are not available)
 */
export function getDefaultUserStats(): UserStatsData {
  return {
    totalPoints: 0,
    level: 1,
    challengesCompleted: 0,
    chessWins: 0,
    snakeHighScore: 0,
    ticTacToeWins: 0,
    canvasDrawCompleted: false,
    sokobanLevelsCompleted: 0,
  };
}

/**
 * Calculate user level from total points (Fibonacci-like progression)
 */
export function calculateLevel(points: number): number {
  const thresholds = [0, 100, 250, 500, 850, 1300, 1900, 2600, 3500, 4600, 5900];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (points >= thresholds[i]) return i + 1;
  }
  return 1;
}
