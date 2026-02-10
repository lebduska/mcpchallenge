import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { referrals, users, userAchievements, achievements, userStats } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { createAuthConfig } from "@/lib/auth";

export const runtime = "edge";

async function getSession() {
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const { auth } = NextAuth(createAuthConfig(db));
  return auth();
}

// POST /api/referral/qualify - Called when a user completes their first challenge
// This qualifies any pending referral and grants achievements to the referrer
export async function POST() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { env } = getRequestContext();
    const db = createDb(env.DB);
    const userId = session.user.id;

    // Find pending referral where this user is the referee
    const [pendingReferral] = await db
      .select()
      .from(referrals)
      .where(and(
        eq(referrals.refereeId, userId),
        eq(referrals.status, "pending")
      ))
      .limit(1);

    if (!pendingReferral) {
      // No pending referral - that's fine, just return
      return NextResponse.json({ success: true, qualified: false });
    }

    const referrerId = pendingReferral.referrerId;

    // Update referral status to qualified
    await db
      .update(referrals)
      .set({
        status: "qualified",
        qualifiedAt: new Date(),
      })
      .where(eq(referrals.id, pendingReferral.id));

    // Count qualified referrals for the referrer
    const qualifiedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(referrals)
      .where(and(
        eq(referrals.referrerId, referrerId),
        eq(referrals.status, "qualified")
      ));

    const totalQualified = Number(qualifiedCount[0]?.count || 0) + 1; // +1 for this one

    // Check and grant achievements to referrer
    const achievementsToGrant: string[] = [];

    // First referral achievement
    if (totalQualified >= 1) {
      const [existing] = await db
        .select()
        .from(userAchievements)
        .where(and(
          eq(userAchievements.userId, referrerId),
          eq(userAchievements.achievementId, "referral-first")
        ))
        .limit(1);

      if (!existing) {
        achievementsToGrant.push("referral-first");
      }
    }

    // 5 referrals achievement
    if (totalQualified >= 5) {
      const [existing] = await db
        .select()
        .from(userAchievements)
        .where(and(
          eq(userAchievements.userId, referrerId),
          eq(userAchievements.achievementId, "referral-5")
        ))
        .limit(1);

      if (!existing) {
        achievementsToGrant.push("referral-5");
      }
    }

    // Grant achievements
    let totalPoints = 0;
    for (const achievementId of achievementsToGrant) {
      const [achievement] = await db
        .select()
        .from(achievements)
        .where(eq(achievements.id, achievementId))
        .limit(1);

      if (achievement) {
        await db.insert(userAchievements).values({
          userId: referrerId,
          achievementId,
        });
        totalPoints += achievement.points;
      }
    }

    // Update referrer's stats if achievements were granted
    if (totalPoints > 0) {
      const [stats] = await db
        .select()
        .from(userStats)
        .where(eq(userStats.userId, referrerId))
        .limit(1);

      if (stats) {
        await db
          .update(userStats)
          .set({
            totalPoints: sql`${userStats.totalPoints} + ${totalPoints}`,
            achievementsUnlocked: sql`${userStats.achievementsUnlocked} + ${achievementsToGrant.length}`,
            updatedAt: new Date(),
          })
          .where(eq(userStats.userId, referrerId));
      } else {
        await db.insert(userStats).values({
          userId: referrerId,
          totalPoints,
          achievementsUnlocked: achievementsToGrant.length,
          level: 1,
          challengesCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          dailyStreak: 0,
          longestDailyStreak: 0,
        });
      }
    }

    return NextResponse.json({
      success: true,
      qualified: true,
      referrerId,
      achievementsGranted: achievementsToGrant,
    });
  } catch (error) {
    console.error("Error qualifying referral:", error);
    return NextResponse.json(
      { error: "Failed to qualify referral" },
      { status: 500 }
    );
  }
}
