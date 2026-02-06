"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import Matter from "matter-js";
import { cn } from "@/lib/utils";
import {
  Play,
  RotateCcw,
  Trash2,
  ChevronRight,
  Hammer,
  Link2,
  Route,
  Sparkles,
} from "lucide-react";
import {
  type Structure,
  POLYBRIDGE_LEVELS,
  MATERIAL_COSTS,
} from "@mcpchallenge/game-engines";

// =============================================================================
// Types
// =============================================================================

type ToolType = "beam" | "cable" | "road" | "delete";
type MaterialType = "wood" | "steel" | "cable" | "road";

interface Point {
  x: number;
  y: number;
}

interface PolyBridgeGameProps {
  onGameComplete?: (result: { won: boolean; level: number; budget: number }) => void;
}

interface BodyWithStructureId extends Matter.Body {
  structureId?: string;
}

interface SimulationState {
  vehicle: Matter.Body;
  wheels: Matter.Body[];
  structureBodies: Matter.Body[];
  constraints: Matter.Constraint[];
}

// =============================================================================
// Constants
// =============================================================================

const TOOL_CONFIG: Record<ToolType, { icon: typeof Hammer; label: string; color: string }> = {
  beam: { icon: Hammer, label: "Beam", color: "#8B4513" },
  cable: { icon: Link2, label: "Cable", color: "#333333" },
  road: { icon: Route, label: "Road", color: "#555555" },
  delete: { icon: Trash2, label: "Delete", color: "#ef4444" },
};

const MATERIAL_COLORS: Record<MaterialType, string> = {
  wood: "#8B4513",
  steel: "#4a5568",
  cable: "#1a1a1a",
  road: "#2d3748",
};

// =============================================================================
// Helper Functions
// =============================================================================

function splitTerrainIntoPolygons(terrain: Point[]): Point[][] {
  const chunks: Point[][] = [];
  for (let i = 0; i < terrain.length; i += 4) {
    const chunk = terrain.slice(i, i + 4);
    if (chunk.length === 4) {
      chunks.push(chunk);
    }
  }
  return chunks;
}

function pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;
  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

// =============================================================================
// Sub-components
// =============================================================================

function BudgetBar({ used, total }: { used: number; total: number }) {
  const percentage = Math.min((used / total) * 100, 100);
  const remaining = total - used;

  const getBarColor = () => {
    if (percentage < 60) return "from-emerald-400 to-emerald-500";
    if (percentage < 85) return "from-amber-400 to-amber-500";
    return "from-red-400 to-red-500";
  };

  const getTextColor = () => {
    if (percentage < 60) return "text-emerald-600 dark:text-emerald-400";
    if (percentage < 85) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="w-48">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Budget</span>
        <span className={cn("text-sm font-bold tabular-nums", getTextColor())}>
          ${used.toLocaleString()}
          <span className="text-zinc-400 font-normal"> / ${total.toLocaleString()}</span>
        </span>
      </div>
      <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
        <div
          className={cn(
            "h-full bg-gradient-to-r rounded-full transition-all duration-300 ease-out",
            getBarColor()
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-zinc-400">
          {remaining >= 0 ? `$${remaining} left` : "Over budget!"}
        </span>
        <span className="text-[10px] text-zinc-400">{percentage.toFixed(0)}%</span>
      </div>
    </div>
  );
}

function CountdownOverlay({ count, onComplete }: { count: number; onComplete: () => void }) {
  useEffect(() => {
    if (count <= 0) {
      onComplete();
    }
  }, [count, onComplete]);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl z-20">
      <div className="relative" key={count}>
        <div className="text-8xl font-black text-white animate-ping absolute inset-0 flex items-center justify-center opacity-50">
          {count}
        </div>
        <div className="text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
          {count}
        </div>
      </div>
    </div>
  );
}

function ToolButton({ tool, selected, onClick }: { tool: ToolType; selected: boolean; onClick: () => void }) {
  const config = TOOL_CONFIG[tool];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl transition-all duration-200",
        "border-2",
        selected
          ? tool === "delete"
            ? "bg-red-500 border-red-600 text-white shadow-lg shadow-red-500/30 scale-105"
            : "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-zinc-900 shadow-lg shadow-zinc-900/30 dark:shadow-white/30 scale-105"
          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:scale-102"
      )}
    >
      <Icon className={cn("h-5 w-5 transition-transform duration-200", selected ? "" : "group-hover:scale-110")} />
      <span className="text-[10px] font-semibold uppercase tracking-wide">{config.label}</span>
      {selected && (
        <div className={cn(
          "absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full",
          tool === "delete" ? "bg-red-300" : "bg-white dark:bg-zinc-900"
        )} />
      )}
    </button>
  );
}

