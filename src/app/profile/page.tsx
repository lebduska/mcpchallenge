"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Target, Star, User, Settings } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
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

  const user = session.user;

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
                <span className="font-semibold">0</span>
                <span className="text-zinc-500">points</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-purple-500" />
                <span className="font-semibold">Level 1</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                <span className="font-semibold">0</span>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Achievements
              </CardTitle>
              <CardDescription>
                0 achievements unlocked
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-500 text-sm">
                No achievements yet. Start completing challenges!
              </p>
              <Link href="/challenges" className="mt-4 inline-block">
                <Button size="sm">Browse Challenges</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Getting Started
              </CardTitle>
              <CardDescription>
                Welcome to MCP Challenge!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Complete challenges to earn points and unlock achievements.
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">1.</span>
                  <Link href="/learn" className="hover:underline">Learn MCP basics</Link>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">2.</span>
                  <Link href="/challenges/hello-world" className="hover:underline">Build your first MCP server</Link>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">3.</span>
                  <Link href="/challenges" className="hover:underline">Try game challenges</Link>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
