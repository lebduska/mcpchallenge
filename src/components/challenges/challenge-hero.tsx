"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReactNode } from "react";

interface ChallengeHeroProps {
  title: string;
  description: string;
  image: string;
  icon: ReactNode;
  badges: Array<{
    label: string;
    className: string;
  }>;
}

export function ChallengeHero({
  title,
  description,
  image,
  icon,
  badges,
}: ChallengeHeroProps) {
  return (
    <div className="relative w-full h-[200px] md:h-[280px] mb-8 rounded-xl overflow-hidden">
      {/* Background Image */}
      <Image
        src={image}
        alt={title}
        fill
        className="object-cover"
        priority
        unoptimized
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
        <Link
          href="/challenges"
          className="inline-flex items-center text-sm text-white/80 hover:text-white mb-3 w-fit"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Challenges
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <span className="text-white">{icon}</span>
          <h1 className="text-2xl md:text-4xl font-bold text-white">
            {title}
          </h1>
          {badges.map((badge, i) => (
            <Badge key={i} className={badge.className}>
              {badge.label}
            </Badge>
          ))}
        </div>

        <p className="text-white/80 max-w-2xl">
          {description}
        </p>
      </div>
    </div>
  );
}
