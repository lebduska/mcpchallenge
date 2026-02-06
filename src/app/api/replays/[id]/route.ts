import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { replays, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "edge";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/replays/[id]
 * Get a single replay by ID
 */
export async function GET(request: Request, { params }: PageProps) {
  const { id } = await params;
  const { env } = getRequestContext();
  const db = createDb(env.DB);

  const replay = await db.query.replays.findFirst({
    where: eq(replays.id, id),
  });

  if (!replay) {
    return NextResponse.json(
      { error: "Replay not found" },
      { status: 404 }
    );
  }

  // Get user info if replay has a user
  let user = null;
  if (replay.userId) {
    const userData = await db.query.users.findFirst({
      where: eq(users.id, replay.userId),
      columns: {
        id: true,
        username: true,
        name: true,
        image: true,
      },
    });
    user = userData || null;
  }

  return NextResponse.json({
    id: replay.id,
    challengeId: replay.challengeId,
    levelId: replay.levelId,
    seed: replay.seed,
    moves: JSON.parse(replay.movesJson),
    result: replay.resultJson ? JSON.parse(replay.resultJson) : null,
    createdAt: replay.createdAt,
    user,
  });
}
