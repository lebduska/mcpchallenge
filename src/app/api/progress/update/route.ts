import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import {
  replays,
  challengeProgress,
  levelBest,
  userStats,
  userAchievements,
  achievements,
  challengeCompletions,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import NextAuth from "next-auth";
import { createAuthConfig } from "@/lib/auth";
import {
  evaluateAchievements,
  calculateLevel,
  type AchievementContext,
  type UserStatsData,
} from "@/lib/achievement-evaluator";

export const runtime = "edge";

async function getSession() {
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const { auth } = NextAuth(createAuthConfig(db));
  return auth();
}

interface UpdateProgressBody {
  action?: "onboarding_complete";
  challengeId?: string;
  levelId?: string;
  result?: {
    won?: boolean;
    moves?: number;
    pushes?: number;
    timeMs?: number;
    score?: number;
  };
  moves?: unknown[];
  seed?: string;
}

/**
 * POST /api/progress/update
 * Update progress after completing a level or handle special actions
 */
export async function POST(request: Request) {
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = (await request.json()) as UpdateProgressBody;

  // Handle onboarding completion - grant first-login achievement
  if (body.action === "onboarding_complete") {
    return handleOnboardingComplete(db, userId);
  }

  if (!body.challengeId || !body.levelId || !body.moves || !body.result) {
    return NextResponse.json(
      { error: "challengeId, levelId, moves, and result are required" },
      { status: 400 }
    );
  }

  // 1. Save replay
  const replayId = crypto.randomUUID();
  await db.insert(replays).values({
    id: replayId,
    userId,
    challengeId: body.challengeId,
    levelId: body.levelId,
    seed: body.seed || null,
    movesJson: JSON.stringify(body.moves),
    resultJson: JSON.stringify(body.result),
  });

  // 2. Get or create challenge progress
  const progress = await db.query.challengeProgress.findFirst({
    where: and(
      eq(challengeProgress.userId, userId),
      eq(challengeProgress.challengeId, body.challengeId)
    ),
  });

  const levelNum = parseInt(body.levelId, 10) || 1;
  let progressUpdated = false;

  if (!progress) {
    // Create new progress
    await db.insert(challengeProgress).values({
      id: crypto.randomUUID(),
      userId,
      challengeId: body.challengeId,
      maxLevelUnlocked: body.result.won ? levelNum + 1 : levelNum,
      lastLevel: levelNum,
    });
    progressUpdated = true;
  } else if (body.result.won && levelNum >= progress.maxLevelUnlocked) {
    // Unlock next level
    await db
      .update(challengeProgress)
      .set({
        maxLevelUnlocked: levelNum + 1,
        lastLevel: levelNum,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(challengeProgress.userId, userId),
          eq(challengeProgress.challengeId, body.challengeId)
        )
      );
    progressUpdated = true;
  } else {
    // Just update last level
    await db
      .update(challengeProgress)
      .set({
        lastLevel: levelNum,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(challengeProgress.userId, userId),
          eq(challengeProgress.challengeId, body.challengeId)
        )
      );
  }

  // 3. Update level best if this is a new best
  let newBest = false;
  if (body.result.won) {
    const existing = await db.query.levelBest.findFirst({
      where: and(
        eq(levelBest.userId, userId),
        eq(levelBest.challengeId, body.challengeId),
        eq(levelBest.levelId, body.levelId)
      ),
    });

    const isBetterMoves = !existing?.bestMoves || (body.result.moves && body.result.moves < existing.bestMoves);
    const isBetterPushes = !existing?.bestPushes || (body.result.pushes && body.result.pushes < existing.bestPushes);
    const isBetterTime = !existing?.bestTimeMs || (body.result.timeMs && body.result.timeMs < existing.bestTimeMs);

    if (!existing) {
      // Create new best
      await db.insert(levelBest).values({
        id: crypto.randomUUID(),
        userId,
        challengeId: body.challengeId,
        levelId: body.levelId,
        bestMoves: body.result.moves || null,
        bestPushes: body.result.pushes || null,
        bestTimeMs: body.result.timeMs || null,
        bestReplayId: replayId,
      });
      newBest = true;
    } else if (isBetterMoves || isBetterPushes || isBetterTime) {
      // Update best
      await db
        .update(levelBest)
        .set({
          bestMoves: isBetterMoves ? body.result.moves : existing.bestMoves,
          bestPushes: isBetterPushes ? body.result.pushes : existing.bestPushes,
          bestTimeMs: isBetterTime ? body.result.timeMs : existing.bestTimeMs,
          bestReplayId: replayId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(levelBest.userId, userId),
            eq(levelBest.challengeId, body.challengeId),
            eq(levelBest.levelId, body.levelId)
          )
        );
      newBest = true;
    }
  }

  // 4. Record challenge completion
  await db.insert(challengeCompletions).values({
    id: crypto.randomUUID(),
    userId,
    challengeId: body.challengeId,
    score: body.result.score || null,
    completedAt: new Date(),
  });

  // 5. Get user stats for achievement evaluation
  let stats = await db.query.userStats.findFirst({
    where: eq(userStats.userId, userId),
  });

  if (!stats) {
    await db.insert(userStats).values({
      userId,
      totalPoints: 0,
      level: 1,
      challengesCompleted: 0,
      achievementsUnlocked: 0,
      currentStreak: 0,
      longestStreak: 0,
    });
    stats = {
      userId,
      totalPoints: 0,
      level: 1,
      challengesCompleted: 0,
      achievementsUnlocked: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveAt: null,
      updatedAt: new Date(),
    };
  }

  // Calculate extended stats
  const [chessWins, snakeScores, tttWins, sokobanLevels] = await Promise.all([
    db.select({ count: sql<number>`count(*)` })
      .from(challengeCompletions)
      .where(and(
        eq(challengeCompletions.userId, userId),
        eq(challengeCompletions.challengeId, "chess")
      )),
    db.select({ maxScore: sql<number>`max(score)` })
      .from(challengeCompletions)
      .where(and(
        eq(challengeCompletions.userId, userId),
        eq(challengeCompletions.challengeId, "snake")
      )),
    db.select({ count: sql<number>`count(*)` })
      .from(challengeCompletions)
      .where(and(
        eq(challengeCompletions.userId, userId),
        eq(challengeCompletions.challengeId, "tic-tac-toe")
      )),
    db.select({ count: sql<number>`count(*)` })
      .from(levelBest)
      .where(and(
        eq(levelBest.userId, userId),
        eq(levelBest.challengeId, "sokoban")
      )),
  ]);

  const extendedStats: UserStatsData = {
    totalPoints: stats.totalPoints,
    level: stats.level,
    challengesCompleted: stats.challengesCompleted + 1,
    chessWins: Number(chessWins[0]?.count || 0),
    snakeHighScore: Number(snakeScores[0]?.maxScore || 0),
    ticTacToeWins: Number(tttWins[0]?.count || 0),
    canvasDrawCompleted: false, // TODO: check
    sokobanLevelsCompleted: Number(sokobanLevels[0]?.count || 0),
  };

  // 6. Evaluate achievements
  const existingAchievements = await db
    .select({ achievementId: userAchievements.achievementId })
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));

  const existingIds = new Set(existingAchievements.map((a) => a.achievementId));

  const ctx: AchievementContext = {
    challengeId: body.challengeId,
    levelId: body.levelId,
    result: {
      won: body.result.won,
      moves: body.result.moves,
      pushes: body.result.pushes,
      timeMs: body.result.timeMs,
      score: body.result.score,
    },
    userStats: extendedStats,
  };

  const newAchievementIds = evaluateAchievements(ctx, existingIds);

  // Grant new achievements
  let pointsEarned = 0;
  const unlockedAchievements = [];

  for (const achievementId of newAchievementIds) {
    const achievement = await db.query.achievements.findFirst({
      where: eq(achievements.id, achievementId),
    });

    if (achievement) {
      await db.insert(userAchievements).values({
        userId,
        achievementId,
        unlockedAt: new Date(),
      });

      pointsEarned += achievement.points;
      unlockedAchievements.push(achievement);
    }
  }

  // 7. Update user stats
  const newTotalPoints = stats.totalPoints + pointsEarned;
  const newLevel = calculateLevel(newTotalPoints);

  await db
    .update(userStats)
    .set({
      totalPoints: newTotalPoints,
      level: newLevel,
      challengesCompleted: stats.challengesCompleted + 1,
      achievementsUnlocked: stats.achievementsUnlocked + unlockedAchievements.length,
      lastActiveAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userStats.userId, userId));

  return NextResponse.json({
    success: true,
    replayId,
    newBest,
    progressUpdated,
    achievementsUnlocked: unlockedAchievements,
    pointsEarned,
    stats: {
      totalPoints: newTotalPoints,
      level: newLevel,
      challengesCompleted: stats.challengesCompleted + 1,
    },
  });
}

