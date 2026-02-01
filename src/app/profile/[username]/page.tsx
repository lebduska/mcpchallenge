import { notFound } from "next/navigation";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { users, userStats, userAchievements, achievements, challengeCompletions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Star, Calendar, Share2 } from "lucide-react";
import Link from "next/link";
import { ShareButtons } from "@/components/share/share-buttons";
import type { Metadata } from "next";

export const runtime = "edge";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const { env } = getRequestContext();
  const db = createDb(env.DB);

  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!user) {
    return { title: "User Not Found" };
  }

  const stats = await db.query.userStats.findFirst({
    where: eq(userStats.userId, user.id),
  });

  const baseUrl = "https://mcpchallenge.org";
  const title = `${user.name || username}'s Profile`;
  const description = `Level ${stats?.level || 1} | ${stats?.totalPoints || 0} points | ${stats?.challengesCompleted || 0} challenges completed`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/profile/${username}`,
      siteName: "MCP Challenge",
      images: [
        {
          url: `${baseUrl}/api/og/profile/${username}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${baseUrl}/api/og/profile/${username}`],
    },
  };
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;
  const { env } = getRequestContext();
  const db = createDb(env.DB);

  // Fetch user
  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!user) {
    notFound();
  }

  // Fetch user stats
  const stats = await db.query.userStats.findFirst({
    where: eq(userStats.userId, user.id),
  });

  // Fetch user achievements with details
  const userAchievementsList = await db
    .select({
      achievement: achievements,
      unlockedAt: userAchievements.unlockedAt,
    })
    .from(userAchievements)
    .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
    .where(eq(userAchievements.userId, user.id))
    .orderBy(desc(userAchievements.unlockedAt));

  // Fetch recent challenge completions
  const recentCompletions = await db
    .select()
    .from(challengeCompletions)
    .where(eq(challengeCompletions.userId, user.id))
    .orderBy(desc(challengeCompletions.completedAt))
    .limit(10);

  const rarityColors: Record<string, string> = {
    common: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
    rare: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    epic: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    legendary: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  };

  const challengeNames: Record<string, string> = {
    chess: "Chess",
    "tic-tac-toe": "Tic-Tac-Toe",
    snake: "Snake",
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="flex items-start gap-6 mb-8">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || username}
              className="w-24 h-24 rounded-full"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-3xl font-bold">
              {(user.name || username).charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{user.name || username}</h1>
            <p className="text-zinc-500 dark:text-zinc-400">@{username}</p>
            {user.bio && (
              <p className="mt-2 text-zinc-600 dark:text-zinc-300">{user.bio}</p>
            )}
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <span className="font-semibold">{stats?.totalPoints || 0}</span>
                <span className="text-zinc-500">points</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-purple-500" />
                <span className="font-semibold">Level {stats?.level || 1}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                <span className="font-semibold">{stats?.challengesCompleted || 0}</span>
                <span className="text-zinc-500">challenges</span>
              </div>
            </div>
            {/* Share */}
            <div className="flex items-center gap-3 mt-4">
              <Share2 className="h-4 w-4 text-zinc-500" />
              <ShareButtons
                url={`https://mcpchallenge.org/profile/${username}`}
                title={`Check out ${user.name || username}'s profile on MCP Challenge!`}
                description={`Level ${stats?.level || 1} with ${stats?.totalPoints || 0} points`}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Achievements
              </CardTitle>
              <CardDescription>
                {userAchievementsList.length} achievements unlocked
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userAchievementsList.length === 0 ? (
                <p className="text-zinc-500 text-sm">No achievements yet. Start completing challenges!</p>
              ) : (
                <div className="space-y-3">
                  {userAchievementsList.map(({ achievement, unlockedAt }) => (
                    <div
                      key={achievement.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900"
                    >
                      <span className="text-2xl">{achievement.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{achievement.name}</span>
                          <Badge className={rarityColors[achievement.rarity]}>
                            {achievement.rarity}
                          </Badge>
                        </div>
                        <p className="text-sm text-zinc-500 truncate">
                          {achievement.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-amber-600">
                          +{achievement.points}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest challenge completions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentCompletions.length === 0 ? (
                <p className="text-zinc-500 text-sm">No completed challenges yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentCompletions.map((completion) => (
                    <Link
                      key={completion.id}
                      href={`/challenges/${completion.challengeId}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <div>
                        <div className="font-medium">
                          {challengeNames[completion.challengeId] || completion.challengeId}
                        </div>
                        <div className="text-sm text-zinc-500">
                          {completion.completedAt && new Date(completion.completedAt).toLocaleDateString()}
                        </div>
                      </div>
                      {completion.score !== null && (
                        <div className="text-right">
                          <div className="font-semibold">{completion.score}</div>
                          <div className="text-xs text-zinc-500">score</div>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
