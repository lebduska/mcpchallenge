/**
 * Sorting Algorithm Challenge
 *
 * Challenge: Sort an array using compare and swap operations.
 * Goal: Minimize the number of comparisons and swaps.
 *
 * The agent cannot see the actual values - only compare them!
 * This teaches fundamental sorting algorithm concepts.
 */
import { type GameEngine, type GameState, type Difficulty } from '../types';
export interface SortingState extends GameState {
    array: number[];
    length: number;
    comparisons: number;
    swaps: number;
    isSorted: boolean;
    difficulty: Difficulty;
    levelIndex: number;
    totalLevels: number;
    parComparisons: number;
    parSwaps: number;
    history: Array<{
        type: 'compare' | 'swap';
        i: number;
        j: number;
        result?: number;
    }>;
    lastCompared: [number, number] | null;
    lastSwapped: [number, number] | null;
}
export interface SortingMove {
    action: 'compare' | 'swap' | 'get_array' | 'check_sorted' | 'new_game' | 'load_level';
    i?: number;
    j?: number;
    level?: number;
}
export interface SortingOptions {
    difficulty?: Difficulty;
    level?: number;
    arraySize?: number;
}
export interface SortingLevel {
    id: number;
    name: string;
    description: string;
    arraySize: number;
    difficulty: Difficulty;
    parComparisons: number;
    parSwaps: number;
    hint?: string;
}
export declare const SORTING_LEVELS: SortingLevel[];
export declare const TOTAL_LEVELS: number;
export declare const sortingEngine: GameEngine<SortingState, SortingMove, SortingOptions>;
//# sourceMappingURL=index.d.ts.map