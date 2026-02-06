/**
 * Poly Bridge Game Engine
 *
 * A bridge-building puzzle game. Build bridges using beams, cables, and road
 * segments, then test if vehicles can cross safely.
 *
 * Note: Physics simulation runs client-side only (matter.js).
 * This engine manages the structure data and validation.
 */

import {
  generateGameId,
  type GameEngine,
  type GameState,
  type GameResult,
  type MoveResult,
  type GameStateJSON,
} from '../types';
import { LEVELS, getLevelByIndex, MATERIAL_COSTS, type Level, type Point, type MaterialType } from './levels';

// =============================================================================
// Types
// =============================================================================

export interface Structure {
  id: string;
  type: 'beam' | 'cable' | 'road';
  material: MaterialType;
  start: Point;
  end: Point;
  cost: number;
}

export interface PolyBridgeState extends GameState {
  /** Current level */
  level: Level;
  /** Level index (0-4) */
  levelIndex: number;
  /** Built structures */
  structures: Structure[];
  /** Total budget used */
  budgetUsed: number;
  /** Test result */
  testResult: 'untested' | 'testing' | 'passed' | 'failed';
  /** Vehicle progress during test (0-100) */
  vehicleProgress: number;
  /** Whether the level is complete */
  levelComplete: boolean;
}

export type PolyBridgeMoveAction =
  | 'add_structure'
  | 'remove_structure'
  | 'start_test'
  | 'test_passed'
  | 'test_failed'
  | 'reset'
  | 'next_level';

export interface PolyBridgeMove {
  action: PolyBridgeMoveAction;
  params?: {
    type?: 'beam' | 'cable' | 'road';
    material?: MaterialType;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    id?: string;
  };
}

export interface PolyBridgeOptions {
  levelIndex?: number;
}

// =============================================================================
// Helper Functions
// =============================================================================

