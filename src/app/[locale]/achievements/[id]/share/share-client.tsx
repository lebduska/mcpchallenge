"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Twitter,
  Linkedin,
  Link2,
  Check,
  Share2,
  Trophy,
  Users,
  Clock,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getRarityConfig } from "@/lib/rarity";
import { RarityBadge } from "@/components/achievements/rarity-badge";
import Link from "next/link";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: string;
}

interface UserData {
  unlockedAt: Date | null;
  userName: string | null;
  userUsername: string | null;
  userImage: string | null;
}

interface AchievementShareClientProps {
  achievement: Achievement;
  totalUnlocks: number;
  userData: UserData | null;
  userRank: number | null;
  percentile: number | null;
  shareUrl: string;
  tweetText: string;
}

export function AchievementShareClient({
  achievement,
  totalUnlocks,
  userData,
  userRank,
  percentile,
  shareUrl,
  tweetText,
}: AchievementShareClientProps) {
  const [copied, setCopied] = useState(false);
  const config = getRarityConfig(achievement.rarity);
  const isLegendary = achievement.rarity === "legendary";
  const isEpic = achievement.rarity === "epic";

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "width=550,height=420");
  };

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "width=550,height=420");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Background glow */}
      {(isLegendary || isEpic) && (
        <div
          className={cn(
            "fixed inset-0 opacity-20 pointer-events-none",
            isLegendary && "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/30 via-transparent to-transparent",
            isEpic && "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/30 via-transparent to-transparent"
          )}
        />
      )}

      <div className="relative max-w-2xl mx-auto px-4 py-12">
        {/* Back link */}
        <Link
          href="/achievements"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All Achievements
        </Link>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-2xl border-2 p-8 overflow-hidden relative",
            config.bgColor,
            config.borderColor,
            (isLegendary || isEpic) && "shadow-2xl"
          )}
          style={{
            boxShadow: isLegendary
              ? "0 0 60px rgba(251, 191, 36, 0.3)"
              : isEpic
                ? "0 0 50px rgba(168, 85, 247, 0.3)"
                : undefined,
          }}
        >
          {/* Animated border for legendary */}
          {isLegendary && (
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/30 to-amber-400/0 animate-shimmer-border" />
            </div>
          )}

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <RarityBadge rarity={achievement.rarity} size="lg" showIcon />
            <div className={cn("flex items-center gap-2 text-lg font-bold", config.textColor)}>
              <Trophy className="h-5 w-5" />
              +{achievement.points} pts
            </div>
          </div>

          {/* Achievement content */}
          <div className="flex items-center gap-6 mb-8">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 10 }}
              className={cn(
                "w-24 h-24 rounded-2xl flex items-center justify-center text-5xl",
                config.iconBg,
                isLegendary && "animate-bounce-subtle"
              )}
            >
              {achievement.icon}
            </motion.div>

            {/* Text */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                {achievement.name}
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                {achievement.description}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 mb-8">
            {totalUnlocks > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/50 dark:bg-black/20">
                <Users className="h-4 w-4 text-zinc-500" />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {totalUnlocks.toLocaleString()} players
                </span>
              </div>
            )}
            {percentile && (
              <div className={cn("flex items-center gap-2 px-4 py-2 rounded-xl", config.badgeBg)}>
                <span className={cn("text-sm font-bold", config.textColor)}>
                  Top {percentile}%
                </span>
              </div>
            )}
            {userRank && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/50 dark:bg-black/20">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  #{userRank} to unlock
                </span>
              </div>
            )}
          </div>

          {/* User info */}
          {userData?.userUsername && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/30 dark:bg-black/20 mb-8">
              {userData.userImage && (
                <img
                  src={userData.userImage}
                  alt={userData.userName || ""}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <div className="font-medium text-zinc-900 dark:text-white">
                  {userData.userName || userData.userUsername}
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Clock className="h-3 w-3" />
                  {userData.unlockedAt &&
                    new Date(userData.unlockedAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Share buttons */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 mb-3">
              <Share2 className="h-4 w-4" />
              Share this achievement
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={shareToTwitter}
                className="flex-1 gap-2 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </Button>

              <Button
                onClick={shareToLinkedIn}
                className="flex-1 gap-2 bg-[#0A66C2] hover:bg-[#094d92] text-white"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </Button>

              <Button
                onClick={copyLink}
                variant="outline"
                className={cn(
                  "flex-1 gap-2",
                  copied && "bg-emerald-500/20 border-emerald-500 text-emerald-600"
                )}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-zinc-400 mb-4">
            Think your AI can do better?
          </p>
          <Link href="/challenges">
            <Button size="lg" className="gap-2">
              <Trophy className="h-5 w-5" />
              Try the Challenges
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-zinc-500">
          <a
            href="https://mcpchallenge.org"
            className="hover:text-white transition-colors"
          >
            mcpchallenge.org
          </a>
          {" · "}
          <span>Test your AI with MCP-powered challenges</span>
        </div>
      </div>
    </div>
  );
}
