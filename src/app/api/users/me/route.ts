import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { users, userStats } from "@/db/schema";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import { createAuthConfig } from "@/lib/auth";

export const runtime = "edge";

async function getSession() {
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const { auth } = NextAuth(createAuthConfig(db));
  return auth();
}

export async function GET() {
  const { env } = getRequestContext();
  const db = createDb(env.DB);

  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const stats = await db.query.userStats.findFirst({
    where: eq(userStats.userId, user.id),
  });

  return NextResponse.json({
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    image: user.image,
    bio: user.bio,
    stats: stats || { totalPoints: 0, level: 1, challengesCompleted: 0, achievementsUnlocked: 0 },
  });
}

export async function PATCH(request: Request) {
  const { env } = getRequestContext();
  const db = createDb(env.DB);

  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { username?: string; name?: string; bio?: string };
  const { username, name, bio } = body;

  // Validate username format
  if (username && !/^[a-zA-Z0-9_-]+$/.test(username)) {
    return NextResponse.json(
      { error: "Username can only contain letters, numbers, underscores and hyphens" },
      { status: 400 }
    );
  }

  // Check if username is taken by another user
  if (username) {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, username),
    });
    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 400 }
      );
    }
  }

  // Update user
  await db
    .update(users)
    .set({
      username: username || undefined,
      name: name || undefined,
      bio: bio || undefined,
    })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ success: true });
}
