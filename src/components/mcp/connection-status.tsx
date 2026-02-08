"use client";

/**
 * ConnectionStatus - Animated multi-stage connection indicator
 *
 * States:
 * - listening: Pulsing dot, waiting for agent to connect
 * - connecting: Spinning, SSE establishing
 * - handshake: Spinning, agent identified but no commands yet
 * - ready: Checkmark, agent connected and sending commands
 * - error: Red X, connection failed
 */

import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, Loader2, Check, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConnectionState =
  | "listening"
  | "connecting"
  | "handshake"
  | "ready"
  | "error";

interface ConnectionStatusProps {
  state: ConnectionState;
  agentName?: string;
  className?: string;
}

const stateConfig: Record<
  ConnectionState,
  {
    icon: React.ElementType;
    label: string;
    bg: string;
    text: string;
    border: string;
    animate?: boolean;
    pulse?: boolean;
  }
> = {
  listening: {
    icon: Radio,
    label: "Listening...",
    bg: "bg-amber-100 dark:bg-amber-500/20",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-500/30",
    pulse: true,
  },
  connecting: {
    icon: Loader2,
    label: "Connecting...",
    bg: "bg-blue-100 dark:bg-blue-500/20",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-500/30",
    animate: true,
  },
  handshake: {
    icon: Loader2,
    label: "Handshaking...",
    bg: "bg-purple-100 dark:bg-purple-500/20",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-500/30",
    animate: true,
  },
  ready: {
    icon: Wifi,
    label: "Connected",
    bg: "bg-emerald-100 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-500/30",
  },
  error: {
    icon: WifiOff,
    label: "Disconnected",
    bg: "bg-red-100 dark:bg-red-500/20",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-500/30",
  },
};

export function ConnectionStatus({
  state,
  agentName,
  className,
}: ConnectionStatusProps) {
  const config = stateConfig[state];
  const Icon = config.icon;
  const displayLabel = state === "ready" && agentName ? agentName : config.label;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border min-w-[140px] justify-center",
          config.bg,
          config.text,
          config.border,
          className
        )}
      >
        {/* Icon with animations */}
        <span className="relative flex items-center justify-center">
          {config.pulse && (
            <span className="absolute inset-0 rounded-full bg-current opacity-30 animate-ping" />
          )}
          <Icon
            className={cn(
              "h-3.5 w-3.5 relative",
              config.animate && "animate-spin"
            )}
          />
        </span>

        {/* Label with truncation for agent names */}
        <span className="truncate max-w-[100px]">{displayLabel}</span>

        {/* Success checkmark animation for ready state */}
        {state === "ready" && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
          >
            <Check className="h-3 w-3" />
          </motion.span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Derive connection state from component state values
 */
export function deriveConnectionState(params: {
  isConnecting: boolean;
  isConnected: boolean;
  hasAgent: boolean;
  hasCommands: boolean;
}): ConnectionState {
  const { isConnecting, isConnected, hasAgent, hasCommands } = params;

  if (!isConnected && !isConnecting) return "error";
  if (isConnecting) return "connecting";
  if (!hasAgent) return "listening";
  if (hasAgent && !hasCommands) return "handshake";
  return "ready";
}
