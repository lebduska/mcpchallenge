/**
 * Lights Out Game Engine
 *
 * Classic puzzle game from Tiger Electronics (1995)
 * Toggle lights to turn them all off - each toggle affects neighbors
 */
import { generateGameId, } from '../types';
// =============================================================================
// Constants
// =============================================================================
const DIFFICULTY_CONFIG = {
    easy: { size: 5, toggles: 5 }, // 5 random toggles
    medium: { size: 5, toggles: 10 }, // 10 random toggles
    hard: { size: 5, toggles: 15 }, // 15 random toggles
};
// Cross pattern: the cell and its 4 neighbors
const NEIGHBORS = [
    [0, 0], // self
    [-1, 0], // up
    [1, 0], // down
    [0, -1], // left
    [0, 1], // right
];
// =============================================================================
// Helper Functions
// =============================================================================
function createEmptyGrid(size) {
    return Array.from({ length: size }, () => Array.from({ length: size }, () => false));
}
function cloneGrid(grid) {
    return grid.map(row => [...row]);
}
function toggleCell(grid, row, col, size) {
    for (const [dr, dc] of NEIGHBORS) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            grid[nr][nc] = !grid[nr][nc];
        }
    }
}
function countLightsOn(grid) {
    return grid.flat().filter(Boolean).length;
}
function isSolved(grid) {
    return grid.every(row => row.every(cell => !cell));
}
/**
 * Generate a solvable puzzle by starting from solved state
 * and applying random toggles
 */
