"use client";

import { useMemo, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Play,
  Move,
  Bot,
  Trophy,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import type { DomainEvent } from '@mcpchallenge/challenge-registry';

// =============================================================================
// Types
// =============================================================================

interface EventTimelineProps {
  events: readonly DomainEvent[];
  maxEvents?: number;
  autoScroll?: boolean;
  className?: string;
}

// =============================================================================
// Event Config
// =============================================================================

const eventIcons: Record<string, React.ElementType> = {
  session_created: Play,
  session_restored: RefreshCw,
  move_validated: CheckCircle2,
  move_executed: Move,
  ai_thinking: Clock,
  ai_moved: Bot,
  game_state_changed: RefreshCw,
  game_completed: CheckCircle2,
  achievement_earned: Trophy,
  achievement_evaluation_complete: Trophy,
  session_expired: XCircle,
  error: AlertCircle,
};

const eventColors: Record<string, string> = {
  session_created: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
  session_restored: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
  move_validated: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
  move_executed: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
  ai_thinking: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
  ai_moved: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
  game_state_changed: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200',
  game_completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
  achievement_earned: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  achievement_evaluation_complete:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  session_expired: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
};

// =============================================================================
// Helpers
// =============================================================================

function formatEventMessage(event: DomainEvent): string {
  switch (event.type) {
    case 'session_created':
      return `Session started (${event.payload.difficulty})`;
    case 'session_restored':
      return `Session restored (${event.payload.moveCount} moves)`;
    case 'move_validated':
      return event.payload.valid
        ? `Move validated: ${event.payload.move}`
        : `Invalid move: ${event.payload.error}`;
    case 'move_executed':
      return `Move: ${event.payload.move}`;
    case 'ai_thinking':
      return 'AI is thinking...';
    case 'ai_moved':
      return `AI moved: ${event.payload.move}`;
    case 'game_state_changed':
      return event.payload.gameOver
        ? 'Game over!'
        : `Turn ${event.payload.moveCount} - ${event.payload.turn === 'player' ? 'Your turn' : "Opponent's turn"}`;
    case 'game_completed':
      return `Game ${event.payload.result.status}!`;
    case 'achievement_earned':
      return `Achievement: ${event.payload.name}`;
    case 'achievement_evaluation_complete':
      return `${event.payload.totalEarned} achievements earned (${event.payload.totalPoints} pts)`;
    case 'session_expired':
      return `Session expired (${event.payload.reason})`;
    case 'error':
      return event.payload.message;
    default:
      return (event as DomainEvent).type;
  }
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatRelativeTime(timestamp: number, referenceTime: number): string {
  const diff = timestamp - referenceTime;
  if (diff < 1000) return '+0s';
  if (diff < 60000) return `+${Math.floor(diff / 1000)}s`;
  return `+${Math.floor(diff / 60000)}m ${Math.floor((diff % 60000) / 1000)}s`;
}

// =============================================================================
// Component
// =============================================================================

export function EventTimeline({
  events,
  maxEvents = 50,
  autoScroll = true,
  className,
}: EventTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get display events (limited and reversed for newest-first)
  const displayEvents = useMemo(() => {
    return events.slice(-maxEvents).reverse();
  }, [events, maxEvents]);

  // Reference time for relative timestamps (use first event's timestamp or 0)
  const referenceTime = useMemo(() => {
    return events.length > 0 ? events[0].timestamp : 0;
  }, [events]);

  // Auto-scroll to top when new events arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events.length, autoScroll]);

  if (displayEvents.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Event Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No events yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          Event Timeline
          <Badge variant="secondary" className="text-xs">
            {events.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={scrollRef} className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
          {displayEvents.map((event, index) => {
            const Icon = eventIcons[event.type] || AlertCircle;
            const colorClass =
              eventColors[event.type] || 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200';

            return (
              <div
                key={event.id as string}
                className="flex items-start gap-3 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                <div className={`p-1.5 rounded-full shrink-0 ${colorClass}`}>
                  <Icon className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{formatEventMessage(event)}</p>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{formatTime(event.timestamp)}</span>
                    <span className="text-zinc-300 dark:text-zinc-600">|</span>
                    <span>{formatRelativeTime(event.timestamp, referenceTime)}</span>
                    <span className="text-zinc-300 dark:text-zinc-600">|</span>
                    <span className="font-mono">#{event.seq}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
