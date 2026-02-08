import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { challengeComments, commentLikes } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import NextAuth from "next-auth";
import { createAuthConfig } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface RouteParams {
  params: Promise<{ id: string; commentId: string }>;
}

async function getSession() {
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const { auth } = NextAuth(createAuthConfig(db));
  return auth();
}

// POST /api/challenges/[id]/comments/[commentId]/like - Toggle like
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { commentId } = await params;
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { env } = getRequestContext();
  const db = createDb(env.DB);

  // Check if already liked
  const [existingLike] = await db
    .select()
    .from(commentLikes)
    .where(
      and(
        eq(commentLikes.userId, session.user.id),
        eq(commentLikes.commentId, commentId)
      )
    )
    .limit(1);

  if (existingLike) {
    // Unlike
    await db
      .delete(commentLikes)
      .where(
        and(
          eq(commentLikes.userId, session.user.id),
          eq(commentLikes.commentId, commentId)
        )
      );

    await db
      .update(challengeComments)
      .set({ likeCount: sql`${challengeComments.likeCount} - 1` })
      .where(eq(challengeComments.id, commentId));

    return NextResponse.json({ liked: false });
  } else {
    // Like
    await db.insert(commentLikes).values({
      userId: session.user.id,
      commentId,
    });

    await db
      .update(challengeComments)
      .set({ likeCount: sql`${challengeComments.likeCount} + 1` })
      .where(eq(challengeComments.id, commentId));

    return NextResponse.json({ liked: true });
  }
}
