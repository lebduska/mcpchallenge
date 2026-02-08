"use client";

export const runtime = "edge";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Heart,
  ArrowRight,
  Gamepad2,
  Sparkles,
  Zap,
  Code2,
  MessageSquare,
  Crown,
  Banana,
  TreePine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { challengeCovers } from "@/lib/challenge-covers";

// Featured challenges to display on homepage
const featuredChallenges = [
  {
    id: "chess",
    key: "chess",
    icon: Crown,
    gradient: "from-amber-500 to-orange-600",
    points: 100,
  },
  {
    id: "gorillas",
    key: "gorillas",
    icon: Banana,
    gradient: "from-yellow-500 to-amber-600",
    points: 175,
  },
  {
    id: "fractals",
    key: "fractals",
    icon: TreePine,
    gradient: "from-purple-500 to-fuchsia-600",
    points: 200,
  },
];

const steps = [
  {
    icon: Gamepad2,
    titleKey: "howItWorks.step1.title",
    descKey: "howItWorks.step1.description",
  },
  {
    icon: Code2,
    titleKey: "howItWorks.step2.title",
    descKey: "howItWorks.step2.description",
  },
  {
    icon: MessageSquare,
    titleKey: "howItWorks.step3.title",
    descKey: "howItWorks.step3.description",
  },
];

