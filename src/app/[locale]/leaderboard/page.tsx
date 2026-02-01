"use client";

export const runtime = "edge";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Target, Medal, Crown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface LeaderboardUser {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
  totalPoints: number;
  level: number;
  challengesCompleted: number;
  achievementsUnlocked: number;
  rank: number;
  isCurrentUser: boolean;
}

interface LeaderboardData {
  leaderboard: LeaderboardUser[];
  currentUserRank: LeaderboardUser | null;
}

export default function LeaderboardPage() {
  const t = useTranslations("leaderboard");
  const tCommon = useTranslations("common");
  const { data: session } = useSession();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        const response = await fetch("/api/leaderboard");
        if (!response.ok) {
          throw new Error("Failed to fetch leaderboard");
        }
        const data = await response.json() as LeaderboardData;
        setData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-amber-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-zinc-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="text-sm font-semibold text-zinc-500">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-300";
      case 2:
        return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-300";
      case 3:
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="h-8 w-8 text-amber-500" />
              {t("title")}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
              {t("subtitle")}
            </p>
          </div>
          <div className="animate-pulse space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-20 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Trophy className="h-8 w-8 text-amber-500" />
            {t("title")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            {t("subtitle")}
          </p>
        </div>

        {/* Current User Rank (if not in top 50) */}
        {data?.currentUserRank && !data.leaderboard.find(u => u.isCurrentUser) && (
          <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {t("you")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-3 bg-white dark:bg-zinc-900 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <span className="text-sm font-bold text-blue-900 dark:text-blue-100">
                    #{data.currentUserRank.rank}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-1">
                  {data.currentUserRank.image ? (
                    <img
                      src={data.currentUserRank.image}
                      alt={data.currentUserRank.name || "User"}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-bold">
                      {(data.currentUserRank.name || data.currentUserRank.username || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">
                      {data.currentUserRank.name || data.currentUserRank.username || "Anonymous"}
                    </div>
                    {data.currentUserRank.username && data.currentUserRank.name && (
                      <div className="text-xs text-zinc-500 truncate">
                        @{data.currentUserRank.username}
                      </div>
                    )}
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">{data.currentUserRank.level}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold">{data.currentUserRank.totalPoints}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-green-500" />
                    <span>{data.currentUserRank.challengesCompleted}</span>
                  </div>
                </div>
                <div className="flex sm:hidden flex-col items-end text-sm">
                  <div className="font-semibold text-amber-600">
                    {data.currentUserRank.totalPoints} pts
                  </div>
                  <div className="text-xs text-zinc-500">
                    {tCommon("level")} {data.currentUserRank.level}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>
              Top 50 MCP developers
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {/* Desktop Table Header */}
            <div className="hidden md:grid grid-cols-[80px_1fr_120px_120px_140px] gap-4 px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-500">
              <div>{t("rank")}</div>
              <div>{t("player")}</div>
              <div className="text-center">{t("level")}</div>
              <div className="text-center">{t("points")}</div>
              <div className="text-center">{t("challenges")}</div>
            </div>

            {/* Leaderboard Rows */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data?.leaderboard.map((user) => (
                <div
                  key={user.id}
                  className={`grid grid-cols-[60px_1fr_auto] md:grid-cols-[80px_1fr_120px_120px_140px] gap-3 md:gap-4 px-4 md:px-6 py-4 items-center transition-colors ${
                    user.isCurrentUser
                      ? "bg-blue-50 dark:bg-blue-950/30 border-l-4 border-l-blue-500"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  }`}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center">
                    {user.rank <= 3 ? (
                      <div className={`flex items-center justify-center w-12 h-12 rounded-lg border-2 ${getRankBadgeColor(user.rank)}`}>
                        {getRankIcon(user.rank)}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                        {getRankIcon(user.rank)}
                      </div>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name || "User"}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {(user.name || user.username || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate flex items-center gap-2">
                        {user.name || user.username || "Anonymous"}
                        {user.isCurrentUser && (
                          <Badge variant="outline" className="text-xs">
                            {t("you")}
                          </Badge>
                        )}
                      </div>
                      {user.username && user.name && (
                        <div className="text-xs text-zinc-500 truncate">
                          @{user.username}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile Stats */}
                  <div className="flex md:hidden flex-col items-end text-sm">
                    <div className="font-semibold text-amber-600">
                      {user.totalPoints} pts
                    </div>
                    <div className="text-xs text-zinc-500">
                      {tCommon("level")} {user.level}
                    </div>
                  </div>

                  {/* Desktop Stats */}
                  <div className="hidden md:flex items-center justify-center gap-1.5">
                    <Star className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">{user.level}</span>
                  </div>

                  <div className="hidden md:flex items-center justify-center gap-1.5">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold text-amber-600 dark:text-amber-500">
                      {user.totalPoints}
                    </span>
                  </div>

                  <div className="hidden md:flex items-center justify-center gap-1.5">
                    <Target className="h-4 w-4 text-green-500" />
                    <span>{user.challengesCompleted}</span>
                  </div>
                </div>
              ))}
            </div>

            {data?.leaderboard.length === 0 && (
              <div className="px-6 py-12 text-center">
                <Trophy className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">No users on the leaderboard yet.</p>
                <p className="text-sm text-zinc-400 mt-2">
                  Be the first to complete challenges and earn points!
                </p>
                {!session && (
                  <Link href="/auth/signin" className="inline-block mt-4">
                    <Badge variant="outline" className="text-sm">
                      {tCommon("signIn")} to get started
                    </Badge>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
              <p className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                Rankings are based on total points earned from challenges and achievements.
              </p>
              <p className="flex items-center gap-2">
                <Star className="h-4 w-4 text-purple-500" />
                Level up by completing more challenges and earning achievements.
              </p>
              {!session && (
                <p className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <Link href="/auth/signin" className="text-blue-600 dark:text-blue-400 hover:underline">
                    {tCommon("signIn")}
                  </Link>
                  <span>to track your progress and compete on the leaderboard!</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
