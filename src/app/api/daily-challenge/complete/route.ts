import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { dailyChallenges, dailyChallengeCompletions, userStats, userAchievements, achievements } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import { createAuthConfig } from "@/lib/auth";

export const runtime = "edge";

async function getSession() {
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const { auth } = NextAuth(createAuthConfig(db));
  return auth();
}

// Get today's date in UTC YYYY-MM-DD format
function getTodayUTC(): string {
  return new Date().toISOString().split("T")[0];
}

// Get yesterday's date in UTC YYYY-MM-DD format
function getYesterdayUTC(): string {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return yesterday.toISOString().split("T")[0];
}

// POST /api/daily-challenge/complete - Complete today's challenge
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { env } = getRequestContext();
    const db = createDb(env.DB);
    const userId = session.user.id;
    const today = getTodayUTC();

    // Get request body
    const { score, timeSpentMs } = await request.json() as { score?: number; timeSpentMs?: number };

    // Get today's challenge
    const [dailyChallenge] = await db
      .select()
      .from(dailyChallenges)
      .where(eq(dailyChallenges.date, today))
      .limit(1);

    if (!dailyChallenge) {
      return NextResponse.json(
        { error: "No daily challenge for today" },
        { status: 404 }
      );
    }

    // Check if already completed
    const [existing] = await db
      .select()
      .from(dailyChallengeCompletions)
      .where(and(
        eq(dailyChallengeCompletions.userId, userId),
        eq(dailyChallengeCompletions.dailyChallengeId, dailyChallenge.id)
      ))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "Already completed today's challenge", completion: existing },
        { status: 400 }
      );
    }

    // Create completion record
    const [completion] = await db
      .insert(dailyChallengeCompletions)
      .values({
        userId,
        dailyChallengeId: dailyChallenge.id,
        score: score || 0,
        timeSpentMs,
      })
      .returning();

    // Calculate streak
    // Check if user completed yesterday's challenge
    const yesterday = getYesterdayUTC();
    const [yesterdayChallenge] = await db
      .select()
      .from(dailyChallenges)
      .where(eq(dailyChallenges.date, yesterday))
      .limit(1);

    let hadYesterdayCompletion = false;
    if (yesterdayChallenge) {
      const [yesterdayCompletion] = await db
        .select()
        .from(dailyChallengeCompletions)
        .where(and(
          eq(dailyChallengeCompletions.userId, userId),
          eq(dailyChallengeCompletions.dailyChallengeId, yesterdayChallenge.id)
        ))
        .limit(1);
      hadYesterdayCompletion = !!yesterdayCompletion;
    }

    // Get current stats
    const [currentStats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .limit(1);

    const currentStreak = currentStats?.dailyStreak || 0;
    const newStreak = hadYesterdayCompletion ? currentStreak + 1 : 1;
    const longestStreak = Math.max(currentStats?.longestDailyStreak || 0, newStreak);

    // Calculate total points earned (bonus + score)
    const totalPointsEarned = dailyChallenge.bonusPoints + (score || 0);

    // Update user stats
    if (currentStats) {
      await db
        .update(userStats)
        .set({
          dailyStreak: newStreak,
          longestDailyStreak: longestStreak,
          lastDailyCompletedAt: new Date(),
          totalPoints: sql`${userStats.totalPoints} + ${totalPointsEarned}`,
          updatedAt: new Date(),
        })
        .where(eq(userStats.userId, userId));
    } else {
      await db
        .insert(userStats)
        .values({
          userId,
          dailyStreak: newStreak,
          longestDailyStreak: newStreak,
          lastDailyCompletedAt: new Date(),
          totalPoints: totalPointsEarned,
        });
    }

    // Check for new achievements
    const newAchievements: { id: string; name: string; description: string; icon: string; points: number; rarity: string }[] = [];

    // Achievement: First daily completion
    if (newStreak === 1) {
      const [existing] = await db
        .select()
        .from(userAchievements)
        .where(and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, "daily-first")
        ))
        .limit(1);

      if (!existing) {
        const [achievement] = await db
          .select()
          .from(achievements)
          .where(eq(achievements.id, "daily-first"))
          .limit(1);

        if (achievement) {
          await db.insert(userAchievements).values({
            userId,
            achievementId: "daily-first",
          });
          newAchievements.push(achievement);
        }
      }
    }

    // Achievement: 7-day streak
    if (newStreak >= 7) {
      const [existing] = await db
        .select()
        .from(userAchievements)
        .where(and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, "daily-streak-7")
        ))
        .limit(1);

      if (!existing) {
        const [achievement] = await db
          .select()
          .from(achievements)
          .where(eq(achievements.id, "daily-streak-7"))
          .limit(1);

        if (achievement) {
          await db.insert(userAchievements).values({
            userId,
            achievementId: "daily-streak-7",
          });
          newAchievements.push(achievement);
        }
      }
    }

    // Achievement: 30-day streak
    if (newStreak >= 30) {
      const [existing] = await db
        .select()
        .from(userAchievements)
        .where(and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, "daily-streak-30")
        ))
        .limit(1);

      if (!existing) {
        const [achievement] = await db
          .select()
          .from(achievements)
          .where(eq(achievements.id, "daily-streak-30"))
          .limit(1);

        if (achievement) {
          await db.insert(userAchievements).values({
            userId,
            achievementId: "daily-streak-30",
          });
          newAchievements.push(achievement);
        }
      }
    }

    return NextResponse.json({
      success: true,
      completion,
      streak: newStreak,
      longestStreak,
      pointsEarned: totalPointsEarned,
      newAchievements,
    });
  } catch (error) {
    console.error("Error completing daily challenge:", error);
    return NextResponse.json(
      { error: "Failed to complete daily challenge" },
      { status: 500 }
    );
  }
}
