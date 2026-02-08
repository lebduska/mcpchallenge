import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { achievements, userAchievements, users } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { AchievementShareClient } from "./share-client";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
  searchParams: Promise<{ user?: string }>;
}

async function getAchievementData(id: string, userId?: string) {
  const db = getDb();

  // Get achievement
  const [achievement] = await db
    .select()
    .from(achievements)
    .where(eq(achievements.id, id))
    .limit(1);

  if (!achievement) return null;

  // Get total unlocks count
  const [{ total }] = await db
    .select({ total: count() })
    .from(userAchievements)
    .where(eq(userAchievements.achievementId, id));

  // Get user data if userId provided
  let userData = null;
  let userRank = null;
  let percentile = null;

  if (userId) {
    const [userAchievement] = await db
      .select({
        unlockedAt: userAchievements.unlockedAt,
        userName: users.name,
        userUsername: users.username,
        userImage: users.image,
      })
      .from(userAchievements)
      .innerJoin(users, eq(userAchievements.userId, users.id))
      .where(eq(userAchievements.id, userId))
      .limit(1);

    if (userAchievement) {
      userData = userAchievement;

      // Calculate rank (how many users unlocked before this user)
      // This is simplified - in production you'd want a more efficient query
      const rankResult = await db
        .select({ total: count() })
        .from(userAchievements)
        .where(eq(userAchievements.achievementId, id));
      userRank = rankResult[0]?.total || 1;

      // Calculate percentile (simplified)
      // In production: (users who DON'T have this / total users) * 100
      percentile = total > 100 ? Math.round((1 - total / 1000) * 100) : null;
    }
  }

  return {
    achievement,
    totalUnlocks: total,
    userData,
    userRank,
    percentile,
  };
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { user } = await searchParams;

  const data = await getAchievementData(id, user);
  if (!data) return { title: "Achievement Not Found" };

  const { achievement, userData, percentile, userRank, totalUnlocks } = data;

  const title = `${achievement.name} - Achievement Unlocked!`;
  const description = userData?.userUsername
    ? `@${userData.userUsername} unlocked "${achievement.name}" on MCP Challenge!`
    : `${achievement.description} - ${totalUnlocks} players have this achievement.`;

  // Build OG image URL
  const ogParams = new URLSearchParams({
    name: achievement.name,
    description: achievement.description,
    icon: achievement.icon,
    rarity: achievement.rarity,
    points: String(achievement.points),
  });

  if (userData?.userUsername) {
    ogParams.set("username", userData.userUsername);
  }
  if (percentile) {
    ogParams.set("percentile", String(percentile));
  }
  if (userRank) {
    ogParams.set("rank", String(userRank));
  }
  if (userData?.unlockedAt) {
    const date = new Date(userData.unlockedAt);
    ogParams.set("date", date.toLocaleDateString("en-US", { month: "short", year: "numeric" }));
  }

  const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://mcpchallenge.org"}/api/og/achievement?${ogParams.toString()}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: achievement.name,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function AchievementSharePage({ params, searchParams }: PageProps) {
  const { id, locale } = await params;
  const { user } = await searchParams;

  const data = await getAchievementData(id, user);

  if (!data) {
    notFound();
  }

  const { achievement, totalUnlocks, userData, userRank, percentile } = data;

  // Build share URL
  const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://mcpchallenge.org"}/${locale}/achievements/${id}/share${user ? `?user=${user}` : ""}`;

  // Build tweet text
  const tweetText = userData?.userUsername
    ? `🏆 Just unlocked "${achievement.name}" on @MCPChallenge!\n\n${percentile ? `Top ${percentile}% of players` : ""} ${userRank ? `· #${userRank} to get this` : ""}\n\nThink your AI can do better?`
    : `🏆 "${achievement.name}" - ${achievement.description}\n\n${totalUnlocks} players have unlocked this achievement on @MCPChallenge`;

  return (
    <AchievementShareClient
      achievement={achievement}
      totalUnlocks={totalUnlocks}
      userData={userData}
      userRank={userRank}
      percentile={percentile}
      shareUrl={shareUrl}
      tweetText={tweetText}
    />
  );
}
