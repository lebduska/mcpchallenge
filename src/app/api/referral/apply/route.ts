import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { referralCodes, referrals, users, userAchievements, achievements, userStats } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
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

// POST /api/referral/apply - Apply a referral code after signup
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await request.json() as { code?: string };

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Referral code is required" }, { status: 400 });
    }

    const { env } = getRequestContext();
    const db = createDb(env.DB);
    const userId = session.user.id;

    // Check if user already used a referral code
    const [user] = await db
      .select({ referredBy: users.referredBy })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user?.referredBy) {
      return NextResponse.json(
        { error: "You have already used a referral code" },
        { status: 400 }
      );
    }

    // Normalize code (uppercase, trim)
    const normalizedCode = code.trim().toUpperCase();

    // Find the referral code
    const [referralCode] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.code, normalizedCode))
      .limit(1);

    if (!referralCode) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }

    // Check if code is expired
    if (referralCode.expiresAt && referralCode.expiresAt < new Date()) {
      return NextResponse.json({ error: "Referral code has expired" }, { status: 400 });
    }

    // Check if code has reached max uses
    if (referralCode.maxUses !== null && referralCode.usageCount >= referralCode.maxUses) {
      return NextResponse.json({ error: "Referral code has reached its usage limit" }, { status: 400 });
    }

    // Can't refer yourself
    if (referralCode.userId === userId) {
      return NextResponse.json({ error: "You cannot use your own referral code" }, { status: 400 });
    }

    // Check if referral already exists
    const [existingReferral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.refereeId, userId))
      .limit(1);

    if (existingReferral) {
      return NextResponse.json(
        { error: "You have already been referred" },
        { status: 400 }
      );
    }

    // Apply the referral
    await db.transaction(async (tx) => {
      // Update user's referredBy
      await tx
        .update(users)
        .set({ referredBy: normalizedCode, updatedAt: new Date() })
        .where(eq(users.id, userId));

      // Create referral record
      await tx.insert(referrals).values({
        referrerId: referralCode.userId,
        refereeId: userId,
        codeUsed: normalizedCode,
        status: "pending",
      });

      // Increment usage count
      await tx
        .update(referralCodes)
        .set({ usageCount: sql`${referralCodes.usageCount} + 1` })
        .where(eq(referralCodes.id, referralCode.id));

      // Grant "referred-friend" achievement to the new user
      const [existingAchievement] = await tx
        .select()
        .from(userAchievements)
        .where(and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, "referred-friend")
        ))
        .limit(1);

      if (!existingAchievement) {
        // Get achievement details
        const [achievement] = await tx
          .select()
          .from(achievements)
          .where(eq(achievements.id, "referred-friend"))
          .limit(1);

        if (achievement) {
          // Grant achievement
          await tx.insert(userAchievements).values({
            userId,
            achievementId: "referred-friend",
          });

          // Update user stats
          const [stats] = await tx
            .select()
            .from(userStats)
            .where(eq(userStats.userId, userId))
            .limit(1);

          if (stats) {
            await tx
              .update(userStats)
              .set({
                totalPoints: sql`${userStats.totalPoints} + ${achievement.points}`,
                achievementsUnlocked: sql`${userStats.achievementsUnlocked} + 1`,
                updatedAt: new Date(),
              })
              .where(eq(userStats.userId, userId));
          } else {
            await tx.insert(userStats).values({
              userId,
              totalPoints: achievement.points,
              achievementsUnlocked: 1,
              level: 1,
              challengesCompleted: 0,
              currentStreak: 0,
              longestStreak: 0,
              dailyStreak: 0,
              longestDailyStreak: 0,
            });
          }
        }
      }
    });

    // Get referrer's name for display
    const [referrer] = await db
      .select({ name: users.name, username: users.username })
      .from(users)
      .where(eq(users.id, referralCode.userId))
      .limit(1);

    return NextResponse.json({
      success: true,
      message: "Referral code applied successfully",
      referrerName: referrer?.name || referrer?.username || "A friend",
      achievementUnlocked: "referred-friend",
    });
  } catch (error) {
    console.error("Error applying referral code:", error);
    return NextResponse.json(
      { error: "Failed to apply referral code" },
      { status: 500 }
    );
  }
}
