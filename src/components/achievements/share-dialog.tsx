"use client";

/**
 * ShareDialog - Quick share modal for achievements
 *
 * Opens from toast or achievement card, allows sharing to social media
 * with pre-filled text and dynamic OG image URL.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Twitter,
  Linkedin,
  Link2,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getRarityConfig } from "@/lib/rarity";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: string;
}

interface ShareDialogProps {
  achievement: Achievement;
  isOpen: boolean;
  onClose: () => void;
  userAchievementId?: string; // For personalized share URL
  percentile?: number;
  rank?: number;
}

export function ShareDialog({
  achievement,
  isOpen,
  onClose,
  userAchievementId,
  percentile,
  rank,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const config = getRarityConfig(achievement.rarity);

  // Build share URL
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://mcpchallenge.org";
  const shareUrl = userAchievementId
    ? `${baseUrl}/achievements/${achievement.id}/share?user=${userAchievementId}`
    : `${baseUrl}/achievements/${achievement.id}/share`;

  // Build tweet text
  const rarityEmoji = {
    legendary: "👑",
    epic: "💜",
    rare: "💎",
    common: "🏆",
  }[achievement.rarity] || "🏆";

  const statsText = [
    percentile && `Top ${percentile}%`,
    rank && `#${rank} to unlock`,
  ].filter(Boolean).join(" · ");

  const tweetText = `${rarityEmoji} Just unlocked "${achievement.name}" on @MCPChallenge!

${statsText ? `${statsText}\n\n` : ""}Think your AI can do better?`;

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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md"
          >
            <div className={cn(
              "rounded-2xl border-2 p-6 shadow-2xl",
              config.bgColor,
              config.borderColor
            )}>
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center text-3xl",
                  config.iconBg
                )}>
                  {achievement.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                    Share Achievement
                  </h3>
                  <p className="text-sm text-zinc-500">
                    {achievement.name}
                  </p>
                </div>
              </div>

              {/* Preview card (mini) */}
              <div className="mb-6 p-4 rounded-xl bg-zinc-900 dark:bg-zinc-950">
                <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                  <ExternalLink className="h-3 w-3" />
                  Preview on social media
                </div>
                <div className="aspect-[1200/630] rounded-lg overflow-hidden bg-zinc-800 relative">
                  {/* Mini preview of OG image */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">{achievement.icon}</div>
                      <div className="text-sm font-medium text-white">{achievement.name}</div>
                      <div className="text-xs text-zinc-400 mt-1 capitalize">{achievement.rarity}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Share buttons */}
              <div className="space-y-3">
                <Button
                  onClick={shareToTwitter}
                  className="w-full gap-2 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white h-11"
                >
                  <Twitter className="h-5 w-5" />
                  Share on Twitter
                </Button>

                <Button
                  onClick={shareToLinkedIn}
                  className="w-full gap-2 bg-[#0A66C2] hover:bg-[#094d92] text-white h-11"
                >
                  <Linkedin className="h-5 w-5" />
                  Share on LinkedIn
                </Button>

                <Button
                  onClick={copyLink}
                  variant="outline"
                  className={cn(
                    "w-full gap-2 h-11",
                    copied && "bg-emerald-500/20 border-emerald-500 text-emerald-600"
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="h-5 w-5" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <Link2 className="h-5 w-5" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>

              {/* Share URL */}
              <div className="mt-4 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/50">
                <code className="text-xs text-zinc-500 dark:text-zinc-400 break-all">
                  {shareUrl}
                </code>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
