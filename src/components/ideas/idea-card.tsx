"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronUp,
  MessageCircle,
  Gamepad2,
  Palette,
  Puzzle,
  GraduationCap,
  Star,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface IdeaCardProps {
  idea: {
    id: string;
    title: string;
    description: string;
    category: string;
    gameReference?: string | null;
    status: string;
    isFeatured: boolean;
    voteCount: number;
    commentCount: number;
    createdAt: Date | string | null;
    hasVoted: boolean;
    author: {
      id: string | null;
      name: string | null;
      image: string | null;
      username: string | null;
    };
  };
  onVote?: (ideaId: string, newVoteCount: number, hasVoted: boolean) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  game: <Gamepad2 className="h-3 w-3" />,
  creative: <Palette className="h-3 w-3" />,
  puzzle: <Puzzle className="h-3 w-3" />,
  educational: <GraduationCap className="h-3 w-3" />,
};

const statusColors: Record<string, string> = {
  pending: "bg-zinc-600",
  approved: "bg-green-600",
  in_progress: "bg-blue-600",
  implemented: "bg-purple-600",
  rejected: "bg-red-600",
};

export function IdeaCard({ idea, onVote }: IdeaCardProps) {
  const { data: session } = useSession();
  const t = useTranslations("ideas");
  const [isVoting, setIsVoting] = useState(false);
  const [localVoteCount, setLocalVoteCount] = useState(idea.voteCount);
  const [localHasVoted, setLocalHasVoted] = useState(idea.hasVoted);

  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user || isVoting) return;

    setIsVoting(true);
    try {
      const response = await fetch(`/api/ideas/${idea.id}/vote`, {
        method: "POST",
      });
      const data = await response.json() as { voteCount: number; voted: boolean };

      if (response.ok) {
        setLocalVoteCount(data.voteCount);
        setLocalHasVoted(data.voted);
        onVote?.(idea.id, data.voteCount, data.voted);
      }
    } catch (error) {
      console.error("Failed to vote:", error);
    } finally {
      setIsVoting(false);
    }
  };

  const createdAt = idea.createdAt ? new Date(idea.createdAt) : null;
  const timeAgo = createdAt
    ? formatDistanceToNow(createdAt, { addSuffix: true })
    : "";

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Vote button */}
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVote}
              disabled={!session?.user || isVoting}
              className={cn(
                "h-10 w-10 p-0 rounded-lg",
                localHasVoted
                  ? "text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20"
                  : "text-zinc-400 hover:text-yellow-400 hover:bg-zinc-800"
              )}
            >
              {isVoting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </Button>
            <span
              className={cn(
                "text-sm font-medium",
                localHasVoted ? "text-yellow-400" : "text-zinc-400"
              )}
            >
              {localVoteCount}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <Link
                href={`/ideas/${idea.id}`}
                className="hover:underline"
              >
                <h3 className="font-semibold text-white text-lg leading-tight">
                  {idea.isFeatured && (
                    <Star className="h-4 w-4 text-yellow-400 inline mr-1" />
                  )}
                  {idea.title}
                </h3>
              </Link>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs text-white",
                    statusColors[idea.status] || "bg-zinc-600"
                  )}
                >
                  {t(`status.${idea.status}`)}
                </Badge>
              </div>
            </div>

            <p className="text-sm text-zinc-400 line-clamp-2 mb-3">
              {idea.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                  {categoryIcons[idea.category]}
                  <span className="ml-1">{t(`categories.${idea.category}`)}</span>
                </Badge>
                {idea.gameReference && (
                  <span className="text-zinc-500">
                    {t("basedOn")}: {idea.gameReference}
                  </span>
                )}
                <Link
                  href={`/ideas/${idea.id}#comments`}
                  className="flex items-center gap-1 hover:text-zinc-300"
                >
                  <MessageCircle className="h-3 w-3" />
                  {idea.commentCount}
                </Link>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={idea.author.image || undefined} />
                  <AvatarFallback className="text-[10px] bg-zinc-700">
                    {idea.author.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <span>{idea.author.name || idea.author.username}</span>
                <span>·</span>
                <span>{timeAgo}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
