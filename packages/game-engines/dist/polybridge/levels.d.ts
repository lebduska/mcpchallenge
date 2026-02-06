/**
 * Poly Bridge Level Definitions
 */
export interface Point {
    x: number;
    y: number;
}
export interface Level {
    id: string;
    name: string;
    description: string;
    /** Ground/terrain polygon points */
    terrain: Point[];
    /** Fixed anchor points where structures can connect */
    anchors: Point[];
    /** Vehicle start position */
    vehicleStart: Point;
    /** Target position vehicle must reach */
    vehicleEnd: Point;
    /** Maximum budget for structures */
    budget: number;
    /** Vehicle weight multiplier */
    vehicleWeight: number;
    /** Canvas dimensions */
    width: number;
    height: number;
}
export declare const MATERIAL_COSTS: {
    readonly wood: 10;
    readonly steel: 25;
    readonly cable: 15;
    readonly road: 20;
};
export type MaterialType = keyof typeof MATERIAL_COSTS;
export declare const LEVELS: Level[];
export declare function getLevel(id: string): Level | undefined;
export declare function getLevelByIndex(index: number): Level | undefined;
//# sourceMappingURL=levels.d.ts.map