import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { achievements, userAchievements } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Lock } from "lucide-react";
import NextAuth from "next-auth";
import { createAuthConfig } from "@/lib/auth";
import Link from "next/link";

export const runtime = "edge";

async function getSession() {
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const { auth } = NextAuth(createAuthConfig(db));
  return auth();
}

export default async function AchievementsPage() {
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  const session = await getSession();

  // Get all achievements (with error handling for missing table)
  let allAchievements: typeof achievements.$inferSelect[] = [];
  try {
    allAchievements = await db.select().from(achievements);
  } catch {
    // Table might not exist in local dev - seed the database
    console.error("Achievements table not found. Run migrations with: npx wrangler d1 execute mcpchallenge-db --local --file=drizzle/migrations/0000_initial.sql");
  }

  // Get user's unlocked achievements if logged in
  let unlockedIds = new Set<string>();
  if (session?.user?.id) {
    const userUnlocked = await db
      .select({ achievementId: userAchievements.achievementId })
      .from(userAchievements)
      .where(eq(userAchievements.userId, session.user.id));
    unlockedIds = new Set(userUnlocked.map((a) => a.achievementId));
  }

  const rarityColors: Record<string, string> = {
    common: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
    rare: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    epic: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    legendary: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  };

  const categoryNames: Record<string, string> = {
    milestone: "Milestones",
    challenge: "Challenges",
    special: "Special",
  };

  // Group achievements by category
  const grouped = allAchievements.reduce(
    (acc, achievement) => {
      const category = achievement.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(achievement);
      return acc;
    },
    {} as Record<string, typeof allAchievements>
  );

  const totalUnlocked = unlockedIds.size;
  const totalAchievements = allAchievements.length;
  const totalPoints = allAchievements
    .filter((a) => unlockedIds.has(a.id))
    .reduce((sum, a) => sum + a.points, 0);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Trophy className="h-8 w-8 text-amber-500" />
            Achievements
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Complete challenges and earn achievements to show off your MCP skills.
          </p>
        </div>

        {/* Stats */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-amber-500">{totalUnlocked}</div>
                <div className="text-sm text-zinc-500">Unlocked</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{totalAchievements}</div>
                <div className="text-sm text-zinc-500">Total</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-500">{totalPoints}</div>
                <div className="text-sm text-zinc-500">Points Earned</div>
              </div>
            </div>
            {!session && (
              <p className="text-center text-sm text-zinc-500 mt-4">
                <Link href="/auth/signin" className="underline">Sign in</Link> to track your achievements.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Achievement categories */}
        {Object.entries(grouped).map(([category, categoryAchievements]) => (
          <Card key={category} className="mb-6">
            <CardHeader>
              <CardTitle>{categoryNames[category] || category}</CardTitle>
              <CardDescription>
                {categoryAchievements.filter((a) => unlockedIds.has(a.id)).length} / {categoryAchievements.length} unlocked
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryAchievements.map((achievement) => {
                  const isUnlocked = unlockedIds.has(achievement.id);
                  return (
                    <Link
                      key={achievement.id}
                      href={`/achievements/${achievement.id}`}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-md ${
                        isUnlocked
                          ? "bg-white dark:bg-zinc-900 border-amber-200 dark:border-amber-800 hover:border-amber-400"
                          : "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 opacity-60 hover:opacity-80"
                      }`}
                    >
                      <div
                        className={`text-3xl ${
                          isUnlocked ? "" : "grayscale opacity-50"
                        }`}
                      >
                        {isUnlocked ? achievement.icon : <Lock className="h-8 w-8" />}
                      </div>
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
                        <div className={`text-sm font-medium ${isUnlocked ? "text-amber-600" : "text-zinc-400"}`}>
                          +{achievement.points}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
