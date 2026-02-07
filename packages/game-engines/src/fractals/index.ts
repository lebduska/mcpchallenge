/**
 * Fractals Game Engine
 *
 * L-System based fractal generator with turtle graphics.
 * Agent defines grammar rules, system expands and renders via turtle graphics.
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

export interface FractalRule {
  symbol: string;
  replacement: string;
  probability: number;
}

export interface FractalState extends GameState {
  /** L-System axiom (starting string) */
  axiom: string;
  /** Production rules */
  rules: FractalRule[];
  /** Number of expansion iterations */
  iterations: number;
  /** Turn angle in degrees */
  angle: number;
  /** Initial line length */
  length: number;
  /** Length decay per iteration (0-1) */
  decay: number;
  /** Expanded L-System string (after generate) */
  expandedString: string | null;
  /** Canvas data */
  canvas: {
    width: number;
    height: number;
    pixels: number[];
  };
  /** Active preset name */
  preset: string | null;
  /** Rendering statistics */
  stats: {
    segmentsDrawn: number;
    maxDepth: number;
  };
  /** Current color scheme */
  colorScheme: ColorScheme;
}

export type ColorScheme = 'monochrome' | 'depth' | 'rainbow' | 'forest' | 'fire' | 'ocean';

export type FractalMoveAction =
  | 'new_fractal'
  | 'set_axiom'
  | 'add_rule'
  | 'remove_rule'
  | 'set_parameters'
  | 'generate'
  | 'render'
  | 'get_state';

export interface FractalMove {
  action: FractalMoveAction;
  params: Record<string, string | number | boolean | undefined>;
}

export interface FractalOptions {
  width?: number;
  height?: number;
}

// =============================================================================
// Constants
// =============================================================================

const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 512;
const MAX_ITERATIONS = 12;
const MAX_EXPANDED_LENGTH = 1_000_000;
const MAX_RULES_PER_SYMBOL = 5;

// =============================================================================
// Presets
// =============================================================================

interface Preset {
  axiom: string;
  rules: FractalRule[];
  angle: number;
  iterations: number;
  length: number;
  decay: number;
}

const PRESETS: Record<string, Preset> = {
  tree: {
    axiom: 'F',
    rules: [
      { symbol: 'F', replacement: 'FF+[+F-F-F]-[-F+F+F]', probability: 1 },
    ],
    angle: 22.5,
    iterations: 4,
    length: 8,
    decay: 0.7,
  },
  plant: {
    axiom: 'X',
    rules: [
      { symbol: 'X', replacement: 'F+[[X]-X]-F[-FX]+X', probability: 1 },
      { symbol: 'F', replacement: 'FF', probability: 1 },
    ],
    angle: 25,
    iterations: 5,
    length: 5,
    decay: 0.75,
  },
  dragon: {
    axiom: 'FX',
    rules: [
      { symbol: 'X', replacement: 'X+YF+', probability: 1 },
      { symbol: 'Y', replacement: '-FX-Y', probability: 1 },
    ],
    angle: 90,
    iterations: 12,
    length: 4,
    decay: 1,
  },
  koch: {
    axiom: 'F',
    rules: [
      { symbol: 'F', replacement: 'F+F-F-F+F', probability: 1 },
    ],
    angle: 90,
    iterations: 4,
    length: 3,
    decay: 1,
  },
  sierpinski: {
    axiom: 'F-G-G',
    rules: [
      { symbol: 'F', replacement: 'F-G+F+G-F', probability: 1 },
      { symbol: 'G', replacement: 'GG', probability: 1 },
    ],
    angle: 120,
    iterations: 6,
    length: 4,
    decay: 1,
  },
  snowflake: {
    axiom: 'F++F++F',
    rules: [
      { symbol: 'F', replacement: 'F-F++F-F', probability: 1 },
    ],
    angle: 60,
    iterations: 4,
    length: 3,
    decay: 1,
  },
  hilbert: {
    axiom: 'A',
    rules: [
      { symbol: 'A', replacement: '-BF+AFA+FB-', probability: 1 },
      { symbol: 'B', replacement: '+AF-BFB-FA+', probability: 1 },
    ],
    angle: 90,
    iterations: 5,
    length: 6,
    decay: 1,
  },
  custom: {
    axiom: 'F',
    rules: [],
    angle: 45,
    iterations: 3,
    length: 10,
    decay: 0.8,
  },
};

// =============================================================================
// Color Schemes
// =============================================================================

