import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { pvpMatches, userStats, userAchievements, achievements } from "@/db/schema";
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

// Calculate ELO rating change
function calculateEloChange(
  winnerRating: number,
  loserRating: number,
  isDraw: boolean = false
): { winnerChange: number; loserChange: number } {
  const K = 32; // K-factor
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser = 1 - expectedWinner;

  if (isDraw) {
    const winnerChange = Math.round(K * (0.5 - expectedWinner));
    const loserChange = Math.round(K * (0.5 - expectedLoser));
    return { winnerChange, loserChange };
  }

  const winnerChange = Math.round(K * (1 - expectedWinner));
  const loserChange = Math.round(K * (0 - expectedLoser));

  return { winnerChange, loserChange };
}

// POST /api/pvp/complete - Complete a PvP match
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { env } = getRequestContext();
    const db = createDb(env.DB);

    const { roomId, result, winnerId, moves, totalMoves } = await request.json() as {
      roomId: string;
      result: "white_wins" | "black_wins" | "draw" | "abandoned";
      winnerId?: string;
      moves?: unknown[];
      totalMoves?: number;
    };

    // Find the match
    const [match] = await db
      .select()
      .from(pvpMatches)
      .where(and(
        eq(pvpMatches.roomId, roomId),
        eq(pvpMatches.result, "pending")
      ))
      .limit(1);

    if (!match) {
      return NextResponse.json(
        { error: "Match not found or already completed" },
        { status: 404 }
      );
    }

    // Verify the user is part of this match
    const userId = session.user.id;
    if (match.whiteUserId !== userId && match.blackUserId !== userId) {
      return NextResponse.json(
        { error: "You are not part of this match" },
        { status: 403 }
      );
    }

    // Calculate duration
    const durationMs = match.startedAt
      ? Date.now() - new Date(match.startedAt).getTime()
      : null;

    // Calculate rating changes
    let whiteRatingChange = 0;
    let blackRatingChange = 0;
    let actualWinnerId: string | null = null;

    if (match.whiteUserId && match.blackUserId) {
      const whiteRating = match.whiteRatingBefore ?? 1000;
      const blackRating = match.blackRatingBefore ?? 1000;

      if (result === "white_wins") {
        actualWinnerId = match.whiteUserId;
        const { winnerChange, loserChange } = calculateEloChange(whiteRating, blackRating);
        whiteRatingChange = winnerChange;
        blackRatingChange = loserChange;
      } else if (result === "black_wins") {
        actualWinnerId = match.blackUserId;
        const { winnerChange, loserChange } = calculateEloChange(blackRating, whiteRating);
        blackRatingChange = winnerChange;
        whiteRatingChange = loserChange;
      } else if (result === "draw") {
        const { winnerChange, loserChange } = calculateEloChange(whiteRating, blackRating, true);
        whiteRatingChange = winnerChange;
        blackRatingChange = loserChange;
      }
    }

    // Update match
    await db
      .update(pvpMatches)
      .set({
        result,
        winnerId: actualWinnerId,
        whiteRatingChange,
        blackRatingChange,
        movesJson: moves ? JSON.stringify(moves) : null,
        totalMoves: totalMoves ?? 0,
        durationMs,
        endedAt: new Date(),
      })
      .where(eq(pvpMatches.id, match.id));

    // Update player stats
    const achievementsUnlocked: string[] = [];

    // Update white player stats
    if (match.whiteUserId) {
      const isWinner = actualWinnerId === match.whiteUserId;
      const [whiteStats] = await db
        .select()
        .from(userStats)
        .where(eq(userStats.userId, match.whiteUserId))
        .limit(1);

      const currentStreak = whiteStats?.pvpWinStreak ?? 0;
      const newStreak = isWinner ? currentStreak + 1 : 0;
      const bestStreak = Math.max(whiteStats?.pvpBestWinStreak ?? 0, newStreak);
      const newRating = Math.max(0, (whiteStats?.pvpRating ?? 1000) + whiteRatingChange);

      if (whiteStats) {
        await db
          .update(userStats)
          .set({
            pvpWins: isWinner ? sql`${userStats.pvpWins} + 1` : userStats.pvpWins,
            pvpLosses: !isWinner && result !== "draw" ? sql`${userStats.pvpLosses} + 1` : userStats.pvpLosses,
            pvpRating: newRating,
            pvpWinStreak: newStreak,
            pvpBestWinStreak: bestStreak,
            updatedAt: new Date(),
          })
          .where(eq(userStats.userId, match.whiteUserId));

        // Check achievements for white player
        if (isWinner) {
          const whiteAchievements = await checkPvpAchievements(
            db,
            match.whiteUserId,
            (whiteStats.pvpWins ?? 0) + 1,
            newStreak,
            newRating
          );
          achievementsUnlocked.push(...whiteAchievements);
        }
      }
    }

    // Update black player stats
    if (match.blackUserId) {
      const isWinner = actualWinnerId === match.blackUserId;
      const [blackStats] = await db
        .select()
        .from(userStats)
        .where(eq(userStats.userId, match.blackUserId))
        .limit(1);

      const currentStreak = blackStats?.pvpWinStreak ?? 0;
      const newStreak = isWinner ? currentStreak + 1 : 0;
      const bestStreak = Math.max(blackStats?.pvpBestWinStreak ?? 0, newStreak);
      const newRating = Math.max(0, (blackStats?.pvpRating ?? 1000) + blackRatingChange);

      if (blackStats) {
        await db
          .update(userStats)
          .set({
            pvpWins: isWinner ? sql`${userStats.pvpWins} + 1` : userStats.pvpWins,
            pvpLosses: !isWinner && result !== "draw" ? sql`${userStats.pvpLosses} + 1` : userStats.pvpLosses,
            pvpRating: newRating,
            pvpWinStreak: newStreak,
            pvpBestWinStreak: bestStreak,
            updatedAt: new Date(),
          })
          .where(eq(userStats.userId, match.blackUserId));

        // Check achievements for black player
        if (isWinner) {
          const blackAchievements = await checkPvpAchievements(
            db,
            match.blackUserId,
            (blackStats.pvpWins ?? 0) + 1,
            newStreak,
            newRating
          );
          achievementsUnlocked.push(...blackAchievements);
        }
      }
    }

    return NextResponse.json({
      success: true,
      result,
      winnerId: actualWinnerId,
      whiteRatingChange,
      blackRatingChange,
      achievementsUnlocked,
    });
  } catch (error) {
    console.error("Error completing PvP match:", error);
    return NextResponse.json(
      { error: "Failed to complete match" },
      { status: 500 }
    );
  }
}

