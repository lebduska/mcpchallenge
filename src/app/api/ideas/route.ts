import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { challengeIdeas, ideaVotes, users } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import NextAuth from "next-auth";
import { createAuthConfig } from "@/lib/auth";

export const runtime = "edge";

async function getSession() {
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const { auth } = NextAuth(createAuthConfig(db));
  return auth();
}

/**
 * GET /api/ideas
 * List all challenge ideas with pagination and filtering
 *
 * Query params:
 * - status: filter by status (pending, approved, in_progress, implemented, rejected)
 * - category: filter by category (game, creative, puzzle, educational)
 * - sort: top (by votes), new (by date), featured
 * - limit: number of results (default 20)
 * - offset: pagination offset
 */
export async function GET(request: Request) {
  const { env } = getRequestContext();
  const db = createDb(env.DB);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const sort = searchParams.get("sort") || "top";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  // Get current user for vote status
  const session = await getSession();
  const userId = session?.user?.id;

  // Build query conditions
  const conditions = [];
  if (status) {
    conditions.push(eq(challengeIdeas.status, status));
  }
  if (category) {
    conditions.push(eq(challengeIdeas.category, category));
  }

  // Get ideas with author info
  const ideasQuery = db
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
      createdAt: challengeIdeas.createdAt,
      authorId: users.id,
      authorName: users.name,
      authorImage: users.image,
      authorUsername: users.username,
    })
    .from(challengeIdeas)
    .leftJoin(users, eq(challengeIdeas.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(limit)
    .offset(offset);

  // Apply sorting
  let ideas;
  if (sort === "featured") {
    ideas = await ideasQuery.orderBy(desc(challengeIdeas.isFeatured), desc(challengeIdeas.voteCount));
  } else if (sort === "new") {
    ideas = await ideasQuery.orderBy(desc(challengeIdeas.createdAt));
  } else {
    // Default: top (by votes)
    ideas = await ideasQuery.orderBy(desc(challengeIdeas.voteCount), desc(challengeIdeas.createdAt));
  }

  // Get user's votes if authenticated
  let userVotes = new Set<string>();
  if (userId) {
    const votes = await db
      .select({ ideaId: ideaVotes.ideaId })
      .from(ideaVotes)
      .where(eq(ideaVotes.userId, userId));
    userVotes = new Set(votes.map(v => v.ideaId));
  }

  // Format response
  const formattedIdeas = ideas.map(idea => ({
    id: idea.id,
    title: idea.title,
    description: idea.description,
    category: idea.category,
    gameReference: idea.gameReference,
    status: idea.status,
    isFeatured: idea.isFeatured,
    voteCount: idea.voteCount,
    commentCount: idea.commentCount,
    createdAt: idea.createdAt,
    hasVoted: userVotes.has(idea.id),
    author: {
      id: idea.authorId,
      name: idea.authorName,
      image: idea.authorImage,
      username: idea.authorUsername,
    },
  }));

  // Get total count for pagination
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(challengeIdeas)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  const total = countResult[0]?.count || 0;

  return NextResponse.json({
    ideas: formattedIdeas,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + ideas.length < total,
    },
  });
}

/**
 * POST /api/ideas
 * Create a new challenge idea (requires authentication)
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { env } = getRequestContext();
  const db = createDb(env.DB);

  const body = await request.json() as { title?: string; description?: string; category?: string; gameReference?: string };
  const { title, description, category, gameReference } = body;

  // Validation
  if (!title || title.length < 5 || title.length > 100) {
    return NextResponse.json({ error: "Title must be 5-100 characters" }, { status: 400 });
  }
  if (!description || description.length < 20 || description.length > 2000) {
    return NextResponse.json({ error: "Description must be 20-2000 characters" }, { status: 400 });
  }
  const validCategories = ["game", "creative", "puzzle", "educational"];
  if (category && !validCategories.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  // Create idea
  const ideaId = crypto.randomUUID();
  const now = new Date();

  await db.insert(challengeIdeas).values({
    id: ideaId,
    userId: session.user.id,
    title: title.trim(),
    description: description.trim(),
    category: category || "game",
    gameReference: gameReference?.trim() || null,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({
    success: true,
    idea: {
      id: ideaId,
      title: title.trim(),
      description: description.trim(),
      category: category || "game",
      gameReference: gameReference?.trim() || null,
      status: "pending",
      isFeatured: false,
      voteCount: 0,
      commentCount: 0,
      createdAt: now,
    },
  }, { status: 201 });
}
