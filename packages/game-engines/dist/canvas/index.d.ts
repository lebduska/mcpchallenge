/**
 * Canvas Game Engine
 *
 * A drawing canvas controlled via MCP tools.
 * Unlike other games, this has no win/lose state - it's a creative sandbox.
 */
import { type GameEngine, type GameState } from '../types';
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
export type CanvasMoveAction = 'set_color' | 'set_pixel' | 'draw_line' | 'draw_rect' | 'draw_circle' | 'fill' | 'clear';
export interface CanvasMove {
    action: CanvasMoveAction;
    params: Record<string, number | boolean>;
}
export interface CanvasOptions {
    width?: number;
    height?: number;
}
export declare const canvasEngine: GameEngine<CanvasState, CanvasMove, CanvasOptions>;
//# sourceMappingURL=index.d.ts.map