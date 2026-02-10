import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import {
  challengeCompletions,
  userStats,
  userAchievements,
  achievements,
  referrals,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import NextAuth from "next-auth";
import { createAuthConfig } from "@/lib/auth";
import {
  checkRateLimit,
  RateLimitPresets,
  rateLimitExceededResponse,
  rateLimitHeaders,
} from "@/lib/rate-limit";

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
  // Gorillas-specific data
  throws?: number;
  hitSun?: boolean;
  // Lights Out-specific data
  difficulty?: string;
  toggles?: number;
  minSolution?: number;
  timeSeconds?: number;
  // Pathfinding-specific data
  algorithm?: string;
  pathCost?: number;
  parCost?: number;
  nodesExpanded?: number;
  parNodes?: number;
  // Fractals-specific data
  iterations?: number;
  preset?: string;
  customRules?: boolean;
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
  // Gorillas-specific stats
  gorillasWins: number;
  // Lights Out-specific stats
  lightsoutWins: number;
  lightsoutHardWins: number;
  // Pathfinding-specific stats
  pathfindingLevels: number;
  pathfindingAlgorithmsUsed: string[];
  // Fractals-specific stats
  fractalsCreated: number;
  fractalsGallerySaved: number;
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
  // Gorillas achievements
  {
    id: "gorillas-first-win",
    check: (data) => data.challengeId === "gorillas" && data.winner === "player",
  },
  {
    id: "gorillas-no-miss",
    check: (data) =>
      data.challengeId === "gorillas" &&
      data.winner === "player" &&
      data.throws !== undefined &&
      data.score !== undefined &&
      data.throws === data.score,
  },
  {
    id: "gorillas-sun-hit",
    check: (data) => data.challengeId === "gorillas" && data.hitSun === true,
  },
  {
    id: "gorillas-speedrun",
    check: (data) =>
      data.challengeId === "gorillas" &&
      data.winner === "player" &&
      (data.throws || Infinity) <= 3,
  },
  {
    id: "gorillas-master",
    check: (_, stats) => stats.gorillasWins >= 10,
  },
  // Fractals achievements
  {
    id: "fractals-first",
    check: (data) => data.challengeId === "fractals",
  },
  {
    id: "fractals-custom",
    check: (data) => data.challengeId === "fractals" && data.customRules === true,
  },
  {
    id: "fractals-deep",
    check: (data) =>
      data.challengeId === "fractals" && (data.iterations || 0) >= 6,
  },
  {
    id: "fractals-gallery",
    check: (_, stats) => stats.fractalsGallerySaved >= 5,
  },
  // Lights Out achievements
  {
    id: "lightsout-first",
    check: (data) => data.challengeId === "lightsout" && data.winner === "player",
  },
  {
    id: "lightsout-easy",
    check: (data) =>
      data.challengeId === "lightsout" &&
      data.winner === "player" &&
      data.difficulty === "easy",
  },
  {
    id: "lightsout-medium",
    check: (data) =>
      data.challengeId === "lightsout" &&
      data.winner === "player" &&
      data.difficulty === "medium",
  },
  {
    id: "lightsout-hard",
    check: (data) =>
      data.challengeId === "lightsout" &&
      data.winner === "player" &&
      data.difficulty === "hard",
  },
  {
    id: "lightsout-optimal",
    check: (data) =>
      data.challengeId === "lightsout" &&
      data.winner === "player" &&
      data.toggles !== undefined &&
      data.minSolution !== undefined &&
      data.toggles <= data.minSolution,
  },
  {
    id: "lightsout-speed",
    check: (data) =>
      data.challengeId === "lightsout" &&
      data.winner === "player" &&
      (data.timeSeconds || Infinity) < 30,
  },
  // Pathfinding achievements
  {
    id: "pathfinding-first",
    check: (data) => data.challengeId === "pathfinding",
  },
  {
    id: "pathfinding-algorithms",
    check: (_, stats) =>
      stats.pathfindingAlgorithmsUsed.includes("bfs") &&
      stats.pathfindingAlgorithmsUsed.includes("dijkstra") &&
      stats.pathfindingAlgorithmsUsed.includes("astar"),
  },
  {
    id: "pathfinding-level5",
    check: (_, stats) => stats.pathfindingLevels >= 5,
  },
  {
    id: "pathfinding-all-levels",
    check: (_, stats) => stats.pathfindingLevels >= 10,
  },
  {
    id: "pathfinding-beat-par",
    check: (data) =>
      data.challengeId === "pathfinding" &&
      data.pathCost !== undefined &&
      data.parCost !== undefined &&
      data.pathCost <= data.parCost,
  },
  {
    id: "pathfinding-perfect",
    check: (data) =>
      data.challengeId === "pathfinding" &&
      data.pathCost !== undefined &&
      data.parCost !== undefined &&
      data.nodesExpanded !== undefined &&
      data.parNodes !== undefined &&
      data.pathCost <= data.parCost &&
      data.nodesExpanded <= data.parNodes,
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

  // Rate limiting - per user
  const rateLimit = await checkRateLimit(
    env.RATE_LIMIT,
    userId,
    RateLimitPresets.CHALLENGE_COMPLETE
  );
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(
      rateLimit,
      RateLimitPresets.CHALLENGE_COMPLETE,
      "Too many challenge completions. Max 30 per hour."
    );
  }
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
    // Gorillas-specific
    throws?: number;
    hitSun?: boolean;
    // Lights Out-specific
    difficulty?: string;
    toggles?: number;
    minSolution?: number;
    timeSeconds?: number;
    // Pathfinding-specific
    algorithm?: string;
    pathCost?: number;
    parCost?: number;
    nodesExpanded?: number;
    parNodes?: number;
    // Fractals-specific
    iterations?: number;
    preset?: string;
    customRules?: boolean;
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
      dailyStreak: 0,
      longestDailyStreak: 0,
      pvpWins: 0,
      pvpLosses: 0,
      pvpRating: 1000,
      pvpWinStreak: 0,
      pvpBestWinStreak: 0,
    };
    await db.insert(userStats).values(newStats);
    stats = {
      ...newStats,
      lastActiveAt: null,
      lastDailyCompletedAt: null,
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

  // Gorillas wins
  const gorillasWins = await db
    .select({ count: sql<number>`count(*)` })
    .from(challengeCompletions)
    .where(
      and(
        eq(challengeCompletions.userId, userId),
        eq(challengeCompletions.challengeId, "gorillas")
      )
    );

  // Lights Out wins
  const lightsoutWins = await db
    .select({ count: sql<number>`count(*)` })
    .from(challengeCompletions)
    .where(
      and(
        eq(challengeCompletions.userId, userId),
        eq(challengeCompletions.challengeId, "lightsout")
      )
    );

  // Pathfinding levels completed
  const pathfindingLevels = await db
    .select({ count: sql<number>`count(distinct score)` })
    .from(challengeCompletions)
    .where(
      and(
        eq(challengeCompletions.userId, userId),
        eq(challengeCompletions.challengeId, "pathfinding")
      )
    );

  // Fractals created
  const fractalsCreated = await db
    .select({ count: sql<number>`count(*)` })
    .from(challengeCompletions)
    .where(
      and(
        eq(challengeCompletions.userId, userId),
        eq(challengeCompletions.challengeId, "fractals")
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
    // New game stats
    gorillasWins: Number(gorillasWins[0]?.count || 0),
    lightsoutWins: Number(lightsoutWins[0]?.count || 0),
    lightsoutHardWins: 0, // Would need separate query if needed
    pathfindingLevels: Number(pathfindingLevels[0]?.count || 0),
    pathfindingAlgorithmsUsed: body.algorithm ? [body.algorithm] : [], // Simplified - would need history query for accurate tracking
    fractalsCreated: Number(fractalsCreated[0]?.count || 0),
    fractalsGallerySaved: 0, // This is tracked separately in gallery_images table
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
    // Gorillas-specific
    throws: body.throws,
    hitSun: body.hitSun,
    // Lights Out-specific
    difficulty: body.difficulty,
    toggles: body.toggles,
    minSolution: body.minSolution,
    timeSeconds: body.timeSeconds,
    // Pathfinding-specific
    algorithm: body.algorithm,
    pathCost: body.pathCost,
    parCost: body.parCost,
    nodesExpanded: body.nodesExpanded,
    parNodes: body.parNodes,
    // Fractals-specific
    iterations: body.iterations,
    preset: body.preset,
    customRules: body.customRules,
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

  // Qualify pending referral if this is user's first challenge
  if (stats.challengesCompleted === 0) {
    // This is the first challenge completion
    const [pendingReferral] = await db
      .select()
      .from(referrals)
      .where(and(
        eq(referrals.refereeId, userId),
        eq(referrals.status, "pending")
      ))
      .limit(1);

    if (pendingReferral) {
      // Qualify the referral
      await db
        .update(referrals)
        .set({
          status: "qualified",
          qualifiedAt: new Date(),
        })
        .where(eq(referrals.id, pendingReferral.id));

      const referrerId = pendingReferral.referrerId;

      // Count qualified referrals for the referrer
      const qualifiedCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(referrals)
        .where(and(
          eq(referrals.referrerId, referrerId),
          sql`${referrals.status} IN ('qualified', 'rewarded')`
        ));

      const totalQualified = Number(qualifiedCount[0]?.count || 0);

      // Check and grant achievements to referrer
      const referrerAchievementsToGrant: string[] = [];

      // First referral achievement
      if (totalQualified >= 1) {
        const [existing] = await db
          .select()
          .from(userAchievements)
          .where(and(
            eq(userAchievements.userId, referrerId),
            eq(userAchievements.achievementId, "referral-first")
          ))
          .limit(1);

        if (!existing) {
          referrerAchievementsToGrant.push("referral-first");
        }
      }

      // 5 referrals achievement
      if (totalQualified >= 5) {
        const [existing] = await db
          .select()
          .from(userAchievements)
          .where(and(
            eq(userAchievements.userId, referrerId),
            eq(userAchievements.achievementId, "referral-5")
          ))
          .limit(1);

        if (!existing) {
          referrerAchievementsToGrant.push("referral-5");
        }
      }

      // Grant referrer achievements
      let referrerPointsEarned = 0;
      for (const achievementId of referrerAchievementsToGrant) {
        const [achievement] = await db
          .select()
          .from(achievements)
          .where(eq(achievements.id, achievementId))
          .limit(1);

        if (achievement) {
          await db.insert(userAchievements).values({
            userId: referrerId,
            achievementId,
          });
          referrerPointsEarned += achievement.points;
        }
      }

      // Update referrer's stats if achievements were granted
      if (referrerPointsEarned > 0) {
        const [referrerStats] = await db
          .select()
          .from(userStats)
          .where(eq(userStats.userId, referrerId))
          .limit(1);

        if (referrerStats) {
          await db
            .update(userStats)
            .set({
              totalPoints: sql`${userStats.totalPoints} + ${referrerPointsEarned}`,
              achievementsUnlocked: sql`${userStats.achievementsUnlocked} + ${referrerAchievementsToGrant.length}`,
              updatedAt: new Date(),
            })
            .where(eq(userStats.userId, referrerId));
        }
      }
    }
  }

  return NextResponse.json(
    {
      success: true,
      pointsEarned,
      newAchievements: unlockedAchievements.filter(Boolean),
      stats: {
        totalPoints: newTotalPoints,
        level: newLevel,
        challengesCompleted: stats.challengesCompleted + 1,
      },
    },
    {
      headers: rateLimitHeaders(rateLimit, RateLimitPresets.CHALLENGE_COMPLETE),
    }
  );
}
