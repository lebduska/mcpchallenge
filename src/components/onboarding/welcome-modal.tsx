"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Cpu,
  Trophy,
  Gamepad2,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

const STORAGE_KEY = "mcp-onboarding-completed";
const STORAGE_VERSION = "v1"; // Increment to re-show modal after major updates

interface WelcomeStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  visual?: React.ReactNode;
}

const welcomeSteps: WelcomeStep[] = [
  {
    id: "welcome",
    title: "Welcome to MCP Challenge!",
    description:
      "The ultimate playground for AI agents. Test your coding skills by building agents that play games through the Model Context Protocol.",
    icon: <Sparkles className="h-6 w-6" />,
    visual: (
      <div className="grid grid-cols-3 gap-3 mt-4">
        {["Chess", "Snake", "Sokoban"].map((game, i) => (
          <div
            key={game}
            className={cn(
              "aspect-square rounded-xl flex items-center justify-center text-2xl",
              i === 0 && "bg-amber-100 dark:bg-amber-900/30",
              i === 1 && "bg-green-100 dark:bg-green-900/30",
              i === 2 && "bg-blue-100 dark:bg-blue-900/30"
            )}
          >
            {i === 0 ? "♟️" : i === 1 ? "🐍" : "📦"}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "mcp",
    title: "What is MCP?",
    description:
      "Model Context Protocol is an open standard for AI agents to interact with tools. Your agent connects to our servers and controls games using simple tool calls.",
    icon: <Cpu className="h-6 w-6" />,
    visual: (
      <div className="mt-4 p-4 bg-zinc-900 rounded-xl">
        <code className="text-sm text-emerald-400 font-mono">
          <span className="text-zinc-500">{/* Your agent calls: */}{"// Your agent calls:"}</span>
          <br />
          await client.callTool({"{"}
          <br />
          {"  "}name: <span className="text-amber-400">{'"make_move"'}</span>,
          <br />
          {"  "}arguments: {"{"} position: 4 {"}"}
          <br />
          {"}"});
        </code>
      </div>
    ),
  },
  {
    id: "challenges",
    title: "Play Challenges",
    description:
      "Each challenge is a game with MCP integration. Play manually to learn, then build an AI agent to beat it. Watch your agent play in real-time!",
    icon: <Gamepad2 className="h-6 w-6" />,
    visual: (
      <div className="mt-4 flex items-center gap-4">
        <div className="flex-1 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-center">
          <div className="text-2xl mb-1">🎮</div>
          <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">
            Play Mode
          </div>
          <div className="text-[10px] text-purple-600/70 dark:text-purple-400/70">
            Learn the rules
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-zinc-400" />
        <div className="flex-1 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-center">
          <div className="text-2xl mb-1">🤖</div>
          <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">
            MCP Mode
          </div>
          <div className="text-[10px] text-blue-600/70 dark:text-blue-400/70">
            Connect your AI
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "achievements",
    title: "Earn Achievements",
    description:
      "Complete challenges to unlock achievements, climb the leaderboard, and show off your AI skills. Can you collect them all?",
    icon: <Trophy className="h-6 w-6" />,
    visual: (
      <div className="mt-4 flex justify-center gap-3">
        {[
          { icon: "🏆", name: "First Win", rarity: "common" },
          { icon: "⚡", name: "Speed Run", rarity: "rare" },
          { icon: "👑", name: "Master", rarity: "legendary" },
        ].map((badge) => (
          <div
            key={badge.name}
            className={cn(
              "w-16 h-16 rounded-xl flex flex-col items-center justify-center",
              badge.rarity === "common" && "bg-zinc-100 dark:bg-zinc-800",
              badge.rarity === "rare" && "bg-blue-100 dark:bg-blue-900/30",
              badge.rarity === "legendary" &&
                "bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30"
            )}
          >
            <span className="text-xl">{badge.icon}</span>
            <span className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-1">
              {badge.name}
            </span>
          </div>
        ))}
      </div>
    ),
  },
];

interface WelcomeModalProps {
  forceShow?: boolean;
  onComplete?: () => void;
}

export function WelcomeModal({ forceShow = false, onComplete }: WelcomeModalProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(STORAGE_KEY);
    const shouldShow = forceShow || stored !== STORAGE_VERSION;

    // Small delay to prevent flash
    const timer = setTimeout(() => {
      setIsOpen(shouldShow);
      setIsLoaded(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [forceShow]);

  const handleComplete = useCallback(async () => {
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, STORAGE_VERSION);
    setIsOpen(false);

    // If logged in, try to grant first-login achievement
    if (session?.user?.id) {
      try {
        // Call a simple endpoint to check/grant first-login achievement
        await fetch("/api/progress/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "onboarding_complete" }),
        });
      } catch {
        // Silently fail - not critical
      }
    }

    onComplete?.();
  }, [session?.user?.id, onComplete]);

  const handleNext = useCallback(() => {
    if (currentStep < welcomeSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, handleComplete]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  // Don't render until we've checked localStorage
  if (!isLoaded) return null;

  const step = welcomeSteps[currentStep];
  const isLastStep = currentStep === welcomeSteps.length - 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleSkip}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[10%] z-50 mx-auto max-w-md"
          >
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
              {/* Close button */}
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors z-10"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Content */}
              <div className="p-6 pt-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="text-center"
                  >
                    {/* Icon */}
                    <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-purple-600 dark:text-purple-400 mb-4">
                      {step.icon}
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                      {step.title}
                    </h2>

                    {/* Description */}
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Visual */}
                    {step.visual}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800">
                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  {welcomeSteps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        index === currentStep
                          ? "w-6 bg-purple-500"
                          : index < currentStep
                          ? "bg-purple-300 dark:bg-purple-700"
                          : "bg-zinc-200 dark:bg-zinc-700"
                      )}
                    />
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between gap-3">
                  {currentStep > 0 ? (
                    <Button
                      variant="ghost"
                      onClick={handlePrevious}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={handleSkip}
                      className="text-zinc-500"
                    >
                      Skip
                    </Button>
                  )}

                  <Button
                    onClick={handleNext}
                    className={cn(
                      "gap-2",
                      isLastStep &&
                        "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    )}
                  >
                    {isLastStep ? (
                      <>
                        <Zap className="h-4 w-4" />
                        Start Exploring
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
