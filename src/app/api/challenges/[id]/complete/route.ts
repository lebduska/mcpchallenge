import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import {
  challengeCompletions,
  userStats,
  userAchievements,
  achievements,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import NextAuth from "next-auth";
import { createAuthConfig } from "@/lib/auth";

export const runtime = "edge";

interface AchievementRule {
  id: string;
  check: (data: CompletionData, stats: UserStatsData) => boolean;
}

interface CompletionData {
  challengeId: string;
  score?: number;
  winner?: string;
  moves?: number;
  // Sorting-specific data
  level?: number;
  comparisons?: number;
  swaps?: number;
  parComparisons?: number;
  parSwaps?: number;
}

interface UserStatsData {
  totalPoints: number;
  level: number;
  challengesCompleted: number;
  chessWins: number;
  snakeHighScore: number;
  ticTacToeWins: number;
  canvasDrawCompleted: boolean;
  minesweeperWins: number;
  sokobanLevels: number;
  // Sorting-specific stats
  sortingLevelsCompleted: number;
  sortingBeatPar: boolean;
}

// Achievement rules for game challenges
const achievementRules: AchievementRule[] = [
  // First challenge
  {
    id: "first-challenge",
    check: (_, stats) => stats.challengesCompleted === 1,
  },
  // Chess achievements
  {
    id: "chess-win",
    check: (data) => data.challengeId === "chess" && data.winner === "player",
  },
  {
    id: "chess-master",
    check: (_, stats) => stats.chessWins >= 10,
  },
  // Snake achievements
  {
    id: "snake-10",
    check: (data) =>
      data.challengeId === "snake" && (data.score || 0) >= 10,
  },
  {
    id: "snake-25",
    check: (data) =>
      data.challengeId === "snake" && (data.score || 0) >= 25,
  },
  {
    id: "snake-50",
    check: (data) =>
      data.challengeId === "snake" && (data.score || 0) >= 50,
  },
  // Tic-tac-toe achievements
  {
    id: "ttt-win",
    check: (data) =>
      data.challengeId === "tic-tac-toe" && data.winner === "player",
  },
  {
    id: "ttt-master",
    check: (_, stats) => stats.ticTacToeWins >= 5,
  },
  // Canvas Draw achievement
  {
    id: "canvas-artist",
    check: (data) => data.challengeId === "canvas-draw",
  },
  // Minesweeper achievements
  {
    id: "minesweeper-win",
    check: (data) => data.challengeId === "minesweeper" && data.winner === "player",
  },
  {
    id: "minesweeper-expert",
    check: (data, stats) =>
      data.challengeId === "minesweeper" && data.winner === "player" && stats.minesweeperWins >= 5,
  },
  // Sokoban achievements
  {
    id: "sokoban-10",
    check: (_, stats) => stats.sokobanLevels >= 10,
  },
  {
    id: "sokoban-30",
    check: (_, stats) => stats.sokobanLevels >= 30,
  },
  {
    id: "sokoban-complete",
    check: (_, stats) => stats.sokobanLevels >= 60,
  },
  // Level achievements
  {
    id: "level-5",
    check: (_, stats) => stats.level >= 5,
  },
  {
    id: "level-10",
    check: (_, stats) => stats.level >= 10,
  },
  // Sorting achievements
  {
    id: "sorting-first",
    check: (data) => data.challengeId === "sorting",
  },
  {
    id: "sorting-bubble-master",
    check: (data) =>
      data.challengeId === "sorting" &&
      data.level === 1 &&
      (data.comparisons || 0) <= (data.parComparisons || 4) &&
      (data.swaps || 0) <= (data.parSwaps || 3),
  },
  {
    id: "sorting-quick-thinker",
    check: (data) =>
      data.challengeId === "sorting" &&
      data.level === 6 &&
      (data.comparisons || 0) <= (data.parComparisons || 120) &&
      (data.swaps || 0) <= (data.parSwaps || 100),
  },
  {
    id: "sorting-minimal-swapper",
    check: (data) =>
      data.challengeId === "sorting" &&
      data.parSwaps !== undefined &&
      (data.swaps || Infinity) < data.parSwaps,
  },
  {
    id: "sorting-all-levels",
    check: (_, stats) => stats.sortingLevelsCompleted >= 10,
  },
  {
    id: "sorting-gauntlet",
    check: (data) =>
      data.challengeId === "sorting" &&
      data.level === 10 &&
      (data.comparisons || 0) <= (data.parComparisons || 840) &&
      (data.swaps || 0) <= (data.parSwaps || 700),
  },
];

// Calculate level from points (Fibonacci-like progression)
function calculateLevel(points: number): number {
  const thresholds = [0, 100, 250, 500, 850, 1300, 1900, 2600, 3500, 4600, 5900];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (points >= thresholds[i]) return i + 1;
  }
  return 1;
}

