/**
 * Pathfinding Game Engine
 *
 * Interactive pathfinding visualizer with BFS, Dijkstra, and A* algorithms.
 * Supports walls and weighted terrain (mud, water).
 */
import { type GameEngine, type GameState, type Difficulty } from '../types';
export type CellType = 'empty' | 'wall' | 'start' | 'goal' | 'mud' | 'water';
export type Algorithm = 'bfs' | 'dijkstra' | 'astar';
export interface Cell {
    type: CellType;
    visited: boolean;
    inPath: boolean;
    gCost: number;
    fCost: number;
}
export interface Position {
    row: number;
    col: number;
}
export interface PathfindingState extends GameState {
    grid: Cell[][];
    width: number;
    height: number;
    start: Position | null;
    goal: Position | null;
    algorithm: Algorithm;
    pathFound: boolean | null;
    pathLength: number;
    pathCost: number;
    nodesExpanded: number;
    path: Position[];
    difficulty: Difficulty;
    levelIndex: number;
    totalLevels: number;
    parCost: number;
    parNodes: number;
    levelName: string;
    mode: 'sandbox' | 'challenge';
}
export interface PathfindingMove {
    action: 'set_cell' | 'set_start' | 'set_goal' | 'find_path' | 'clear' | 'generate_maze' | 'load_level' | 'next_level';
    row?: number;
    col?: number;
    cellType?: CellType;
    algorithm?: Algorithm;
    level?: number;
}
export interface PathfindingOptions {
    width?: number;
    height?: number;
    difficulty?: Difficulty;
    level?: number;
    mode?: 'sandbox' | 'challenge';
}
export interface PathfindingLevel {
    id: number;
    name: string;
    description: string;
    width: number;
    height: number;
    map: string;
    parCost: number;
    parNodes: number;
    difficulty: Difficulty;
    hint?: string;
}
export declare const PATHFINDING_LEVELS: PathfindingLevel[];
export declare const TOTAL_LEVELS: number;
export declare const pathfindingEngine: GameEngine<PathfindingState, PathfindingMove, PathfindingOptions>;
//# sourceMappingURL=index.d.ts.map