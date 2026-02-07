import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { challengeIdeas, ideaComments, users } from "@/db/schema";
import { eq, desc, sql, isNull } from "drizzle-orm";
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
 * GET /api/ideas/[id]/comments
 * Get all comments for an idea
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const { env } = getRequestContext();
  const db = createDb(env.DB);

  const session = await getSession();
  const userId = session?.user?.id;

  // Get top-level comments with author info
  const comments = await db
    .select({
      id: ideaComments.id,
      content: ideaComments.content,
      parentId: ideaComments.parentId,
      isEdited: ideaComments.isEdited,
      createdAt: ideaComments.createdAt,
      authorId: users.id,
      authorName: users.name,
      authorImage: users.image,
      authorUsername: users.username,
    })
    .from(ideaComments)
    .leftJoin(users, eq(ideaComments.userId, users.id))
    .where(eq(ideaComments.ideaId, id))
    .orderBy(desc(ideaComments.createdAt));

  // Format as nested structure
  const commentMap = new Map<string, {
    id: string;
    content: string;
    isEdited: boolean;
    createdAt: Date | null;
    isOwner: boolean;
    author: {
      id: string | null;
      name: string | null;
      image: string | null;
      username: string | null;
    };
    replies: unknown[];
  }>();

  const topLevelComments: unknown[] = [];

  // First pass: create all comment objects
  for (const comment of comments) {
    const formatted = {
      id: comment.id,
      content: comment.content,
      isEdited: comment.isEdited ?? false,
      createdAt: comment.createdAt,
      isOwner: userId === comment.authorId,
      author: {
        id: comment.authorId,
        name: comment.authorName,
        image: comment.authorImage,
        username: comment.authorUsername,
      },
      replies: [],
    };
    commentMap.set(comment.id, formatted);
  }

  // Second pass: build tree structure
  for (const comment of comments) {
    const formatted = commentMap.get(comment.id);
    if (!formatted) continue;

    if (comment.parentId && commentMap.has(comment.parentId)) {
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        (parent.replies as unknown[]).push(formatted);
      }
    } else {
      topLevelComments.push(formatted);
    }
  }

  return NextResponse.json({
    comments: topLevelComments,
    total: comments.length,
  });
}

/**
 * POST /api/ideas/[id]/comments
 * Add a comment to an idea
 */
export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { env } = getRequestContext();
  const db = createDb(env.DB);

  // Check if idea exists
  const [idea] = await db
    .select()
    .from(challengeIdeas)
    .where(eq(challengeIdeas.id, id));

  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  const body = await request.json() as { content?: string; parentId?: string };
  const { content, parentId } = body;

  // Validation
  if (!content || content.length < 1 || content.length > 1000) {
    return NextResponse.json({ error: "Comment must be 1-1000 characters" }, { status: 400 });
  }

  // Verify parent exists if provided
  if (parentId) {
    const [parent] = await db
      .select()
      .from(ideaComments)
      .where(eq(ideaComments.id, parentId));
    if (!parent) {
      return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
    }
  }

  // Create comment
  const commentId = crypto.randomUUID();
  const now = new Date();

  await db.insert(ideaComments).values({
    id: commentId,
    ideaId: id,
    userId: session.user.id,
    content: content.trim(),
    parentId: parentId || null,
    createdAt: now,
    updatedAt: now,
  });

  // Update comment count
  await db
    .update(challengeIdeas)
    .set({ commentCount: sql`${challengeIdeas.commentCount} + 1` })
    .where(eq(challengeIdeas.id, id));

  // Get author info
  const [user] = await db
    .select({ name: users.name, image: users.image, username: users.username })
    .from(users)
    .where(eq(users.id, session.user.id));

  return NextResponse.json({
    success: true,
    comment: {
      id: commentId,
      content: content.trim(),
      parentId: parentId || null,
      isEdited: false,
      createdAt: now,
      isOwner: true,
      author: {
        id: session.user.id,
        name: user?.name,
        image: user?.image,
        username: user?.username,
      },
      replies: [],
    },
  }, { status: 201 });
}
