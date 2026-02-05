"use client";

/**
 * GameHistoryPanel
 *
 * Tabbed panel showing:
 * - "Moves" tab: Chess move history (SAN notation)
 * - "Events" tab: Timeline of DomainEvents
 */

import { useRef, useEffect, useMemo, forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { History, Activity } from 'lucide-react';
import type { DomainEvent } from '@mcpchallenge/challenge-registry';
import {
  getEventUIConfig,
  getEventDescription,
  formatEventTime,
} from '@/lib/domain-event-ui';

// =============================================================================
// Types
// =============================================================================

interface GameHistoryPanelProps {
  moves: readonly string[];
  events: readonly DomainEvent[];
  defaultTab?: 'moves' | 'events';
  /** Event ID to highlight (for scrubbing) */
  highlightedEventId?: string | null;
  /** Callback when event is clicked (for scrubbing) */
  onEventClick?: (index: number) => void;
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function GameHistoryPanel({
  moves,
  events,
  defaultTab = 'moves',
  highlightedEventId,
  onEventClick,
  className,
}: GameHistoryPanelProps) {
  return (
    <Card className={className}>
      <Tabs defaultValue={defaultTab}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">History</CardTitle>
            <TabsList className="h-8">
              <TabsTrigger value="moves" className="h-7 px-2 text-xs gap-1">
                <History className="h-3 w-3" />
                Moves
                {moves.length > 0 && (
                  <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                    {moves.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="events" className="h-7 px-2 text-xs gap-1">
                <Activity className="h-3 w-3" />
                Events
                {events.length > 0 && (
                  <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                    {events.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <TabsContent value="moves" className="mt-0">
            <MovesList moves={moves} />
          </TabsContent>
          <TabsContent value="events" className="mt-0">
            <EventsList
              events={events}
              highlightedEventId={highlightedEventId}
              onEventClick={onEventClick}
            />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}

// =============================================================================
// MovesList
// =============================================================================

function MovesList({ moves }: { moves: readonly string[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group moves into pairs (white, black) - must be before any early returns
  const movePairs = useMemo(() => {
    const pairs: { number: number; white: string; black?: string }[] = [];
    for (let i = 0; i < moves.length; i += 2) {
      pairs.push({
        number: Math.floor(i / 2) + 1,
        white: moves[i],
        black: moves[i + 1],
      });
    }
    return pairs;
  }, [moves]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves.length]);

  if (moves.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No moves yet</p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="h-48 overflow-y-auto">
      <div className="space-y-1">
        {movePairs.map((pair) => (
          <div
            key={pair.number}
            className="flex items-center text-sm font-mono bg-zinc-50 dark:bg-zinc-900 rounded px-2 py-1"
          >
            <span className="w-8 text-zinc-400 text-right mr-2">{pair.number}.</span>
            <span className="flex-1">{pair.white}</span>
            {pair.black && <span className="flex-1 text-zinc-600 dark:text-zinc-400">{pair.black}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// EventsList
// =============================================================================

interface EventsListProps {
  events: readonly DomainEvent[];
  highlightedEventId?: string | null;
  onEventClick?: (index: number) => void;
}

function EventsList({ events, highlightedEventId, onEventClick }: EventsListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const highlightedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new events arrive (not scrubbing)
  useEffect(() => {
    if (!highlightedEventId && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length, highlightedEventId]);

  // Scroll to highlighted event when scrubbing
  useEffect(() => {
    if (highlightedEventId && highlightedRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const element = highlightedRef.current;
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      // Check if element is outside visible area
      if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedEventId]);

  if (events.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No events yet</p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="h-48 overflow-y-auto">
      <div className="space-y-2">
        {events.map((event, index) => {
          const isHighlighted = highlightedEventId === (event.id as string);
          return (
            <EventRow
              key={event.id as string}
              ref={isHighlighted ? highlightedRef : undefined}
              event={event}
              isHighlighted={isHighlighted}
              onClick={onEventClick ? () => onEventClick(index) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}

interface EventRowProps {
  event: DomainEvent;
  isHighlighted?: boolean;
  onClick?: () => void;
}

const EventRow = forwardRef<HTMLDivElement, EventRowProps>(function EventRow(
  { event, isHighlighted, onClick },
  ref
) {
  const config = getEventUIConfig(event.type);
  const description = getEventDescription(event);
  const Icon = config.icon;

  const highlightClass = isHighlighted
    ? 'ring-2 ring-purple-500 ring-offset-1 dark:ring-offset-zinc-900'
    : '';

  const clickableClass = onClick
    ? 'cursor-pointer hover:ring-1 hover:ring-purple-300 dark:hover:ring-purple-700'
    : '';

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`flex items-start gap-2 p-2 rounded-md transition-all ${config.bgColor} ${highlightClass} ${clickableClass}`}
    >
      <div className={`flex-shrink-0 mt-0.5 ${config.color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-medium ${config.color}`}>{description.title}</span>
          <span className="text-[10px] text-zinc-400 flex-shrink-0">
            {formatEventTime(event.timestamp)}
          </span>
        </div>
        {description.description && (
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate">
            {description.description}
          </p>
        )}
      </div>
    </div>
  );
});
