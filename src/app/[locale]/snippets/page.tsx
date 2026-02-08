"use client";

export const runtime = "edge";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  Code2,
  Clock,
  Eye,
  Loader2,
  Plus,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

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

function SnippetCard({ snippet }: { snippet: CodeSnippet }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const previewCode = snippet.code.split("\n").slice(0, 6).join("\n");
  const hasMore = snippet.code.split("\n").length > 6;

  return (
    <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-medium text-zinc-900 dark:text-white truncate">
            {snippet.title}
          </h3>
          <span className="text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
            {snippet.language}
          </span>
        </div>

        {snippet.description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">
            {snippet.description}
          </p>
        )}

        <div className="relative">
          <pre className="text-xs bg-zinc-950 text-zinc-300 p-3 rounded-lg overflow-hidden">
            <code>{previewCode}</code>
            {hasMore && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-zinc-950 to-transparent" />
            )}
          </pre>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-500">
            {snippet.author?.name && (
              <span>{snippet.author.name}</span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {snippet.viewCount}
            </span>
            {snippet.createdAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(snippet.createdAt), { addSuffix: true })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
            <Link href={`/snippets/${snippet.id}`}>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function SnippetsPage() {
  const t = useTranslations("snippets");
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const fetchSnippets = useCallback(
    async (reset = false) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("limit", "20");
        params.set("offset", reset ? "0" : String(offset));

        const response = await fetch(`/api/snippets?${params.toString()}`);
        const data = (await response.json()) as {
          snippets: CodeSnippet[];
        };

        if (reset) {
          setSnippets(data.snippets || []);
          setOffset(data.snippets?.length || 0);
        } else {
          setSnippets((prev) => [...prev, ...(data.snippets || [])]);
          setOffset((prev) => prev + (data.snippets?.length || 0));
        }
        setHasMore((data.snippets?.length || 0) >= 20);
      } catch (error) {
        console.error("Failed to fetch snippets:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [offset]
  );

  useEffect(() => {
    fetchSnippets(true);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Code2 className="h-6 w-6 text-blue-500 dark:text-blue-400" />
              {t("pageTitle")}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              {t("pageSubtitle")}
            </p>
          </div>
          <Link href="/snippets/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t("share")}
            </Button>
          </Link>
        </div>

        {/* Snippets grid */}
        {isLoading && snippets.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400 dark:text-zinc-500" />
          </div>
        ) : snippets.length === 0 ? (
          <div className="text-center py-12">
            <Code2 className="h-12 w-12 text-zinc-400 dark:text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">
              {t("noSnippets")}
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              {t("noSnippetsDescription")}
            </p>
            <Link href="/snippets/new">
              <Button>{t("shareFirst")}</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {snippets.map((snippet) => (
                <SnippetCard key={snippet.id} snippet={snippet} />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  onClick={() => fetchSnippets(false)}
                  disabled={isLoading}
                  className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {t("loadMore")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