function generatePuzzle(size, toggleCount) {
    const grid = createEmptyGrid(size);
    const toggledPositions = new Set();
    // Apply random toggles - track unique positions for min solution estimate
    for (let i = 0; i < toggleCount; i++) {
        const row = Math.floor(Math.random() * size);
        const col = Math.floor(Math.random() * size);
        const key = `${row},${col}`;
        toggleCell(grid, row, col, size);
        // XOR logic: toggling same cell twice cancels out
        if (toggledPositions.has(key)) {
            toggledPositions.delete(key);
        }
        else {
            toggledPositions.add(key);
        }
    }
    // If puzzle is already solved, toggle a few more times
    if (isSolved(grid)) {
        const row = Math.floor(Math.random() * size);
        const col = Math.floor(Math.random() * size);
        toggleCell(grid, row, col, size);
        toggledPositions.add(`${row},${col}`);
    }
    return {
        grid,
        minSolution: toggledPositions.size,
    };
}
function formatGrid(grid, size) {
    const lines = [];
    // Column headers
    lines.push('   ' + Array.from({ length: size }, (_, i) => i.toString()).join(' '));
    lines.push('  ' + '─'.repeat(size * 2 + 1));
    for (let r = 0; r < size; r++) {
        let line = r + ' │';
        for (let c = 0; c < size; c++) {
            line += grid[r][c] ? ' ●' : ' ○';
        }
        lines.push(line);
    }
    return lines.join('\n');
}
// =============================================================================
// Lights Out Engine Implementation
// =============================================================================
function createLightsOutEngine() {
    return {
        // -------------------------------------------------------------------------
        // Metadata
        // -------------------------------------------------------------------------
        metadata: {
            id: 'lightsout',
            name: 'Lights Out',
            description: 'Classic 90s puzzle - toggle lights to turn them all off',
            difficulty: 'medium',
            points: 75,
            transport: 'sse',
            minPlayers: 1,
            maxPlayers: 1,
        },
        // -------------------------------------------------------------------------
        // Lifecycle
        // -------------------------------------------------------------------------
        newGame(options = {}) {
            const difficulty = options.difficulty ?? 'medium';
            const config = DIFFICULTY_CONFIG[difficulty];
            const size = options.size ?? config.size;
            const { grid, minSolution } = generatePuzzle(size, config.toggles);
            return {
                gameId: generateGameId(),
                status: 'playing',
                turn: 'player',
                moveCount: 0,
                grid,
                size,
                toggleCount: 0,
                minSolution,
                difficulty,
            };
        },
        validateState(state) {
            if (!state || typeof state !== 'object')
                return false;
            const s = state;
            return (typeof s.gameId === 'string' &&
                Array.isArray(s.grid) &&
                typeof s.size === 'number' &&
                typeof s.toggleCount === 'number');
        },
        // -------------------------------------------------------------------------
        // Game Logic
        // -------------------------------------------------------------------------
        getLegalMoves(state) {
            const moves = [];
            const { size } = state;
            for (let row = 0; row < size; row++) {
                for (let col = 0; col < size; col++) {
                    moves.push({ row, col });
                }
            }
            return moves;
        },
        isLegalMove(state, move) {
            const { row, col } = move;
            const { size } = state;
            return row >= 0 && row < size && col >= 0 && col < size;
        },
        makeMove(state, move) {
            const { row, col } = move;
            const { size } = state;
            // Validate bounds
            if (row < 0 || row >= size || col < 0 || col >= size) {
                return {
                    state,
                    valid: false,
                    error: `Invalid position: (${row}, ${col}). Must be 0-${size - 1}.`,
                };
            }
            // Clone grid and apply toggle
            const newGrid = cloneGrid(state.grid);
            toggleCell(newGrid, row, col, size);
            // Check for win
            const hasWon = isSolved(newGrid);
            const newState = {
                ...state,
                grid: newGrid,
                toggleCount: state.toggleCount + 1,
                moveCount: state.moveCount + 1,
                status: hasWon ? 'won' : 'playing',
                lastMoveAt: Date.now(),
            };
            if (hasWon) {
                return {
                    state: newState,
                    valid: true,
                    result: this.getResult(newState) ?? undefined,
                };
            }
            return { state: newState, valid: true };
        },
        getAIMove() {
            // Single-player puzzle, no AI opponent
            return null;
        },
        isGameOver(state) {
            return state.status === 'won';
        },
        getResult(state) {
            if (state.status !== 'won')
                return null;
            // Score based on how close to optimal solution
            const efficiency = state.minSolution / state.toggleCount;
            const score = Math.round(efficiency * 100);
            return {
                status: 'won',
                score,
                totalMoves: state.toggleCount,
                metadata: {
                    size: state.size,
                    difficulty: state.difficulty,
                    toggleCount: state.toggleCount,
                    minSolution: state.minSolution,
                    efficiency: Math.round(efficiency * 100) + '%',
                },
            };
        },
        // -------------------------------------------------------------------------
        // Serialization
        // -------------------------------------------------------------------------
        serialize(state) {
            return JSON.stringify(state);
        },
        deserialize(data) {
            const parsed = JSON.parse(data);
            if (!this.validateState(parsed)) {
                throw new Error('Invalid lightsout state data');
            }
            return parsed;
        },
        // -------------------------------------------------------------------------
        // Rendering
        // -------------------------------------------------------------------------
        renderText(state) {
            let text = formatGrid(state.grid, state.size);
            text += '\n\n';
            text += `● = ON (${countLightsOn(state.grid)} lights)  ○ = OFF\n`;
            text += `Toggles: ${state.toggleCount}`;
            if (state.status === 'won') {
                const efficiency = Math.round((state.minSolution / state.toggleCount) * 100);
                text += `\n\n🎉 Puzzle solved in ${state.toggleCount} moves!`;
                text += `\nEfficiency: ${efficiency}% (optimal: ~${state.minSolution} moves)`;
            }
            else {
                text += `\n\nGoal: Turn all lights OFF`;
                text += `\nHint: Each toggle affects the cell + its 4 neighbors (cross pattern)`;
            }
            return text;
        },
        renderJSON(state) {
            return {
                gameType: 'lightsout',
                gameId: state.gameId,
                status: state.status,
                turn: state.turn,
                moveCount: state.moveCount,
                legalMoves: this.getLegalMoves(state).map(m => `${m.row},${m.col}`),
                board: {
                    grid: state.grid,
                    size: state.size,
                },
                extra: {
                    toggleCount: state.toggleCount,
                    lightsOn: countLightsOn(state.grid),
                    difficulty: state.difficulty,
                },
            };
        },
        formatMove(move) {
            return `toggle ${move.row},${move.col}`;
        },
        parseMove(input) {
            // Format: "toggle 2,3" or "2,3" or "2 3"
            const match = input.trim().match(/^(?:toggle\s+)?(\d+)[,\s]+(\d+)$/i);
            if (!match)
                return null;
            const row = parseInt(match[1], 10);
            const col = parseInt(match[2], 10);
            if (isNaN(row) || isNaN(col))
                return null;
            return { row, col };
        },
    };
}
// =============================================================================
// Export
// =============================================================================
export const lightsOutEngine = createLightsOutEngine();
//# sourceMappingURL=index.js.map