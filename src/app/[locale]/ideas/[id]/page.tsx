"use client";

export const runtime = "edge";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronUp,
  ArrowLeft,
  MessageCircle,
  Gamepad2,
  Palette,
  Puzzle,
  GraduationCap,
  Star,
  Loader2,
  Send,
  Reply,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Idea {
  id: string;
  title: string;
  description: string;
  category: string;
  gameReference: string | null;
  status: string;
  isFeatured: boolean;
  voteCount: number;
  commentCount: number;
  createdAt: Date | string | null;
  hasVoted: boolean;
  isOwner: boolean;
  author: {
    id: string | null;
    name: string | null;
    image: string | null;
    username: string | null;
  };
}

interface Comment {
  id: string;
  content: string;
  isEdited: boolean;
  createdAt: Date | string | null;
  isOwner: boolean;
  author: {
    id: string | null;
    name: string | null;
    image: string | null;
    username: string | null;
  };
  replies: Comment[];
}

const categoryIcons: Record<string, React.ReactNode> = {
  game: <Gamepad2 className="h-4 w-4" />,
  creative: <Palette className="h-4 w-4" />,
  puzzle: <Puzzle className="h-4 w-4" />,
  educational: <GraduationCap className="h-4 w-4" />,
};

const statusColors: Record<string, string> = {
  pending: "bg-zinc-600",
  approved: "bg-green-600",
  in_progress: "bg-blue-600",
  implemented: "bg-purple-600",
  rejected: "bg-red-600",
};

