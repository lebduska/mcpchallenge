/**
 * Minesweeper Game Engine
 *
 * Classic Windows XP-style Minesweeper
 * Board cell values: -1 = mine, 0-8 = adjacent mine count
 */
import { generateGameId, } from '../types';
// =============================================================================
// Constants
// =============================================================================
const DIFFICULTY_CONFIG = {
    easy: { rows: 9, cols: 9, mines: 10 },
    medium: { rows: 16, cols: 16, mines: 40 },
    hard: { rows: 16, cols: 30, mines: 99 },
};
const NEIGHBORS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1],
];
// =============================================================================
// Helper Functions
// =============================================================================
function createEmptyBoard(rows, cols, value) {
    return Array.from({ length: rows }, () => Array.from({ length: cols }, () => value));
}
function placeMines(rows, cols, mineCount, excludeRow, excludeCol) {
    const board = createEmptyBoard(rows, cols, 0);
    let placed = 0;
    // Create list of valid positions (excluding clicked cell and neighbors)
    const validPositions = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const isExcluded = Math.abs(r - excludeRow) <= 1 && Math.abs(c - excludeCol) <= 1;
            if (!isExcluded) {
                validPositions.push([r, c]);
            }
        }
    }
    // Shuffle and pick mine positions
    for (let i = validPositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [validPositions[i], validPositions[j]] = [validPositions[j], validPositions[i]];
    }
    const minePositions = validPositions.slice(0, Math.min(mineCount, validPositions.length));
    // Place mines
    for (const [r, c] of minePositions) {
        board[r][c] = -1;
        placed++;
    }
    // Calculate adjacent mine counts
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c] === -1)
                continue;
            let count = 0;
            for (const [dr, dc] of NEIGHBORS) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc] === -1) {
                    count++;
                }
            }
            board[r][c] = count;
        }
    }
    return board;
}
function floodReveal(board, revealed, row, col, rows, cols) {
    if (row < 0 || row >= rows || col < 0 || col >= cols)
        return;
    if (revealed[row][col])
        return;
    revealed[row][col] = true;
    // If cell is 0, recursively reveal neighbors
    if (board[row][col] === 0) {
        for (const [dr, dc] of NEIGHBORS) {
            floodReveal(board, revealed, row + dr, col + dc, rows, cols);
        }
    }
}
function countRevealed(revealed) {
    return revealed.flat().filter(Boolean).length;
}
function countFlagged(flagged) {
    return flagged.flat().filter(Boolean).length;
}
function checkWin(state) {
    // Win if all non-mine cells are revealed
    const { revealed, rows, cols, mineCount } = state;
    const totalCells = rows * cols;
    const revealedCount = countRevealed(revealed);
    return revealedCount === totalCells - mineCount;
}
function formatBoard(state) {
    const { board, revealed, flagged, rows, cols } = state;
    const lines = [];
    // Column headers
    const colHeader = '   ' + Array.from({ length: cols }, (_, i) => (i % 10).toString()).join('');
    lines.push(colHeader);
    for (let r = 0; r < rows; r++) {
        let line = r.toString().padStart(2, ' ') + ' ';
        for (let c = 0; c < cols; c++) {
            if (flagged[r][c]) {
                line += '🚩';
            }
            else if (!revealed[r][c]) {
                line += '■';
            }
            else if (board[r][c] === -1) {
                line += '💥';
            }
            else if (board[r][c] === 0) {
                line += '·';
            }
            else {
                line += board[r][c].toString();
            }
        }
        lines.push(line);
    }
    return lines.join('\n');
}
function getVisibleBoard(state) {
    const { board, revealed, flagged, rows, cols, status } = state;
    const visible = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            if (status === 'lost' && board[r][c] === -1) {
                // Show all mines on loss
                row.push(revealed[r][c] ? 'exploded' : 'mine');
            }
            else if (flagged[r][c]) {
                row.push('flag');
            }
            else if (!revealed[r][c]) {
                row.push('hidden');
            }
            else if (board[r][c] === -1) {
                row.push('exploded');
            }
            else {
                row.push(board[r][c].toString());
            }
        }
        visible.push(row);
    }
    return visible;
}
// =============================================================================
// Minesweeper Engine Implementation
// =============================================================================
function createMinesweeperEngine() {
    return {
        // -------------------------------------------------------------------------
        // Metadata
        // -------------------------------------------------------------------------
        metadata: {
            id: 'minesweeper',
            name: 'Minesweeper',
            description: 'Classic mine-sweeping puzzle from Windows XP',
            difficulty: 'medium',
            points: 100,
            transport: 'sse',
            minPlayers: 1,
            maxPlayers: 1,
        },
        // -------------------------------------------------------------------------
        // Lifecycle
        // -------------------------------------------------------------------------
        newGame(options = {}) {
            const difficulty = options.difficulty ?? 'easy';
            const config = DIFFICULTY_CONFIG[difficulty];
            // Create empty board - mines will be placed on first click
            const board = createEmptyBoard(config.rows, config.cols, 0);
            const revealed = createEmptyBoard(config.rows, config.cols, false);
            const flagged = createEmptyBoard(config.rows, config.cols, false);
            return {
                gameId: generateGameId(),
                status: 'playing',
                turn: 'player',
                moveCount: 0,
                board,
                revealed,
                flagged,
                rows: config.rows,
                cols: config.cols,
                mineCount: config.mines,
                flagsRemaining: config.mines,
                startTime: null,
                elapsedSeconds: 0,
                firstMove: true,
            };
        },
        validateState(state) {
            if (!state || typeof state !== 'object')
                return false;
            const s = state;
            return (typeof s.gameId === 'string' &&
                Array.isArray(s.board) &&
                Array.isArray(s.revealed) &&
                Array.isArray(s.flagged) &&
                typeof s.rows === 'number' &&
                typeof s.cols === 'number' &&
                typeof s.mineCount === 'number');
        },
        // -------------------------------------------------------------------------
        // Game Logic
        // -------------------------------------------------------------------------
        getLegalMoves(state) {
            const moves = [];
            const { rows, cols, revealed, flagged } = state;
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    if (!revealed[row][col]) {
                        moves.push({ action: 'reveal', row, col });
                        if (!flagged[row][col]) {
                            moves.push({ action: 'flag', row, col });
                        }
                        else {
                            moves.push({ action: 'flag', row, col }); // unflag
                        }
                    }
                }
            }
            return moves;
        },
        isLegalMove(state, move) {
            const { row, col, action } = move;
            const { rows, cols, revealed, flagged } = state;
            if (row < 0 || row >= rows || col < 0 || col >= cols)
                return false;
            if (action === 'reveal') {
                return !revealed[row][col] && !flagged[row][col];
            }
            else if (action === 'flag') {
                return !revealed[row][col];
            }
            return false;
        },
        makeMove(state, move) {
            const { row, col, action } = move;
            const { rows, cols } = state;
            // Validate bounds
            if (row < 0 || row >= rows || col < 0 || col >= cols) {
                return {
                    state,
                    valid: false,
                    error: `Invalid position: (${row}, ${col})`,
                };
            }
            // Can't act on revealed cells
            if (state.revealed[row][col]) {
                return {
                    state,
                    valid: false,
                    error: 'Cell is already revealed',
                };
            }
            // Can't reveal flagged cells (must unflag first)
            if (action === 'reveal' && state.flagged[row][col]) {
                return {
                    state,
                    valid: false,
                    error: 'Cannot reveal a flagged cell. Remove the flag first.',
                };
            }
            // Clone state for immutability
            let newBoard = state.board.map(r => [...r]);
            const newRevealed = state.revealed.map(r => [...r]);
            const newFlagged = state.flagged.map(r => [...r]);
            let newStatus = state.status;
            let newStartTime = state.startTime;
            let isFirstMove = state.firstMove;
            if (action === 'flag') {
                // Toggle flag
                newFlagged[row][col] = !newFlagged[row][col];
                const newState = {
                    ...state,
                    flagged: newFlagged,
                    flagsRemaining: state.mineCount - countFlagged(newFlagged),
                    moveCount: state.moveCount + 1,
                    lastMoveAt: Date.now(),
                };
                return { state: newState, valid: true };
            }
            // action === 'reveal'
            // First move - place mines avoiding clicked area
            if (isFirstMove) {
                newBoard = placeMines(rows, cols, state.mineCount, row, col);
                newStartTime = Date.now();
                isFirstMove = false;
            }
            // Check if hit a mine
            if (newBoard[row][col] === -1) {
                newRevealed[row][col] = true;
                newStatus = 'lost';
                const newState = {
                    ...state,
                    board: newBoard,
                    revealed: newRevealed,
                    status: newStatus,
                    moveCount: state.moveCount + 1,
                    lastMoveAt: Date.now(),
                    startTime: newStartTime,
                    firstMove: isFirstMove,
                };
                return {
                    state: newState,
                    valid: true,
                    result: this.getResult(newState) ?? undefined,
                };
            }
            // Safe reveal - flood fill if 0
            floodReveal(newBoard, newRevealed, row, col, rows, cols);
            // Check for win before creating state
            const tempState = {
                ...state,
                board: newBoard,
                revealed: newRevealed,
                rows,
                cols,
                mineCount: state.mineCount,
            };
            const hasWon = checkWin(tempState);
            const newState = {
                ...state,
                board: newBoard,
                revealed: newRevealed,
                status: hasWon ? 'won' : 'playing',
                moveCount: state.moveCount + 1,
                lastMoveAt: Date.now(),
                startTime: newStartTime,
                firstMove: isFirstMove,
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
            // Minesweeper is single-player, no AI opponent
            return null;
        },
        isGameOver(state) {
            return state.status === 'won' || state.status === 'lost';
        },
        getResult(state) {
            if (state.status === 'playing')
                return null;
            const elapsed = state.startTime
                ? Math.floor((Date.now() - state.startTime) / 1000)
                : 0;
            return {
                status: state.status,
                totalMoves: state.moveCount,
                metadata: {
                    rows: state.rows,
                    cols: state.cols,
                    mineCount: state.mineCount,
                    elapsedSeconds: elapsed,
                    revealedCount: countRevealed(state.revealed),
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
                throw new Error('Invalid minesweeper state data');
            }
            return parsed;
        },
        // -------------------------------------------------------------------------
        // Rendering
        // -------------------------------------------------------------------------
        renderText(state) {
            let text = formatBoard(state);
            text += `\n\nMines: ${state.mineCount} | Flags: ${state.flagsRemaining}`;
            text += `\nRevealed: ${countRevealed(state.revealed)} / ${state.rows * state.cols - state.mineCount}`;
            if (state.status === 'won') {
                text += '\n\n🎉 You win! All mines cleared!';
            }
            else if (state.status === 'lost') {
                text += '\n\n💥 BOOM! You hit a mine!';
            }
            return text;
        },
        renderJSON(state) {
            return {
                gameType: 'minesweeper',
                gameId: state.gameId,
                status: state.status,
                turn: state.turn,
                moveCount: state.moveCount,
                legalMoves: [], // Too many to list
                board: {
                    cells: getVisibleBoard(state),
                    rows: state.rows,
                    cols: state.cols,
                },
                extra: {
                    mineCount: state.mineCount,
                    flagsRemaining: state.flagsRemaining,
                    revealedCount: countRevealed(state.revealed),
                    elapsedSeconds: state.startTime
                        ? Math.floor((Date.now() - state.startTime) / 1000)
                        : 0,
                },
            };
        },
        formatMove(move) {
            return `${move.action} ${move.row},${move.col}`;
        },
        parseMove(input) {
            // Format: "reveal 3,5" or "flag 3,5" or "r 3 5" or "f 3 5"
            const match = input.trim().match(/^(reveal|flag|r|f)\s+(\d+)[,\s]+(\d+)$/i);
            if (!match)
                return null;
            const action = match[1].toLowerCase().startsWith('r') ? 'reveal' : 'flag';
            const row = parseInt(match[2], 10);
            const col = parseInt(match[3], 10);
            if (isNaN(row) || isNaN(col))
                return null;
            return { action, row, col };
        },
    };
}
// =============================================================================
// Export
// =============================================================================
export const minesweeperEngine = createMinesweeperEngine();
//# sourceMappingURL=index.js.map