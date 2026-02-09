/**
 * Game Engines Package
 *
 * Pure game logic implementations for MCP Challenge
 * All engines implement the GameEngine interface
 */
// Core types
export * from './types';
// Chess engine
export { chessEngine } from './chess';
// Tic-Tac-Toe engine
export { tictactoeEngine } from './tictactoe';
// Snake engine
export { snakeEngine, getVision } from './snake';
// Minesweeper engine
export { minesweeperEngine } from './minesweeper';
// Canvas engine
export { canvasEngine } from './canvas';
// Poly Bridge engine
export { polybridgeEngine } from './polybridge';
export { LEVELS as POLYBRIDGE_LEVELS, MATERIAL_COSTS } from './polybridge';
// Sokoban engine
export { sokobanEngine, SOKOBAN_LEVELS, TOTAL_LEVELS as SOKOBAN_TOTAL_LEVELS } from './sokoban';
// Gorillas engine
export { GorillasEngine, LEVELS as GORILLAS_LEVELS, simulateThrowPreview, getStrategicHints } from './gorillas';
// Fractals engine
export { fractalsEngine, FRACTAL_PRESETS } from './fractals';
// Lights Out engine
export { lightsOutEngine } from './lightsout';
// Pathfinding engine
export { pathfindingEngine } from './pathfinding';
// Engine registry for dynamic access
import { chessEngine } from './chess';
import { tictactoeEngine } from './tictactoe';
import { snakeEngine } from './snake';
import { minesweeperEngine } from './minesweeper';
import { canvasEngine } from './canvas';
import { polybridgeEngine } from './polybridge';
import { sokobanEngine } from './sokoban';
import { GorillasEngine } from './gorillas';
import { fractalsEngine } from './fractals';
import { lightsOutEngine } from './lightsout';
import { pathfindingEngine } from './pathfinding';
export const engines = {
    chess: chessEngine,
    tictactoe: tictactoeEngine,
    snake: snakeEngine,
    canvas: canvasEngine,
    minesweeper: minesweeperEngine,
    polybridge: polybridgeEngine,
    sokoban: sokobanEngine,
    gorillas: GorillasEngine,
    fractals: fractalsEngine,
    lightsout: lightsOutEngine,
    pathfinding: pathfindingEngine,
};
/**
 * Get an engine by ID
 */
export function getEngine(id) {
    return engines[id];
}
/**
 * List all available engine IDs
 */
export function listEngines() {
    return Object.keys(engines);
}
/**
 * Get metadata for all engines
 */
export function getAllMetadata() {
    return Object.values(engines).map(e => e.metadata);
}
//# sourceMappingURL=index.js.map