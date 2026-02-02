import { notFound, redirect } from "next/navigation";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { achievements, userAchievements, users } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, ArrowLeft, Share2 } from "lucide-react";
import Link from "next/link";
import { ShareButtons } from "@/components/share/share-buttons";
import NextAuth from "next-auth";
import { createAuthConfig } from "@/lib/auth";
import type { Metadata } from "next";

export const runtime = "edge";

async function getSession() {
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const { auth } = NextAuth(createAuthConfig(db));
  return auth();
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { env } = getRequestContext();
  const db = createDb(env.DB);

  const achievement = await db.query.achievements.findFirst({
    where: eq(achievements.id, id),
  });

  if (!achievement) {
    return {
      title: "Achievement Not Found",
    };
  }

  const baseUrl = "https://mcpchallenge.org";

  return {
    title: `${achievement.name} - Achievement`,
    description: achievement.description,
    openGraph: {
      title: `${achievement.icon} ${achievement.name}`,
      description: `${achievement.description} - ${achievement.points} points (${achievement.rarity})`,
      url: `${baseUrl}/achievements/${id}`,
      siteName: "MCP Challenge",
      images: [
        {
          url: `${baseUrl}/api/og/achievement/${id}`,
          width: 1200,
          height: 630,
          alt: achievement.name,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${achievement.icon} ${achievement.name}`,
      description: `${achievement.description} - ${achievement.points} points`,
      images: [`${baseUrl}/api/og/achievement/${id}`],
    },
  };
}

export default async function AchievementDetailPage({ params }: PageProps) {
  const session = await getSession();

  // Redirect non-logged users to achievements page (which shows sign-in prompt)
  if (!session) {
    redirect("/achievements");
  }

  const { id } = await params;
  const { env } = getRequestContext();
  const db = createDb(env.DB);

  const achievement = await db.query.achievements.findFirst({
    where: eq(achievements.id, id),
  });

  if (!achievement) {
    notFound();
  }

  // Get count of users who unlocked this achievement
  const unlockCount = await db
    .select({ count: count() })
    .from(userAchievements)
    .where(eq(userAchievements.achievementId, id));

  // Get recent unlockers
  const recentUnlockers = await db
    .select({
      username: users.username,
      name: users.name,
      image: users.image,
      unlockedAt: userAchievements.unlockedAt,
    })
    .from(userAchievements)
    .innerJoin(users, eq(userAchievements.userId, users.id))
    .where(eq(userAchievements.achievementId, id))
    .orderBy(desc(userAchievements.unlockedAt))
    .limit(10);

  const rarityColors: Record<string, string> = {
    common: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
    rare: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    epic: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    legendary: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  };

  const rarityBorders: Record<string, string> = {
    common: "border-zinc-300 dark:border-zinc-700",
    rare: "border-blue-400 dark:border-blue-600",
    epic: "border-purple-400 dark:border-purple-600",
    legendary: "border-amber-400 dark:border-amber-600",
  };

  const shareUrl = `https://mcpchallenge.org/achievements/${id}`;
  const shareTitle = `I'm working towards the "${achievement.name}" achievement on MCP Challenge!`;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/achievements"
          className="inline-flex items-center text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Achievements
        </Link>

        {/* Achievement Card */}
        <Card className={`border-2 ${rarityBorders[achievement.rarity]} mb-8`}>
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">{achievement.icon}</div>
            <CardTitle className="text-3xl">{achievement.name}</CardTitle>
            <CardDescription className="text-lg">
              {achievement.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-4 mb-6">
              <Badge className={`${rarityColors[achievement.rarity]} px-4 py-1 text-sm`}>
                {achievement.rarity}
              </Badge>
              <Badge variant="outline" className="px-4 py-1 text-sm">
                {achievement.category}
              </Badge>
              <div className="flex items-center gap-1 text-amber-600 font-semibold">
                <Trophy className="h-4 w-4" />
                +{achievement.points} pts
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center items-center gap-2 text-zinc-600 dark:text-zinc-400 mb-6">
              <Users className="h-4 w-4" />
              <span>
                {unlockCount[0]?.count || 0} {unlockCount[0]?.count === 1 ? "user has" : "users have"} unlocked this
              </span>
            </div>

            {/* Share */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Share2 className="h-5 w-5" />
                <span className="font-medium">Share this achievement</span>
              </div>
              <ShareButtons
                url={shareUrl}
                title={shareTitle}
                description={achievement.description}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Unlockers */}
        {recentUnlockers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Unlockers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentUnlockers.map((user, i) => (
                  <Link
                    key={i}
                    href={`/profile/${user.username}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name || user.username || "User"}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-medium">
                        {(user.name || user.username || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {user.name || user.username}
                      </div>
                      <div className="text-xs text-zinc-500">
                        @{user.username}
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500">
                      {user.unlockedAt && new Date(user.unlockedAt).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