function getColor(scheme: ColorScheme, depth: number, maxDepth: number, segment: number, totalSegments: number): [number, number, number] {
  const t = maxDepth > 0 ? depth / maxDepth : 0;
  const s = totalSegments > 0 ? segment / totalSegments : 0;

  switch (scheme) {
    case 'monochrome':
      return [30, 30, 30];

    case 'depth': {
      // Dark brown to green (tree-like)
      const r = Math.floor(60 + (1 - t) * 80);
      const g = Math.floor(40 + t * 150);
      const b = Math.floor(20 + (1 - t) * 30);
      return [r, g, b];
    }

    case 'rainbow': {
      // HSL to RGB with hue based on segment position
      const hue = s * 360;
      const [r, g, b] = hslToRgb(hue, 0.8, 0.5);
      return [r, g, b];
    }

    case 'forest': {
      // Greens and browns
      const r = Math.floor(30 + t * 60);
      const g = Math.floor(80 + t * 100);
      const b = Math.floor(20 + t * 40);
      return [r, g, b];
    }

    case 'fire': {
      // Red to yellow
      const r = Math.floor(200 + t * 55);
      const g = Math.floor(50 + t * 150);
      const b = Math.floor(10);
      return [r, g, b];
    }

    case 'ocean': {
      // Deep blue to cyan
      const r = Math.floor(20 + t * 50);
      const g = Math.floor(80 + t * 120);
      const b = Math.floor(150 + t * 105);
      return [r, g, b];
    }

    default:
      return [0, 0, 0];
  }
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return [
    Math.floor((r + m) * 255),
    Math.floor((g + m) * 255),
    Math.floor((b + m) * 255),
  ];
}

// =============================================================================
// Helper Functions
// =============================================================================

function createPixelArray(width: number, height: number): number[] {
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
  height: number,
  x: number,
  y: number,
  r: number,
  g: number,
  b: number
): void {
  const px = Math.floor(x);
  const py = Math.floor(y);
  if (px < 0 || px >= width || py < 0 || py >= height) return;
  const i = (py * width + px) * 4;
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

  let x = Math.floor(x1);
  let y = Math.floor(y1);
  const endX = Math.floor(x2);
  const endY = Math.floor(y2);

  const maxSteps = Math.max(dx, dy) * 2 + 10;
  let steps = 0;

  while (steps < maxSteps) {
    setPixel(pixels, width, height, x, y, r, g, b);

    if (x === endX && y === endY) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
    steps++;
  }
}

// =============================================================================
// L-System Functions
// =============================================================================

/**
 * Expand the L-System string by applying production rules
 */
function expandLSystem(
  axiom: string,
  rules: FractalRule[],
  iterations: number
): string {
  let current = axiom;

  for (let i = 0; i < iterations; i++) {
    let next = '';

    for (const char of current) {
      // Find matching rules for this symbol
      const matchingRules = rules.filter(r => r.symbol === char);

      if (matchingRules.length === 0) {
        // No rule - keep symbol as is
        next += char;
      } else if (matchingRules.length === 1) {
        // Single rule - apply it
        next += matchingRules[0].replacement;
      } else {
        // Stochastic rules - pick based on probability
        const totalProb = matchingRules.reduce((sum, r) => sum + r.probability, 0);
        let rand = Math.random() * totalProb;

        for (const rule of matchingRules) {
          rand -= rule.probability;
          if (rand <= 0) {
            next += rule.replacement;
            break;
          }
        }

        // Fallback to first rule
        if (rand > 0) {
          next += matchingRules[0].replacement;
        }
      }

      // Safety: prevent explosion
      if (next.length > MAX_EXPANDED_LENGTH) {
        return next.substring(0, MAX_EXPANDED_LENGTH);
      }
    }

    current = next;
  }

  return current;
}

/**
 * Render L-System string using turtle graphics
 */