function MaterialButton({ material, selected, onClick }: { material: "wood" | "steel"; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm",
        selected
          ? "bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md"
          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
      )}
    >
      <div className="w-3 h-3 rounded-sm shadow-inner" style={{ backgroundColor: MATERIAL_COLORS[material] }} />
      <span className="font-medium">{material === "wood" ? "Wood" : "Steel"}</span>
      <span className="text-xs opacity-60">${MATERIAL_COSTS[material]}/u</span>
    </button>
  );
}

function SuccessOverlay({ budgetUsed, budgetTotal, hasNextLevel, onNextLevel }: {
  budgetUsed: number;
  budgetTotal: number;
  hasNextLevel: boolean;
  onNextLevel: () => void;
}) {
  const savings = budgetTotal - budgetUsed;
  const efficiency = Math.round((savings / budgetTotal) * 100);

  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-xl z-20 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 via-green-500/20 to-teal-500/30 animate-pulse" />
      <div className="absolute inset-0 border-4 border-emerald-400/50 rounded-xl animate-pulse" />

      <div className="relative bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl text-center max-w-sm mx-4 border border-emerald-200 dark:border-emerald-800">
        <div className="relative mx-auto w-20 h-20 mb-4">
          <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
        </div>

        <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-1">Bridge Holds!</h3>
        <p className="text-emerald-600 dark:text-emerald-400 font-semibold mb-4">
          {savings > 0 ? `$${savings} under budget!` : "Within budget!"}
        </p>

        <div className="flex justify-center gap-6 mb-6 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          <div className="text-center">
            <div className="text-2xl font-bold text-zinc-900 dark:text-white">${budgetUsed}</div>
            <div className="text-xs text-zinc-500">Spent</div>
          </div>
          <div className="w-px bg-zinc-300 dark:bg-zinc-700" />
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{efficiency}%</div>
            <div className="text-xs text-zinc-500">Efficiency</div>
          </div>
        </div>

        {hasNextLevel ? (
          <button
            onClick={onNextLevel}
            className="group w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-2">
              Next Level
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        ) : (
          <div className="py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl">
            🏆 All Levels Complete!
          </div>
        )}
      </div>
    </div>
  );
}

