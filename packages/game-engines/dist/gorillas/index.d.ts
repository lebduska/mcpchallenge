/**
 * Gorillas Game Engine
 *
 * Classic artillery game inspired by GORILLA.BAS (MS-DOS 1991)
 * Two gorillas throw explosive bananas at each other across a cityscape
 *
 * Physics: Projectile motion with gravity and wind
 * Players input: angle (0-360°) and velocity (1-200)
 */
import { type GameEngine, type GameState, type Difficulty } from '../types';
export interface Position {
    x: number;
    y: number;
}
export interface Building {
    x: number;
    width: number;
    height: number;
    /** Damage mask - array of damaged pixel columns (relative heights) */
    damage: number[];
}
export interface Gorilla {
    position: Position;
    buildingIndex: number;
    score: number;
    name: string;
}
export interface Trajectory {
    points: Position[];
    hit: 'building' | 'gorilla' | 'out-of-bounds' | 'sun' | null;
    hitPosition?: Position;
    explosionRadius: number;
}
export interface GorillasState extends GameState {
    /** Game type identifier */
    gameType: 'gorillas';
    /** City buildings */
    buildings: Building[];
    /** Player 1 (left gorilla) */
    player1: Gorilla;
    /** Player 2 (right gorilla) - can be AI or human */
    player2: Gorilla;
    /** Current wind strength (-15 to +15, negative = left) */
    wind: number;
    /** Gravity constant (default 9.8) */
    gravity: number;
    /** Current level index */
    levelIndex: number;
    /** Total levels */
    totalLevels: number;
    /** Points needed to win */
    pointsToWin: number;
    /** Canvas dimensions */
    width: number;
    height: number;
    /** Sun position */
    sunPosition: Position;
    /** Is player 2 AI? */
    isVsAI: boolean;
    /** AI difficulty */
    aiDifficulty: Difficulty;
    /** Last throw trajectory (for visualization) */
    lastTrajectory?: Trajectory;
    /** Which player just threw */
    lastThrower?: 'player1' | 'player2';
    /** Message to display */
    message?: string;
}
export interface GorillasMove {
    angle: number;
    velocity: number;
}
export interface GorillasOptions {
    levelIndex?: number;
    vsAI?: boolean;
    aiDifficulty?: Difficulty;
    player1Name?: string;
    player2Name?: string;
    pointsToWin?: number;
    gravity?: number;
}
interface LevelConfig {
    name: string;
    buildingCount: number;
    minHeight: number;
    maxHeight: number;
    windRange: [number, number];
    gravity: number;
    description: string;
}
declare const LEVELS: LevelConfig[];
export declare const GorillasEngine: GameEngine<GorillasState, GorillasMove, GorillasOptions>;
export { LEVELS };
export type { LevelConfig };
//# sourceMappingURL=index.d.ts.map