function renderTurtleGraphics(
  lsystem: string,
  state: FractalState
): { pixels: number[]; stats: { segmentsDrawn: number; maxDepth: number } } {
  const { angle, length, decay, canvas, colorScheme } = state;
  const pixels = createPixelArray(canvas.width, canvas.height);

  // Calculate bounding box first to center the fractal
  const bounds = calculateBounds(lsystem, angle, length, decay);

  // Calculate scale and offset to fit and center
  const padding = 20;
  const availWidth = canvas.width - 2 * padding;
  const availHeight = canvas.height - 2 * padding;

  const fractalWidth = bounds.maxX - bounds.minX;
  const fractalHeight = bounds.maxY - bounds.minY;

  const scale = Math.min(
    availWidth / (fractalWidth || 1),
    availHeight / (fractalHeight || 1),
    1
  );

  const offsetX = padding + (availWidth - fractalWidth * scale) / 2 - bounds.minX * scale;
  const offsetY = padding + (availHeight - fractalHeight * scale) / 2 - bounds.minY * scale;

  // Turtle state
  let x = 0;
  let y = 0;
  let dir = -90; // Start pointing up
  const stack: Array<{ x: number; y: number; dir: number; depth: number }> = [];
  let depth = 0;
  let maxDepth = 0;
  let segmentsDrawn = 0;
  let currentLength = length;

  // Count total F segments for rainbow coloring
  const totalSegments = (lsystem.match(/F/g) || []).length;
  let segmentIndex = 0;

  for (const char of lsystem) {
    switch (char) {
      case 'F':
      case 'G': {
        // Move forward and draw
        const rad = (dir * Math.PI) / 180;
        const newX = x + Math.cos(rad) * currentLength;
        const newY = y + Math.sin(rad) * currentLength;

        const [r, g, b] = getColor(colorScheme, depth, maxDepth || 10, segmentIndex, totalSegments);

        drawLine(
          pixels,
          canvas.width,
          canvas.height,
          x * scale + offsetX,
          y * scale + offsetY,
          newX * scale + offsetX,
          newY * scale + offsetY,
          r, g, b
        );

        x = newX;
        y = newY;
        segmentsDrawn++;
        segmentIndex++;
        break;
      }

      case 'f': {
        // Move forward without drawing
        const rad = (dir * Math.PI) / 180;
        x += Math.cos(rad) * currentLength;
        y += Math.sin(rad) * currentLength;
        break;
      }

      case '+':
        // Turn left
        dir -= angle;
        break;

      case '-':
        // Turn right
        dir += angle;
        break;

      case '[':
        // Push state
        stack.push({ x, y, dir, depth });
        depth++;
        maxDepth = Math.max(maxDepth, depth);
        currentLength *= decay;
        break;

      case ']':
        // Pop state
        if (stack.length > 0) {
          const popped = stack.pop()!;
          x = popped.x;
          y = popped.y;
          dir = popped.dir;
          depth = popped.depth;
          currentLength = length * Math.pow(decay, depth);
        }
        break;

      // Ignore other symbols (X, Y, A, B, etc.)
    }
  }

  return {
    pixels,
    stats: { segmentsDrawn, maxDepth },
  };
}

/**
 * Calculate bounding box of the fractal without rendering
 */
function calculateBounds(
  lsystem: string,
  angle: number,
  length: number,
  decay: number
): { minX: number; maxX: number; minY: number; maxY: number } {
  let x = 0;
  let y = 0;
  let dir = -90;
  let minX = 0, maxX = 0, minY = 0, maxY = 0;
  const stack: Array<{ x: number; y: number; dir: number; depth: number }> = [];
  let depth = 0;
  let currentLength = length;

  for (const char of lsystem) {
    switch (char) {
      case 'F':
      case 'G': {
        const rad = (dir * Math.PI) / 180;
        x += Math.cos(rad) * currentLength;
        y += Math.sin(rad) * currentLength;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        break;
      }
      case 'f': {
        const rad = (dir * Math.PI) / 180;
        x += Math.cos(rad) * currentLength;
        y += Math.sin(rad) * currentLength;
        break;
      }
      case '+':
        dir -= angle;
        break;
      case '-':
        dir += angle;
        break;
      case '[':
        stack.push({ x, y, dir, depth });
        depth++;
        currentLength *= decay;
        break;
      case ']':
        if (stack.length > 0) {
          const popped = stack.pop()!;
          x = popped.x;
          y = popped.y;
          dir = popped.dir;
          depth = popped.depth;
          currentLength = length * Math.pow(decay, depth);
        }
        break;
    }
  }

  return { minX, maxX, minY, maxY };
}

// =============================================================================
// Fractals Engine Implementation
// =============================================================================

