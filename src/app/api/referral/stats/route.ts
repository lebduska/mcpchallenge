import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { referralCodes, referrals, users } from "@/db/schema";
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

// GET /api/referral/stats - Get user's referral statistics
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { env } = getRequestContext();
    const db = createDb(env.DB);
    const userId = session.user.id;

    // Get user's referral code
    const [referralCode] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.userId, userId))
      .limit(1);

    // Get all referrals made by this user
    const userReferrals = await db
      .select({
        id: referrals.id,
        refereeId: referrals.refereeId,
        status: referrals.status,
        qualifiedAt: referrals.qualifiedAt,
        rewardedAt: referrals.rewardedAt,
        createdAt: referrals.createdAt,
        refereeName: users.name,
        refereeUsername: users.username,
        refereeImage: users.image,
      })
      .from(referrals)
      .leftJoin(users, eq(referrals.refereeId, users.id))
      .where(eq(referrals.referrerId, userId))
      .orderBy(sql`${referrals.createdAt} DESC`);

    // Count statistics
    const totalReferrals = userReferrals.length;
    const pendingReferrals = userReferrals.filter(r => r.status === "pending").length;
    const qualifiedReferrals = userReferrals.filter(r => r.status === "qualified" || r.status === "rewarded").length;

    // Check if user was referred by someone
    const [user] = await db
      .select({ referredBy: users.referredBy })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    let referredByInfo = null;
    if (user?.referredBy) {
      const [referrerCode] = await db
        .select({
          userId: referralCodes.userId,
        })
        .from(referralCodes)
        .where(eq(referralCodes.code, user.referredBy))
        .limit(1);

      if (referrerCode) {
        const [referrer] = await db
          .select({ name: users.name, username: users.username, image: users.image })
          .from(users)
          .where(eq(users.id, referrerCode.userId))
          .limit(1);

        if (referrer) {
          referredByInfo = {
            name: referrer.name || referrer.username || "A friend",
            image: referrer.image,
          };
        }
      }
    }

    return NextResponse.json({
      code: referralCode?.code || null,
      shareUrl: referralCode ? `https://mcpchallenge.org/join?ref=${referralCode.code}` : null,
      stats: {
        totalReferrals,
        pendingReferrals,
        qualifiedReferrals,
      },
      referrals: userReferrals.map(r => ({
        id: r.id,
        name: r.refereeName || r.refereeUsername || "Anonymous",
        image: r.refereeImage,
        status: r.status,
        createdAt: r.createdAt,
        qualifiedAt: r.qualifiedAt,
      })),
      referredBy: referredByInfo,
    });
  } catch (error) {
    console.error("Error fetching referral stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral stats" },
      { status: 500 }
    );
  }
}
