"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Eye,
  Heart,
  Copy,
  Check,
  Twitter,
  Paintbrush,
  Sparkles,
} from "lucide-react";

interface GalleryImageCardProps {
  image: {
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
  };
}

const challengeIcons: Record<string, React.ReactNode> = {
  "canvas-draw": <Paintbrush className="h-3 w-3" />,
  fractals: <Sparkles className="h-3 w-3" />,
};

export function GalleryImageCard({ image }: GalleryImageCardProps) {
  const t = useTranslations("gallery");
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const createdAt = image.createdAt ? new Date(image.createdAt) : null;
  const timeAgo = createdAt
    ? formatDistanceToNow(createdAt, { addSuffix: true })
    : "";

  const shareUrl = `https://mcpchallenge.org/gallery/${image.id}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTwitterShare = () => {
    const text = image.title
      ? `Check out "${image.title}" on MCP Challenge!`
      : "Check out this creation on MCP Challenge!";
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank");
  };

  return (
    <>
      <Card
        className="bg-zinc-900 border-zinc-800 overflow-hidden cursor-pointer hover:border-zinc-700 transition-colors group"
        onClick={() => setIsOpen(true)}
      >
        {/* Image */}
        <div className="aspect-square relative bg-zinc-800">
          <img
            src={image.url}
            alt={image.title || "Gallery image"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="flex items-center gap-4 text-white">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {image.viewCount}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {image.likeCount}
              </span>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            {image.title ? (
              <h3 className="text-sm font-medium text-white truncate">
                {image.title}
              </h3>
            ) : (
              <span className="text-sm text-zinc-500 italic">
                {t("untitled")}
              </span>
            )}
            <Badge
              variant="outline"
              className="border-zinc-700 text-zinc-400 text-xs"
            >
              {challengeIcons[image.challengeId]}
              <span className="ml-1">{t(`challenges.${image.challengeId}`)}</span>
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Avatar className="h-4 w-4">
              <AvatarImage src={image.author.image || undefined} />
              <AvatarFallback className="text-[8px] bg-zinc-700">
                {image.author.name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">
              {image.author.name || image.author.username || t("anonymous")}
            </span>
            <span>·</span>
            <span>{timeAgo}</span>
          </div>
        </div>
      </Card>

      {/* Full-size modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {image.title || t("untitled")}
            </DialogTitle>
          </DialogHeader>

          {/* Full-size image */}
          <div className="relative aspect-square bg-zinc-800 rounded-lg overflow-hidden">
            <img
              src={image.url}
              alt={image.title || "Gallery image"}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Stats and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-zinc-400">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {image.viewCount} {t("views")}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {image.likeCount} {t("likes")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="border-zinc-700 text-zinc-300"
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                {copied ? t("copied") : t("copyLink")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTwitterShare}
                className="border-zinc-700 text-zinc-300"
              >
                <Twitter className="h-4 w-4 mr-1" />
                {t("share")}
              </Button>
            </div>
          </div>

          {/* Author info */}
          <div className="flex items-center gap-3 pt-2 border-t border-zinc-800">
            <Avatar className="h-8 w-8">
              <AvatarImage src={image.author.image || undefined} />
              <AvatarFallback className="bg-zinc-700">
                {image.author.name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="text-zinc-300">
                {image.author.name || image.author.username || t("anonymous")}
              </p>
              <p className="text-zinc-500">{timeAgo}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
