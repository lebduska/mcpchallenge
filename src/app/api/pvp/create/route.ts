import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { pvpMatches, userStats } from "@/db/schema";
import { eq } from "drizzle-orm";
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

// POST /api/pvp/create - Create a new PvP room
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

    // Get user's rating
    const [stats] = await db
      .select({ pvpRating: userStats.pvpRating })
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .limit(1);

    const rating = stats?.pvpRating ?? 1000;

    // Generate room ID
    const roomId = crypto.randomUUID();

    // Create match record
    const [match] = await db
      .insert(pvpMatches)
      .values({
        roomId,
        gameType,
        whiteUserId: userId,
        whiteRatingBefore: rating,
        result: "pending",
      })
      .returning();

    // Initialize Durable Object room
    const gameRoomId = env.GAME_ROOM.idFromName(roomId);
    const gameRoom = env.GAME_ROOM.get(gameRoomId);

    const initResponse = await gameRoom.fetch("https://game-room/init", {
      method: "POST",
      body: JSON.stringify({
        gameType,
        roomId,
        mode: "pvp",
      }),
    });

    if (!initResponse.ok) {
      // Cleanup the match record
      await db.delete(pvpMatches).where(eq(pvpMatches.id, match.id));
      return NextResponse.json(
        { error: "Failed to create game room" },
        { status: 500 }
      );
    }

    const roomData = await initResponse.json() as {
      sessionNonce: string;
      gameMode: string;
    };

    // Join as white player
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
      gameType,
      color: joinData.color,
      playerNonce: joinData.playerNonce,
      sessionNonce: roomData.sessionNonce,
      inviteUrl: `${request.nextUrl.origin}/pvp/${roomId}`,
    });
  } catch (error) {
    console.error("Error creating PvP room:", error);
    return NextResponse.json(
      { error: "Failed to create PvP room" },
      { status: 500 }
    );
  }
}