/**
 * Handle onboarding completion - grant first-login achievement if not already granted
 */
async function handleOnboardingComplete(db: ReturnType<typeof createDb>, userId: string) {
  // Check if user already has first-login achievement
  const existing = await db.query.userAchievements.findFirst({
    where: and(
      eq(userAchievements.userId, userId),
      eq(userAchievements.achievementId, "first-login")
    ),
  });

  if (existing) {
    return NextResponse.json({
      success: true,
      alreadyCompleted: true,
    });
  }

  // Get the achievement
  const achievement = await db.query.achievements.findFirst({
    where: eq(achievements.id, "first-login"),
  });

  if (!achievement) {
    return NextResponse.json({
      success: false,
      error: "Achievement not found",
    });
  }

  // Grant the achievement
  await db.insert(userAchievements).values({
    userId,
    achievementId: "first-login",
    unlockedAt: new Date(),
  });

  // Get or create user stats
  const stats = await db.query.userStats.findFirst({
    where: eq(userStats.userId, userId),
  });

  if (!stats) {
    await db.insert(userStats).values({
      userId,
      totalPoints: achievement.points,
      level: 1,
      challengesCompleted: 0,
      achievementsUnlocked: 1,
      currentStreak: 1,
      longestStreak: 1,
    });
  } else {
    const newTotal = stats.totalPoints + achievement.points;
    const newLevel = calculateLevel(newTotal);
    await db
      .update(userStats)
      .set({
        totalPoints: newTotal,
        level: newLevel,
        achievementsUnlocked: stats.achievementsUnlocked + 1,
        lastActiveAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userStats.userId, userId));
  }

  return NextResponse.json({
    success: true,
    achievementUnlocked: achievement,
    pointsEarned: achievement.points,
  });
}
