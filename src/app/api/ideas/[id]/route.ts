import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { challengeIdeas, ideaVotes, ideaComments, users } from "@/db/schema";
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
 * GET /api/ideas/[id]
 * Get a single idea with full details
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const { env } = getRequestContext();
  const db = createDb(env.DB);

  const session = await getSession();
  const userId = session?.user?.id;

  // Get idea with author info
  const [idea] = await db
    .select({
      id: challengeIdeas.id,
      title: challengeIdeas.title,
      description: challengeIdeas.description,
      category: challengeIdeas.category,
      gameReference: challengeIdeas.gameReference,
      status: challengeIdeas.status,
      isFeatured: challengeIdeas.isFeatured,
      voteCount: challengeIdeas.voteCount,
      commentCount: challengeIdeas.commentCount,
      adminNotes: challengeIdeas.adminNotes,
      createdAt: challengeIdeas.createdAt,
      updatedAt: challengeIdeas.updatedAt,
      authorId: users.id,
      authorName: users.name,
      authorImage: users.image,
      authorUsername: users.username,
    })
    .from(challengeIdeas)
    .leftJoin(users, eq(challengeIdeas.userId, users.id))
    .where(eq(challengeIdeas.id, id));

  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  // Check if user has voted
  let hasVoted = false;
  if (userId) {
    const [vote] = await db
      .select()
      .from(ideaVotes)
      .where(and(eq(ideaVotes.ideaId, id), eq(ideaVotes.userId, userId)));
    hasVoted = !!vote;
  }

  return NextResponse.json({
    id: idea.id,
    title: idea.title,
    description: idea.description,
    category: idea.category,
    gameReference: idea.gameReference,
    status: idea.status,
    isFeatured: idea.isFeatured,
    voteCount: idea.voteCount,
    commentCount: idea.commentCount,
    adminNotes: idea.adminNotes,
    createdAt: idea.createdAt,
    updatedAt: idea.updatedAt,
    hasVoted,
    isOwner: userId === idea.authorId,
    author: {
      id: idea.authorId,
      name: idea.authorName,
      image: idea.authorImage,
      username: idea.authorUsername,
    },
  });
}

/**
 * PATCH /api/ideas/[id]
 * Update an idea (only owner or admin)
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { env } = getRequestContext();
  const db = createDb(env.DB);

  // Check ownership
  const [idea] = await db
    .select()
    .from(challengeIdeas)
    .where(eq(challengeIdeas.id, id));

  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  if (idea.userId !== session.user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await request.json() as { title?: string; description?: string; category?: string; gameReference?: string };
  const { title, description, category, gameReference } = body;

  // Validation
  const updates: Record<string, unknown> = {};
  if (title !== undefined) {
    if (title.length < 5 || title.length > 100) {
      return NextResponse.json({ error: "Title must be 5-100 characters" }, { status: 400 });
    }
    updates.title = title.trim();
  }
  if (description !== undefined) {
    if (description.length < 20 || description.length > 2000) {
      return NextResponse.json({ error: "Description must be 20-2000 characters" }, { status: 400 });
    }
    updates.description = description.trim();
  }
  if (category !== undefined) {
    const validCategories = ["game", "creative", "puzzle", "educational"];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    updates.category = category;
  }
  if (gameReference !== undefined) {
    updates.gameReference = gameReference?.trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  updates.updatedAt = new Date();

  await db
    .update(challengeIdeas)
    .set(updates)
    .where(eq(challengeIdeas.id, id));

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/ideas/[id]
 * Delete an idea (only owner or admin)
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { env } = getRequestContext();
  const db = createDb(env.DB);

  // Check ownership
  const [idea] = await db
    .select()
    .from(challengeIdeas)
    .where(eq(challengeIdeas.id, id));

  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  if (idea.userId !== session.user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  await db.delete(challengeIdeas).where(eq(challengeIdeas.id, id));

  return NextResponse.json({ success: true });
}