export default function IdeaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations("ideas");
  const id = params.id as string;

  const [idea, setIdea] = useState<Idea | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const fetchIdea = useCallback(async () => {
    try {
      const response = await fetch(`/api/ideas/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push("/ideas");
          return;
        }
        throw new Error("Failed to fetch idea");
      }
      const data = await response.json() as Idea;
      setIdea(data);
    } catch (error) {
      console.error("Failed to fetch idea:", error);
    }
  }, [id, router]);

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/ideas/${id}/comments`);
      const data = await response.json() as { comments: Comment[] };
      setComments(data.comments || []);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  }, [id]);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      await Promise.all([fetchIdea(), fetchComments()]);
      setIsLoading(false);
    }
    load();
  }, [fetchIdea, fetchComments]);

  const handleVote = async () => {
    if (!session?.user || isVoting || !idea) return;

    setIsVoting(true);
    try {
      const response = await fetch(`/api/ideas/${id}/vote`, { method: "POST" });
      const data = await response.json() as { voteCount: number; voted: boolean };
      if (response.ok) {
        setIdea({ ...idea, voteCount: data.voteCount, hasVoted: data.voted });
      }
    } catch (error) {
      console.error("Failed to vote:", error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user || !newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch(`/api/ideas/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (response.ok) {
        setNewComment("");
        await fetchComments();
        if (idea) {
          setIdea({ ...idea, commentCount: idea.commentCount + 1 });
        }
      }
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!session?.user || !replyContent.trim()) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch(`/api/ideas/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent.trim(), parentId }),
      });
      if (response.ok) {
        setReplyContent("");
        setReplyingTo(null);
        await fetchComments();
        if (idea) {
          setIdea({ ...idea, commentCount: idea.commentCount + 1 });
        }
      }
    } catch (error) {
      console.error("Failed to submit reply:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!idea) {
    return null;
  }

  const createdAt = idea.createdAt ? new Date(idea.createdAt) : null;
  const timeAgo = createdAt
    ? formatDistanceToNow(createdAt, { addSuffix: true })
    : "";

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <Link
          href="/ideas"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToIdeas")}
        </Link>

        {/* Main content */}
        <div className="flex gap-6">
          {/* Vote column */}
          <div className="flex flex-col items-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVote}
              disabled={!session?.user || isVoting}
              className={cn(
                "h-12 w-12 p-0 rounded-lg",
                idea.hasVoted
                  ? "text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20"
                  : "text-zinc-400 hover:text-yellow-400 hover:bg-zinc-800"
              )}
            >
              {isVoting ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <ChevronUp className="h-6 w-6" />
              )}
            </Button>
            <span
              className={cn(
                "text-lg font-bold",
                idea.hasVoted ? "text-yellow-400" : "text-zinc-400"
              )}
            >
              {idea.voteCount}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-2xl font-bold text-white">
                {idea.isFeatured && (
                  <Star className="h-5 w-5 text-yellow-400 inline mr-2" />
                )}
                {idea.title}
              </h1>
              <Badge
                variant="secondary"
                className={cn(
                  "text-sm text-white flex-shrink-0",
                  statusColors[idea.status] || "bg-zinc-600"
                )}
              >
                {t(`status.${idea.status}`)}
              </Badge>
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-4 text-sm text-zinc-500 mb-6">
              <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                {categoryIcons[idea.category]}
                <span className="ml-1">{t(`categories.${idea.category}`)}</span>
              </Badge>
              {idea.gameReference && (
                <span>
                  {t("basedOn")}: {idea.gameReference}
                </span>
              )}
              <span className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {idea.commentCount} {t("comments")}
              </span>
            </div>

            {/* Description */}
            <div className="prose prose-invert max-w-none mb-6">
              <p className="text-zinc-300 whitespace-pre-wrap">{idea.description}</p>
            </div>

            {/* Author info */}
            <div className="flex items-center gap-3 text-sm text-zinc-500 pb-6 border-b border-zinc-800">
              <Avatar className="h-8 w-8">
                <AvatarImage src={idea.author.image || undefined} />
                <AvatarFallback className="bg-zinc-700">
                  {idea.author.name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="text-zinc-300">
                  {idea.author.name || idea.author.username}
                </span>
                <span className="mx-2">·</span>
                <span>{timeAgo}</span>
              </div>
            </div>

            {/* Comments section */}
            <div id="comments" className="mt-8">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                {t("comments")} ({comments.length})
              </h2>

              {/* New comment form */}
              {session?.user ? (
                <form onSubmit={handleSubmitComment} className="mb-6">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={t("addComment")}
                    className="bg-zinc-800 border-zinc-700 text-white mb-2 min-h-[80px]"
                    maxLength={1000}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">
                      {newComment.length}/1000
                    </span>
                    <Button
                      type="submit"
                      disabled={isSubmittingComment || !newComment.trim()}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black"
                    >
                      {isSubmittingComment ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          {t("submit")}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <Card className="bg-zinc-900 border-zinc-800 mb-6">
                  <CardContent className="py-4 text-center">
                    <p className="text-zinc-400 mb-2">{t("signInToComment")}</p>
                    <Button asChild variant="outline" className="border-zinc-700">
                      <Link href="/auth/signin">{t("signIn")}</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Comments list */}
              {comments.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t("noComments")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <CommentCard
                      key={comment.id}
                      comment={comment}
                      replyingTo={replyingTo}
                      replyContent={replyContent}
                      isSubmitting={isSubmittingComment}
                      session={session}
                      t={t}
                      onReplyClick={(id) => {
                        setReplyingTo(replyingTo === id ? null : id);
                        setReplyContent("");
                      }}
                      onReplyChange={setReplyContent}
                      onReplySubmit={handleSubmitReply}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CommentCardProps {
  comment: Comment;
  replyingTo: string | null;
  replyContent: string;
  isSubmitting: boolean;
  session: { user?: { id?: string } } | null;
  t: (key: string) => string;
  onReplyClick: (id: string) => void;
  onReplyChange: (content: string) => void;
  onReplySubmit: (parentId: string) => void;
  depth?: number;
}

function CommentCard({
  comment,
  replyingTo,
  replyContent,
  isSubmitting,
  session,
  t,
  onReplyClick,
  onReplyChange,
  onReplySubmit,
  depth = 0,
}: CommentCardProps) {
  const createdAt = comment.createdAt ? new Date(comment.createdAt) : null;
  const timeAgo = createdAt
    ? formatDistanceToNow(createdAt, { addSuffix: true })
    : "";

  return (
    <div className={cn("", depth > 0 && "ml-8 border-l-2 border-zinc-800 pl-4")}>
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="py-3 px-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.author.image || undefined} />
              <AvatarFallback className="bg-zinc-700 text-xs">
                {comment.author.name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-zinc-300">
                  {comment.author.name || comment.author.username}
                </span>
                <span className="text-xs text-zinc-500">{timeAgo}</span>
                {comment.isEdited && (
                  <span className="text-xs text-zinc-600">({t("edited")})</span>
                )}
              </div>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                {comment.content}
              </p>
              {session?.user && depth < 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReplyClick(comment.id)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 p-0 h-auto mt-2"
                >
                  <Reply className="h-3 w-3 mr-1" />
                  {t("reply")}
                </Button>
              )}
            </div>
          </div>

          {/* Reply form */}
          {replyingTo === comment.id && (
            <div className="mt-3 ml-11">
              <Textarea
                value={replyContent}
                onChange={(e) => onReplyChange(e.target.value)}
                placeholder={t("writeReply")}
                className="bg-zinc-800 border-zinc-700 text-white mb-2 min-h-[60px] text-sm"
                maxLength={1000}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReplyClick(comment.id)}
                  className="text-zinc-400"
                >
                  {t("cancel")}
                </Button>
                <Button
                  size="sm"
                  disabled={isSubmitting || !replyContent.trim()}
                  onClick={() => onReplySubmit(comment.id)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    t("reply")
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              replyingTo={replyingTo}
              replyContent={replyContent}
              isSubmitting={isSubmitting}
              session={session}
              t={t}
              onReplyClick={onReplyClick}
              onReplyChange={onReplyChange}
              onReplySubmit={onReplySubmit}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
