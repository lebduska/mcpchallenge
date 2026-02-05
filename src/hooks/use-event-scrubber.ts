"use client";

/**
 * useEventScrubber
 *
 * Hook for scrubbing through DomainEvents timeline.
 * Derives temporary game state by replaying moves up to selected index.
 * Pure UI logic - no backend calls.
 */

import { useState, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import type { DomainEvent } from '@mcpchallenge/challenge-registry';

// =============================================================================
// Types
// =============================================================================

export interface ScrubberState {
  /** Whether scrub mode is active */
  isScrubbing: boolean;
  /** Current index in the events array (0 = start, events.length = live) */
  scrubIndex: number;
  /** Derived game state (FEN) at current scrub position */
  derivedState: string;
  /** Derived turn at current scrub position */
  derivedTurn: 'player' | 'opponent';
  /** Move count at current scrub position */
  derivedMoveCount: number;
  /** Whether game is over at current scrub position */
  derivedGameOver: boolean;
}

export interface ScrubberControls {
  /** Start scrubbing at a specific index */
  startScrub: (index: number) => void;
  /** Stop scrubbing and return to live */
  stopScrub: () => void;
  /** Set scrub index while scrubbing */
  setScrubIndex: (index: number) => void;
  /** Step forward one event */
  stepForward: () => void;
  /** Step backward one event */
  stepBackward: () => void;
  /** Jump to start */
  jumpToStart: () => void;
  /** Jump to end (live) */
  jumpToEnd: () => void;
}

export interface UseEventScrubberResult extends ScrubberState, ScrubberControls {
  /** Maximum valid scrub index */
  maxIndex: number;
  /** Events that affect game state (for slider) */
  significantEvents: readonly DomainEvent[];
  /** Current event being shown (null if at live) */
  currentEvent: DomainEvent | null;
}

// =============================================================================
// Event Type Filters
// =============================================================================

const SIGNIFICANT_EVENT_TYPES = new Set([
  'session_created',
  'move_executed',
  'ai_moved',
  'game_state_changed',
  'game_completed',
]);

function isSignificantEvent(event: DomainEvent): boolean {
  return SIGNIFICANT_EVENT_TYPES.has(event.type);
}

// =============================================================================
// State Derivation
// =============================================================================

interface DerivedState {
  fen: string;
  turn: 'player' | 'opponent';
  moveCount: number;
  gameOver: boolean;
}

/**
 * Derive game state by replaying events up to index
 */
function deriveStateFromEvents(
  events: readonly DomainEvent[],
  upToIndex: number
): DerivedState {
  const chess = new Chess();
  let moveCount = 0;
  let gameOver = false;
  let turn: 'player' | 'opponent' = 'player';

  // Replay events up to index
  for (let i = 0; i <= upToIndex && i < events.length; i++) {
    const event = events[i];

    switch (event.type) {
      case 'session_created':
        // Reset to starting position
        chess.reset();
        moveCount = 0;
        gameOver = false;
        turn = 'player';
        break;

      case 'move_executed': {
        const payload = event.payload as { move: string; turn: 'player' | 'opponent'; moveCount: number };
        try {
          chess.move(payload.move);
          moveCount = payload.moveCount;
          // After move, it's the other player's turn
          turn = payload.turn === 'player' ? 'opponent' : 'player';
        } catch {
          // Invalid move, skip
        }
        break;
      }

      case 'ai_moved': {
        const payload = event.payload as { move: string };
        try {
          chess.move(payload.move);
          moveCount++;
          turn = 'player'; // After AI moves, it's player's turn
        } catch {
          // Invalid move, skip
        }
        break;
      }

      case 'game_state_changed': {
        const payload = event.payload as { turn: 'player' | 'opponent'; moveCount: number; gameOver: boolean };
        turn = payload.turn;
        moveCount = payload.moveCount;
        gameOver = payload.gameOver;
        break;
      }

      case 'game_completed':
        gameOver = true;
        break;
    }
  }

  return {
    fen: chess.fen(),
    turn,
    moveCount,
    gameOver,
  };
}

// =============================================================================
// Hook
// =============================================================================

export function useEventScrubber(events: readonly DomainEvent[]): UseEventScrubberResult {
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubIndex, setScrubIndexState] = useState(0);

  // Filter to significant events only
  const significantEvents = useMemo(
    () => events.filter(isSignificantEvent),
    [events]
  );

  const maxIndex = events.length - 1;

  // Derive state at current scrub position
  const derivedState = useMemo(() => {
    if (!isScrubbing) {
      // Return live state (last event)
      return deriveStateFromEvents(events, events.length - 1);
    }
    return deriveStateFromEvents(events, scrubIndex);
  }, [events, isScrubbing, scrubIndex]);

  // Current event being shown
  const currentEvent = useMemo(() => {
    if (!isScrubbing) return null;
    return events[scrubIndex] ?? null;
  }, [events, isScrubbing, scrubIndex]);

  // ---------------------------------------------------------------------------
  // Controls
  // ---------------------------------------------------------------------------

  const startScrub = useCallback((index: number) => {
    setIsScrubbing(true);
    setScrubIndexState(Math.min(Math.max(0, index), maxIndex));
  }, [maxIndex]);

  const stopScrub = useCallback(() => {
    setIsScrubbing(false);
    setScrubIndexState(0);
  }, []);

  const setScrubIndex = useCallback((index: number) => {
    if (isScrubbing) {
      setScrubIndexState(Math.min(Math.max(0, index), maxIndex));
    }
  }, [isScrubbing, maxIndex]);

  const stepForward = useCallback(() => {
    if (isScrubbing && scrubIndex < maxIndex) {
      setScrubIndexState(scrubIndex + 1);
    }
  }, [isScrubbing, scrubIndex, maxIndex]);

  const stepBackward = useCallback(() => {
    if (isScrubbing && scrubIndex > 0) {
      setScrubIndexState(scrubIndex - 1);
    }
  }, [isScrubbing, scrubIndex]);

  const jumpToStart = useCallback(() => {
    if (isScrubbing) {
      setScrubIndexState(0);
    }
  }, [isScrubbing]);

  const jumpToEnd = useCallback(() => {
    if (isScrubbing) {
      setScrubIndexState(maxIndex);
    }
  }, [isScrubbing, maxIndex]);

  return {
    // State
    isScrubbing,
    scrubIndex,
    derivedState: derivedState.fen,
    derivedTurn: derivedState.turn,
    derivedMoveCount: derivedState.moveCount,
    derivedGameOver: derivedState.gameOver,
    maxIndex: Math.max(0, maxIndex),
    significantEvents,
    currentEvent,

    // Controls
    startScrub,
    stopScrub,
    setScrubIndex,
    stepForward,
    stepBackward,
    jumpToStart,
    jumpToEnd,
  };
}
