"use client";

export const runtime = "edge";

import { useState, useEffect, use } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Code2,
  Loader2,
  ArrowLeft,
  Copy,
  Check,
  Eye,
  Clock,
  Share2,
  Twitter,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CodeSnippet {
  id: string;
  title: string;
  description: string | null;
  language: string;
  code: string;
  challengeId: string | null;
  viewCount: number;
  createdAt: Date | string | null;
  author: {
    id: string | null;
    name: string | null;
    image: string | null;
    username: string | null;
  } | null;
}

export default function SnippetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("snippets");
  const router = useRouter();
  const { data: session } = useSession();
  const [snippet, setSnippet] = useState<CodeSnippet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchSnippet = async () => {
      try {
        const response = await fetch(`/api/snippets/${id}`);
        if (!response.ok) {
          setSnippet(null);
          return;
        }
        const data = await response.json() as CodeSnippet;
        setSnippet(data);
      } catch (error) {
        console.error("Failed to fetch snippet:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSnippet();
  }, [id]);

  const handleCopy = async () => {
    if (!snippet) return;
    await navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ url, title: snippet?.title });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/snippets/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        router.push("/snippets");
      }
    } catch (error) {
      console.error("Failed to delete snippet:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!snippet) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center">
          <Code2 className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
            {t("notFound")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            {t("notFoundDescription")}
          </p>
          <Link href="/snippets">
            <Button>{t("backToSnippets")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = session?.user?.id === snippet.author?.id;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/snippets"
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToSnippets")}
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                {snippet.title}
              </h1>
              {snippet.description && (
                <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                  {snippet.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-1.5"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? t("copied") : t("copy")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-1.5"
              >
                <Share2 className="h-4 w-4" />
                {t("shareBtn")}
              </Button>
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDelete(true)}
                  className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 text-sm text-zinc-500 dark:text-zinc-500">
            <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">
              {snippet.language}
            </span>
            {snippet.author?.name && <span>{snippet.author.name}</span>}
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {snippet.viewCount} views
            </span>
            {snippet.createdAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDistanceToNow(new Date(snippet.createdAt), {
                  addSuffix: true,
                })}
              </span>
            )}
          </div>
        </div>

        {/* Code */}
        <Card className="bg-zinc-950 border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
            <span className="text-xs text-zinc-500">{snippet.language}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 text-xs text-zinc-400 hover:text-white"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 mr-1 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 mr-1" />
              )}
              {copied ? t("copied") : t("copy")}
            </Button>
          </div>
          <pre className="p-4 overflow-x-auto">
            <code className="text-sm text-zinc-300">{snippet.code}</code>
          </pre>
        </Card>
      </div>

      {/* Delete dialog */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-900 dark:text-white">
              {t("deleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-600 dark:text-zinc-400">
              {t("deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-200 dark:border-zinc-700">
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
