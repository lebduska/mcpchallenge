"use client";

/**
 * MCPSessionDemo
 *
 * Demonstrates useChallengeSession hook with DomainEvents projection.
 * Shows: SessionStatusCard, GameHistoryPanel (moves + events), AchievementToast.
 *
 * Pure UI projection - no engine logic, only renders state from events.
 */

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled - react-chessboard uses DOM APIs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Chessboard: any = dynamic(
  () => import('react-chessboard').then((mod) => mod.Chessboard),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-zinc-400">Loading board...</span>
      </div>
    )
  }
);
import { Play, RotateCcw, Loader2, Plug, History } from 'lucide-react';
import { useChallengeSession, type EarnedAchievement } from '@/hooks/use-challenge-session';
import { useEventScrubber } from '@/hooks/use-event-scrubber';
import { SessionStatusCard } from './session-status-card';
import { GameHistoryPanel } from './game-history-panel';
import { ReplayScrubber } from './replay-scrubber';
import { AchievementToast } from '@/components/achievements/achievement-toast';
import type { Difficulty } from '@mcpchallenge/challenge-registry';

// =============================================================================
// Types
// =============================================================================

interface MCPSessionDemoProps {
  challengeId?: string;
}

// =============================================================================
// Component
// =============================================================================

export function MCPSessionDemo({ challengeId = 'chess' }: MCPSessionDemoProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const session = useChallengeSession();

  // Event scrubber for replay
  const scrubber = useEventScrubber(session.events);

  // Extract moves from move_executed events
  const moves = useMemo(() => {
    return session.events
      .filter((e) => e.type === 'move_executed')
      .map((e) => (e as { payload: { move: string } }).payload.move);
  }, [session.events]);

  // Determine which state to show (live or scrubbed)
  const displayState = scrubber.isScrubbing ? scrubber.derivedState : (session.gameState ?? 'start');
  const displayTurn = scrubber.isScrubbing ? scrubber.derivedTurn : session.turn;
  const displayGameOver = scrubber.isScrubbing ? scrubber.derivedGameOver : session.gameOver;

  // Handle clicking on an event in the timeline
  const handleEventClick = useCallback(
    (index: number) => {
      if (!scrubber.isScrubbing) {
        scrubber.startScrub(index);
      } else {
        scrubber.setScrubIndex(index);
      }
    },
    [scrubber]
  );

  // Handle start challenge
  const handleStart = useCallback(() => {
    session.startChallenge(challengeId, difficulty);
  }, [session, challengeId, difficulty]);

  // Handle achievement toast close
  const handleAchievementClose = useCallback(() => {
    session.clearAchievements();
  }, [session]);

  // Map achievements for toast (ensure correct format)
  const achievementsForToast = useMemo(() => {
    return session.earnedAchievements.map((a: EarnedAchievement) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon ?? '🏆',
      points: a.points,
      rarity: a.rarity,
    }));
  }, [session.earnedAchievements]);

  // Not started yet
  if (!session.sessionId && !session.isStarting) {
    return (
      <div className="space-y-6">
        {/* Intro */}
        <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30">
          <CardHeader>
            <CardTitle className="text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <Plug className="h-5 w-5" />
              MCP Session Demo
            </CardTitle>
          </CardHeader>
          <CardContent className="text-zinc-700 dark:text-zinc-300">
            <p className="mb-4">
              This demonstrates the internal MCP orchestrator with real-time DomainEvents streaming.
              Start a session to see events flow through SSE.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">Difficulty:</span>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleStart} className="gap-2">
                <Play className="h-4 w-4" />
                Start Session
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Session status (disconnected) */}
        <SessionStatusCard
          connectionStatus={session.connectionStatus}
          sessionId={session.sessionId}
          events={session.events}
          error={session.error}
        />
      </div>
    );
  }

  // Starting...
  if (session.isStarting) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              <p className="text-zinc-500">Starting session...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active session
  return (
    <div className="space-y-6">
      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Board column */}
        <div className="lg:col-span-2 space-y-4">
          <Card className={scrubber.isScrubbing ? 'ring-2 ring-purple-500' : ''}>
            <CardContent className="p-4">
              <div className="relative">
                {/* Chess board - read-only projection */}
                <Chessboard
                  position={displayState}
                  arePiecesDraggable={false}
                  boardOrientation="white"
                  customBoardStyle={{
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  customDarkSquareStyle={{ backgroundColor: '#779952' }}
                  customLightSquareStyle={{ backgroundColor: '#edeed1' }}
                />

                {/* Scrub mode indicator */}
                {scrubber.isScrubbing && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="gap-1 bg-purple-500 text-white">
                      <History className="h-3 w-3" />
                      Replay Mode
                    </Badge>
                  </div>
                )}

                {/* Status overlays (only when not scrubbing) */}
                {!scrubber.isScrubbing && session.isAIThinking && (
                  <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                    <div className="bg-white dark:bg-zinc-800 rounded-lg px-4 py-2 flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                      <span>AI Thinking...</span>
                    </div>
                  </div>
                )}

                {!scrubber.isScrubbing && session.gameOver && session.result && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 text-center">
                      <h3 className="text-xl font-bold mb-2">
                        {session.result.status === 'won'
                          ? 'Victory!'
                          : session.result.status === 'lost'
                          ? 'Defeat'
                          : 'Draw'}
                      </h3>
                      {session.result.score !== undefined && (
                        <p className="text-zinc-500 mb-4">Score: {session.result.score}</p>
                      )}
                      <Button onClick={session.reset} className="gap-2">
                        <RotateCcw className="h-4 w-4" />
                        New Game
                      </Button>
                    </div>
                  </div>
                )}

                {/* Turn indicator */}
                <div className="absolute bottom-2 right-2">
                  <Badge variant={displayTurn === 'player' ? 'default' : 'secondary'}>
                    {displayTurn === 'player' ? 'Your Turn' : 'AI Turn'}
                    {scrubber.isScrubbing && displayGameOver && ' (Game Over)'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          {!session.gameOver && !scrubber.isScrubbing && (
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Move #{session.moveCount}</Badge>
                    {session.isMoving && (
                      <Badge variant="secondary" className="gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Processing...
                      </Badge>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={session.reset} className="gap-1">
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Replay Scrubber */}
          <ReplayScrubber
            isScrubbing={scrubber.isScrubbing}
            scrubIndex={scrubber.scrubIndex}
            maxIndex={scrubber.maxIndex}
            currentEvent={scrubber.currentEvent}
            totalEvents={session.events.length}
            onStartScrub={scrubber.startScrub}
            onStopScrub={scrubber.stopScrub}
            onScrubIndexChange={scrubber.setScrubIndex}
            onStepForward={scrubber.stepForward}
            onStepBackward={scrubber.stepBackward}
            onJumpToStart={scrubber.jumpToStart}
            onJumpToEnd={scrubber.jumpToEnd}
          />
        </div>

        {/* Sidebar column */}
        <div className="space-y-4">
          {/* Session Status Card */}
          <SessionStatusCard
            connectionStatus={session.connectionStatus}
            sessionId={session.sessionId}
            events={session.events}
            error={session.error}
          />

          {/* History Panel with Moves/Events tabs */}
          <GameHistoryPanel
            moves={moves}
            events={session.events}
            defaultTab="events"
            highlightedEventId={scrubber.isScrubbing ? (scrubber.currentEvent?.id as string) : null}
            onEventClick={handleEventClick}
          />
        </div>
      </div>

      {/* Achievement Toast */}
      {achievementsForToast.length > 0 && (
        <AchievementToast
          achievements={achievementsForToast}
          onClose={handleAchievementClose}
        />
      )}
    </div>
  );
}
