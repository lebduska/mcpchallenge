/**
 * Fractals Game Engine
 *
 * L-System based fractal generator with turtle graphics.
 * Agent defines grammar rules, system expands and renders via turtle graphics.
 */
import { type GameEngine, type GameState } from '../types';
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
export type FractalMoveAction = 'new_fractal' | 'set_axiom' | 'add_rule' | 'remove_rule' | 'set_parameters' | 'generate' | 'render' | 'get_state';
export interface FractalMove {
    action: FractalMoveAction;
    params: Record<string, string | number | boolean | undefined>;
}
export interface FractalOptions {
    width?: number;
    height?: number;
}
interface Preset {
    axiom: string;
    rules: FractalRule[];
    angle: number;
    iterations: number;
    length: number;
    decay: number;
}
declare const PRESETS: Record<string, Preset>;
export declare const fractalsEngine: GameEngine<FractalState, FractalMove, FractalOptions>;
export { PRESETS as FRACTAL_PRESETS };
//# sourceMappingURL=index.d.ts.map