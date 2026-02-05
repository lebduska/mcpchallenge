"use client";

import { useReducer, useCallback, useEffect, useRef } from 'react';
import type {
  DomainEvent,
  GameResult,
  Difficulty,
} from '@mcpchallenge/challenge-registry';

// =============================================================================
// Types
// =============================================================================

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface EarnedAchievement {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly points: number;
  readonly rarity: string;
  readonly icon?: string;
}

export interface SessionState {
  // Connection
  connectionStatus: ConnectionStatus;
  sessionId: string | null;
  lastEventId: string | null;

  // Game state
  challengeId: string | null;
  gameState: string | null;
  legalMoves: readonly string[];
  turn: 'player' | 'opponent';
  moveCount: number;
  gameOver: boolean;
  result: GameResult | null;

  // Events
  events: readonly DomainEvent[];

  // Achievements
  earnedAchievements: readonly EarnedAchievement[];

  // Loading states
  isStarting: boolean;
  isMoving: boolean;
  isAIThinking: boolean;

  // Errors
  error: string | null;

  // Replay
  replayId: string | null;
}

// =============================================================================
// Actions
// =============================================================================

type SessionAction =
  | { type: 'CONNECT_START' }
  | { type: 'CONNECT_SUCCESS'; sessionId: string }
  | { type: 'CONNECT_ERROR'; error: string }
  | { type: 'RECONNECT_START' }
  | { type: 'RECONNECT_SUCCESS'; missedCount: number }
  | { type: 'DISCONNECT' }
  | { type: 'SESSION_START' }
  | {
      type: 'SESSION_CREATED';
      sessionId: string;
      challengeId: string;
      gameState: string;
      legalMoves: readonly string[];
      turn: 'player' | 'opponent';
    }
  | { type: 'MOVE_START' }
  | {
      type: 'MOVE_SUCCESS';
      gameState: string;
      legalMoves: readonly string[];
      turn: 'player' | 'opponent';
      moveCount: number;
      aiMove?: string;
    }
  | { type: 'MOVE_ERROR'; error: string }
  | { type: 'AI_THINKING_START' }
  | { type: 'AI_MOVED'; move: string }
  | { type: 'GAME_STATE_CHANGED'; turn: 'player' | 'opponent'; moveCount: number; gameOver: boolean }
  | { type: 'GAME_OVER'; result: GameResult; replayId: string }
  | { type: 'ACHIEVEMENT_EARNED'; achievement: EarnedAchievement }
  | { type: 'EVENT_RECEIVED'; event: DomainEvent }
  | { type: 'CLEAR_ACHIEVEMENTS' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' };

// =============================================================================
// Initial State
// =============================================================================

const initialState: SessionState = {
  connectionStatus: 'disconnected',
  sessionId: null,
  lastEventId: null,
  challengeId: null,
  gameState: null,
  legalMoves: [],
  turn: 'player',
  moveCount: 0,
  gameOver: false,
  result: null,
  events: [],
  earnedAchievements: [],
  isStarting: false,
  isMoving: false,
  isAIThinking: false,
  error: null,
  replayId: null,
};

// =============================================================================
// Reducer
// =============================================================================

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'CONNECT_START':
      return { ...state, connectionStatus: 'connecting', error: null };

    case 'CONNECT_SUCCESS':
      return { ...state, connectionStatus: 'connected', sessionId: action.sessionId };

    case 'CONNECT_ERROR':
      return { ...state, connectionStatus: 'error', error: action.error };

    case 'RECONNECT_START':
      return { ...state, connectionStatus: 'reconnecting' };

    case 'RECONNECT_SUCCESS':
      return { ...state, connectionStatus: 'connected' };

    case 'DISCONNECT':
      return { ...state, connectionStatus: 'disconnected' };

    case 'SESSION_START':
      return { ...state, isStarting: true, error: null };

    case 'SESSION_CREATED':
      return {
        ...state,
        sessionId: action.sessionId,
        challengeId: action.challengeId,
        gameState: action.gameState,
        legalMoves: action.legalMoves,
        turn: action.turn,
        isStarting: false,
        moveCount: 0,
        gameOver: false,
        result: null,
        earnedAchievements: [],
        events: [],
      };

    case 'MOVE_START':
      return { ...state, isMoving: true, error: null };

    case 'MOVE_SUCCESS':
      return {
        ...state,
        isMoving: false,
        gameState: action.gameState,
        legalMoves: action.legalMoves,
        turn: action.turn,
        moveCount: action.moveCount,
      };

    case 'MOVE_ERROR':
      return { ...state, isMoving: false, error: action.error };

    case 'AI_THINKING_START':
      return { ...state, isAIThinking: true };

    case 'AI_MOVED':
      return { ...state, isAIThinking: false };

    case 'GAME_STATE_CHANGED':
      return {
        ...state,
        turn: action.turn,
        moveCount: action.moveCount,
        gameOver: action.gameOver,
        isAIThinking: false,
      };

    case 'GAME_OVER':
      return {
        ...state,
        gameOver: true,
        result: action.result,
        replayId: action.replayId,
      };

    case 'ACHIEVEMENT_EARNED':
      return {
        ...state,
        earnedAchievements: [...state.earnedAchievements, action.achievement],
      };

    case 'EVENT_RECEIVED':
      return {
        ...state,
        events: [...state.events, action.event],
        lastEventId: action.event.id as string,
      };

    case 'CLEAR_ACHIEVEMENTS':
      return { ...state, earnedAchievements: [] };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// =============================================================================
// Hook
// =============================================================================

export interface UseChallengeSessionOptions {
  /** Auto-reconnect on connection loss (default: true) */
  autoReconnect?: boolean;
  /** Reconnect delay in ms (default: 1000) */
  reconnectDelay?: number;
  /** Max reconnect attempts (default: 5) */
  maxReconnectAttempts?: number;
}

export function useChallengeSession(options: UseChallengeSessionOptions = {}) {
  const { autoReconnect = true, reconnectDelay = 1000, maxReconnectAttempts = 5 } = options;

  const [state, dispatch] = useReducer(sessionReducer, initialState);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectRef = useRef<(sessionId: string, lastEventId?: string) => void>(() => {});

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  const handleEvent = useCallback((event: DomainEvent) => {
    dispatch({ type: 'EVENT_RECEIVED', event });

    switch (event.type) {
      case 'session_created':
        // Session created is handled by startChallenge response
        break;

      case 'move_executed':
        // Move executed is handled by makeMove response
        break;

      case 'ai_thinking':
        dispatch({ type: 'AI_THINKING_START' });
        break;

      case 'ai_moved':
        dispatch({ type: 'AI_MOVED', move: event.payload.move });
        break;

      case 'game_state_changed':
        dispatch({
          type: 'GAME_STATE_CHANGED',
          turn: event.payload.turn,
          moveCount: event.payload.moveCount,
          gameOver: event.payload.gameOver,
        });
        break;

      case 'game_completed':
        dispatch({
          type: 'GAME_OVER',
          result: event.payload.result,
          replayId: event.payload.replayId,
        });
        break;

      case 'achievement_earned':
        dispatch({
          type: 'ACHIEVEMENT_EARNED',
          achievement: {
            id: event.payload.achievementId as string,
            name: event.payload.name,
            description: event.payload.description,
            points: event.payload.points,
            rarity: event.payload.rarity,
            icon: event.payload.icon,
          },
        });
        break;

      case 'error':
        if (!event.payload.recoverable) {
          dispatch({ type: 'CONNECT_ERROR', error: event.payload.message });
        }
        break;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // SSE Connection
  // ---------------------------------------------------------------------------

  const connect = useCallback(
    (sessionId: string, lastEventId?: string) => {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      dispatch({ type: lastEventId ? 'RECONNECT_START' : 'CONNECT_START' });

      const url = new URL('/api/mcp/stream', window.location.origin);
      url.searchParams.set('sessionId', sessionId);
      if (lastEventId) {
        url.searchParams.set('lastEventId', lastEventId);
      }

      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('connected', () => {
        reconnectAttemptsRef.current = 0;
        dispatch({ type: 'CONNECT_SUCCESS', sessionId });
      });

      eventSource.addEventListener('reconnected', (e) => {
        const data = JSON.parse((e as MessageEvent).data) as { missedCount: number };
        dispatch({ type: 'RECONNECT_SUCCESS', missedCount: data.missedCount });
      });

      // Handle domain events
      const eventTypes = [
        'session_created',
        'session_restored',
        'move_validated',
        'move_executed',
        'ai_thinking',
        'ai_moved',
        'game_state_changed',
        'game_completed',
        'achievement_earned',
        'achievement_evaluation_complete',
        'session_expired',
        'error',
      ];

      for (const eventType of eventTypes) {
        eventSource.addEventListener(eventType, (e) => {
          try {
            const event = JSON.parse((e as MessageEvent).data) as DomainEvent;
            handleEvent(event);
          } catch (err) {
            console.error('Failed to parse event:', err);
          }
        });
      }

      eventSource.onerror = () => {
        eventSource.close();
        eventSourceRef.current = null;

        if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connectRef.current(sessionId, state.lastEventId ?? undefined);
          }, reconnectDelay * reconnectAttemptsRef.current);
        } else {
          dispatch({ type: 'CONNECT_ERROR', error: 'Connection lost' });
        }
      };
    },
    [autoReconnect, reconnectDelay, maxReconnectAttempts, state.lastEventId, handleEvent]
  );

  // Update ref when connect changes
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    dispatch({ type: 'DISCONNECT' });
  }, []);

  // ---------------------------------------------------------------------------
  // API Actions
  // ---------------------------------------------------------------------------

  const startChallenge = useCallback(
    async (challengeId: string, difficulty: Difficulty = 'medium') => {
      dispatch({ type: 'SESSION_START' });

      try {
        const response = await fetch('/api/mcp/tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: 'start_challenge',
            args: { challengeId, difficulty },
          }),
        });

        const data = (await response.json()) as {
          success: boolean;
          data?: {
            sessionId: string;
            challengeId: string;
            gameState: string;
            legalMoves: string[];
            turn: 'player' | 'opponent';
          };
          error?: string;
        };

        if (data.success && data.data) {
          dispatch({
            type: 'SESSION_CREATED',
            sessionId: data.data.sessionId,
            challengeId: data.data.challengeId,
            gameState: data.data.gameState,
            legalMoves: data.data.legalMoves,
            turn: data.data.turn,
          });

          // Connect to SSE stream
          connect(data.data.sessionId);
        } else {
          dispatch({ type: 'MOVE_ERROR', error: data.error ?? 'Failed to start challenge' });
        }
      } catch (err) {
        dispatch({ type: 'MOVE_ERROR', error: (err as Error).message });
      }
    },
    [connect]
  );

  const makeMove = useCallback(
    async (move: string) => {
      if (!state.sessionId) {
        dispatch({ type: 'MOVE_ERROR', error: 'No active session' });
        return;
      }

      dispatch({ type: 'MOVE_START' });

      try {
        const response = await fetch('/api/mcp/tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: 'challenge_move',
            args: { sessionId: state.sessionId, move },
          }),
        });

        const data = (await response.json()) as {
          success: boolean;
          data?: {
            valid: boolean;
            gameState: string;
            legalMoves: string[];
            turn: 'player' | 'opponent';
            gameOver: boolean;
            result?: GameResult;
            aiMove?: string;
          };
          error?: string;
        };

        if (data.success && data.data) {
          dispatch({
            type: 'MOVE_SUCCESS',
            gameState: data.data.gameState,
            legalMoves: data.data.legalMoves,
            turn: data.data.turn,
            moveCount: state.moveCount + 1,
            aiMove: data.data.aiMove,
          });
        } else {
          dispatch({ type: 'MOVE_ERROR', error: data.error ?? 'Invalid move' });
        }
      } catch (err) {
        dispatch({ type: 'MOVE_ERROR', error: (err as Error).message });
      }
    },
    [state.sessionId, state.moveCount]
  );

  const completeChallenge = useCallback(async () => {
    if (!state.sessionId) {
      dispatch({ type: 'MOVE_ERROR', error: 'No active session' });
      return;
    }

    try {
      const response = await fetch('/api/mcp/tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'complete_challenge',
          args: { sessionId: state.sessionId },
        }),
      });

      const data = (await response.json()) as {
        success: boolean;
        data?: {
          result: GameResult;
          replayId: string;
        };
        error?: string;
      };

      if (!data.success) {
        dispatch({ type: 'MOVE_ERROR', error: data.error ?? 'Failed to complete challenge' });
      }
      // Success events will come through SSE
    } catch (err) {
      dispatch({ type: 'MOVE_ERROR', error: (err as Error).message });
    }
  }, [state.sessionId]);

  // ---------------------------------------------------------------------------
  // Utility Actions
  // ---------------------------------------------------------------------------

  const clearAchievements = useCallback(() => {
    dispatch({ type: 'CLEAR_ACHIEVEMENTS' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const reset = useCallback(() => {
    disconnect();
    dispatch({ type: 'RESET' });
  }, [disconnect]);

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    // State
    ...state,

    // Actions
    connect,
    disconnect,
    startChallenge,
    makeMove,
    completeChallenge,
    clearAchievements,
    clearError,
    reset,

    // Computed
    isConnected: state.connectionStatus === 'connected',
    canMove:
      state.connectionStatus === 'connected' &&
      !state.isMoving &&
      !state.isAIThinking &&
      !state.gameOver &&
      state.turn === 'player',
  };
}
