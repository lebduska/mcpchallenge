import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { challengeIdeas, ideaVotes } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import NextAuth from "next-auth";
import { createAuthConfig } from "@/lib/auth";

export const runtime = "edge";

async function getSession() {
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const { auth } = NextAuth(createAuthConfig(db));
  return auth();
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/ideas/[id]/vote
 * Toggle vote on an idea (upvote/remove upvote)
 */
export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const userId = session.user.id;

  // Check if idea exists
  const [idea] = await db
    .select()
    .from(challengeIdeas)
    .where(eq(challengeIdeas.id, id));

  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  // Check if user already voted
  const [existingVote] = await db
    .select()
    .from(ideaVotes)
    .where(and(eq(ideaVotes.ideaId, id), eq(ideaVotes.userId, userId)));

  if (existingVote) {
    // Remove vote
    await db
      .delete(ideaVotes)
      .where(and(eq(ideaVotes.ideaId, id), eq(ideaVotes.userId, userId)));

    // Update vote count
    await db
      .update(challengeIdeas)
      .set({ voteCount: sql`${challengeIdeas.voteCount} - 1` })
      .where(eq(challengeIdeas.id, id));

    return NextResponse.json({
      success: true,
      voted: false,
      voteCount: idea.voteCount - 1,
    });
  } else {
    // Add vote
    await db.insert(ideaVotes).values({
      ideaId: id,
      userId,
      voteType: 1,
    });

    // Update vote count
    await db
      .update(challengeIdeas)
      .set({ voteCount: sql`${challengeIdeas.voteCount} + 1` })
      .where(eq(challengeIdeas.id, id));

    return NextResponse.json({
      success: true,
      voted: true,
      voteCount: idea.voteCount + 1,
    });
  }
}
