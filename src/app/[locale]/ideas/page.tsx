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
import { IdeaCard } from "@/components/ideas/idea-card";
import { SubmitIdeaDialog } from "@/components/ideas/submit-idea-dialog";
import {
  Lightbulb,
  TrendingUp,
  Clock,
  Star,
  Loader2,
  Plus,
} from "lucide-react";

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
  createdAt: Date | null;
  hasVoted: boolean;
  author: {
    id: string | null;
    name: string | null;
    image: string | null;
    username: string | null;
  };
}

export default function IdeasPage() {
  const t = useTranslations("ideas");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState("top");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  const fetchIdeas = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("sort", sort);
      if (category !== "all") params.set("category", category);
      if (status !== "all") params.set("status", status);

      const response = await fetch(`/api/ideas?${params.toString()}`);
      const data = await response.json() as { ideas: Idea[] };
      setIdeas(data.ideas || []);
    } catch (error) {
      console.error("Failed to fetch ideas:", error);
    } finally {
      setIsLoading(false);
    }
  }, [sort, category, status]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const handleVote = (ideaId: string, newVoteCount: number, hasVoted: boolean) => {
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === ideaId
          ? { ...idea, voteCount: newVoteCount, hasVoted }
          : idea
      )
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-yellow-400" />
              {t("pageTitle")}
            </h1>
            <p className="text-zinc-400 mt-1">{t("pageSubtitle")}</p>
          </div>
          <SubmitIdeaDialog
            trigger={
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                <Plus className="h-4 w-4 mr-2" />
                {t("submitIdea")}
              </Button>
            }
            onSuccess={fetchIdeas}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <Tabs value={sort} onValueChange={setSort}>
            <TabsList className="bg-zinc-800/50">
              <TabsTrigger value="top" className="gap-1.5 data-[state=active]:bg-zinc-700">
                <TrendingUp className="h-3.5 w-3.5" />
                {t("sort.top")}
              </TabsTrigger>
              <TabsTrigger value="new" className="gap-1.5 data-[state=active]:bg-zinc-700">
                <Clock className="h-3.5 w-3.5" />
                {t("sort.new")}
              </TabsTrigger>
              <TabsTrigger value="featured" className="gap-1.5 data-[state=active]:bg-zinc-700">
                <Star className="h-3.5 w-3.5" />
                {t("sort.featured")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[140px] bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder={t("filter.category")} />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="all">{t("filter.allCategories")}</SelectItem>
                <SelectItem value="game">{t("categories.game")}</SelectItem>
                <SelectItem value="creative">{t("categories.creative")}</SelectItem>
                <SelectItem value="puzzle">{t("categories.puzzle")}</SelectItem>
                <SelectItem value="educational">{t("categories.educational")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[140px] bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder={t("filter.status")} />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="all">{t("filter.allStatus")}</SelectItem>
                <SelectItem value="pending">{t("status.pending")}</SelectItem>
                <SelectItem value="approved">{t("status.approved")}</SelectItem>
                <SelectItem value="in_progress">{t("status.in_progress")}</SelectItem>
                <SelectItem value="implemented">{t("status.implemented")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Ideas list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : ideas.length === 0 ? (
          <div className="text-center py-12">
            <Lightbulb className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">{t("noIdeas")}</h3>
            <p className="text-zinc-400 mb-4">{t("noIdeasDescription")}</p>
            <SubmitIdeaDialog
              trigger={
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("beFirst")}
                </Button>
              }
              onSuccess={fetchIdeas}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} onVote={handleVote} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
