import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { pvpMatches, userStats } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
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

interface PageProps {
  params: Promise<{ roomId: string }>;
}

// POST /api/pvp/join/[roomId] - Join an existing PvP room
export async function POST(request: NextRequest, { params }: PageProps) {
  try {
    const { roomId } = await params;

    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { env } = getRequestContext();
    const db = createDb(env.DB);
    const userId = session.user.id;

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

    // Check if user is already in the match
    if (match.whiteUserId === userId) {
      // User is already white, reconnect
      const gameRoomId = env.GAME_ROOM.idFromName(roomId);
      const gameRoom = env.GAME_ROOM.get(gameRoomId);

      // Get room state
      const stateResponse = await gameRoom.fetch("https://game-room/state");
      const state = await stateResponse.json() as {
        sessionNonce: string;
        gameType: string;
        gameMode: string;
      };

      // Rejoin
      const joinResponse = await gameRoom.fetch("https://game-room/join", {
        method: "POST",
      });
      const joinData = await joinResponse.json() as {
        playerNonce: string;
        color: string;
      };

      return NextResponse.json({
        success: true,
        matchId: match.id,
        roomId,
        gameType: match.gameType,
        color: "white",
        playerNonce: joinData.playerNonce,
        sessionNonce: state.sessionNonce,
        isReconnect: true,
      });
    }

    if (match.blackUserId === userId) {
      // User is already black, reconnect
      const gameRoomId = env.GAME_ROOM.idFromName(roomId);
      const gameRoom = env.GAME_ROOM.get(gameRoomId);

      const stateResponse = await gameRoom.fetch("https://game-room/state");
      const state = await stateResponse.json() as {
        sessionNonce: string;
        gameType: string;
      };

      const joinResponse = await gameRoom.fetch("https://game-room/join", {
        method: "POST",
      });
      const joinData = await joinResponse.json() as {
        playerNonce: string;
        color: string;
      };

      return NextResponse.json({
        success: true,
        matchId: match.id,
        roomId,
        gameType: match.gameType,
        color: "black",
        playerNonce: joinData.playerNonce,
        sessionNonce: state.sessionNonce,
        isReconnect: true,
      });
    }

    // Check if black slot is available
    if (match.blackUserId !== null) {
      return NextResponse.json(
        { error: "Match is full" },
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

    // Update match with black player
    await db
      .update(pvpMatches)
      .set({
        blackUserId: userId,
        blackRatingBefore: rating,
      })
      .where(eq(pvpMatches.id, match.id));

    // Join the Durable Object room
    const gameRoomId = env.GAME_ROOM.idFromName(roomId);
    const gameRoom = env.GAME_ROOM.get(gameRoomId);

    const stateResponse = await gameRoom.fetch("https://game-room/state");
    const state = await stateResponse.json() as {
      sessionNonce: string;
      gameType: string;
    };

    const joinResponse = await gameRoom.fetch("https://game-room/join", {
      method: "POST",
    });

    if (!joinResponse.ok) {
      return NextResponse.json(
        { error: "Failed to join game room" },
        { status: 500 }
      );
    }

    const joinData = await joinResponse.json() as {
      playerNonce: string;
      color: string;
    };

    return NextResponse.json({
      success: true,
      matchId: match.id,
      roomId,
      gameType: match.gameType,
      color: joinData.color,
      playerNonce: joinData.playerNonce,
      sessionNonce: state.sessionNonce,
    });
  } catch (error) {
    console.error("Error joining PvP room:", error);
    return NextResponse.json(
      { error: "Failed to join PvP room" },
      { status: 500 }
    );
  }
}

// GET /api/pvp/join/[roomId] - Get room info without joining
export async function GET(request: NextRequest, { params }: PageProps) {
  try {
    const { roomId } = await params;
    const { env } = getRequestContext();
    const db = createDb(env.DB);

    // Find the match
    const [match] = await db
      .select()
      .from(pvpMatches)
      .where(eq(pvpMatches.roomId, roomId))
      .limit(1);

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      matchId: match.id,
      roomId,
      gameType: match.gameType,
      result: match.result,
      hasWhite: !!match.whiteUserId,
      hasBlack: !!match.blackUserId,
      isFull: !!match.whiteUserId && !!match.blackUserId,
      startedAt: match.startedAt,
    });
  } catch (error) {
    console.error("Error getting room info:", error);
    return NextResponse.json(
      { error: "Failed to get room info" },
      { status: 500 }
    );
  }
}
