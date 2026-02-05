"use client";

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Wifi,
  WifiOff,
  Loader2,
  Play,
  CheckCircle2,
  XCircle,
  Trophy,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import type { ConnectionStatus } from '@/hooks/use-challenge-session';
import type { GameResult } from '@mcpchallenge/challenge-registry';

// =============================================================================
// Types
// =============================================================================

interface SessionStatusProps {
  connectionStatus: ConnectionStatus;
  sessionId: string | null;
  challengeId: string | null;
  turn: 'player' | 'opponent';
  moveCount: number;
  gameOver: boolean;
  result: GameResult | null;
  isAIThinking: boolean;
  isMoving: boolean;
  error: string | null;
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function SessionStatus({
  connectionStatus,
  sessionId,
  challengeId,
  turn,
  moveCount,
  gameOver,
  result,
  isAIThinking,
  isMoving,
  error,
  className,
}: SessionStatusProps) {
  return (
    <Card className={className}>
      <CardContent className="py-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <ConnectionBadge status={connectionStatus} />
            {error && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {error.length > 30 ? `${error.slice(0, 30)}...` : error}
              </Badge>
            )}
          </div>

          {/* Session Info */}
          {sessionId && (
            <div className="flex items-center gap-2">
              {challengeId && <Badge variant="outline">{challengeId}</Badge>}
              <Badge variant="outline">Moves: {moveCount}</Badge>
            </div>
          )}

          {/* Game Status */}
          <div className="flex items-center gap-2">
            <GameStatusBadge
              gameOver={gameOver}
              result={result}
              turn={turn}
              isAIThinking={isAIThinking}
              isMoving={isMoving}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  switch (status) {
    case 'connecting':
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Connecting...
        </Badge>
      );

    case 'connected':
      return (
        <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600">
          <Wifi className="h-3 w-3" />
          Connected
        </Badge>
      );

    case 'reconnecting':
      return (
        <Badge variant="secondary" className="gap-1 bg-yellow-500 text-white hover:bg-yellow-600">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Reconnecting...
        </Badge>
      );

    case 'error':
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Error
        </Badge>
      );

    case 'disconnected':
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <WifiOff className="h-3 w-3" />
          Disconnected
        </Badge>
      );
  }
}

function GameStatusBadge({
  gameOver,
  result,
  turn,
  isAIThinking,
  isMoving,
}: {
  gameOver: boolean;
  result: GameResult | null;
  turn: 'player' | 'opponent';
  isAIThinking: boolean;
  isMoving: boolean;
}) {
  // Loading states
  if (isMoving) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Making move...
      </Badge>
    );
  }

  if (isAIThinking) {
    return (
      <Badge variant="secondary" className="gap-1 bg-purple-500 text-white hover:bg-purple-600">
        <Loader2 className="h-3 w-3 animate-spin" />
        AI Thinking...
      </Badge>
    );
  }

  // Game over
  if (gameOver && result) {
    const resultConfig = {
      won: {
        className: 'bg-green-500 hover:bg-green-600',
        icon: Trophy,
        label: 'Victory!',
      },
      lost: {
        className: 'bg-red-500 hover:bg-red-600',
        icon: XCircle,
        label: 'Defeat',
      },
      draw: {
        className: 'bg-yellow-500 hover:bg-yellow-600',
        icon: CheckCircle2,
        label: 'Draw',
      },
    };

    const config = resultConfig[result.status];
    const Icon = config.icon;

    return (
      <Badge variant="default" className={`gap-1 ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
        {result.score !== undefined && ` (${result.score})`}
      </Badge>
    );
  }

  // Turn indicator
  if (turn === 'player') {
    return (
      <Badge variant="default" className="gap-1 bg-blue-500 hover:bg-blue-600">
        <Play className="h-3 w-3" />
        Your Turn
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      Opponent&apos;s Turn
    </Badge>
  );
}

// =============================================================================
// Compact Variant
// =============================================================================

export function SessionStatusCompact({
  connectionStatus,
  turn,
  moveCount,
  gameOver,
  isAIThinking,
}: Pick<
  SessionStatusProps,
  'connectionStatus' | 'turn' | 'moveCount' | 'gameOver' | 'isAIThinking'
>) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {/* Connection dot */}
      <div
        className={`w-2 h-2 rounded-full ${
          connectionStatus === 'connected'
            ? 'bg-green-500'
            : connectionStatus === 'reconnecting'
              ? 'bg-yellow-500 animate-pulse'
              : connectionStatus === 'connecting'
                ? 'bg-blue-500 animate-pulse'
                : 'bg-zinc-400'
        }`}
      />

      {/* Move count */}
      <span className="text-zinc-500 dark:text-zinc-400">#{moveCount}</span>

      {/* Status */}
      {isAIThinking ? (
        <span className="text-purple-500">AI thinking...</span>
      ) : gameOver ? (
        <span className="text-emerald-500">Game Over</span>
      ) : turn === 'player' ? (
        <span className="text-blue-500">Your turn</span>
      ) : (
        <span className="text-zinc-500">Waiting...</span>
      )}
    </div>
  );
}
