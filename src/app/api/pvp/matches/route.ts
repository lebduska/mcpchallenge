import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { pvpMatches, users } from "@/db/schema";
import { eq, or, desc, sql } from "drizzle-orm";
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

// GET /api/pvp/matches - Get user's match history
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { env } = getRequestContext();
    const db = createDb(env.DB);
    const userId = session.user.id;

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") ?? "20");
    const offset = parseInt(url.searchParams.get("offset") ?? "0");
    const gameType = url.searchParams.get("gameType");

    // Build query
    const whereClause = or(
      eq(pvpMatches.whiteUserId, userId),
      eq(pvpMatches.blackUserId, userId)
    );

    // Get matches
    const matches = await db
      .select({
        id: pvpMatches.id,
        roomId: pvpMatches.roomId,
        gameType: pvpMatches.gameType,
        whiteUserId: pvpMatches.whiteUserId,
        blackUserId: pvpMatches.blackUserId,
        winnerId: pvpMatches.winnerId,
        result: pvpMatches.result,
        whiteRatingBefore: pvpMatches.whiteRatingBefore,
        blackRatingBefore: pvpMatches.blackRatingBefore,
        whiteRatingChange: pvpMatches.whiteRatingChange,
        blackRatingChange: pvpMatches.blackRatingChange,
        totalMoves: pvpMatches.totalMoves,
        durationMs: pvpMatches.durationMs,
        startedAt: pvpMatches.startedAt,
        endedAt: pvpMatches.endedAt,
      })
      .from(pvpMatches)
      .where(whereClause)
      .orderBy(desc(pvpMatches.startedAt))
      .limit(limit)
      .offset(offset);

    // Filter by game type if specified
    const filteredMatches = gameType
      ? matches.filter(m => m.gameType === gameType)
      : matches;

    // Get opponent info for each match
    const enrichedMatches = await Promise.all(
      filteredMatches.map(async (match) => {
        const opponentId = match.whiteUserId === userId
          ? match.blackUserId
          : match.whiteUserId;

        let opponent = null;
        if (opponentId) {
          const [user] = await db
            .select({
              id: users.id,
              name: users.name,
              username: users.username,
              image: users.image,
            })
            .from(users)
            .where(eq(users.id, opponentId))
            .limit(1);
          opponent = user;
        }

        const playerColor = match.whiteUserId === userId ? "white" : "black";
        const isWinner = match.winnerId === userId;
        const ratingChange = playerColor === "white"
          ? match.whiteRatingChange
          : match.blackRatingChange;

        return {
          ...match,
          playerColor,
          isWinner,
          isDraw: match.result === "draw",
          ratingChange,
          opponent,
        };
      })
    );

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(pvpMatches)
      .where(whereClause);

    return NextResponse.json({
      matches: enrichedMatches,
      total: Number(countResult[0]?.count ?? 0),
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching match history:", error);
    return NextResponse.json(
      { error: "Failed to fetch match history" },
      { status: 500 }
    );
  }
}
