"use client";

/**
 * ReplayScrubber
 *
 * UI controls for scrubbing through DomainEvents timeline.
 * - Slider bound to event index
 * - Play/pause, step, jump controls
 * - Current event indicator
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronsLeft,
  ChevronsRight,
  X,
  History,
} from 'lucide-react';
import type { DomainEvent } from '@mcpchallenge/challenge-registry';
import { getEventUIConfig, formatEventTime } from '@/lib/domain-event-ui';

// =============================================================================
// Types
// =============================================================================

interface ReplayScrubberProps {
  /** Whether scrub mode is active */
  isScrubbing: boolean;
  /** Current scrub index */
  scrubIndex: number;
  /** Maximum index */
  maxIndex: number;
  /** Current event at scrub position */
  currentEvent: DomainEvent | null;
  /** Total events count */
  totalEvents: number;
  /** Callback to start scrubbing */
  onStartScrub: (index: number) => void;
  /** Callback to stop scrubbing */
  onStopScrub: () => void;
  /** Callback to set scrub index */
  onScrubIndexChange: (index: number) => void;
  /** Step forward */
  onStepForward: () => void;
  /** Step backward */
  onStepBackward: () => void;
  /** Jump to start */
  onJumpToStart: () => void;
  /** Jump to end */
  onJumpToEnd: () => void;
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function ReplayScrubber({
  isScrubbing,
  scrubIndex,
  maxIndex,
  currentEvent,
  totalEvents,
  onStartScrub,
  onStopScrub,
  onScrubIndexChange,
  onStepForward,
  onStepBackward,
  onJumpToStart,
  onJumpToEnd,
  className,
}: ReplayScrubberProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derived playing state - auto-stop when conditions change
  const canPlay = isScrubbing && scrubIndex < maxIndex;
  const effectivePlaying = isPlaying && canPlay;

  // Auto-play logic
  useEffect(() => {
    if (!effectivePlaying) {
      return;
    }

    playIntervalRef.current = setInterval(() => {
      onStepForward();
    }, 500); // 500ms between events

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    };
  }, [effectivePlaying, onStepForward]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleSliderChange = useCallback(
    (values: number[]) => {
      const newIndex = values[0];
      if (newIndex !== undefined) {
        onScrubIndexChange(newIndex);
      }
    },
    [onScrubIndexChange]
  );

  const handleEnterScrubMode = useCallback(() => {
    onStartScrub(0);
  }, [onStartScrub]);

  // Not scrubbing - show enter button
  if (!isScrubbing) {
    if (totalEvents === 0) {
      return null; // No events to scrub
    }

    return (
      <Card className={className}>
        <CardContent className="py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnterScrubMode}
            className="w-full gap-2"
          >
            <History className="h-4 w-4" />
            Replay Events ({totalEvents})
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Scrubbing - show full controls
  return (
    <Card className={`border-purple-200 dark:border-purple-800 ${className}`}>
      <CardContent className="py-3 space-y-3">
        {/* Header with exit button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">Replay Mode</span>
            <Badge variant="secondary" className="text-xs">
              {scrubIndex + 1} / {maxIndex + 1}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onStopScrub} className="h-7 w-7 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Slider */}
        <div className="px-1">
          <Slider
            value={[scrubIndex]}
            min={0}
            max={maxIndex}
            step={1}
            onValueChange={handleSliderChange}
            className="w-full"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onJumpToStart}
            disabled={scrubIndex === 0}
            className="h-8 w-8 p-0"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onStepBackward}
            disabled={scrubIndex === 0}
            className="h-8 w-8 p-0"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlayPause}
            disabled={!canPlay && !effectivePlaying}
            className="h-8 w-8 p-0"
          >
            {effectivePlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onStepForward}
            disabled={scrubIndex >= maxIndex}
            className="h-8 w-8 p-0"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onJumpToEnd}
            disabled={scrubIndex >= maxIndex}
            className="h-8 w-8 p-0"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Current event indicator */}
        {currentEvent && <CurrentEventIndicator event={currentEvent} />}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function CurrentEventIndicator({ event }: { event: DomainEvent }) {
  const config = getEventUIConfig(event.type);
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 p-2 rounded-md ${config.bgColor}`}>
      <Icon className={`h-4 w-4 ${config.color}`} />
      <div className="flex-1 min-w-0">
        <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
      </div>
      <span className="text-[10px] text-zinc-400">{formatEventTime(event.timestamp)}</span>
    </div>
  );
}
