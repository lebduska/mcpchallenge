"use client";

export const runtime = "edge";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Star, User, Settings, Gamepad2, CheckCircle, Lock, Award, Image, ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ReferralCard } from "@/components/referral/referral-card";

interface UserStats {
  totalPoints: number;
  level: number;
  challengesCompleted: number;
  achievementsUnlocked?: number;
}

interface UserData {
  id: string;
  username: string | null;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  stats: UserStats;
}

interface ChallengeProgress {
  maxLevelUnlocked: number;
  lastLevel: number;
  updatedAt: string | null;
}

interface LevelBest {
  levelId: string;
  bestMoves: number | null;
  bestPushes: number | null;
  bestTimeMs: number | null;
}

interface ProgressData {
  progress: ChallengeProgress;
  levelBests: Record<string, LevelBest>;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: string;
  unlocked: boolean;
}

const rarityColors: Record<string, string> = {
  common: "border-zinc-300 dark:border-zinc-600",
  rare: "border-blue-400 dark:border-blue-500",
  epic: "border-purple-400 dark:border-purple-500",
  legendary: "border-amber-400 dark:border-amber-500",
};

const rarityBg: Record<string, string> = {
  common: "bg-zinc-100 dark:bg-zinc-800",
  rare: "bg-blue-50 dark:bg-blue-950/30",
  epic: "bg-purple-50 dark:bg-purple-950/30",
  legendary: "bg-amber-50 dark:bg-amber-950/30",
};

const CHALLENGE_INFO: Record<string, { name: string; totalLevels: number; icon: string }> = {
  chess: { name: "Chess", totalLevels: 1, icon: "♟️" },
  "tic-tac-toe": { name: "Tic-Tac-Toe", totalLevels: 1, icon: "⭕" },
  snake: { name: "Snake", totalLevels: 1, icon: "🐍" },
  minesweeper: { name: "Minesweeper", totalLevels: 3, icon: "💣" },
  sokoban: { name: "Sokoban", totalLevels: 60, icon: "📦" },
  gorillas: { name: "Gorillas", totalLevels: 10, icon: "🍌" },
  "lights-out": { name: "Lights Out", totalLevels: 1, icon: "💡" },
  fractals: { name: "Fractals", totalLevels: 1, icon: "✨" },
  "canvas-draw": { name: "Canvas Draw", totalLevels: 1, icon: "🎨" },
};

