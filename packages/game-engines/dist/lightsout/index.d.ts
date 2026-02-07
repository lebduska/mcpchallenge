/**
 * Lights Out Game Engine
 *
 * Classic puzzle game from Tiger Electronics (1995)
 * Toggle lights to turn them all off - each toggle affects neighbors
 */
import { type GameEngine, type GameState, type Difficulty } from '../types';
export interface LightsOutState extends GameState {
    /** Grid of lights (true = on, false = off) */
    grid: boolean[][];
    /** Grid dimensions */
    size: number;
    /** Number of toggles made */
    toggleCount: number;
    /** Minimum solution length (for scoring) */
    minSolution: number;
    /** Difficulty level */
    difficulty: Difficulty;
}
export interface LightsOutMove {
    row: number;
    col: number;
}
export interface LightsOutOptions {
    /** Grid size (default: 5) */
    size?: number;
    /** Difficulty affects puzzle complexity */
    difficulty?: Difficulty;
}
export declare const lightsOutEngine: GameEngine<LightsOutState, LightsOutMove, LightsOutOptions>;
//# sourceMappingURL=index.d.ts.map