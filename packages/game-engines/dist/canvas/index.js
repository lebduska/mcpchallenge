/**
 * Canvas Game Engine
 *
 * A drawing canvas controlled via MCP tools.
 * Unlike other games, this has no win/lose state - it's a creative sandbox.
 */
import { generateGameId, } from '../types';
// =============================================================================
// Constants
// =============================================================================
const DEFAULT_WIDTH = 64;
const DEFAULT_HEIGHT = 64;
// =============================================================================
// Helper Functions
// =============================================================================
function createPixelArray(width, height) {
    // Initialize with white (255, 255, 255, 255)
    const size = width * height * 4;
    const pixels = new Array(size);
    for (let i = 0; i < size; i += 4) {
        pixels[i] = 255; // R
        pixels[i + 1] = 255; // G
        pixels[i + 2] = 255; // B
        pixels[i + 3] = 255; // A
    }
    return pixels;
}
function setPixel(pixels, width, x, y, r, g, b) {
    if (x < 0 || x >= width || y < 0 || y >= width)
        return;
    const i = (y * width + x) * 4;
    pixels[i] = r;
    pixels[i + 1] = g;
    pixels[i + 2] = b;
    pixels[i + 3] = 255;
}
function drawLine(pixels, width, height, x1, y1, x2, y2, r, g, b) {
    // Bresenham's line algorithm
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    let x = x1;
    let y = y1;
    while (true) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
            setPixel(pixels, width, x, y, r, g, b);
        }
        if (x === x2 && y === y2)
            break;
        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x += sx;
        }
        if (e2 < dx) {
            err += dx;
            y += sy;
        }
    }
}
function drawRect(pixels, width, height, x, y, w, h, r, g, b, filled) {
    if (filled) {
        for (let py = y; py < y + h; py++) {
            for (let px = x; px < x + w; px++) {
                if (px >= 0 && px < width && py >= 0 && py < height) {
                    setPixel(pixels, width, px, py, r, g, b);
                }
            }
        }
    }
    else {
        // Top and bottom
        for (let px = x; px < x + w; px++) {
            setPixel(pixels, width, px, y, r, g, b);
            setPixel(pixels, width, px, y + h - 1, r, g, b);
        }
        // Left and right
        for (let py = y; py < y + h; py++) {
            setPixel(pixels, width, x, py, r, g, b);
            setPixel(pixels, width, x + w - 1, py, r, g, b);
        }
    }
}
function drawCircle(pixels, width, height, cx, cy, radius, r, g, b, filled) {
    if (filled) {
        for (let py = cy - radius; py <= cy + radius; py++) {
            for (let px = cx - radius; px <= cx + radius; px++) {
                const dx = px - cx;
                const dy = py - cy;
                if (dx * dx + dy * dy <= radius * radius) {
                    if (px >= 0 && px < width && py >= 0 && py < height) {
                        setPixel(pixels, width, px, py, r, g, b);
                    }
                }
            }
        }
    }
    else {
        // Midpoint circle algorithm
        let x = radius;
        let y = 0;
        let err = 0;
        while (x >= y) {
            setPixel(pixels, width, cx + x, cy + y, r, g, b);
            setPixel(pixels, width, cx + y, cy + x, r, g, b);
            setPixel(pixels, width, cx - y, cy + x, r, g, b);
            setPixel(pixels, width, cx - x, cy + y, r, g, b);
            setPixel(pixels, width, cx - x, cy - y, r, g, b);
            setPixel(pixels, width, cx - y, cy - x, r, g, b);
            setPixel(pixels, width, cx + y, cy - x, r, g, b);
            setPixel(pixels, width, cx + x, cy - y, r, g, b);
            y++;
            if (err <= 0) {
                err += 2 * y + 1;
            }
            if (err > 0) {
                x--;
                err -= 2 * x + 1;
            }
        }
    }
}
function floodFill(pixels, width, height, startX, startY, r, g, b) {
    if (startX < 0 || startX >= width || startY < 0 || startY >= height)
        return;
    const startIdx = (startY * width + startX) * 4;
    const targetR = pixels[startIdx];
    const targetG = pixels[startIdx + 1];
    const targetB = pixels[startIdx + 2];
    // Don't fill if already the same color
    if (targetR === r && targetG === g && targetB === b)
        return;
    const stack = [[startX, startY]];
    const visited = new Set();
    while (stack.length > 0) {
        const [x, y] = stack.pop();
        const key = `${x},${y}`;
        if (visited.has(key))
            continue;
        if (x < 0 || x >= width || y < 0 || y >= height)
            continue;
        const idx = (y * width + x) * 4;
        if (pixels[idx] !== targetR || pixels[idx + 1] !== targetG || pixels[idx + 2] !== targetB) {
            continue;
        }
        visited.add(key);
        pixels[idx] = r;
        pixels[idx + 1] = g;
        pixels[idx + 2] = b;
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
}
// =============================================================================
// Canvas Engine Implementation
// =============================================================================
function createCanvasEngine() {
    return {
        // -------------------------------------------------------------------------
        // Metadata
        // -------------------------------------------------------------------------
        metadata: {
            id: 'canvas',
            name: 'Canvas Drawing',
            description: 'A 64x64 pixel canvas for creative drawing via MCP tools',
            difficulty: 'easy',
            points: 50,
            transport: 'sse',
            minPlayers: 1,
            maxPlayers: 1,
        },
        // -------------------------------------------------------------------------
        // Lifecycle
        // -------------------------------------------------------------------------
        newGame(options = {}) {
            const width = options.width ?? DEFAULT_WIDTH;
            const height = options.height ?? DEFAULT_HEIGHT;
            return {
                gameId: generateGameId(),
                status: 'playing',
                turn: 'player',
                moveCount: 0,
                width,
                height,
                currentColor: [0, 0, 0], // Black
                pixels: createPixelArray(width, height),
                commands: [],
            };
        },
        validateState(state) {
            if (!state || typeof state !== 'object')
                return false;
            const s = state;
            return (typeof s.gameId === 'string' &&
                typeof s.width === 'number' &&
                typeof s.height === 'number' &&
                Array.isArray(s.pixels) &&
                Array.isArray(s.commands));
        },
        // -------------------------------------------------------------------------
        // Game Logic
        // -------------------------------------------------------------------------
        getLegalMoves(_state) {
            // Canvas allows any drawing command at any time
            return [
                { action: 'set_color', params: { r: 0, g: 0, b: 0 } },
                { action: 'set_pixel', params: { x: 0, y: 0 } },
                { action: 'clear', params: {} },
            ];
        },
        isLegalMove(_state, move) {
            // All moves are legal in canvas mode
            return move.action !== undefined;
        },
        makeMove(state, move) {
            const { action, params } = move;
            const newPixels = [...state.pixels];
            let newColor = state.currentColor;
            const [r, g, b] = state.currentColor;
            switch (action) {
                case 'set_color':
                    newColor = [
                        params.r ?? 0,
                        params.g ?? 0,
                        params.b ?? 0,
                    ];
                    break;
                case 'set_pixel':
                    setPixel(newPixels, state.width, params.x, params.y, r, g, b);
                    break;
                case 'draw_line':
                    drawLine(newPixels, state.width, state.height, params.x1, params.y1, params.x2, params.y2, r, g, b);
                    break;
                case 'draw_rect':
                    drawRect(newPixels, state.width, state.height, params.x, params.y, params.w, params.h, r, g, b, params.filled ?? false);
                    break;
                case 'draw_circle':
                    drawCircle(newPixels, state.width, state.height, params.cx, params.cy, params.r, r, g, b, params.filled ?? false);
                    break;
                case 'fill':
                    floodFill(newPixels, state.width, state.height, params.x, params.y, r, g, b);
                    break;
                case 'clear':
                    for (let i = 0; i < newPixels.length; i += 4) {
                        newPixels[i] = 255;
                        newPixels[i + 1] = 255;
                        newPixels[i + 2] = 255;
                        newPixels[i + 3] = 255;
                    }
                    break;
                default:
                    return {
                        state,
                        valid: false,
                        error: `Unknown action: ${action}`,
                    };
            }
            const newState = {
                ...state,
                currentColor: newColor,
                pixels: newPixels,
                commands: [...state.commands, { type: action, params }],
                moveCount: state.moveCount + 1,
                lastMoveAt: Date.now(),
            };
            return { state: newState, valid: true };
        },
        getAIMove() {
            // Canvas is player-controlled only
            return null;
        },
        isGameOver(_state) {
            // Canvas never ends
            return false;
        },
        getResult(_state) {
            // No win/lose in canvas
            return null;
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
                throw new Error('Invalid canvas state data');
            }
            return parsed;
        },
        // -------------------------------------------------------------------------
        // Rendering
        // -------------------------------------------------------------------------
        renderText(state) {
            return `Canvas ${state.width}x${state.height}\nCommands: ${state.commands.length}\nCurrent color: rgb(${state.currentColor.join(', ')})`;
        },
        renderJSON(state) {
            return {
                gameType: 'canvas',
                gameId: state.gameId,
                status: state.status,
                turn: state.turn,
                moveCount: state.moveCount,
                legalMoves: [],
                board: {
                    width: state.width,
                    height: state.height,
                },
                extra: {
                    currentColor: state.currentColor,
                    commandCount: state.commands.length,
                },
            };
        },
        formatMove(move) {
            return `${move.action}(${JSON.stringify(move.params)})`;
        },
        parseMove(input) {
            try {
                const match = input.match(/^(\w+)\((.*)\)$/);
                if (!match)
                    return null;
                const action = match[1];
                const params = JSON.parse(match[2] || '{}');
                return { action, params };
            }
            catch {
                return null;
            }
        },
    };
}
// =============================================================================
// Export
// =============================================================================
export const canvasEngine = createCanvasEngine();
//# sourceMappingURL=index.js.map