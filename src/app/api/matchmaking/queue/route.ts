import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { matchmakingQueue, userStats, pvpMatches } from "@/db/schema";
import { eq, and, ne, lt, sql } from "drizzle-orm";
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

// POST /api/matchmaking/queue - Join matchmaking queue
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { env } = getRequestContext();
    const db = createDb(env.DB);
    const userId = session.user.id;

    const { gameType } = await request.json() as { gameType?: string };

    // Validate game type
    const validGameTypes = ["chess", "tic-tac-toe"];
    if (!gameType || !validGameTypes.includes(gameType)) {
      return NextResponse.json(
        { error: "Invalid game type. Supported: chess, tic-tac-toe" },
        { status: 400 }
      );
    }

    // Check if user is already in queue
    const [existing] = await db
      .select()
      .from(matchmakingQueue)
      .where(and(
        eq(matchmakingQueue.userId, userId),
        eq(matchmakingQueue.status, "waiting")
      ))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "Already in matchmaking queue", queueId: existing.id },
        { status: 400 }
      );
    }

    // Get user's rating
    const [stats] = await db
      .select({ pvpRating: userStats.pvpRating })
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .limit(1);

    const rating = stats?.pvpRating ?? 1000;

    // Clean up old waiting entries (older than 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    await db
      .update(matchmakingQueue)
      .set({ status: "cancelled" })
      .where(and(
        eq(matchmakingQueue.status, "waiting"),
        lt(matchmakingQueue.joinedAt, fiveMinutesAgo)
      ));

    // Try to find a match (within 200 rating points)
    const ratingRange = 200;
    const [potentialMatch] = await db
      .select()
      .from(matchmakingQueue)
      .where(and(
        eq(matchmakingQueue.gameType, gameType),
        eq(matchmakingQueue.status, "waiting"),
        ne(matchmakingQueue.userId, userId),
        sql`ABS(${matchmakingQueue.rating} - ${rating}) <= ${ratingRange}`
      ))
      .orderBy(matchmakingQueue.joinedAt)
      .limit(1);

    if (potentialMatch) {
      // Found a match! Create the game room
      const roomId = crypto.randomUUID();

      // Create match record
      const [match] = await db
        .insert(pvpMatches)
        .values({
          roomId,
          gameType,
          whiteUserId: potentialMatch.userId, // First in queue is white
          blackUserId: userId, // Joiner is black
          whiteRatingBefore: potentialMatch.rating,
          blackRatingBefore: rating,
          result: "pending",
        })
        .returning();

      // Update both queue entries
      await db
        .update(matchmakingQueue)
        .set({
          status: "matched",
          matchedWithUserId: userId,
          matchedRoomId: roomId,
          matchedAt: new Date(),
        })
        .where(eq(matchmakingQueue.id, potentialMatch.id));

      // Create queue entry for current user (marked as matched)
      await db.insert(matchmakingQueue).values({
        userId,
        gameType,
        rating,
        status: "matched",
        matchedWithUserId: potentialMatch.userId,
        matchedRoomId: roomId,
        matchedAt: new Date(),
      });

      // Initialize Durable Object room
      const gameRoomId = env.GAME_ROOM.idFromName(roomId);
      const gameRoom = env.GAME_ROOM.get(gameRoomId);

      await gameRoom.fetch("https://game-room/init", {
        method: "POST",
        body: JSON.stringify({
          gameType,
          roomId,
          mode: "pvp",
        }),
      });

      return NextResponse.json({
        success: true,
        status: "matched",
        matchId: match.id,
        roomId,
        gameType,
        color: "black", // Joiner is black
      });
    }

    // No match found, add to queue
    const [queueEntry] = await db
      .insert(matchmakingQueue)
      .values({
        userId,
        gameType,
        rating,
        status: "waiting",
      })
      .returning();

    return NextResponse.json({
      success: true,
      status: "waiting",
      queueId: queueEntry.id,
      gameType,
      rating,
      position: 1, // Simplified - would need actual queue position calculation
    });
  } catch (error) {
    console.error("Error joining matchmaking queue:", error);
    return NextResponse.json(
      { error: "Failed to join matchmaking queue" },
      { status: 500 }
    );
  }
}

// DELETE /api/matchmaking/queue - Leave matchmaking queue
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { env } = getRequestContext();
    const db = createDb(env.DB);
    const userId = session.user.id;

    // Cancel any waiting queue entries
    await db
      .update(matchmakingQueue)
      .set({ status: "cancelled" })
      .where(and(
        eq(matchmakingQueue.userId, userId),
        eq(matchmakingQueue.status, "waiting")
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error leaving matchmaking queue:", error);
    return NextResponse.json(
      { error: "Failed to leave queue" },
      { status: 500 }
    );
  }
}

// GET /api/matchmaking/queue - Check queue status
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { env } = getRequestContext();
    const db = createDb(env.DB);
    const userId = session.user.id;

    // Find user's queue entry
    const [entry] = await db
      .select()
      .from(matchmakingQueue)
      .where(and(
        eq(matchmakingQueue.userId, userId),
        ne(matchmakingQueue.status, "cancelled")
      ))
      .orderBy(sql`${matchmakingQueue.joinedAt} DESC`)
      .limit(1);

    if (!entry) {
      return NextResponse.json({
        inQueue: false,
      });
    }

    if (entry.status === "matched") {
      return NextResponse.json({
        inQueue: false,
        matched: true,
        roomId: entry.matchedRoomId,
        gameType: entry.gameType,
      });
    }

    // Calculate wait time
    const waitTimeMs = entry.joinedAt
      ? Date.now() - new Date(entry.joinedAt).getTime()
      : 0;

    return NextResponse.json({
      inQueue: true,
      queueId: entry.id,
      gameType: entry.gameType,
      rating: entry.rating,
      waitTimeMs,
      status: entry.status,
    });
  } catch (error) {
    console.error("Error checking queue status:", error);
    return NextResponse.json(
      { error: "Failed to check queue status" },
      { status: 500 }
    );
  }
}
