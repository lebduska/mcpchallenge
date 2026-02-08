"use client";

export const runtime = "edge";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GalleryImageCard } from "@/components/gallery/image-card";
import {
  Image,
  Clock,
  TrendingUp,
  Eye,
  Loader2,
  Paintbrush,
  Sparkles,
} from "lucide-react";

interface GalleryImage {
  id: string;
  url: string;
  challengeId: string;
  title: string | null;
  width: number;
  height: number;
  viewCount: number;
  likeCount: number;
  createdAt: Date | string | null;
  author: {
    id: string | null;
    name: string | null;
    image: string | null;
    username: string | null;
  };
}

export default function GalleryPage() {
  const t = useTranslations("gallery");
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState("new");
  const [challengeId, setChallengeId] = useState("all");
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const fetchImages = useCallback(
    async (reset = false) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("sort", sort);
        params.set("limit", "24");
        params.set("offset", reset ? "0" : String(offset));
        if (challengeId !== "all") {
          params.set("challengeId", challengeId);
        }

        const response = await fetch(`/api/gallery?${params.toString()}`);
        const data = (await response.json()) as {
          images: GalleryImage[];
          pagination: { hasMore: boolean };
        };

        if (reset) {
          setImages(data.images || []);
          setOffset(data.images?.length || 0);
        } else {
          setImages((prev) => [...prev, ...(data.images || [])]);
          setOffset((prev) => prev + (data.images?.length || 0));
        }
        setHasMore(data.pagination?.hasMore || false);
      } catch (error) {
        console.error("Failed to fetch gallery:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [sort, challengeId, offset]
  );

  useEffect(() => {
    setOffset(0);
    fetchImages(true);
  }, [sort, challengeId]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Image className="h-6 w-6 text-purple-500 dark:text-purple-400" />
            {t("pageTitle")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">{t("pageSubtitle")}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <Tabs value={sort} onValueChange={setSort}>
            <TabsList className="bg-zinc-100 dark:bg-zinc-800/50">
              <TabsTrigger
                value="new"
                className="gap-1.5 text-zinc-600 dark:text-zinc-400 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white"
              >
                <Clock className="h-3.5 w-3.5" />
                {t("sort.new")}
              </TabsTrigger>
              <TabsTrigger
                value="popular"
                className="gap-1.5 text-zinc-600 dark:text-zinc-400 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                {t("sort.popular")}
              </TabsTrigger>
              <TabsTrigger
                value="views"
                className="gap-1.5 text-zinc-600 dark:text-zinc-400 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white"
              >
                <Eye className="h-3.5 w-3.5" />
                {t("sort.views")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={challengeId} onValueChange={setChallengeId}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white">
              <SelectValue placeholder={t("filter.challenge")} />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
              <SelectItem value="all">{t("filter.allChallenges")}</SelectItem>
              <SelectItem value="canvas-draw">
                <div className="flex items-center gap-2">
                  <Paintbrush className="h-4 w-4" />
                  {t("challenges.canvas-draw")}
                </div>
              </SelectItem>
              <SelectItem value="fractals">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  {t("challenges.fractals")}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Gallery grid */}
        {isLoading && images.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400 dark:text-zinc-500" />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12">
            <Image className="h-12 w-12 text-zinc-400 dark:text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">
              {t("noImages")}
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">{t("noImagesDescription")}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {images.map((image) => (
                <GalleryImageCard key={image.id} image={image} />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  onClick={() => fetchImages(false)}
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
