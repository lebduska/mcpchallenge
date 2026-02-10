"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  Copy,
  Check,
  Share2,
  Gift,
  UserPlus,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReferralStats {
  code: string | null;
  shareUrl: string | null;
  stats: {
    totalReferrals: number;
    pendingReferrals: number;
    qualifiedReferrals: number;
  };
  referrals: Array<{
    id: string;
    name: string;
    image: string | null;
    status: string;
    createdAt: Date | null;
    qualifiedAt: Date | null;
  }>;
  referredBy: {
    name: string;
    image: string | null;
  } | null;
}

interface ReferralCardProps {
  className?: string;
}

export function ReferralCard({ className }: ReferralCardProps) {
  const [data, setData] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showReferrals, setShowReferrals] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch("/api/referral/stats");
      if (res.ok) {
        const json = await res.json() as ReferralStats;
        setData(json);
      }
    } catch (error) {
      console.error("Failed to fetch referral stats:", error);
    } finally {
      setLoading(false);
    }
  }

  async function generateCode() {
    setGenerating(true);
    try {
      const res = await fetch("/api/referral/generate");
      if (res.ok) {
        await fetchStats();
      }
    } catch (error) {
      console.error("Failed to generate referral code:", error);
    } finally {
      setGenerating(false);
    }
  }

  async function copyToClipboard() {
    if (!data?.shareUrl) return;

    try {
      await navigator.clipboard.writeText(data.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }

  async function shareLink() {
    if (!data?.shareUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join MCP Challenge",
          text: "Learn AI-assisted coding with fun challenges!",
          url: data.shareUrl,
        });
      } catch (error) {
        // User cancelled or share failed
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  }

  if (loading) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
          <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-white">
            Invite Friends
          </h3>
          <p className="text-sm text-zinc-500">
            Earn rewards when friends join
          </p>
        </div>
      </div>

      {/* If user was referred */}
      {data?.referredBy && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
            <Gift className="h-4 w-4" />
            <span>Referred by {data.referredBy.name}</span>
          </div>
        </div>
      )}

      {/* Referral code section */}
      {data?.code ? (
        <div className="space-y-4">
          {/* Code display */}
          <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            <div className="text-xs text-zinc-500 mb-1">Your referral code</div>
            <div className="flex items-center justify-between">
              <code className="text-2xl font-mono font-bold text-zinc-900 dark:text-white tracking-wider">
                {data.code}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-8 px-2"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Share button */}
          <Button
            onClick={shareLink}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Invite Link
          </Button>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="text-center p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
              <div className="text-xl font-bold text-zinc-900 dark:text-white">
                {data.stats.totalReferrals}
              </div>
              <div className="text-xs text-zinc-500">Invited</div>
            </div>
            <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {data.stats.pendingReferrals}
              </div>
              <div className="text-xs text-zinc-500">Pending</div>
            </div>
            <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {data.stats.qualifiedReferrals}
              </div>
              <div className="text-xs text-zinc-500">Qualified</div>
            </div>
          </div>

          {/* Referral list (expandable) */}
          {data.referrals.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setShowReferrals(!showReferrals)}
                className="flex items-center justify-between w-full text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <span>Your referrals</span>
                {showReferrals ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {showReferrals && (
                <div className="mt-3 space-y-2">
                  {data.referrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={referral.image || undefined} />
                          <AvatarFallback>
                            {referral.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-zinc-900 dark:text-white">
                          {referral.name}
                        </span>
                      </div>
                      <Badge
                        className={cn(
                          referral.status === "qualified" || referral.status === "rewarded"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        )}
                      >
                        {referral.status === "qualified" || referral.status === "rewarded"
                          ? "Qualified"
                          : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Help text */}
          <p className="text-xs text-zinc-500 pt-2">
            Friends must complete a challenge to qualify your referral.
          </p>
        </div>
      ) : (
        /* Generate code button */
        <Button
          onClick={generateCode}
          disabled={generating}
          className="w-full"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Get Your Referral Code
            </>
          )}
        </Button>
      )}
    </Card>
  );
}
