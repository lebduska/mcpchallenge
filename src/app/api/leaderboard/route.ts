import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { users, userStats } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
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

  // Get top 50 users ordered by totalPoints
  const topUsers = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      image: users.image,
      totalPoints: userStats.totalPoints,
      level: userStats.level,
      challengesCompleted: userStats.challengesCompleted,
      achievementsUnlocked: userStats.achievementsUnlocked,
    })
    .from(userStats)
    .innerJoin(users, eq(userStats.userId, users.id))
    .orderBy(desc(userStats.totalPoints), desc(userStats.challengesCompleted))
    .limit(50);

  // Add rank to each user
  const leaderboard = topUsers.map((user, index) => ({
    ...user,
    rank: index + 1,
    isCurrentUser: session?.user?.id === user.id,
  }));

  // If current user is not in top 50, get their stats separately
  let currentUserRank = null;
  if (session?.user?.id) {
    const currentUserInTop = leaderboard.find((u) => u.isCurrentUser);
    if (!currentUserInTop) {
      // Count how many users have more points than current user
      const currentUserStats = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          image: users.image,
          totalPoints: userStats.totalPoints,
          level: userStats.level,
          challengesCompleted: userStats.challengesCompleted,
          achievementsUnlocked: userStats.achievementsUnlocked,
        })
        .from(userStats)
        .innerJoin(users, eq(userStats.userId, users.id))
        .where(eq(users.id, session.user.id))
        .limit(1);

      if (currentUserStats.length > 0) {
        const userAbove = await db
          .select({ count: userStats.userId })
          .from(userStats)
          .where(desc(userStats.totalPoints))
          .limit(1000); // Get more for ranking

        const allUsersSorted = await db
          .select({
            userId: userStats.userId,
            totalPoints: userStats.totalPoints,
            challengesCompleted: userStats.challengesCompleted,
          })
          .from(userStats)
          .orderBy(desc(userStats.totalPoints), desc(userStats.challengesCompleted));

        const currentRank =
          allUsersSorted.findIndex((u) => u.userId === session.user.id) + 1;

        currentUserRank = {
          ...currentUserStats[0],
          rank: currentRank,
          isCurrentUser: true,
        };
      }
    }
  }

  return NextResponse.json({
    leaderboard,
    currentUserRank,
  });
}
