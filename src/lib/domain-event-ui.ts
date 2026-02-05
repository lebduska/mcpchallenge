/**
 * DomainEvent UI Mapping
 *
 * Maps DomainEvent types to UI labels, icons, and descriptions.
 * Pure projection - no business logic.
 */

import type { DomainEvent, DomainEventType } from '@mcpchallenge/challenge-registry';
import type { LucideIcon } from 'lucide-react';
import {
  Play,
  RotateCcw,
  CheckCircle,
  Move,
  Brain,
  Bot,
  RefreshCw,
  Trophy,
  Award,
  Medal,
  Clock,
  AlertCircle,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface EventUIConfig {
  readonly label: string;
  readonly icon: LucideIcon;
  readonly color: string;
  readonly bgColor: string;
}

export interface EventUIDescription {
  readonly title: string;
  readonly description: string;
}

// =============================================================================
// Event Type -> UI Config
// =============================================================================

const EVENT_UI_CONFIG: Record<DomainEventType, EventUIConfig> = {
  session_created: {
    label: 'Session Started',
    icon: Play,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  session_restored: {
    label: 'Session Restored',
    icon: RotateCcw,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  move_validated: {
    label: 'Move Validated',
    icon: CheckCircle,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  move_executed: {
    label: 'Move Executed',
    icon: Move,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  ai_thinking: {
    label: 'AI Thinking',
    icon: Brain,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  ai_moved: {
    label: 'AI Moved',
    icon: Bot,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
  },
  game_state_changed: {
    label: 'State Changed',
    icon: RefreshCw,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
  game_completed: {
    label: 'Game Over',
    icon: Trophy,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  achievement_earned: {
    label: 'Achievement!',
    icon: Award,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  achievement_evaluation_complete: {
    label: 'Evaluation Done',
    icon: Medal,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  session_expired: {
    label: 'Session Expired',
    icon: Clock,
    color: 'text-zinc-600 dark:text-zinc-400',
    bgColor: 'bg-zinc-100 dark:bg-zinc-800',
  },
  error: {
    label: 'Error',
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
};

// =============================================================================
// Get UI Config
// =============================================================================

export function getEventUIConfig(eventType: DomainEventType): EventUIConfig {
  return EVENT_UI_CONFIG[eventType];
}

// =============================================================================
// Event -> Description
// =============================================================================

export function getEventDescription(event: DomainEvent): EventUIDescription {
  switch (event.type) {
    case 'session_created':
      return {
        title: 'Session Started',
        description: `Challenge: ${event.payload.challengeId}, Difficulty: ${event.payload.difficulty}`,
      };

    case 'session_restored':
      return {
        title: 'Session Restored',
        description: `Resumed at move ${event.payload.moveCount}`,
      };

    case 'move_validated':
      return {
        title: event.payload.valid ? 'Valid Move' : 'Invalid Move',
        description: event.payload.valid
          ? `Move "${event.payload.move}" is valid`
          : `Move "${event.payload.move}" rejected: ${event.payload.error ?? 'unknown'}`,
      };

    case 'move_executed':
      return {
        title: 'Move Executed',
        description: `${event.payload.turn === 'player' ? 'You' : 'Opponent'} played ${event.payload.move}`,
      };

    case 'ai_thinking':
      return {
        title: 'AI Thinking',
        description: `Computing move (${event.payload.difficulty})...`,
      };

    case 'ai_moved':
      return {
        title: 'AI Moved',
        description: `AI played ${event.payload.move}${event.payload.thinkTimeMs ? ` (${event.payload.thinkTimeMs}ms)` : ''}`,
      };

    case 'game_state_changed':
      return {
        title: 'State Updated',
        description: event.payload.gameOver
          ? 'Game has ended'
          : `Move ${event.payload.moveCount}, ${event.payload.turn === 'player' ? 'your' : "opponent's"} turn`,
      };

    case 'game_completed':
      return {
        title: 'Game Over',
        description: getResultDescription(event.payload.result),
      };

    case 'achievement_earned':
      return {
        title: event.payload.name,
        description: `+${event.payload.points} points (${event.payload.rarity})`,
      };

    case 'achievement_evaluation_complete':
      return {
        title: 'Achievements Evaluated',
        description: `${event.payload.totalEarned} earned, +${event.payload.totalPoints} points`,
      };

    case 'session_expired':
      return {
        title: 'Session Expired',
        description: `Reason: ${event.payload.reason}`,
      };

    case 'error':
      return {
        title: `Error: ${event.payload.code}`,
        description: event.payload.message,
      };

    default:
      return {
        title: 'Unknown Event',
        description: '',
      };
  }
}

// =============================================================================
// Helpers
// =============================================================================

function getResultDescription(result: { status: 'won' | 'lost' | 'draw'; score?: number }): string {
  const statusText = {
    won: 'Victory!',
    lost: 'Defeat',
    draw: 'Draw',
  };

  return result.score !== undefined
    ? `${statusText[result.status]} (Score: ${result.score})`
    : statusText[result.status];
}

// =============================================================================
// Format Timestamp
// =============================================================================

export function formatEventTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatRelativeTime(timestamp: number, now: number): string {
  const diff = now - timestamp;

  if (diff < 1000) return 'just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;

  return formatEventTime(timestamp);
}

// =============================================================================
// Shorten Session ID
// =============================================================================

export function shortenSessionId(sessionId: string | null): string {
  if (!sessionId) return '-';
  if (sessionId.length <= 8) return sessionId;
  return `${sessionId.slice(0, 4)}...${sessionId.slice(-4)}`;
}
