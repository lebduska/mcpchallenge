import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { dailyChallenges, dailyChallengeCompletions, users } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Get today's date in UTC YYYY-MM-DD format
function getTodayUTC(): string {
  return new Date().toISOString().split("T")[0];
}

// GET /api/daily-challenge/leaderboard - Get today's leaderboard
export async function GET(request: NextRequest) {
  try {
    const { env } = getRequestContext();
    const db = createDb(env.DB);
    const { searchParams } = new URL(request.url);

    const date = searchParams.get("date") || getTodayUTC();
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    // Get the daily challenge for the specified date
    const [dailyChallenge] = await db
      .select()
      .from(dailyChallenges)
      .where(eq(dailyChallenges.date, date))
      .limit(1);

    if (!dailyChallenge) {
      return NextResponse.json({
        date,
        leaderboard: [],
        message: "No challenge for this date",
      });
    }

    // Get completions with user info, ordered by score (desc) then time (asc)
    const completions = await db
      .select({
        id: dailyChallengeCompletions.id,
        score: dailyChallengeCompletions.score,
        timeSpentMs: dailyChallengeCompletions.timeSpentMs,
        completedAt: dailyChallengeCompletions.completedAt,
        userId: users.id,
        userName: users.name,
        userUsername: users.username,
        userImage: users.image,
      })
      .from(dailyChallengeCompletions)
      .innerJoin(users, eq(dailyChallengeCompletions.userId, users.id))
      .where(eq(dailyChallengeCompletions.dailyChallengeId, dailyChallenge.id))
      .orderBy(
        desc(dailyChallengeCompletions.score),
        asc(dailyChallengeCompletions.timeSpentMs)
      )
      .limit(limit);

    return NextResponse.json({
      date,
      challengeId: dailyChallenge.challengeId,
      difficulty: dailyChallenge.difficulty,
      bonusPoints: dailyChallenge.bonusPoints,
      leaderboard: completions.map((c, index) => ({
        rank: index + 1,
        id: c.id,
        score: c.score,
        timeSpentMs: c.timeSpentMs,
        completedAt: c.completedAt,
        user: {
          id: c.userId,
          name: c.userName,
          username: c.userUsername,
          image: c.userImage,
        },
      })),
    });
  } catch (error) {
    console.error("Error fetching daily leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
