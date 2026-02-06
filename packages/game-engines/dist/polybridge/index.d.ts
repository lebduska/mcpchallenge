/**
 * Poly Bridge Game Engine
 *
 * A bridge-building puzzle game. Build bridges using beams, cables, and road
 * segments, then test if vehicles can cross safely.
 *
 * Note: Physics simulation runs client-side only (matter.js).
 * This engine manages the structure data and validation.
 */
import { type GameEngine, type GameState } from '../types';
import { type Level, type Point, type MaterialType } from './levels';
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
export type PolyBridgeMoveAction = 'add_structure' | 'remove_structure' | 'start_test' | 'test_passed' | 'test_failed' | 'reset' | 'next_level';
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
export declare const polybridgeEngine: GameEngine<PolyBridgeState, PolyBridgeMove, PolyBridgeOptions>;
export { LEVELS, MATERIAL_COSTS, type Level, type Point, type MaterialType } from './levels';
//# sourceMappingURL=index.d.ts.map