export default function Home() {
  const t = useTranslations("home");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 dark:from-violet-900 dark:via-purple-900 dark:to-indigo-950" />

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Floating orbs for visual interest */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl" />

        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-6">
              <Sparkles className="h-4 w-4" />
              <span>Learn MCP through interactive games</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Master the{" "}
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Model Context Protocol
              </span>{" "}
              by Playing
            </h1>

            {/* Subheading */}
            <p className="text-xl text-white/80 mb-8 max-w-2xl">
              Interactive challenges that teach you how AI agents communicate with tools.
              Play games, solve puzzles, and learn the protocol that powers modern AI applications.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="text-lg px-8 bg-white text-purple-700 hover:bg-white/90">
                <Link href="/challenges">
                  Start Playing
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 border-white/30 text-white hover:bg-white/10">
                <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer">
                  Learn about MCP
                </a>
              </Button>
            </div>

            {/* Quick stats */}
            <div className="flex gap-8 mt-12 pt-8 border-t border-white/20">
              <div>
                <div className="text-3xl font-bold text-white">9+</div>
                <div className="text-white/60 text-sm">Challenges</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">100%</div>
                <div className="text-white/60 text-sm">Free</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">∞</div>
                <div className="text-white/60 text-sm">Possibilities</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED CHALLENGES */}
      <section className="container mx-auto px-4 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">
              Featured Challenges
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Start with these popular games to learn MCP fundamentals
            </p>
          </div>
          <Link
            href="/challenges"
            className="hidden md:flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
          >
            View all challenges
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredChallenges.map((challenge) => {
            const Icon = challenge.icon;
            const cover = challengeCovers[challenge.id];

            return (
              <Link key={challenge.id} href={`/challenges/${challenge.id}`}>
                <div className={cn(
                  "group relative overflow-hidden rounded-2xl h-80",
                  "bg-white dark:bg-zinc-900",
                  "border border-zinc-200 dark:border-zinc-800",
                  "shadow-lg hover:shadow-2xl",
                  "hover:-translate-y-2",
                  "transition-all duration-300"
                )}>
                  {/* Cover Image */}
                  {cover && (
                    <div className="absolute inset-0">
                      <Image
                        src={cover.image}
                        alt={cover.alt}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className={cn(
                        "absolute inset-0 bg-gradient-to-t",
                        "from-black/80 via-black/40 to-transparent"
                      )} />
                    </div>
                  )}

                  {/* Points Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <div className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                      "bg-gradient-to-r",
                      challenge.gradient,
                      "text-white font-bold text-sm shadow-lg"
                    )}>
                      <Trophy className="h-3.5 w-3.5" />
                      {challenge.points} pts
                    </div>
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                      "bg-white/20 backdrop-blur-sm"
                    )}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {t(`challenges.${challenge.key}.title`)}
                    </h3>
                    <p className="text-white/70 text-sm line-clamp-2">
                      {t(`challenges.${challenge.key}.description`)}
                    </p>

                    {/* Play button hint */}
                    <div className="flex items-center gap-2 mt-4 text-white/80 group-hover:text-white transition-colors">
                      <span className="text-sm font-medium">Play now</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Mobile View All link */}
        <div className="mt-8 text-center md:hidden">
          <Button asChild variant="outline">
            <Link href="/challenges">
              View all challenges
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-zinc-100 dark:bg-zinc-900/50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">
              {t("howItWorks.title")}
            </h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              {t("howItWorks.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="text-center">
                  <div className={cn(
                    "w-16 h-16 mx-auto mb-6 rounded-2xl",
                    "bg-gradient-to-br from-purple-500 to-indigo-600",
                    "flex items-center justify-center",
                    "shadow-lg shadow-purple-500/25"
                  )}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">
                    Step {index + 1}
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">
                    {t(step.titleKey)}
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    {t(step.descKey)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Code Example */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-zinc-900 dark:bg-zinc-950 rounded-xl overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 bg-zinc-800 dark:bg-zinc-900 border-b border-zinc-700">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-2 text-zinc-400 text-sm">mcp-server.ts</span>
              </div>
              <div className="p-6 font-mono text-sm overflow-x-auto">
                <pre className="text-zinc-300">{`// Define an MCP tool for your AI agent
server.tool(
  "chess.make_move",
  "Make a chess move on the board",
  {
    from: z.string().describe("Square to move from (e.g., 'e2')"),
    to: z.string().describe("Square to move to (e.g., 'e4')")
  },
  async ({ from, to }) => {
    const result = await game.move({ from, to });
    return {
      success: result.valid,
      board: game.ascii(),
      status: game.isGameOver() ? "Game Over" : "In Progress"
    };
  }
);`}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF / STATS */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30">
              <Gamepad2 className="h-8 w-8 mx-auto mb-3 text-purple-600 dark:text-purple-400" />
              <div className="text-3xl font-bold text-zinc-900 dark:text-white">9+</div>
              <div className="text-zinc-600 dark:text-zinc-400 text-sm">{t("stats.challenges")}</div>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
              <Trophy className="h-8 w-8 mx-auto mb-3 text-amber-600 dark:text-amber-400" />
              <div className="text-3xl font-bold text-zinc-900 dark:text-white">50+</div>
              <div className="text-zinc-600 dark:text-zinc-400 text-sm">{t("stats.achievements")}</div>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
              <Zap className="h-8 w-8 mx-auto mb-3 text-emerald-600 dark:text-emerald-400" />
              <div className="text-3xl font-bold text-zinc-900 dark:text-white">∞</div>
              <div className="text-zinc-600 dark:text-zinc-400 text-sm">{t("stats.possibilities")}</div>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30">
              <Heart className="h-8 w-8 mx-auto mb-3 text-rose-600 dark:text-rose-400" />
              <div className="text-3xl font-bold text-zinc-900 dark:text-white">$0</div>
              <div className="text-zinc-600 dark:text-zinc-400 text-sm">{t("stats.cost")}</div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-800 dark:to-indigo-800 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to start learning?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Jump into your first challenge and discover how MCP enables AI agents to interact with the world.
          </p>
          <Button asChild size="lg" className="text-lg px-10 bg-white text-purple-700 hover:bg-white/90">
            <Link href="/challenges">
              Browse Challenges
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
              {t("footer.builtWith")} <Heart className="h-4 w-4 text-red-500 fill-red-500" /> {t("footer.forCommunity")}
            </p>
            <div className="flex gap-6">
              <a
                href="https://modelcontextprotocol.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 text-sm"
              >
                MCP Docs
              </a>
              <a
                href="https://github.com/anthropics/anthropic-cookbook/tree/main/misc/model_context_protocol"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 text-sm"
              >
                GitHub
              </a>
              <Link
                href="/privacy"
                className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 text-sm"
              >
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