function generateStructureId(): string {
  return `s-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function calculateDistance(start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function calculateStructureCost(type: 'beam' | 'cable' | 'road', material: MaterialType, start: Point, end: Point): number {
  const length = calculateDistance(start, end);
  const costPerUnit = MATERIAL_COSTS[material];
  // Road is always the same material cost
  if (type === 'road') {
    return Math.ceil(length * MATERIAL_COSTS.road / 10);
  }
  return Math.ceil(length * costPerUnit / 10);
}

function snapToGrid(point: Point, gridSize = 10): Point {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

// =============================================================================
// Poly Bridge Engine Implementation
// =============================================================================

function createPolyBridgeEngine(): GameEngine<PolyBridgeState, PolyBridgeMove, PolyBridgeOptions> {
  return {
    // -------------------------------------------------------------------------
    // Metadata
    // -------------------------------------------------------------------------
    metadata: {
      id: 'polybridge',
      name: 'Poly Bridge',
      description: 'Build bridges to help vehicles cross gaps and valleys',
      difficulty: 'medium',
      points: 200,
      transport: 'sse',
      minPlayers: 1,
      maxPlayers: 1,
    },

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------
    newGame(options = {}): PolyBridgeState {
      const levelIndex = options.levelIndex ?? 0;
      const level = getLevelByIndex(levelIndex) ?? LEVELS[0];

      return {
        gameId: generateGameId(),
        status: 'playing',
        turn: 'player',
        moveCount: 0,
        level,
        levelIndex,
        structures: [],
        budgetUsed: 0,
        testResult: 'untested',
        vehicleProgress: 0,
        levelComplete: false,
      };
    },

    validateState(state: unknown): state is PolyBridgeState {
      if (!state || typeof state !== 'object') return false;
      const s = state as PolyBridgeState;
      return (
        typeof s.gameId === 'string' &&
        typeof s.levelIndex === 'number' &&
        Array.isArray(s.structures) &&
        typeof s.budgetUsed === 'number'
      );
    },

    // -------------------------------------------------------------------------
    // Game Logic
    // -------------------------------------------------------------------------
    getLegalMoves(state: PolyBridgeState): PolyBridgeMove[] {
      const moves: PolyBridgeMove[] = [];

      // Can always add structures if under budget
      if (state.budgetUsed < state.level.budget) {
        moves.push({ action: 'add_structure', params: { type: 'beam', material: 'wood' } });
        moves.push({ action: 'add_structure', params: { type: 'beam', material: 'steel' } });
        moves.push({ action: 'add_structure', params: { type: 'cable', material: 'cable' } });
        moves.push({ action: 'add_structure', params: { type: 'road', material: 'road' } });
      }

      // Can remove existing structures
      for (const structure of state.structures) {
        moves.push({ action: 'remove_structure', params: { id: structure.id } });
      }

      // Can test if there are structures
      if (state.structures.length > 0 && state.testResult !== 'testing') {
        moves.push({ action: 'start_test' });
      }

      // Can reset
      moves.push({ action: 'reset' });

      // Can go to next level if complete
      if (state.levelComplete && state.levelIndex < LEVELS.length - 1) {
        moves.push({ action: 'next_level' });
      }

      return moves;
    },

    isLegalMove(state: PolyBridgeState, move: PolyBridgeMove): boolean {
      switch (move.action) {
        case 'add_structure': {
          const params = move.params;
          if (!params?.x1 || !params?.y1 || !params?.x2 || !params?.y2) {
            return false;
          }
          const start = { x: params.x1, y: params.y1 };
          const end = { x: params.x2, y: params.y2 };
          const material = params.material ?? 'wood';
          const type = params.type ?? 'beam';
          const cost = calculateStructureCost(type, material, start, end);
          return state.budgetUsed + cost <= state.level.budget;
        }

        case 'remove_structure':
          return state.structures.some(s => s.id === move.params?.id);

        case 'start_test':
          return state.structures.length > 0 && state.testResult !== 'testing';

        case 'test_passed':
        case 'test_failed':
          return state.testResult === 'testing';

        case 'reset':
          return true;

        case 'next_level':
          return state.levelComplete && state.levelIndex < LEVELS.length - 1;

        default:
          return false;
      }
    },

    makeMove(state: PolyBridgeState, move: PolyBridgeMove): MoveResult<PolyBridgeState> {
      const { action, params } = move;

      switch (action) {
        case 'add_structure': {
          if (!params?.x1 || !params?.y1 || !params?.x2 || !params?.y2) {
            return { state, valid: false, error: 'Missing coordinates' };
          }

          const type = params.type ?? 'beam';
          const material = params.material ?? (type === 'cable' ? 'cable' : type === 'road' ? 'road' : 'wood');
          const start = snapToGrid({ x: params.x1, y: params.y1 });
          const end = snapToGrid({ x: params.x2, y: params.y2 });
          const cost = calculateStructureCost(type, material as MaterialType, start, end);

          if (state.budgetUsed + cost > state.level.budget) {
            return { state, valid: false, error: 'Over budget' };
          }

          const structure: Structure = {
            id: generateStructureId(),
            type,
            material: material as MaterialType,
            start,
            end,
            cost,
          };

          return {
            state: {
              ...state,
              structures: [...state.structures, structure],
              budgetUsed: state.budgetUsed + cost,
              testResult: 'untested',
              moveCount: state.moveCount + 1,
              lastMoveAt: Date.now(),
            },
            valid: true,
          };
        }

        case 'remove_structure': {
          const structureId = params?.id;
          const structure = state.structures.find(s => s.id === structureId);
          if (!structure) {
            return { state, valid: false, error: 'Structure not found' };
          }

          return {
            state: {
              ...state,
              structures: state.structures.filter(s => s.id !== structureId),
              budgetUsed: state.budgetUsed - structure.cost,
              testResult: 'untested',
              moveCount: state.moveCount + 1,
              lastMoveAt: Date.now(),
            },
            valid: true,
          };
        }

        case 'start_test': {
          return {
            state: {
              ...state,
              testResult: 'testing',
              vehicleProgress: 0,
              moveCount: state.moveCount + 1,
              lastMoveAt: Date.now(),
            },
            valid: true,
          };
        }

        case 'test_passed': {
          const newState: PolyBridgeState = {
            ...state,
            testResult: 'passed',
            vehicleProgress: 100,
            levelComplete: true,
            status: state.levelIndex >= LEVELS.length - 1 ? 'won' : 'playing',
            moveCount: state.moveCount + 1,
            lastMoveAt: Date.now(),
          };

          return {
            state: newState,
            valid: true,
            result: state.levelIndex >= LEVELS.length - 1
              ? { status: 'won', totalMoves: newState.moveCount }
              : undefined,
          };
        }

        case 'test_failed': {
          return {
            state: {
              ...state,
              testResult: 'failed',
              moveCount: state.moveCount + 1,
              lastMoveAt: Date.now(),
            },
            valid: true,
          };
        }

        case 'reset': {
          return {
            state: {
              ...state,
              structures: [],
              budgetUsed: 0,
              testResult: 'untested',
              vehicleProgress: 0,
              moveCount: state.moveCount + 1,
              lastMoveAt: Date.now(),
            },
            valid: true,
          };
        }

        case 'next_level': {
          if (!state.levelComplete || state.levelIndex >= LEVELS.length - 1) {
            return { state, valid: false, error: 'Cannot advance to next level' };
          }

          const nextLevelIndex = state.levelIndex + 1;
          const nextLevel = getLevelByIndex(nextLevelIndex)!;

          return {
            state: {
              ...state,
              level: nextLevel,
              levelIndex: nextLevelIndex,
              structures: [],
              budgetUsed: 0,
              testResult: 'untested',
              vehicleProgress: 0,
              levelComplete: false,
              moveCount: state.moveCount + 1,
              lastMoveAt: Date.now(),
            },
            valid: true,
          };
        }

        default:
          return {
            state,
            valid: false,
            error: `Unknown action: ${action}`,
          };
      }
    },

    getAIMove(_state: PolyBridgeState): PolyBridgeMove | null {
      // Poly Bridge is player-controlled only
      return null;
    },

    isGameOver(state: PolyBridgeState): boolean {
      return state.status === 'won';
    },

    getResult(state: PolyBridgeState): GameResult | null {
      if (state.status === 'won') {
        return { status: 'won', totalMoves: state.moveCount };
      }
      return null;
    },

    // -------------------------------------------------------------------------
    // Serialization
    // -------------------------------------------------------------------------
    serialize(state: PolyBridgeState): string {
      return JSON.stringify(state);
    },

    deserialize(data: string): PolyBridgeState {
      const parsed = JSON.parse(data);
      if (!this.validateState(parsed)) {
        throw new Error('Invalid poly bridge state data');
      }
      return parsed;
    },

    // -------------------------------------------------------------------------
    // Rendering
    // -------------------------------------------------------------------------
    renderText(state: PolyBridgeState): string {
      const lines = [
        `Poly Bridge - ${state.level.name}`,
        `Budget: $${state.budgetUsed} / $${state.level.budget}`,
        `Structures: ${state.structures.length}`,
        `Status: ${state.testResult}`,
      ];
      if (state.levelComplete) {
        lines.push(`Level Complete!`);
      }
      return lines.join('\n');
    },

    renderJSON(state: PolyBridgeState): GameStateJSON {
      return {
        gameType: 'polybridge',
        gameId: state.gameId,
        status: state.status,
        turn: state.turn,
        moveCount: state.moveCount,
        legalMoves: [],
        board: {
          levelId: state.level.id,
          levelName: state.level.name,
          width: state.level.width,
          height: state.level.height,
          anchors: state.level.anchors,
          terrain: state.level.terrain,
        },
        extra: {
          structures: state.structures,
          budget: state.level.budget,
          budgetUsed: state.budgetUsed,
          testResult: state.testResult,
          vehicleProgress: state.vehicleProgress,
          levelComplete: state.levelComplete,
          levelIndex: state.levelIndex,
          totalLevels: LEVELS.length,
        },
      };
    },

    formatMove(move: PolyBridgeMove): string {
      if (move.params) {
        return `${move.action}(${JSON.stringify(move.params)})`;
      }
      return move.action;
    },

    parseMove(input: string): PolyBridgeMove | null {
      try {
        // Try parsing as action(params)
        const match = input.match(/^(\w+)(?:\((.*)\))?$/);
        if (!match) return null;

        const action = match[1] as PolyBridgeMoveAction;
        const paramsStr = match[2];
        const params = paramsStr ? JSON.parse(paramsStr) : undefined;

        return { action, params };
      } catch {
        return null;
      }
    },
  };
}

// =============================================================================
// Export
// =============================================================================

export const polybridgeEngine = createPolyBridgeEngine();
export { LEVELS, MATERIAL_COSTS, type Level, type Point, type MaterialType } from './levels';