// Check and grant PvP achievements
async function checkPvpAchievements(
  db: ReturnType<typeof createDb>,
  userId: string,
  totalWins: number,
  winStreak: number,
  rating: number
): Promise<string[]> {
  const unlocked: string[] = [];

  const achievementChecks = [
    { id: "pvp-first-win", condition: totalWins >= 1 },
    { id: "pvp-champion", condition: totalWins >= 50 },
    { id: "pvp-streak-5", condition: winStreak >= 5 },
    { id: "pvp-rating-1500", condition: rating >= 1500 },
  ];

  for (const check of achievementChecks) {
    if (!check.condition) continue;

    // Check if already has achievement
    const [existing] = await db
      .select()
      .from(userAchievements)
      .where(and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.achievementId, check.id)
      ))
      .limit(1);

    if (existing) continue;

    // Get achievement details
    const [achievement] = await db
      .select()
      .from(achievements)
      .where(eq(achievements.id, check.id))
      .limit(1);

    if (!achievement) continue;

    // Grant achievement
    await db.insert(userAchievements).values({
      userId,
      achievementId: check.id,
    });

    // Update user points
    await db
      .update(userStats)
      .set({
        totalPoints: sql`${userStats.totalPoints} + ${achievement.points}`,
        achievementsUnlocked: sql`${userStats.achievementsUnlocked} + 1`,
      })
      .where(eq(userStats.userId, userId));

    unlocked.push(check.id);
  }

  return unlocked;
}
