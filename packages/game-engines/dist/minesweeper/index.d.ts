/**
 * Minesweeper Game Engine
 *
 * Classic Windows XP-style Minesweeper
 * Board cell values: -1 = mine, 0-8 = adjacent mine count
 */
import { type GameEngine, type GameState, type Difficulty } from '../types';
export type CellValue = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export interface MinesweeperState extends GameState {
    /** Board with mine values (-1 = mine, 0-8 = adjacent count) */
    board: CellValue[][];
    /** Which cells are revealed */
    revealed: boolean[][];
    /** Which cells are flagged */
    flagged: boolean[][];
    /** Board dimensions */
    rows: number;
    cols: number;
    /** Total mine count */
    mineCount: number;
    /** Remaining flags (mineCount - flagged count) */
    flagsRemaining: number;
    /** Game start time (first reveal) */
    startTime: number | null;
    /** Elapsed seconds */
    elapsedSeconds: number;
    /** First move protection - mines are placed after first click */
    firstMove: boolean;
}
export interface MinesweeperMove {
    action: 'reveal' | 'flag';
    row: number;
    col: number;
}
export interface MinesweeperOptions {
    difficulty?: Difficulty;
}
export declare const minesweeperEngine: GameEngine<MinesweeperState, MinesweeperMove, MinesweeperOptions>;
//# sourceMappingURL=index.d.ts.map