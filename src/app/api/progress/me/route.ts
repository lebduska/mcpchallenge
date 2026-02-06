import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { challengeProgress, levelBest, userAchievements, achievements } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import NextAuth from "next-auth";
import { createAuthConfig } from "@/lib/auth";

export const runtime = "edge";

async function getSession() {
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const { auth } = NextAuth(createAuthConfig(db));
  return auth();
}

/**
 * GET /api/progress/me
 * Get current user's progress for a challenge
 *
 * Query params:
 * - challengeId: optional, filter by challenge
 */
export async function GET(request: Request) {
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const challengeId = searchParams.get("challengeId");

  // Get progress - separate variables to avoid type union issues
  const singleProgress = challengeId
    ? await db.query.challengeProgress.findFirst({
        where: and(
          eq(challengeProgress.userId, userId),
          eq(challengeProgress.challengeId, challengeId)
        ),
      })
    : null;

  const allProgress = !challengeId
    ? await db
        .select()
        .from(challengeProgress)
        .where(eq(challengeProgress.userId, userId))
    : null;

  // Get level bests
  let bests;
  if (challengeId) {
    bests = await db
      .select()
      .from(levelBest)
      .where(
        and(
          eq(levelBest.userId, userId),
          eq(levelBest.challengeId, challengeId)
        )
      );
  } else {
    bests = await db
      .select()
      .from(levelBest)
      .where(eq(levelBest.userId, userId));
  }

  // Convert bests to a map
  const levelBests: Record<string, {
    levelId: string;
    bestMoves: number | null;
    bestPushes: number | null;
    bestTimeMs: number | null;
    bestReplayId: string | null;
  }> = {};

  for (const best of bests) {
    const key = challengeId ? best.levelId : `${best.challengeId}:${best.levelId}`;
    levelBests[key] = {
      levelId: best.levelId,
      bestMoves: best.bestMoves,
      bestPushes: best.bestPushes,
      bestTimeMs: best.bestTimeMs,
      bestReplayId: best.bestReplayId,
    };
  }

  // Get achievements
  const userAchievementsList = await db
    .select({
      id: achievements.id,
      name: achievements.name,
      description: achievements.description,
      icon: achievements.icon,
      category: achievements.category,
      points: achievements.points,
      rarity: achievements.rarity,
      unlockedAt: userAchievements.unlockedAt,
    })
    .from(userAchievements)
    .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
    .where(eq(userAchievements.userId, userId));

  // Filter achievements by challenge if specified
  const filteredAchievements = challengeId
    ? userAchievementsList.filter((a) => a.id.startsWith(challengeId) || a.category === "milestone")
    : userAchievementsList;

  return NextResponse.json({
    progress: challengeId
      ? singleProgress
        ? {
            maxLevelUnlocked: singleProgress.maxLevelUnlocked,
            lastLevel: singleProgress.lastLevel,
            updatedAt: singleProgress.updatedAt,
          }
        : { maxLevelUnlocked: 1, lastLevel: 1, updatedAt: null }
      : allProgress,
    levelBests,
    achievements: filteredAchievements,
  });
}
