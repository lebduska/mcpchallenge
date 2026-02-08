"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Twitter,
  Link2,
  ChevronRight,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SuccessCelebrationProps {
  challengeId: string;
  challengeName: string;
  isFirstCompletion?: boolean;
  pointsEarned?: number;
  onContinue?: () => void;
  onShare?: () => void;
  show: boolean;
  onClose: () => void;
}

interface ConfettiParticle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
  isCircle: boolean;
}

// Generate confetti particles with stable random values
function generateConfettiParticles(count: number): ConfettiParticle[] {
  const colors = ["#8B5CF6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 8 + Math.random() * 8,
    rotation: Math.random() * 360,
    isCircle: Math.random() > 0.5,
  }));
}

// Confetti particle component - particles generated once on mount
const Confetti = ({ count = 50 }: { count?: number }) => {
  // Generate particles once when component mounts
  const particles = useMemo(() => generateConfettiParticles(count), [count]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          initial={{
            top: -20,
            left: `${particle.left}%`,
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            top: "110%",
            rotate: particle.rotation + 720,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: "linear",
          }}
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: particle.isCircle ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
};

export function SuccessCelebration({
  challengeId,
  challengeName,
  isFirstCompletion = false,
  pointsEarned = 0,
  onContinue,
  show,
  onClose,
}: SuccessCelebrationProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `https://mcpchallenge.org/challenges/${challengeId}`;
  const shareText = `I just completed the ${challengeName} challenge on MCP Challenge! Ready to test your AI agent skills?`;

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  const handleTwitterShare = useCallback(() => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [shareText, shareUrl]);

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Confetti is a separate component, regenerates on each render when show becomes true */}
          <Confetti count={80} />

          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors z-10"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header gradient */}
              <div className="relative h-32 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500">
                <div className="absolute inset-0 bg-[url('/images/pattern-dots.svg')] opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="p-4 bg-white/20 backdrop-blur-sm rounded-full"
                  >
                    <Trophy className="h-12 w-12 text-white" />
                  </motion.div>
                </div>

                {/* Sparkles */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute top-4 left-8"
                >
                  <Sparkles className="h-6 w-6 text-yellow-300/60" />
                </motion.div>
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute bottom-4 right-12"
                >
                  <Sparkles className="h-5 w-5 text-white/40" />
                </motion.div>
              </div>

              {/* Content */}
              <div className="p-6 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                    {isFirstCompletion ? "First Victory!" : "Challenge Complete!"}
                  </h2>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                    You&apos;ve mastered the <span className="font-medium text-purple-600 dark:text-purple-400">{challengeName}</span> challenge
                  </p>

                  {pointsEarned > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.5 }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-6"
                    >
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                        +{pointsEarned}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 text-sm">
                        points earned
                      </span>
                    </motion.div>
                  )}
                </motion.div>

                {/* Share section */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-6"
                >
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                    Share your achievement
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTwitterShare}
                      className="gap-2"
                    >
                      <Twitter className="h-4 w-4" />
                      Tweet
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className={cn("gap-2", copied && "text-green-600 border-green-300")}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Link2 className="h-4 w-4" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>

                {/* Next challenge suggestion */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    onClick={onContinue || onClose}
                    className="w-full gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    {onContinue ? (
                      <>
                        Next Challenge
                        <ChevronRight className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Continue Playing
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
