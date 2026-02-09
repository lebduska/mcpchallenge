/**
 * Sorting Algorithm Challenge
 *
 * Challenge: Sort an array using compare and swap operations.
 * Goal: Minimize the number of comparisons and swaps.
 *
 * The agent cannot see the actual values - only compare them!
 * This teaches fundamental sorting algorithm concepts.
 */
import { generateGameId, } from '../types';
// Par calculations based on merge sort performance
function calculatePar(n) {
    // Merge sort: ~n log₂ n comparisons, ~n log₂ n array writes (swaps)
    const logN = Math.ceil(Math.log2(n));
    return {
        parComparisons: Math.ceil(n * logN * 1.2), // Slight buffer
        parSwaps: Math.ceil(n * logN),
    };
}
export const SORTING_LEVELS = [
    {
        id: 1,
        name: "Baby Steps",
        description: "Sort 3 numbers - easiest possible",
        arraySize: 3,
        difficulty: "easy",
        ...calculatePar(3),
        hint: "Only 3 comparisons needed at most",
    },
    {
        id: 2,
        name: "Getting Started",
        description: "Sort 5 numbers",
        arraySize: 5,
        difficulty: "easy",
        ...calculatePar(5),
        hint: "Try comparing adjacent elements",
    },
    {
        id: 3,
        name: "Small Array",
        description: "Sort 8 numbers",
        arraySize: 8,
        difficulty: "easy",
        ...calculatePar(8),
    },
    {
        id: 4,
        name: "Double Digits",
        description: "Sort 10 numbers",
        arraySize: 10,
        difficulty: "medium",
        ...calculatePar(10),
        hint: "Bubble sort works but is slow - try something smarter",
    },
    {
        id: 5,
        name: "Growing Pains",
        description: "Sort 15 numbers",
        arraySize: 15,
        difficulty: "medium",
        ...calculatePar(15),
    },
    {
        id: 6,
        name: "Score Challenge",
        description: "Sort 20 numbers efficiently",
        arraySize: 20,
        difficulty: "medium",
        ...calculatePar(20),
        hint: "O(n²) algorithms will struggle here",
    },
    {
        id: 7,
        name: "Algorithm Test",
        description: "Sort 30 numbers - efficiency matters",
        arraySize: 30,
        difficulty: "hard",
        ...calculatePar(30),
    },
    {
        id: 8,
        name: "Scaling Up",
        description: "Sort 50 numbers",
        arraySize: 50,
        difficulty: "hard",
        ...calculatePar(50),
        hint: "QuickSort or MergeSort recommended",
    },
    {
        id: 9,
        name: "Performance Critical",
        description: "Sort 75 numbers optimally",
        arraySize: 75,
        difficulty: "hard",
        ...calculatePar(75),
    },
    {
        id: 10,
        name: "The Gauntlet",
        description: "Sort 100 numbers - master challenge",
        arraySize: 100,
        difficulty: "hard",
        ...calculatePar(100),
        hint: "Only O(n log n) algorithms can achieve par",
    },
];
export const TOTAL_LEVELS = SORTING_LEVELS.length;
// =============================================================================
// Helper Functions
// =============================================================================
function generateRandomArray(size) {
    // Generate unique random numbers for cleaner sorting
    const arr = [];
    for (let i = 1; i <= size; i++) {
        arr.push(i);
    }
    // Fisher-Yates shuffle
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
function isSorted(arr) {
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] < arr[i - 1])
            return false;
    }
    return true;
}
function renderArrayVisual(state) {
    const maxVal = Math.max(...state.array);
    const barWidth = Math.min(3, Math.floor(60 / state.length));
    const maxHeight = 10;
    const lines = [];
    // Render bars from top to bottom
    for (let h = maxHeight; h >= 1; h--) {
        let line = '';
        for (let i = 0; i < state.length; i++) {
            const barHeight = Math.ceil((state.array[i] / maxVal) * maxHeight);
            const isLastCompared = state.lastCompared && (state.lastCompared[0] === i || state.lastCompared[1] === i);
            const isLastSwapped = state.lastSwapped && (state.lastSwapped[0] === i || state.lastSwapped[1] === i);
            if (barHeight >= h) {
                if (isLastSwapped) {
                    line += '▓'.repeat(barWidth);
                }
                else if (isLastCompared) {
                    line += '▒'.repeat(barWidth);
                }
                else {
                    line += '█'.repeat(barWidth);
                }
            }
            else {
                line += ' '.repeat(barWidth);
            }
            line += ' ';
        }
        lines.push(line);
    }
    // Index line
    let indexLine = '';
    for (let i = 0; i < state.length; i++) {
        const idx = i.toString().padStart(barWidth, ' ');
        indexLine += idx + ' ';
    }
    lines.push('─'.repeat(indexLine.length));
    lines.push(indexLine);
    return lines.join('\n');
}
// =============================================================================
// Sorting Engine Implementation
// =============================================================================
function createSortingEngine() {
    return {
        metadata: {
            id: 'sorting',
            name: 'Sorting Algorithm Challenge',
            description: 'Sort an array with minimum comparisons and swaps',
            difficulty: 'medium',
            points: 200,
            transport: 'sse',
            minPlayers: 1,
            maxPlayers: 1,
        },
        newGame(options = {}) {
            const levelIndex = options.level ?? 1;
            const level = SORTING_LEVELS[Math.min(levelIndex, TOTAL_LEVELS) - 1];
            const arraySize = options.arraySize ?? level.arraySize;
            const array = generateRandomArray(arraySize);
            const par = calculatePar(arraySize);
            return {
                gameId: generateGameId(),
                status: 'playing',
                turn: 'player',
                moveCount: 0,
                array,
                length: arraySize,
                comparisons: 0,
                swaps: 0,
                isSorted: false,
                difficulty: level.difficulty,
                levelIndex,
                totalLevels: TOTAL_LEVELS,
                parComparisons: par.parComparisons,
                parSwaps: par.parSwaps,
                history: [],
                lastCompared: null,
                lastSwapped: null,
            };
        },
        validateState(state) {
            if (!state || typeof state !== 'object')
                return false;
            const s = state;
            return (typeof s.gameId === 'string' &&
                Array.isArray(s.array) &&
                typeof s.length === 'number');
        },
        getLegalMoves(state) {
            const moves = [];
            // Compare and swap operations
            for (let i = 0; i < state.length; i++) {
                for (let j = i + 1; j < state.length; j++) {
                    moves.push({ action: 'compare', i, j });
                    moves.push({ action: 'swap', i, j });
                }
            }
            // Utility operations
            moves.push({ action: 'get_array' });
            moves.push({ action: 'check_sorted' });
            // Level operations
            for (let l = 1; l <= TOTAL_LEVELS; l++) {
                moves.push({ action: 'load_level', level: l });
            }
            return moves;
        },
        isLegalMove(state, move) {
            if (move.action === 'compare' || move.action === 'swap') {
                const { i, j } = move;
                return i !== undefined && j !== undefined &&
                    i >= 0 && i < state.length &&
                    j >= 0 && j < state.length &&
                    i !== j;
            }
            if (move.action === 'load_level') {
                return move.level !== undefined && move.level >= 1 && move.level <= TOTAL_LEVELS;
            }
            return true;
        },
        makeMove(state, move) {
            const newState = {
                ...state,
                array: [...state.array],
                history: [...state.history],
                moveCount: state.moveCount + 1,
                lastCompared: null,
                lastSwapped: null,
            };
            switch (move.action) {
                case 'compare': {
                    const { i, j } = move;
                    if (i === undefined || j === undefined) {
                        return { state, valid: false, error: 'Missing indices i and j' };
                    }
                    if (i < 0 || i >= state.length || j < 0 || j >= state.length) {
                        return { state, valid: false, error: `Index out of bounds (0-${state.length - 1})` };
                    }
                    if (i === j) {
                        return { state, valid: false, error: 'Cannot compare element with itself' };
                    }
                    newState.comparisons++;
                    const result = state.array[i] < state.array[j] ? -1 :
                        state.array[i] > state.array[j] ? 1 : 0;
                    newState.history.push({ type: 'compare', i, j, result });
                    newState.lastCompared = [i, j];
                    return {
                        state: newState,
                        valid: true,
                        message: result === -1 ? `array[${i}] < array[${j}]` :
                            result === 1 ? `array[${i}] > array[${j}]` :
                                `array[${i}] = array[${j}]`,
                    };
                }
                case 'swap': {
                    const { i, j } = move;
                    if (i === undefined || j === undefined) {
                        return { state, valid: false, error: 'Missing indices i and j' };
                    }
                    if (i < 0 || i >= state.length || j < 0 || j >= state.length) {
                        return { state, valid: false, error: `Index out of bounds (0-${state.length - 1})` };
                    }
                    if (i === j) {
                        return { state, valid: false, error: 'Cannot swap element with itself' };
                    }
                    newState.swaps++;
                    [newState.array[i], newState.array[j]] = [newState.array[j], newState.array[i]];
                    newState.history.push({ type: 'swap', i, j });
                    newState.lastSwapped = [i, j];
                    // Check if sorted after swap
                    if (isSorted(newState.array)) {
                        const wonState = { ...newState, isSorted: true, status: 'won' };
                        return {
                            state: wonState,
                            valid: true,
                            result: this.getResult(wonState) ?? undefined,
                        };
                    }
                    return { state: newState, valid: true };
                }
                case 'get_array': {
                    // Returns array length and indices (not values - that would be cheating!)
                    return {
                        state: newState,
                        valid: true,
                        message: `Array has ${state.length} elements (indices 0-${state.length - 1})`,
                    };
                }
                case 'check_sorted': {
                    const sorted = isSorted(state.array);
                    if (sorted) {
                        const wonState = { ...newState, isSorted: true, status: 'won' };
                        return {
                            state: wonState,
                            valid: true,
                            result: this.getResult(wonState) ?? undefined,
                        };
                    }
                    return {
                        state: newState,
                        valid: true,
                        message: 'Array is NOT sorted yet',
                    };
                }
                case 'load_level':
                case 'new_game': {
                    const levelNum = move.level ?? 1;
                    if (levelNum < 1 || levelNum > TOTAL_LEVELS) {
                        return { state, valid: false, error: `Level must be 1-${TOTAL_LEVELS}` };
                    }
                    const newGameState = this.newGame({ level: levelNum });
                    return { state: newGameState, valid: true };
                }
                default:
                    return { state, valid: false, error: 'Unknown action' };
            }
        },
        getAIMove() {
            return null; // Single-player
        },
        isGameOver(state) {
            return state.isSorted;
        },
        getResult(state) {
            if (!state.isSorted)
                return null;
            // Calculate stars based on performance vs par
            let stars = 1;
            const totalOps = state.comparisons + state.swaps;
            const parOps = state.parComparisons + state.parSwaps;
            if (state.comparisons <= state.parComparisons && state.swaps <= state.parSwaps) {
                stars = 3; // Perfect: under par on both
            }
            else if (totalOps <= parOps * 1.5) {
                stars = 2; // Good: within 50% of par
            }
            // Score calculation
            const efficiency = parOps / Math.max(totalOps, 1);
            const score = Math.round(stars * 100 + efficiency * 50);
            return {
                status: 'won',
                score,
                totalMoves: state.moveCount,
                metadata: {
                    arraySize: state.length,
                    comparisons: state.comparisons,
                    swaps: state.swaps,
                    parComparisons: state.parComparisons,
                    parSwaps: state.parSwaps,
                    level: state.levelIndex,
                    stars,
                },
            };
        },
        serialize(state) {
            return JSON.stringify(state);
        },
        deserialize(data) {
            const parsed = JSON.parse(data);
            if (!this.validateState(parsed)) {
                throw new Error('Invalid sorting state data');
            }
            return parsed;
        },
        renderText(state) {
            const level = SORTING_LEVELS[state.levelIndex - 1];
            let text = '';
            text += `═══ Level ${state.levelIndex}/${TOTAL_LEVELS}: ${level.name} ═══\n`;
            text += `${level.description}\n`;
            text += `Array size: ${state.length} | Par: ${state.parComparisons} comparisons, ${state.parSwaps} swaps\n\n`;
            // Visual representation
            text += renderArrayVisual(state);
            text += '\n\n';
            // Stats
            text += `Comparisons: ${state.comparisons}/${state.parComparisons} | `;
            text += `Swaps: ${state.swaps}/${state.parSwaps}\n`;
            if (state.lastCompared) {
                const [i, j] = state.lastCompared;
                const lastCmp = state.history[state.history.length - 1];
                if (lastCmp?.type === 'compare') {
                    const sym = lastCmp.result === -1 ? '<' : lastCmp.result === 1 ? '>' : '=';
                    text += `Last compare: array[${i}] ${sym} array[${j}]\n`;
                }
            }
            if (state.lastSwapped) {
                text += `Last swap: [${state.lastSwapped[0]}] ↔ [${state.lastSwapped[1]}]\n`;
            }
            if (state.isSorted) {
                const result = this.getResult(state);
                const stars = result?.metadata?.stars ?? 1;
                text += `\n${'⭐'.repeat(stars)} SORTED! `;
                text += `${state.comparisons} comparisons, ${state.swaps} swaps\n`;
                if (state.levelIndex < TOTAL_LEVELS) {
                    text += `Use 'load_level ${state.levelIndex + 1}' for next challenge!`;
                }
                else {
                    text += `🎉 All levels completed!`;
                }
            }
            else {
                text += '\nGoal: Sort the array using compare(i,j) and swap(i,j)';
            }
            text += '\n\nTools: compare(i,j), swap(i,j), check_sorted, load_level N';
            return text;
        },
        renderJSON(state) {
            return {
                gameType: 'sorting',
                gameId: state.gameId,
                status: state.status,
                turn: state.turn,
                moveCount: state.moveCount,
                legalMoves: ['compare', 'swap', 'check_sorted', 'load_level'],
                board: {
                    // Don't expose actual values - only indices
                    length: state.length,
                    indices: Array.from({ length: state.length }, (_, i) => i),
                    // But for visualization, we can show relative heights
                    relativeHeights: state.array.map(v => v / Math.max(...state.array)),
                },
                extra: {
                    comparisons: state.comparisons,
                    swaps: state.swaps,
                    parComparisons: state.parComparisons,
                    parSwaps: state.parSwaps,
                    isSorted: state.isSorted,
                    levelIndex: state.levelIndex,
                    totalLevels: state.totalLevels,
                    lastCompared: state.lastCompared,
                    lastSwapped: state.lastSwapped,
                    // For UI visualization only
                    _visualArray: state.array,
                },
            };
        },
        formatMove(move) {
            switch (move.action) {
                case 'compare':
                    return `compare(${move.i}, ${move.j})`;
                case 'swap':
                    return `swap(${move.i}, ${move.j})`;
                case 'load_level':
                    return `load_level ${move.level}`;
                default:
                    return move.action;
            }
        },
        parseMove(input) {
            const trimmed = input.trim().toLowerCase();
            // compare(i, j) or compare i j
            const compareMatch = trimmed.match(/^compare\s*\(?\s*(\d+)\s*[,\s]\s*(\d+)\s*\)?$/);
            if (compareMatch) {
                return {
                    action: 'compare',
                    i: parseInt(compareMatch[1], 10),
                    j: parseInt(compareMatch[2], 10),
                };
            }
            // swap(i, j) or swap i j
            const swapMatch = trimmed.match(/^swap\s*\(?\s*(\d+)\s*[,\s]\s*(\d+)\s*\)?$/);
            if (swapMatch) {
                return {
                    action: 'swap',
                    i: parseInt(swapMatch[1], 10),
                    j: parseInt(swapMatch[2], 10),
                };
            }
            // load_level N or level N
            const levelMatch = trimmed.match(/^(?:load_)?level\s+(\d+)$/);
            if (levelMatch) {
                return { action: 'load_level', level: parseInt(levelMatch[1], 10) };
            }
            // Simple commands
            if (trimmed === 'check_sorted' || trimmed === 'check') {
                return { action: 'check_sorted' };
            }
            if (trimmed === 'get_array' || trimmed === 'array') {
                return { action: 'get_array' };
            }
            if (trimmed === 'new_game' || trimmed === 'new' || trimmed === 'reset') {
                return { action: 'new_game' };
            }
            return null;
        },
    };
}
// =============================================================================
// Export
// =============================================================================
export const sortingEngine = createSortingEngine();
//# sourceMappingURL=index.js.map