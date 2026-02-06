/**
 * Canvas Game Engine
 *
 * A drawing canvas controlled via MCP tools.
 * Unlike other games, this has no win/lose state - it's a creative sandbox.
 */

import {
  generateGameId,
  type GameEngine,
  type GameState,
  type GameResult,
  type MoveResult,
  type GameStateJSON,
} from '../types';

// =============================================================================
// Types
// =============================================================================

export interface CanvasState extends GameState {
  /** Canvas width in pixels */
  width: number;
  /** Canvas height in pixels */
  height: number;
  /** Current drawing color [r, g, b] */
  currentColor: [number, number, number];
  /** Pixel data (flattened RGBA array) */
  pixels: number[];
  /** List of drawing commands executed */
  commands: Array<{
    type: string;
    params: Record<string, unknown>;
  }>;
}

export type CanvasMoveAction =
  | 'set_color'
  | 'set_pixel'
  | 'draw_line'
  | 'draw_rect'
  | 'draw_circle'
  | 'fill'
  | 'clear';

export interface CanvasMove {
  action: CanvasMoveAction;
  params: Record<string, number | boolean>;
}

export interface CanvasOptions {
  width?: number;
  height?: number;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_WIDTH = 64;
const DEFAULT_HEIGHT = 64;

// =============================================================================
// Helper Functions
// =============================================================================

function createPixelArray(width: number, height: number): number[] {
  // Initialize with white (255, 255, 255, 255)
  const size = width * height * 4;
  const pixels = new Array(size);
  for (let i = 0; i < size; i += 4) {
    pixels[i] = 255;     // R
    pixels[i + 1] = 255; // G
    pixels[i + 2] = 255; // B
    pixels[i + 3] = 255; // A
  }
  return pixels;
}

function setPixel(
  pixels: number[],
  width: number,
  x: number,
  y: number,
  r: number,
  g: number,
  b: number
): void {
  if (x < 0 || x >= width || y < 0 || y >= width) return;
  const i = (y * width + x) * 4;
  pixels[i] = r;
  pixels[i + 1] = g;
  pixels[i + 2] = b;
  pixels[i + 3] = 255;
}

function drawLine(
  pixels: number[],
  width: number,
  height: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r: number,
  g: number,
  b: number
): void {
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

    if (x === x2 && y === y2) break;

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

function drawRect(
  pixels: number[],
  width: number,
  height: number,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  g: number,
  b: number,
  filled: boolean
): void {
  if (filled) {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        if (px >= 0 && px < width && py >= 0 && py < height) {
          setPixel(pixels, width, px, py, r, g, b);
        }
      }
    }
  } else {
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

function drawCircle(
  pixels: number[],
  width: number,
  height: number,
  cx: number,
  cy: number,
  radius: number,
  r: number,
  g: number,
  b: number,
  filled: boolean
): void {
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
  } else {
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

function floodFill(
  pixels: number[],
  width: number,
  height: number,
  startX: number,
  startY: number,
  r: number,
  g: number,
  b: number
): void {
  if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;

  const startIdx = (startY * width + startX) * 4;
  const targetR = pixels[startIdx];
  const targetG = pixels[startIdx + 1];
  const targetB = pixels[startIdx + 2];

  // Don't fill if already the same color
  if (targetR === r && targetG === g && targetB === b) return;

  const stack: [number, number][] = [[startX, startY]];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const key = `${x},${y}`;

    if (visited.has(key)) continue;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;

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

function createCanvasEngine(): GameEngine<CanvasState, CanvasMove, CanvasOptions> {
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
    newGame(options = {}): CanvasState {
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

    validateState(state: unknown): state is CanvasState {
      if (!state || typeof state !== 'object') return false;
      const s = state as CanvasState;
      return (
        typeof s.gameId === 'string' &&
        typeof s.width === 'number' &&
        typeof s.height === 'number' &&
        Array.isArray(s.pixels) &&
        Array.isArray(s.commands)
      );
    },

    // -------------------------------------------------------------------------
    // Game Logic
    // -------------------------------------------------------------------------
    getLegalMoves(_state: CanvasState): CanvasMove[] {
      // Canvas allows any drawing command at any time
      return [
        { action: 'set_color', params: { r: 0, g: 0, b: 0 } },
        { action: 'set_pixel', params: { x: 0, y: 0 } },
        { action: 'clear', params: {} },
      ];
    },

    isLegalMove(_state: CanvasState, move: CanvasMove): boolean {
      // All moves are legal in canvas mode
      return move.action !== undefined;
    },

    makeMove(state: CanvasState, move: CanvasMove): MoveResult<CanvasState> {
      const { action, params } = move;
      const newPixels = [...state.pixels];
      let newColor = state.currentColor;

      const [r, g, b] = state.currentColor;

      switch (action) {
        case 'set_color':
          newColor = [
            params.r as number ?? 0,
            params.g as number ?? 0,
            params.b as number ?? 0,
          ];
          break;

        case 'set_pixel':
          setPixel(
            newPixels,
            state.width,
            params.x as number,
            params.y as number,
            r, g, b
          );
          break;

        case 'draw_line':
          drawLine(
            newPixels,
            state.width,
            state.height,
            params.x1 as number,
            params.y1 as number,
            params.x2 as number,
            params.y2 as number,
            r, g, b
          );
          break;

        case 'draw_rect':
          drawRect(
            newPixels,
            state.width,
            state.height,
            params.x as number,
            params.y as number,
            params.w as number,
            params.h as number,
            r, g, b,
            params.filled as boolean ?? false
          );
          break;

        case 'draw_circle':
          drawCircle(
            newPixels,
            state.width,
            state.height,
            params.cx as number,
            params.cy as number,
            params.r as number,
            r, g, b,
            params.filled as boolean ?? false
          );
          break;

        case 'fill':
          floodFill(
            newPixels,
            state.width,
            state.height,
            params.x as number,
            params.y as number,
            r, g, b
          );
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

      const newState: CanvasState = {
        ...state,
        currentColor: newColor,
        pixels: newPixels,
        commands: [...state.commands, { type: action, params }],
        moveCount: state.moveCount + 1,
        lastMoveAt: Date.now(),
      };

      return { state: newState, valid: true };
    },

    getAIMove(): CanvasMove | null {
      // Canvas is player-controlled only
      return null;
    },

    isGameOver(_state: CanvasState): boolean {
      // Canvas never ends
      return false;
    },

    getResult(_state: CanvasState): GameResult | null {
      // No win/lose in canvas
      return null;
    },

    // -------------------------------------------------------------------------
    // Serialization
    // -------------------------------------------------------------------------
    serialize(state: CanvasState): string {
      return JSON.stringify(state);
    },

    deserialize(data: string): CanvasState {
      const parsed = JSON.parse(data);
      if (!this.validateState(parsed)) {
        throw new Error('Invalid canvas state data');
      }
      return parsed;
    },

    // -------------------------------------------------------------------------
    // Rendering
    // -------------------------------------------------------------------------
    renderText(state: CanvasState): string {
      return `Canvas ${state.width}x${state.height}\nCommands: ${state.commands.length}\nCurrent color: rgb(${state.currentColor.join(', ')})`;
    },

    renderJSON(state: CanvasState): GameStateJSON {
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

    formatMove(move: CanvasMove): string {
      return `${move.action}(${JSON.stringify(move.params)})`;
    },

    parseMove(input: string): CanvasMove | null {
      try {
        const match = input.match(/^(\w+)\((.*)\)$/);
        if (!match) return null;
        const action = match[1] as CanvasMoveAction;
        const params = JSON.parse(match[2] || '{}');
        return { action, params };
      } catch {
        return null;
      }
    },
  };
}

// =============================================================================
// Export
// =============================================================================

export const canvasEngine = createCanvasEngine();