async function getSession() {
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const { auth } = NextAuth(createAuthConfig(db));
  return auth();
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: PageProps) {
  const { id: challengeId } = await params;
  const { env } = getRequestContext();
  const db = createDb(env.DB);

  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = (await request.json()) as {
    score?: number;
    winner?: string;
    moves?: number;
    // Sorting-specific
    level?: number;
    comparisons?: number;
    swaps?: number;
    parComparisons?: number;
    parSwaps?: number;
  };

  // Record the completion
  await db.insert(challengeCompletions).values({
    id: crypto.randomUUID(),
    userId,
    challengeId,
    score: body.score || null,
    completedAt: new Date(),
  });

  // Get or create user stats
  let stats = await db.query.userStats.findFirst({
    where: eq(userStats.userId, userId),
  });

  if (!stats) {
    const newStats = {
      userId,
      totalPoints: 0,
      level: 1,
      challengesCompleted: 0,
      achievementsUnlocked: 0,
      currentStreak: 0,
      longestStreak: 0,
    };
    await db.insert(userStats).values(newStats);
    stats = {
      ...newStats,
      lastActiveAt: null,
      updatedAt: new Date(),
    };
  }

  // Calculate extended stats for achievement checking
  const chessWins = await db
    .select({ count: sql<number>`count(*)` })
    .from(challengeCompletions)
    .where(
      and(
        eq(challengeCompletions.userId, userId),
        eq(challengeCompletions.challengeId, "chess")
      )
    );

  const snakeScores = await db
    .select({ maxScore: sql<number>`max(score)` })
    .from(challengeCompletions)
    .where(
      and(
        eq(challengeCompletions.userId, userId),
        eq(challengeCompletions.challengeId, "snake")
      )
    );

  const tttWins = await db
    .select({ count: sql<number>`count(*)` })
    .from(challengeCompletions)
    .where(
      and(
        eq(challengeCompletions.userId, userId),
        eq(challengeCompletions.challengeId, "tic-tac-toe")
      )
    );

  // Check if canvas-draw was completed
  const canvasDrawCompletion = await db
    .select({ count: sql<number>`count(*)` })
    .from(challengeCompletions)
    .where(
      and(
        eq(challengeCompletions.userId, userId),
        eq(challengeCompletions.challengeId, "canvas-draw")
      )
    );

  // Minesweeper wins
  const minesweeperWins = await db
    .select({ count: sql<number>`count(*)` })
    .from(challengeCompletions)
    .where(
      and(
        eq(challengeCompletions.userId, userId),
        eq(challengeCompletions.challengeId, "minesweeper")
      )
    );

  // Sokoban levels completed (count unique levels via score field as level index)
  const sokobanLevels = await db
    .select({ count: sql<number>`count(distinct score)` })
    .from(challengeCompletions)
    .where(
      and(
        eq(challengeCompletions.userId, userId),
        eq(challengeCompletions.challengeId, "sokoban")
      )
    );

  // Sorting levels completed (count unique levels via score field as level index)
  const sortingLevels = await db
    .select({ count: sql<number>`count(distinct score)` })
    .from(challengeCompletions)
    .where(
      and(
        eq(challengeCompletions.userId, userId),
        eq(challengeCompletions.challengeId, "sorting")
      )
    );

  const extendedStats: UserStatsData = {
    totalPoints: stats.totalPoints,
    level: stats.level,
    challengesCompleted: stats.challengesCompleted + 1,
    chessWins: Number(chessWins[0]?.count || 0),
    snakeHighScore: Number(snakeScores[0]?.maxScore || 0),
    ticTacToeWins: Number(tttWins[0]?.count || 0),
    canvasDrawCompleted: Number(canvasDrawCompletion[0]?.count || 0) > 0,
    minesweeperWins: Number(minesweeperWins[0]?.count || 0),
    sokobanLevels: Number(sokobanLevels[0]?.count || 0),
    sortingLevelsCompleted: Number(sortingLevels[0]?.count || 0),
    sortingBeatPar: body.comparisons !== undefined && body.parComparisons !== undefined &&
                    body.swaps !== undefined && body.parSwaps !== undefined &&
                    body.comparisons <= body.parComparisons && body.swaps <= body.parSwaps,
  };

  const completionData: CompletionData = {
    challengeId,
    score: body.score,
    winner: body.winner,
    moves: body.moves,
    // Sorting-specific
    level: body.level,
    comparisons: body.comparisons,
    swaps: body.swaps,
    parComparisons: body.parComparisons,
    parSwaps: body.parSwaps,
  };

  // Get user's existing achievements
  const existingAchievements = await db
    .select({ achievementId: userAchievements.achievementId })
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));

  const existingIds = new Set(existingAchievements.map((a) => a.achievementId));

  // Check for new achievements
  const newAchievements: string[] = [];
  let pointsEarned = 0;

  for (const rule of achievementRules) {
    if (!existingIds.has(rule.id) && rule.check(completionData, extendedStats)) {
      // Get achievement details
      const achievement = await db.query.achievements.findFirst({
        where: eq(achievements.id, rule.id),
      });

      if (achievement) {
        // Grant the achievement
        await db.insert(userAchievements).values({
          userId,
          achievementId: rule.id,
          unlockedAt: new Date(),
        });

        newAchievements.push(rule.id);
        pointsEarned += achievement.points;
      }
    }
  }

  // Update user stats
  const newTotalPoints = stats.totalPoints + pointsEarned;
  const newLevel = calculateLevel(newTotalPoints);

  await db
    .update(userStats)
    .set({
      totalPoints: newTotalPoints,
      level: newLevel,
      challengesCompleted: stats.challengesCompleted + 1,
    })
    .where(eq(userStats.userId, userId));

  // Check for level-up achievements after updating stats
  if (newLevel >= 5 && !existingIds.has("level-5")) {
    const levelAchievement = await db.query.achievements.findFirst({
      where: eq(achievements.id, "level-5"),
    });
    if (levelAchievement) {
      await db.insert(userAchievements).values({
        userId,
        achievementId: "level-5",
        unlockedAt: new Date(),
      });
      newAchievements.push("level-5");
    }
  }

  if (newLevel >= 10 && !existingIds.has("level-10")) {
    const levelAchievement = await db.query.achievements.findFirst({
      where: eq(achievements.id, "level-10"),
    });
    if (levelAchievement) {
      await db.insert(userAchievements).values({
        userId,
        achievementId: "level-10",
        unlockedAt: new Date(),
      });
      newAchievements.push("level-10");
    }
  }

  // Get full achievement details for response
  const unlockedAchievements = await Promise.all(
    newAchievements.map(async (id) => {
      const achievement = await db.query.achievements.findFirst({
        where: eq(achievements.id, id),
      });
      return achievement;
    })
  );

  return NextResponse.json({
    success: true,
    pointsEarned,
    newAchievements: unlockedAchievements.filter(Boolean),
    stats: {
      totalPoints: newTotalPoints,
      level: newLevel,
      challengesCompleted: stats.challengesCompleted + 1,
    },
  });
}
