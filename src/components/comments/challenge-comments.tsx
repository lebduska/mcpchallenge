"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  MessageSquare,
  ThumbsUp,
  Loader2,
  Reply,
  Lightbulb,
  Send,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Author {
  id: string | null;
  name: string | null;
  image: string | null;
  username: string | null;
}

interface Comment {
  id: string;
  content: string;
  isTip: boolean;
  likeCount: number;
  isLiked: boolean;
  parentId: string | null;
  createdAt: Date | string;
  author: Author;
  replies: Comment[];
}

interface ChallengeCommentsProps {
  challengeId: string;
}

function CommentItem({
  comment,
  onReply,
  onLike,
  depth = 0,
}: {
  comment: Comment;
  onReply: (parentId: string) => void;
  onLike: (commentId: string) => void;
  depth?: number;
}) {
  const t = useTranslations("comments");
  const { data: session } = useSession();

  return (
    <div className={cn("flex gap-3", depth > 0 && "ml-8 mt-3")}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={comment.author.image || undefined} />
        <AvatarFallback className="text-xs bg-zinc-200 dark:bg-zinc-700">
          {comment.author.name?.[0]?.toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-zinc-900 dark:text-white">
            {comment.author.name || "Anonymous"}
          </span>
          {comment.isTip && (
            <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
              <Lightbulb className="h-3 w-3" />
              {t("tipLabel")}
            </span>
          )}
          <span className="text-xs text-zinc-500">
            {formatDistanceToNow(new Date(comment.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>

        <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1 whitespace-pre-wrap">
          {comment.content}
        </p>

        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => onLike(comment.id)}
            disabled={!session}
            className={cn(
              "flex items-center gap-1 text-xs transition-colors",
              comment.isLiked
                ? "text-blue-600 dark:text-blue-400"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
              !session && "opacity-50 cursor-not-allowed"
            )}
          >
            <ThumbsUp
              className={cn("h-3.5 w-3.5", comment.isLiked && "fill-current")}
            />
            {comment.likeCount > 0 && comment.likeCount}
          </button>
          {session && depth === 0 && (
            <button
              onClick={() => onReply(comment.id)}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              <Reply className="h-3.5 w-3.5" />
              {t("reply")}
            </button>
          )}
        </div>

        {/* Replies */}
        {comment.replies?.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onReply={onReply}
                onLike={onLike}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ChallengeComments({ challengeId }: ChallengeCommentsProps) {
  const t = useTranslations("comments");
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState("");
  const [isTip, setIsTip] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}/comments`);
      const data = await response.json() as { comments: Comment[] };
      setComments(data.comments || []);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [challengeId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !session) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/challenges/${challengeId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), isTip }),
      });

      if (response.ok) {
        const data = await response.json() as { comment: Comment };
        setComments((prev) => [data.comment, ...prev]);
        setContent("");
        setIsTip(false);
      }
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim() || !session) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/challenges/${challengeId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent.trim(), parentId }),
      });

      if (response.ok) {
        await fetchComments(); // Refresh to get nested structure
        setReplyContent("");
        setReplyingTo(null);
      }
    } catch (error) {
      console.error("Failed to post reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!session) return;

    try {
      const response = await fetch(
        `/api/challenges/${challengeId}/comments/${commentId}/like`,
        { method: "POST" }
      );

      if (response.ok) {
        const data = await response.json() as { liked: boolean };
        // Update the comment in state
        const updateComment = (comments: Comment[]): Comment[] =>
          comments.map((c) => {
            if (c.id === commentId) {
              return {
                ...c,
                isLiked: data.liked,
                likeCount: c.likeCount + (data.liked ? 1 : -1),
              };
            }
            if (c.replies?.length) {
              return { ...c, replies: updateComment(c.replies) };
            }
            return c;
          });
        setComments(updateComment);
      }
    } catch (error) {
      console.error("Failed to like comment:", error);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 md:p-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5" />
        {t("title")}
        {comments.length > 0 && (
          <span className="text-sm font-normal text-zinc-500">
            ({comments.length})
          </span>
        )}
      </h3>

      {/* Comment form */}
      {session ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("placeholder")}
            rows={3}
            className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 resize-none"
          />
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <Switch
                id="tip"
                checked={isTip}
                onCheckedChange={setIsTip}
                className="scale-90"
              />
              <Label
                htmlFor="tip"
                className="text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer flex items-center gap-1"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                {t("markAsTip")}
              </Label>
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || isSubmitting}
              className="gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {t("submit")}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            <Link
              href="/auth/signin"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t("signInToComment")}
            </Link>
          </p>
        </div>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("noComments")}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {t("noCommentsDescription")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                onReply={(parentId) => setReplyingTo(parentId)}
                onLike={handleLike}
              />

              {/* Reply form */}
              {replyingTo === comment.id && (
                <div className="ml-11 mt-3">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={t("replyPlaceholder")}
                    rows={2}
                    className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 resize-none text-sm"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleReply(comment.id)}
                      disabled={!replyContent.trim() || isSubmitting}
                    >
                      {isSubmitting && (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      )}
                      {t("reply")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
