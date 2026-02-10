import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { dailyChallenges, dailyChallengeCompletions, userStats } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import { createAuthConfig } from "@/lib/auth";
import { challenges } from "@/lib/challenge-config";

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

// Generate a deterministic seed based on date
function generateSeed(date: string): string {
  // Simple hash of the date string
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    const char = date.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Select a challenge for the day (rotates through available challenges)
function selectChallengeForDay(date: string): string {
  const challengeIds = Object.keys(challenges);
  // Use date as seed for deterministic selection
  const daysSinceEpoch = Math.floor(new Date(date).getTime() / (1000 * 60 * 60 * 24));
  const index = daysSinceEpoch % challengeIds.length;
  return challengeIds[index];
}

// Determine difficulty based on day of week
function getDifficulty(date: string): "easy" | "normal" | "hard" {
  const dayOfWeek = new Date(date).getUTCDay();
  // Weekend = hard, Friday = normal, weekdays = easy/normal alternating
  if (dayOfWeek === 0 || dayOfWeek === 6) return "hard";
  if (dayOfWeek === 5) return "normal";
  return dayOfWeek % 2 === 0 ? "easy" : "normal";
}

// Get bonus points based on difficulty
function getBonusPoints(difficulty: string): number {
  switch (difficulty) {
    case "easy": return 25;
    case "hard": return 100;
    default: return 50;
  }
}

// GET /api/daily-challenge - Get today's challenge
export async function GET(request: NextRequest) {
  try {
    const { env } = getRequestContext();
    const db = createDb(env.DB);
    const session = await getSession();
    const today = getTodayUTC();

    // Check if today's challenge exists
    let [dailyChallenge] = await db
      .select()
      .from(dailyChallenges)
      .where(eq(dailyChallenges.date, today))
      .limit(1);

    // If not, create it
    if (!dailyChallenge) {
      const challengeId = selectChallengeForDay(today);
      const difficulty = getDifficulty(today);
      const bonusPoints = getBonusPoints(difficulty);
      const seed = generateSeed(today);

      const [newChallenge] = await db
        .insert(dailyChallenges)
        .values({
          date: today,
          challengeId,
          seed,
          difficulty,
          bonusPoints,
        })
        .returning();

      dailyChallenge = newChallenge;
    }

    // Get challenge config
    const challengeConfig = challenges[dailyChallenge.challengeId];

    // Check if user has completed today's challenge
    let completed = false;
    let userCompletion = null;
    let userStreak = 0;

    if (session?.user?.id) {
      const [completion] = await db
        .select()
        .from(dailyChallengeCompletions)
        .where(and(
          eq(dailyChallengeCompletions.userId, session.user.id),
          eq(dailyChallengeCompletions.dailyChallengeId, dailyChallenge.id)
        ))
        .limit(1);

      if (completion) {
        completed = true;
        userCompletion = completion;
      }

      // Get user's daily streak
      const [stats] = await db
        .select({ dailyStreak: userStats.dailyStreak })
        .from(userStats)
        .where(eq(userStats.userId, session.user.id))
        .limit(1);

      userStreak = stats?.dailyStreak || 0;
    }

    // Get completion count for today
    const completions = await db
      .select()
      .from(dailyChallengeCompletions)
      .where(eq(dailyChallengeCompletions.dailyChallengeId, dailyChallenge.id));

    return NextResponse.json({
      dailyChallenge: {
        id: dailyChallenge.id,
        date: dailyChallenge.date,
        challengeId: dailyChallenge.challengeId,
        seed: dailyChallenge.seed,
        difficulty: dailyChallenge.difficulty,
        bonusPoints: dailyChallenge.bonusPoints,
        challenge: challengeConfig ? {
          name: challengeConfig.name,
          shortName: challengeConfig.shortName,
          description: challengeConfig.description,
          category: challengeConfig.category,
          difficulty: challengeConfig.difficulty,
        } : null,
      },
      completed,
      userCompletion,
      userStreak,
      totalCompletions: completions.length,
    });
  } catch (error) {
    console.error("Error fetching daily challenge:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily challenge" },
      { status: 500 }
    );
  }
}
