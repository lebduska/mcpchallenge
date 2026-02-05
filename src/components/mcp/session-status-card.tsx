"use client";

/**
 * SessionStatusCard
 *
 * Displays MCP session status from useChallengeSession():
 * - Connection status badge
 * - Session ID (shortened)
 * - Last event (type + timestamp)
 * - Error state
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Wifi,
  WifiOff,
  Loader2,
  RefreshCw,
  AlertCircle,
  Plug,
} from 'lucide-react';
import type { ConnectionStatus } from '@/hooks/use-challenge-session';
import type { DomainEvent } from '@mcpchallenge/challenge-registry';
import {
  getEventUIConfig,
  formatEventTime,
  shortenSessionId,
} from '@/lib/domain-event-ui';

// =============================================================================
// Types
// =============================================================================

interface SessionStatusCardProps {
  connectionStatus: ConnectionStatus;
  sessionId: string | null;
  events: readonly DomainEvent[];
  error: string | null;
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function SessionStatusCard({
  connectionStatus,
  sessionId,
  events,
  error,
  className,
}: SessionStatusCardProps) {
  const lastEvent = events.length > 0 ? events[events.length - 1] : null;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Plug className="h-4 w-4" />
          MCP Session
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Status</span>
          <ConnectionBadge status={connectionStatus} />
        </div>

        {/* Session ID */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Session</span>
          <code className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
            {shortenSessionId(sessionId)}
          </code>
        </div>

        {/* Last Event */}
        {lastEvent && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Last Event</span>
            <LastEventBadge event={lastEvent} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/30 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  const configs: Record<ConnectionStatus, { icon: typeof Wifi; label: string; className: string }> = {
    disconnected: {
      icon: WifiOff,
      label: 'Disconnected',
      className: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    },
    connecting: {
      icon: Loader2,
      label: 'Connecting',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    connected: {
      icon: Wifi,
      label: 'Connected',
      className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    reconnecting: {
      icon: RefreshCw,
      label: 'Reconnecting',
      className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    },
    error: {
      icon: AlertCircle,
      label: 'Error',
      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
  };

  const config = configs[status];
  const Icon = config.icon;
  const isAnimated = status === 'connecting' || status === 'reconnecting';

  return (
    <Badge variant="secondary" className={`gap-1 ${config.className}`}>
      <Icon className={`h-3 w-3 ${isAnimated ? 'animate-spin' : ''}`} />
      {config.label}
    </Badge>
  );
}

function LastEventBadge({ event }: { event: DomainEvent }) {
  const config = getEventUIConfig(event.type);
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="secondary" className={`gap-1 ${config.bgColor} ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
      <span className="text-[10px] text-zinc-400">{formatEventTime(event.timestamp)}</span>
    </div>
  );
}
