"use client";

import { Share2, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ShareButtonProps {
  /** Whether sharing is possible (replay exists) */
  canShare: boolean;
  /** Whether share request is in progress */
  isSharing: boolean;
  /** Whether URL was copied to clipboard */
  shareCopied: boolean;
  /** Called when share button is clicked */
  onShare: () => void;
  /** Button size variant */
  size?: "default" | "sm" | "lg" | "icon";
  /** Button style variant */
  variant?: "default" | "outline" | "ghost" | "secondary";
  /** Additional CSS classes */
  className?: string;
  /** Show text label */
  showLabel?: boolean;
}

/**
 * Reusable share button for game replays.
 *
 * Shows different states:
 * - Default: Share icon + optional label
 * - Loading: Spinner
 * - Success: Checkmark + "Copied!" (auto-resets after 3s)
 *
 * Usage:
 * ```tsx
 * <ShareButton
 *   canShare={canShare}
 *   isSharing={isSharing}
 *   shareCopied={shareCopied}
 *   onShare={shareReplay}
 * />
 * ```
 */
export function ShareButton({
  canShare,
  isSharing,
  shareCopied,
  onShare,
  size = "default",
  variant = "outline",
  className = "",
  showLabel = true,
}: ShareButtonProps) {
  if (!canShare) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onShare}
      disabled={isSharing}
      className={className}
    >
      {isSharing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {showLabel && <span className="ml-2">Sharing...</span>}
        </>
      ) : shareCopied ? (
        <>
          <Check className="h-4 w-4 text-green-500" />
          {showLabel && <span className="ml-2">Copied!</span>}
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          {showLabel && <span className="ml-2">Share</span>}
        </>
      )}
    </Button>
  );
}

/**
 * Compact share button for tight spaces (icon only)
 */
export function ShareButtonCompact(props: Omit<ShareButtonProps, "showLabel" | "size">) {
  return <ShareButton {...props} showLabel={false} size="icon" />;
}