function createFractalsEngine(): GameEngine<FractalState, FractalMove, FractalOptions> {
  return {
    // -------------------------------------------------------------------------
    // Metadata
    // -------------------------------------------------------------------------
    metadata: {
      id: 'fractals',
      name: 'L-System Fractals',
      description: 'Create beautiful fractals by defining L-System grammar rules',
      difficulty: 'medium',
      points: 200,
      transport: 'sse',
      minPlayers: 1,
      maxPlayers: 1,
    },

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------
    newGame(options = {}): FractalState {
      const width = options.width ?? CANVAS_WIDTH;
      const height = options.height ?? CANVAS_HEIGHT;
      const preset = PRESETS.tree;

      return {
        gameId: generateGameId(),
        status: 'playing',
        turn: 'player',
        moveCount: 0,
        axiom: preset.axiom,
        rules: [...preset.rules],
        iterations: preset.iterations,
        angle: preset.angle,
        length: preset.length,
        decay: preset.decay,
        expandedString: null,
        canvas: {
          width,
          height,
          pixels: createPixelArray(width, height),
        },
        preset: 'tree',
        stats: {
          segmentsDrawn: 0,
          maxDepth: 0,
        },
        colorScheme: 'depth',
      };
    },

    validateState(state: unknown): state is FractalState {
      if (!state || typeof state !== 'object') return false;
      const s = state as FractalState;
      return (
        typeof s.gameId === 'string' &&
        typeof s.axiom === 'string' &&
        Array.isArray(s.rules) &&
        typeof s.iterations === 'number' &&
        typeof s.angle === 'number'
      );
    },

    // -------------------------------------------------------------------------
    // Game Logic
    // -------------------------------------------------------------------------
    getLegalMoves(_state: FractalState): FractalMove[] {
      return [
        { action: 'new_fractal', params: { preset: 'tree' } },
        { action: 'generate', params: {} },
        { action: 'render', params: {} },
      ];
    },

    isLegalMove(_state: FractalState, move: FractalMove): boolean {
      return move.action !== undefined;
    },

    makeMove(state: FractalState, move: FractalMove): MoveResult<FractalState> {
      const { action, params } = move;

      switch (action) {
        case 'new_fractal': {
          const presetName = (params.preset as string) ?? 'tree';
          const preset = PRESETS[presetName] ?? PRESETS.custom;

          return {
            valid: true,
            state: {
              ...state,
              axiom: preset.axiom,
              rules: [...preset.rules],
              iterations: preset.iterations,
              angle: preset.angle,
              length: preset.length,
              decay: preset.decay,
              expandedString: null,
              preset: presetName,
              canvas: {
                ...state.canvas,
                pixels: createPixelArray(state.canvas.width, state.canvas.height),
              },
              stats: { segmentsDrawn: 0, maxDepth: 0 },
              moveCount: state.moveCount + 1,
              lastMoveAt: Date.now(),
            },
          };
        }

        case 'set_axiom': {
          const axiom = (params.axiom as string) ?? 'F';
          return {
            valid: true,
            state: {
              ...state,
              axiom,
              expandedString: null,
              preset: 'custom',
              moveCount: state.moveCount + 1,
              lastMoveAt: Date.now(),
            },
          };
        }

        case 'add_rule': {
          const symbol = (params.symbol as string) ?? 'F';
          const replacement = (params.replacement as string) ?? '';
          const probability = (params.probability as number) ?? 1;

          if (symbol.length !== 1) {
            return { valid: false, state, error: 'Symbol must be a single character' };
          }

          // Check max rules per symbol
          const existingRulesCount = state.rules.filter(r => r.symbol === symbol).length;
          if (existingRulesCount >= MAX_RULES_PER_SYMBOL) {
            return { valid: false, state, error: `Maximum ${MAX_RULES_PER_SYMBOL} rules per symbol` };
          }

          return {
            valid: true,
            state: {
              ...state,
              rules: [...state.rules, { symbol, replacement, probability }],
              expandedString: null,
              preset: 'custom',
              moveCount: state.moveCount + 1,
              lastMoveAt: Date.now(),
            },
          };
        }

        case 'remove_rule': {
          const symbol = (params.symbol as string) ?? '';
          return {
            valid: true,
            state: {
              ...state,
              rules: state.rules.filter(r => r.symbol !== symbol),
              expandedString: null,
              preset: 'custom',
              moveCount: state.moveCount + 1,
              lastMoveAt: Date.now(),
            },
          };
        }

        case 'set_parameters': {
          const angle = params.angle as number | undefined;
          const length = params.length as number | undefined;
          const iterations = params.iterations as number | undefined;
          const decay = params.decay as number | undefined;

          return {
            valid: true,
            state: {
              ...state,
              angle: angle !== undefined ? Math.max(0, Math.min(180, angle)) : state.angle,
              length: length !== undefined ? Math.max(1, Math.min(100, length)) : state.length,
              iterations: iterations !== undefined ? Math.max(1, Math.min(MAX_ITERATIONS, iterations)) : state.iterations,
              decay: decay !== undefined ? Math.max(0.1, Math.min(1, decay)) : state.decay,
              expandedString: null,
              moveCount: state.moveCount + 1,
              lastMoveAt: Date.now(),
            },
          };
        }

        case 'generate': {
          const expanded = expandLSystem(state.axiom, state.rules, state.iterations);
          return {
            valid: true,
            state: {
              ...state,
              expandedString: expanded,
              moveCount: state.moveCount + 1,
              lastMoveAt: Date.now(),
            },
          };
        }

        case 'render': {
          const colorScheme = (params.colorScheme as ColorScheme) ?? state.colorScheme;

          // Generate if not already done
          const expanded = state.expandedString ?? expandLSystem(state.axiom, state.rules, state.iterations);

          const stateWithScheme = { ...state, colorScheme, expandedString: expanded };
          const { pixels, stats } = renderTurtleGraphics(expanded, stateWithScheme);

          return {
            valid: true,
            state: {
              ...stateWithScheme,
              canvas: {
                ...state.canvas,
                pixels,
              },
              stats,
              moveCount: state.moveCount + 1,
              lastMoveAt: Date.now(),
            },
          };
        }

        case 'get_state': {
          // Just returns current state (no changes)
          return { valid: true, state };
        }

        default:
          return {
            state,
            valid: false,
            error: `Unknown action: ${action}`,
          };
      }
    },

    getAIMove(): FractalMove | null {
      return null;
    },

    isGameOver(_state: FractalState): boolean {
      return false;
    },

    getResult(_state: FractalState): GameResult | null {
      return null;
    },

    // -------------------------------------------------------------------------
    // Serialization
    // -------------------------------------------------------------------------
    serialize(state: FractalState): string {
      // Don't serialize pixels - too large
      const { canvas, ...rest } = state;
      return JSON.stringify({
        ...rest,
        canvas: {
          width: canvas.width,
          height: canvas.height,
          // pixels omitted
        },
      });
    },

    deserialize(data: string): FractalState {
      const parsed = JSON.parse(data);
      return {
        ...parsed,
        canvas: {
          ...parsed.canvas,
          pixels: createPixelArray(parsed.canvas.width, parsed.canvas.height),
        },
      };
    },

    // -------------------------------------------------------------------------
    // Rendering
    // -------------------------------------------------------------------------
    renderText(state: FractalState): string {
      const rulesStr = state.rules.map(r => `${r.symbol} → ${r.replacement}`).join('\n');
      return [
        `Preset: ${state.preset ?? 'custom'}`,
        `Axiom: ${state.axiom}`,
        `Rules:\n${rulesStr || '(none)'}`,
        `Iterations: ${state.iterations}`,
        `Angle: ${state.angle}°`,
        `Length: ${state.length}`,
        `Decay: ${state.decay}`,
        ``,
        `Expanded length: ${state.expandedString?.length ?? 'not generated'}`,
        `Segments drawn: ${state.stats.segmentsDrawn}`,
        `Max depth: ${state.stats.maxDepth}`,
      ].join('\n');
    },

    renderJSON(state: FractalState): GameStateJSON {
      return {
        gameType: 'fractals',
        gameId: state.gameId,
        status: state.status,
        turn: state.turn,
        moveCount: state.moveCount,
        legalMoves: [],
        board: {
          width: state.canvas.width,
          height: state.canvas.height,
        },
        extra: {
          preset: state.preset,
          axiom: state.axiom,
          rules: state.rules,
          iterations: state.iterations,
          angle: state.angle,
          length: state.length,
          decay: state.decay,
          colorScheme: state.colorScheme,
          expandedLength: state.expandedString?.length ?? 0,
          stats: state.stats,
        },
      };
    },

    formatMove(move: FractalMove): string {
      return `${move.action}(${JSON.stringify(move.params)})`;
    },

    parseMove(input: string): FractalMove | null {
      try {
        const match = input.match(/^(\w+)\((.*)\)$/);
        if (!match) return null;
        const action = match[1] as FractalMoveAction;
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

export const fractalsEngine = createFractalsEngine();
export { PRESETS as FRACTAL_PRESETS };