function FailureOverlay({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-xl z-20 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 via-rose-500/20 to-orange-500/30" />
      <div className="absolute inset-0 border-4 border-red-400/50 rounded-xl" />

      <div className="relative bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl text-center max-w-sm mx-4 border border-red-200 dark:border-red-900 animate-in zoom-in-95 duration-200">
        <div className="relative mx-auto w-20 h-20 mb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/50">
            <span className="text-4xl">💥</span>
          </div>
        </div>

        <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-1">Bridge Collapsed!</h3>
        <p className="text-red-600 dark:text-red-400 font-medium mb-6">Try a different design approach</p>

        <button
          onClick={onRetry}
          className="group w-full py-3 px-6 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="flex items-center justify-center gap-2">
            <RotateCcw className="h-4 w-4 group-hover:-rotate-45 transition-transform" />
            Try Again
          </span>
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function PolyBridgeGame({ onGameComplete }: PolyBridgeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const simulationRef = useRef<SimulationState | null>(null);
  const renderLoopRef = useRef<number | null>(null);

  const [levelIndex, setLevelIndex] = useState(0);
  const [structures, setStructures] = useState<Structure[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolType>("beam");
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType>("wood");
  const [testResult, setTestResult] = useState<"untested" | "countdown" | "testing" | "passed" | "failed">("untested");
  const [countdown, setCountdown] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<Point | null>(null);
  const [drawEnd, setDrawEnd] = useState<Point | null>(null);
  const [canvasShake, setCanvasShake] = useState(false);

  const level = POLYBRIDGE_LEVELS[levelIndex];

  const budgetUsed = useMemo(() => {
    return structures.reduce((sum, s) => sum + s.cost, 0);
  }, [structures]);

  // Draw static scene (when not testing)
  const drawStaticScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, level.height);
    skyGradient.addColorStop(0, "#7dd3fc");
    skyGradient.addColorStop(1, "#bae6fd");
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, level.width, level.height);

    // Terrain
    const terrainChunks = splitTerrainIntoPolygons(level.terrain);
    for (const chunk of terrainChunks) {
      if (chunk.length >= 3) {
        ctx.beginPath();
        ctx.moveTo(chunk[0].x, chunk[0].y);
        for (let i = 1; i < chunk.length; i++) {
          ctx.lineTo(chunk[i].x, chunk[i].y);
        }
        ctx.closePath();
        const terrainGradient = ctx.createLinearGradient(0, level.height - 100, 0, level.height);
        terrainGradient.addColorStop(0, "#4ade80");
        terrainGradient.addColorStop(1, "#16a34a");
        ctx.fillStyle = terrainGradient;
        ctx.fill();
      }
    }

    // Anchors with glow
    for (const anchor of level.anchors) {
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(34, 197, 94, 0.3)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, 8, 0, Math.PI * 2);
      const anchorGradient = ctx.createRadialGradient(anchor.x - 2, anchor.y - 2, 0, anchor.x, anchor.y, 8);
      anchorGradient.addColorStop(0, "#4ade80");
      anchorGradient.addColorStop(1, "#16a34a");
      ctx.fillStyle = anchorGradient;
      ctx.fill();
      ctx.strokeStyle = "#15803d";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Structures
    for (const structure of structures) {
      ctx.beginPath();
      ctx.moveTo(structure.start.x, structure.start.y);
      ctx.lineTo(structure.end.x, structure.end.y);
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.lineWidth = structure.type === "road" ? 8 : structure.type === "cable" ? 3 : 6;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(structure.start.x, structure.start.y);
      ctx.lineTo(structure.end.x, structure.end.y);
      ctx.strokeStyle = MATERIAL_COLORS[structure.material];
      ctx.lineWidth = structure.type === "road" ? 6 : structure.type === "cable" ? 2 : 4;
      ctx.stroke();

      for (const point of [structure.start, structure.end]) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#27272a";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#52525b";
        ctx.fill();
      }
    }

    // Drawing preview
    if (isDrawing && drawStart && drawEnd) {
      ctx.beginPath();
      ctx.moveTo(drawStart.x, drawStart.y);
      ctx.lineTo(drawEnd.x, drawEnd.y);
      ctx.strokeStyle = selectedTool === "delete" ? "#ef4444" : TOOL_CONFIG[selectedTool].color;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      const dx = drawEnd.x - drawStart.x;
      const dy = drawEnd.y - drawStart.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > 20) {
        const material = selectedTool === "cable" ? "cable" : selectedTool === "road" ? "road" : selectedMaterial;
        const previewCost = Math.ceil(length * MATERIAL_COSTS[material] / 10);
        const midX = (drawStart.x + drawEnd.x) / 2;
        const midY = (drawStart.y + drawEnd.y) / 2;

        ctx.font = "bold 12px system-ui";
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(midX - 20, midY - 18, 40, 18);
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.fillText(`$${previewCost}`, midX, midY - 5);
      }
    }

    // Vehicle markers
    ctx.beginPath();
    ctx.arc(level.vehicleStart.x, level.vehicleStart.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = "#ef4444";
    ctx.fill();
    ctx.strokeStyle = "#b91c1c";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("START", level.vehicleStart.x, level.vehicleStart.y + 4);

    ctx.beginPath();
    ctx.arc(level.vehicleEnd.x, level.vehicleEnd.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = "#22c55e";
    ctx.fill();
    ctx.strokeStyle = "#15803d";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.fillText("END", level.vehicleEnd.x, level.vehicleEnd.y + 4);
  }, [level, structures, isDrawing, drawStart, drawEnd, selectedTool, selectedMaterial]);

  // Draw simulation scene (when testing)
  const drawSimulationScene = useCallback(() => {
    const canvas = canvasRef.current;
    const sim = simulationRef.current;
    if (!canvas || !sim) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, level.height);
    skyGradient.addColorStop(0, "#7dd3fc");
    skyGradient.addColorStop(1, "#bae6fd");
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, level.width, level.height);

    // Terrain
    const terrainChunks = splitTerrainIntoPolygons(level.terrain);
    for (const chunk of terrainChunks) {
      if (chunk.length >= 3) {
        ctx.beginPath();
        ctx.moveTo(chunk[0].x, chunk[0].y);
        for (let i = 1; i < chunk.length; i++) {
          ctx.lineTo(chunk[i].x, chunk[i].y);
        }
        ctx.closePath();
        const terrainGradient = ctx.createLinearGradient(0, level.height - 100, 0, level.height);
        terrainGradient.addColorStop(0, "#4ade80");
        terrainGradient.addColorStop(1, "#16a34a");
        ctx.fillStyle = terrainGradient;
        ctx.fill();
      }
    }

    // Anchors
    for (const anchor of level.anchors) {
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#22c55e";
      ctx.fill();
      ctx.strokeStyle = "#15803d";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw structure bodies (these move during simulation!)
    for (const body of sim.structureBodies) {
      const struct = structures.find((s) => s.id === (body as BodyWithStructureId).structureId);
      if (!struct) continue;

      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.rotate(body.angle);

      const vertices = body.vertices;
      const width = Math.sqrt(
        (vertices[1].x - vertices[0].x) ** 2 + (vertices[1].y - vertices[0].y) ** 2
      );
      const height = struct.type === "road" ? 8 : 6;

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(-width / 2 + 2, -height / 2 + 2, width, height);

      // Main body
      ctx.fillStyle = MATERIAL_COLORS[struct.material];
      ctx.fillRect(-width / 2, -height / 2, width, height);

      // Highlight
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(-width / 2, -height / 2, width, height / 3);

      ctx.restore();
    }

    // Draw constraints (cables)
    for (const constraint of sim.constraints) {
      if (!constraint.bodyA && !constraint.bodyB) continue;

      let pointA: Point;
      let pointB: Point;

      if (constraint.bodyA) {
        pointA = {
          x: constraint.bodyA.position.x + (constraint.pointA?.x || 0),
          y: constraint.bodyA.position.y + (constraint.pointA?.y || 0),
        };
      } else {
        pointA = constraint.pointA as Point;
      }

      if (constraint.bodyB) {
        pointB = {
          x: constraint.bodyB.position.x + (constraint.pointB?.x || 0),
          y: constraint.bodyB.position.y + (constraint.pointB?.y || 0),
        };
      } else {
        pointB = constraint.pointB as Point;
      }

      ctx.beginPath();
      ctx.moveTo(pointA.x, pointA.y);
      ctx.lineTo(pointB.x, pointB.y);
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw vehicle (car body)
    ctx.save();
    ctx.translate(sim.vehicle.position.x, sim.vehicle.position.y);
    ctx.rotate(sim.vehicle.angle);

    // Car body shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(-15 + 2, -10 + 2, 30, 20);

    // Car body
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(-15, -10, 30, 20);

    // Car roof
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(-10, -10, 20, 8);

    // Car highlight
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillRect(-15, -10, 30, 5);

    // Windshield
    ctx.fillStyle = "#7dd3fc";
    ctx.fillRect(-8, -8, 8, 6);

    ctx.restore();

    // Draw wheels
    for (const wheel of sim.wheels) {
      ctx.save();
      ctx.translate(wheel.position.x, wheel.position.y);
      ctx.rotate(wheel.angle);

      // Wheel
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#1f2937";
      ctx.fill();

      // Hub
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#6b7280";
      ctx.fill();

      // Spoke for rotation visibility
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(4, 0);
      ctx.strokeStyle = "#9ca3af";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    }

    // End marker
    ctx.beginPath();
    ctx.arc(level.vehicleEnd.x, level.vehicleEnd.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = "#22c55e";
    ctx.fill();
    ctx.strokeStyle = "#15803d";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("END", level.vehicleEnd.x, level.vehicleEnd.y + 4);

  }, [level, structures]);

  // Draw static scene when not testing
  useEffect(() => {
    if (testResult !== "testing") {
      drawStaticScene();
    }
  }, [testResult, drawStaticScene]);

  // Countdown effect
  useEffect(() => {
    if (testResult !== "countdown") return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 600);
      return () => clearTimeout(timer);
    }
  }, [testResult, countdown]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (testResult === "testing" || testResult === "countdown") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedTool === "delete") {
      const clickPoint = { x, y };
      const structureToDelete = structures.find((s) => {
        const dist = pointToLineDistance(clickPoint, s.start, s.end);
        return dist < 10;
      });
      if (structureToDelete) {
        setStructures((prev) => prev.filter((s) => s.id !== structureToDelete.id));
        setTestResult("untested");
      }
    } else {
      setIsDrawing(true);
      setDrawStart({ x, y });
      setDrawEnd({ x, y });
    }
  }, [selectedTool, structures, testResult]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDrawEnd({ x, y });
  }, [isDrawing]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !drawStart || !drawEnd) {
      setIsDrawing(false);
      return;
    }

    const dx = drawEnd.x - drawStart.x;
    const dy = drawEnd.y - drawStart.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length < 20) {
      setIsDrawing(false);
      setDrawStart(null);
      setDrawEnd(null);
      return;
    }

    const material = selectedTool === "cable" ? "cable" : selectedTool === "road" ? "road" : selectedMaterial;
    const cost = Math.ceil(length * MATERIAL_COSTS[material] / 10);

    if (budgetUsed + cost > level.budget) {
      setIsDrawing(false);
      setDrawStart(null);
      setDrawEnd(null);
      return;
    }

    const newStructure: Structure = {
      id: `s-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: selectedTool as "beam" | "cable" | "road",
      material,
      start: drawStart,
      end: drawEnd,
      cost,
    };

    setStructures((prev) => [...prev, newStructure]);
    setTestResult("untested");
    setIsDrawing(false);
    setDrawStart(null);
    setDrawEnd(null);
  }, [isDrawing, drawStart, drawEnd, selectedTool, selectedMaterial, budgetUsed, level.budget]);

  // Start test with countdown
  const startTest = useCallback(() => {
    if (structures.length === 0) return;
    setCountdown(3);
    setTestResult("countdown");
    setCanvasShake(true);
    setTimeout(() => setCanvasShake(false), 500);
  }, [structures.length]);

  // Run physics test with visual rendering
  const runTest = useCallback(() => {
    setTestResult("testing");

    const engine = Matter.Engine.create({ gravity: { x: 0, y: 1 } });
    engineRef.current = engine;
    const world = engine.world;

    // Ground
    const terrainChunks = splitTerrainIntoPolygons(level.terrain);
    for (const chunk of terrainChunks) {
      if (chunk.length >= 3) {
        const vertices = chunk.map((p) => ({ x: p.x, y: p.y }));
        const centroid = Matter.Vertices.centre(vertices);
        const ground = Matter.Bodies.fromVertices(centroid.x, centroid.y, [vertices], {
          isStatic: true,
          friction: 0.8,
        });
        Matter.Composite.add(world, ground);
      }
    }

    // Structure bodies
    const structureBodies: Matter.Body[] = [];
    const allConstraints: Matter.Constraint[] = [];

    for (const structure of structures) {
      if (structure.type === "cable") continue;

      const midX = (structure.start.x + structure.end.x) / 2;
      const midY = (structure.start.y + structure.end.y) / 2;
      const dx = structure.end.x - structure.start.x;
      const dy = structure.end.y - structure.start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      const body = Matter.Bodies.rectangle(midX, midY, length, structure.type === "road" ? 8 : 6, {
        angle,
        friction: 0.8,
        density: structure.material === "steel" ? 0.002 : 0.001,
      });

      (body as BodyWithStructureId).structureId = structure.id;
      structureBodies.push(body);
      Matter.Composite.add(world, body);
    }

    // Connect nearby endpoints
    for (let i = 0; i < structureBodies.length; i++) {
      for (let j = i + 1; j < structureBodies.length; j++) {
        const bodyA = structureBodies[i];
        const bodyB = structureBodies[j];
        const structA = structures.find((s) => s.id === (bodyA as BodyWithStructureId).structureId)!;
        const structB = structures.find((s) => s.id === (bodyB as BodyWithStructureId).structureId)!;

        const points = [
          { a: structA.start, b: structB.start },
          { a: structA.start, b: structB.end },
          { a: structA.end, b: structB.start },
          { a: structA.end, b: structB.end },
        ];

        for (const { a, b } of points) {
          const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
          if (dist < 15) {
            const constraint = Matter.Constraint.create({
              bodyA,
              bodyB,
              pointA: { x: a.x - bodyA.position.x, y: a.y - bodyA.position.y },
              pointB: { x: b.x - bodyB.position.x, y: b.y - bodyB.position.y },
              stiffness: 0.9,
              damping: 0.1,
              length: 0,
            });
            allConstraints.push(constraint);
            Matter.Composite.add(world, constraint);
          }
        }
      }
    }

    // Pin to anchors
    for (const anchor of level.anchors) {
      for (const body of structureBodies) {
        const struct = structures.find((s) => s.id === (body as BodyWithStructureId).structureId)!;
        for (const point of [struct.start, struct.end]) {
          const dist = Math.sqrt((anchor.x - point.x) ** 2 + (anchor.y - point.y) ** 2);
          if (dist < 15) {
            const constraint = Matter.Constraint.create({
              bodyA: body,
              pointA: { x: point.x - body.position.x, y: point.y - body.position.y },
              pointB: anchor,
              stiffness: 1,
              length: 0,
            });
            allConstraints.push(constraint);
            Matter.Composite.add(world, constraint);
          }
        }
      }
    }

    // Cables
    for (const structure of structures) {
      if (structure.type === "cable") {
        const constraint = Matter.Constraint.create({
          pointA: structure.start,
          pointB: structure.end,
          stiffness: 0.01,
          damping: 0.1,
        });
        allConstraints.push(constraint);
        Matter.Composite.add(world, constraint);
      }
    }

    // Vehicle
    const vehicle = Matter.Bodies.rectangle(
      level.vehicleStart.x,
      level.vehicleStart.y - 15,
      30,
      20,
      { friction: 0.5, density: 0.003 * level.vehicleWeight }
    );
    Matter.Composite.add(world, vehicle);

    const wheelLeft = Matter.Bodies.circle(level.vehicleStart.x - 10, level.vehicleStart.y - 5, 6, { friction: 1, density: 0.001 });
    const wheelRight = Matter.Bodies.circle(level.vehicleStart.x + 10, level.vehicleStart.y - 5, 6, { friction: 1, density: 0.001 });
    Matter.Composite.add(world, [wheelLeft, wheelRight]);

    Matter.Composite.add(world, [
      Matter.Constraint.create({ bodyA: vehicle, bodyB: wheelLeft, pointA: { x: -10, y: 10 }, stiffness: 0.5, length: 0 }),
      Matter.Constraint.create({ bodyA: vehicle, bodyB: wheelRight, pointA: { x: 10, y: 10 }, stiffness: 0.5, length: 0 }),
    ]);

    // Store simulation state for rendering
    simulationRef.current = {
      vehicle,
      wheels: [wheelLeft, wheelRight],
      structureBodies,
      constraints: allConstraints,
    };

    // Run simulation
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);

    // Force to move vehicle
    const forceInterval = setInterval(() => {
      Matter.Body.applyForce(vehicle, vehicle.position, { x: 0.001, y: 0 });
    }, 16);

    // Render loop
    const renderLoop = () => {
      drawSimulationScene();
      renderLoopRef.current = requestAnimationFrame(renderLoop);
    };
    renderLoopRef.current = requestAnimationFrame(renderLoop);

    // Check win/fail
    let elapsed = 0;
    const checkInterval = setInterval(() => {
      elapsed += 100;

      const distToEnd = Math.sqrt(
        (vehicle.position.x - level.vehicleEnd.x) ** 2 +
        (vehicle.position.y - level.vehicleEnd.y) ** 2
      );

      if (distToEnd < 30) {
        clearInterval(checkInterval);
        clearInterval(forceInterval);
        if (renderLoopRef.current) cancelAnimationFrame(renderLoopRef.current);
        Matter.Runner.stop(runner);
        simulationRef.current = null;
        setTestResult("passed");
        onGameComplete?.({ won: true, level: levelIndex + 1, budget: budgetUsed });
      } else if (vehicle.position.y > level.height + 50 || elapsed > 15000) {
        clearInterval(checkInterval);
        clearInterval(forceInterval);
        if (renderLoopRef.current) cancelAnimationFrame(renderLoopRef.current);
        Matter.Runner.stop(runner);
        simulationRef.current = null;
        setTestResult("failed");
      }
    }, 100);

  }, [structures, level, levelIndex, budgetUsed, onGameComplete, drawSimulationScene]);

  // Reset level
  const resetLevel = useCallback(() => {
    setStructures([]);
    setTestResult("untested");
    simulationRef.current = null;

    if (renderLoopRef.current) {
      cancelAnimationFrame(renderLoopRef.current);
      renderLoopRef.current = null;
    }
    if (runnerRef.current) {
      Matter.Runner.stop(runnerRef.current);
    }
    if (engineRef.current) {
      Matter.Engine.clear(engineRef.current);
    }
  }, []);

  // Next level
  const nextLevel = useCallback(() => {
    if (levelIndex < POLYBRIDGE_LEVELS.length - 1) {
      setLevelIndex(levelIndex + 1);
      resetLevel();
    }
  }, [levelIndex, resetLevel]);

  return (
    <div className="flex flex-col gap-5 max-w-[800px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 text-xs font-bold rounded-full">
              Level {levelIndex + 1}/{POLYBRIDGE_LEVELS.length}
            </span>
            {testResult === "testing" && (
              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-full animate-pulse">
                🚗 Testing...
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white">{level.name}</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{level.description}</p>
        </div>
        <BudgetBar used={budgetUsed} total={level.budget} />
      </div>

      {/* Canvas */}
      <div className="relative">
        <div
          className={cn(
            "rounded-xl overflow-hidden shadow-xl border-2 border-zinc-200 dark:border-zinc-800 transition-all duration-100",
            canvasShake && "animate-pulse",
            testResult === "countdown" && "ring-4 ring-amber-400/50",
            testResult === "testing" && "ring-2 ring-amber-500/50"
          )}
          style={{ transform: canvasShake ? "translateX(2px)" : "none" }}
        >
          <canvas
            ref={canvasRef}
            width={level.width}
            height={level.height}
            className={cn(
              "cursor-crosshair block",
              selectedTool === "delete" && "cursor-pointer",
              testResult === "testing" && "cursor-default"
            )}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              if (isDrawing) {
                setIsDrawing(false);
                setDrawStart(null);
                setDrawEnd(null);
              }
            }}
          />
        </div>

        {testResult === "countdown" && <CountdownOverlay count={countdown} onComplete={runTest} />}
        {testResult === "passed" && (
          <SuccessOverlay
            budgetUsed={budgetUsed}
            budgetTotal={level.budget}
            hasNextLevel={levelIndex < POLYBRIDGE_LEVELS.length - 1}
            onNextLevel={nextLevel}
          />
        )}
        {testResult === "failed" && <FailureOverlay onRetry={() => setTestResult("untested")} />}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-3 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          {(["beam", "cable", "road", "delete"] as ToolType[]).map((tool) => (
            <ToolButton key={tool} tool={tool} selected={selectedTool === tool} onClick={() => setSelectedTool(tool)} />
          ))}

          {selectedTool === "beam" && (
            <div className="flex items-center gap-2 ml-3 pl-3 border-l border-zinc-300 dark:border-zinc-700">
              {(["wood", "steel"] as const).map((mat) => (
                <MaterialButton key={mat} material={mat} selected={selectedMaterial === mat} onClick={() => setSelectedMaterial(mat)} />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetLevel}
            disabled={testResult === "testing" || testResult === "countdown"}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-sm hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button
            onClick={startTest}
            disabled={structures.length === 0 || testResult === "testing" || testResult === "countdown"}
            className={cn(
              "group flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200",
              "bg-gradient-to-r from-emerald-500 to-green-500 text-white",
              "shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50",
              "hover:scale-[1.02] active:scale-[0.98]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            )}
          >
            <Play className="h-4 w-4 group-hover:scale-110 transition-transform" />
            Test Bridge
          </button>
        </div>
      </div>
    </div>
  );
}