interface GalleryImage {
  id: string;
  url: string;
  challengeId: string;
  title: string | null;
  createdAt: string | null;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [challengeProgress, setChallengeProgress] = useState<Record<string, ProgressData>>({});
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      // Fetch user data
      fetch("/api/users/me")
        .then((res) => res.json() as Promise<UserData>)
        .then((data) => {
          setUserData(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));

      // Fetch progress for each challenge
      Object.keys(CHALLENGE_INFO).forEach((challengeId) => {
        fetch(`/api/progress/me?challengeId=${challengeId}`)
          .then((res) => res.json() as Promise<ProgressData>)
          .then((data) => {
            setChallengeProgress((prev) => ({
              ...prev,
              [challengeId]: data,
            }));
          })
          .catch(console.error);
      });

      // Fetch user's achievements
      fetch("/api/progress/me")
        .then((res) => res.json() as Promise<{ achievements?: Achievement[] }>)
        .then((data) => {
          if (data.achievements) {
            setAchievements(data.achievements.map(a => ({ ...a, unlocked: true })));
          }
        })
        .catch(console.error);

      // Fetch user's gallery images
      fetch("/api/gallery?userId=me&limit=8")
        .then((res) => res.json() as Promise<{ images: GalleryImage[] }>)
        .then((data) => {
          if (data.images) {
            setGalleryImages(data.images);
          }
        })
        .catch(console.error);
    }
  }, [status]);

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="flex items-start gap-6 mb-8">
              <div className="w-24 h-24 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="flex-1 space-y-3">
                <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || !session?.user) {
    redirect("/auth/signin");
  }

  const user = userData || {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    stats: { totalPoints: 0, level: 1, challengesCompleted: 0, achievementsUnlocked: 0 },
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="flex items-start gap-6 mb-8">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || "User"}
              className="w-24 h-24 rounded-full"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-3xl font-bold">
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{user.name || "User"}</h1>
            <p className="text-zinc-500 dark:text-zinc-400">{user.email}</p>
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <span className="font-semibold">{user.stats.totalPoints}</span>
                <span className="text-zinc-500">points</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-purple-500" />
                <span className="font-semibold">Level {user.stats.level}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                <span className="font-semibold">{user.stats.challengesCompleted}</span>
                <span className="text-zinc-500">challenges</span>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/settings">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Challenge Progress */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Game Progress
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(CHALLENGE_INFO).map(([challengeId, info]) => {
              const progress = challengeProgress[challengeId]?.progress;
              const levelsCompleted = progress ? progress.maxLevelUnlocked - 1 : 0;
              const percentage = Math.round((levelsCompleted / info.totalLevels) * 100);

              return (
                <Link key={challengeId} href={`/challenges/${challengeId}`}>
                  <Card className="hover:border-zinc-500 transition-colors cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{info.icon}</span>
                          <span className="font-medium">{info.name}</span>
                        </div>
                        {levelsCompleted === info.totalLevels && (
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Levels completed</span>
                          <span className="font-medium">
                            {levelsCompleted} / {info.totalLevels}
                          </span>
                        </div>
                        <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        {progress?.lastLevel && progress.lastLevel > 1 && (
                          <p className="text-xs text-zinc-500">
                            Last played: Level {progress.lastLevel}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Achievements Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Achievements
            </h2>
            <Link href="/achievements">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>

          {achievements.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Lock className="h-8 w-8 text-zinc-400" />
                </div>
                <p className="text-zinc-500 mb-4">No achievements unlocked yet</p>
                <Link href="/challenges">
                  <Button size="sm">Start Playing</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {achievements.slice(0, 10).map((achievement) => (
                <Link key={achievement.id} href={`/achievements/${achievement.id}`}>
                  <div
                    className={cn(
                      "relative p-3 rounded-xl border-2 transition-all hover:scale-105",
                      "bg-white dark:bg-zinc-900",
                      rarityColors[achievement.rarity],
                      rarityBg[achievement.rarity]
                    )}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">{achievement.icon}</div>
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                        {achievement.name}
                      </h4>
                      <Badge
                        className={cn(
                          "mt-1 text-[10px]",
                          achievement.rarity === "legendary" && "bg-amber-500 text-white",
                          achievement.rarity === "epic" && "bg-purple-500 text-white",
                          achievement.rarity === "rare" && "bg-blue-500 text-white",
                          achievement.rarity === "common" && "bg-zinc-500 text-white"
                        )}
                      >
                        +{achievement.points}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* My Gallery */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Image className="h-5 w-5 text-pink-500" />
              My Gallery
            </h2>
            <Link href="/gallery">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>

          {galleryImages.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Image className="h-8 w-8 text-zinc-400" />
                </div>
                <p className="text-zinc-500 mb-4">No creations yet</p>
                <div className="flex gap-2 justify-center">
                  <Link href="/challenges/canvas-draw">
                    <Button size="sm" variant="outline">🎨 Canvas Draw</Button>
                  </Link>
                  <Link href="/challenges/fractals">
                    <Button size="sm" variant="outline">✨ Fractals</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {galleryImages.map((image) => (
                <Link key={image.id} href={`/gallery/${image.id}`}>
                  <div className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all hover:scale-[1.02]">
                    <img
                      src={image.url}
                      alt={image.title || "Gallery image"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-xs text-white truncate">{image.title || CHALLENGE_INFO[image.challengeId]?.name || "Creation"}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Stats
              </CardTitle>
              <CardDescription>
                Your progress overview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">{user.stats.totalPoints}</div>
                  <div className="text-xs text-zinc-500">Total Points</div>
                </div>
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">Lv.{user.stats.level}</div>
                  <div className="text-xs text-zinc-500">Level</div>
                </div>
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600">{user.stats.challengesCompleted}</div>
                  <div className="text-xs text-zinc-500">Challenges</div>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{achievements.length}</div>
                  <div className="text-xs text-zinc-500">Achievements</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referral Card */}
          <ReferralCard />
        </div>
      </div>
    </div>
  );
}
