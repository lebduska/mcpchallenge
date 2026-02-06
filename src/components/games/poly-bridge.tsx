"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Matter from "matter-js";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Play,
  RotateCcw,
  Trash2,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  type PolyBridgeState,
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

// Extended Matter.Body type with custom property
interface BodyWithStructureId extends Matter.Body {
  structureId?: string;
}

// =============================================================================
// Constants
// =============================================================================

const TOOL_COLORS: Record<ToolType, string> = {
  beam: "#8B4513",
  cable: "#333333",
  road: "#555555",
  delete: "#ff0000",
};

const MATERIAL_DISPLAY: Record<MaterialType, { color: string; label: string }> = {
  wood: { color: "#8B4513", label: "Wood" },
  steel: { color: "#4a5568", label: "Steel" },
  cable: { color: "#1a1a1a", label: "Cable" },
  road: { color: "#2d3748", label: "Road" },
};

// =============================================================================
// Helper Functions (outside component to avoid hoisting issues)
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
// Component
// =============================================================================

export function PolyBridgeGame({ onGameComplete }: PolyBridgeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);

  const [levelIndex, setLevelIndex] = useState(0);
  const [structures, setStructures] = useState<Structure[]>([]);
  const [budgetUsed, setBudgetUsed] = useState(0);
  const [selectedTool, setSelectedTool] = useState<ToolType>("beam");
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType>("wood");
  const [testResult, setTestResult] = useState<"untested" | "testing" | "passed" | "failed">("untested");
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<Point | null>(null);
  const [drawEnd, setDrawEnd] = useState<Point | null>(null);
  const [levelComplete, setLevelComplete] = useState(false);

  const level = POLYBRIDGE_LEVELS[levelIndex];

  // Calculate budget used
  useEffect(() => {
    const total = structures.reduce((sum, s) => sum + s.cost, 0);
    setBudgetUsed(total);
  }, [structures]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.fillStyle = "#87CEEB"; // Sky blue
    ctx.fillRect(0, 0, level.width, level.height);

    // Draw terrain
    ctx.fillStyle = "#4a7c34";
    const terrainChunks = splitTerrainIntoPolygons(level.terrain);
    for (const chunk of terrainChunks) {
      if (chunk.length >= 3) {
        ctx.beginPath();
        ctx.moveTo(chunk[0].x, chunk[0].y);
        for (let i = 1; i < chunk.length; i++) {
          ctx.lineTo(chunk[i].x, chunk[i].y);
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    // Draw anchors
    for (const anchor of level.anchors) {
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#22c55e";
      ctx.fill();
      ctx.strokeStyle = "#166534";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw structures
    for (const structure of structures) {
      ctx.beginPath();
      ctx.moveTo(structure.start.x, structure.start.y);
      ctx.lineTo(structure.end.x, structure.end.y);
      ctx.strokeStyle = MATERIAL_DISPLAY[structure.material].color;
      ctx.lineWidth = structure.type === "road" ? 6 : structure.type === "cable" ? 2 : 4;
      ctx.stroke();

      // Draw joints at endpoints
      ctx.beginPath();
      ctx.arc(structure.start.x, structure.start.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#333";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(structure.end.x, structure.end.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw current drawing
    if (isDrawing && drawStart && drawEnd) {
      ctx.beginPath();
      ctx.moveTo(drawStart.x, drawStart.y);
      ctx.lineTo(drawEnd.x, drawEnd.y);
      ctx.strokeStyle = selectedTool === "delete" ? "#ff0000" : TOOL_COLORS[selectedTool];
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw vehicle positions
    ctx.beginPath();
    ctx.arc(level.vehicleStart.x, level.vehicleStart.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#ef4444";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("S", level.vehicleStart.x, level.vehicleStart.y + 3);

    ctx.beginPath();
    ctx.arc(level.vehicleEnd.x, level.vehicleEnd.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#22c55e";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText("E", level.vehicleEnd.x, level.vehicleEnd.y + 3);

  }, [level, structures, isDrawing, drawStart, drawEnd, selectedTool]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (testResult === "testing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedTool === "delete") {
      // Find and remove structure near click
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

    // Calculate length and cost
    const dx = drawEnd.x - drawStart.x;
    const dy = drawEnd.y - drawStart.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length < 20) {
      // Too short, ignore
      setIsDrawing(false);
      setDrawStart(null);
      setDrawEnd(null);
      return;
    }

    const material = selectedTool === "cable" ? "cable" : selectedTool === "road" ? "road" : selectedMaterial;
    const cost = Math.ceil(length * MATERIAL_COSTS[material] / 10);

    if (budgetUsed + cost > level.budget) {
      // Over budget
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

  // Run physics test
  const runTest = useCallback(() => {
    if (structures.length === 0) return;
    setTestResult("testing");

    // Create Matter.js engine
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 1 },
    });
    engineRef.current = engine;

    const world = engine.world;

    // Add ground bodies
    const terrainChunks = splitTerrainIntoPolygons(level.terrain);
    for (const chunk of terrainChunks) {
      if (chunk.length >= 3) {
        const vertices = chunk.map((p) => ({ x: p.x, y: p.y }));
        const centroid = Matter.Vertices.centre(vertices);
        const ground = Matter.Bodies.fromVertices(centroid.x, centroid.y, [vertices], {
          isStatic: true,
          friction: 0.8,
          render: { fillStyle: "#4a7c34" },
        });
        Matter.Composite.add(world, ground);
      }
    }

    // Add structure bodies
    const structureBodies: Matter.Body[] = [];
    const constraints: Matter.Constraint[] = [];

    for (const structure of structures) {
      const midX = (structure.start.x + structure.end.x) / 2;
      const midY = (structure.start.y + structure.end.y) / 2;
      const dx = structure.end.x - structure.start.x;
      const dy = structure.end.y - structure.start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      if (structure.type === "cable") {
        // Cables are constraints, not bodies
        continue;
      }

      const body = Matter.Bodies.rectangle(midX, midY, length, structure.type === "road" ? 8 : 6, {
        angle,
        friction: 0.8,
        density: structure.material === "steel" ? 0.002 : 0.001,
        render: {
          fillStyle: MATERIAL_DISPLAY[structure.material].color,
        },
      });

      (body as BodyWithStructureId).structureId = structure.id;
      structureBodies.push(body);
      Matter.Composite.add(world, body);
    }

    // Create constraints between nearby endpoints
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
              pointA: {
                x: a.x - bodyA.position.x,
                y: a.y - bodyA.position.y,
              },
              pointB: {
                x: b.x - bodyB.position.x,
                y: b.y - bodyB.position.y,
              },
              stiffness: 0.9,
              damping: 0.1,
              length: 0,
            });
            constraints.push(constraint);
            Matter.Composite.add(world, constraint);
          }
        }
      }
    }

    // Pin structures to anchors
    for (const anchor of level.anchors) {
      for (const body of structureBodies) {
        const struct = structures.find((s) => s.id === (body as BodyWithStructureId).structureId)!;
        for (const point of [struct.start, struct.end]) {
          const dist = Math.sqrt((anchor.x - point.x) ** 2 + (anchor.y - point.y) ** 2);
          if (dist < 15) {
            const constraint = Matter.Constraint.create({
              bodyA: body,
              pointA: {
                x: point.x - body.position.x,
                y: point.y - body.position.y,
              },
              pointB: anchor,
              stiffness: 1,
              length: 0,
            });
            Matter.Composite.add(world, constraint);
          }
        }
      }
    }

    // Add cable constraints
    for (const structure of structures) {
      if (structure.type === "cable") {
        const constraint = Matter.Constraint.create({
          pointA: structure.start,
          pointB: structure.end,
          stiffness: 0.01,
          damping: 0.1,
          render: {
            strokeStyle: "#1a1a1a",
            lineWidth: 2,
          },
        });
        Matter.Composite.add(world, constraint);
      }
    }

    // Add vehicle
    const vehicle = Matter.Bodies.rectangle(
      level.vehicleStart.x,
      level.vehicleStart.y - 15,
      30,
      20,
      {
        friction: 0.5,
        density: 0.003 * level.vehicleWeight,
        render: { fillStyle: "#ef4444" },
      }
    );
    Matter.Composite.add(world, vehicle);

    // Add wheels
    const wheelLeft = Matter.Bodies.circle(
      level.vehicleStart.x - 10,
      level.vehicleStart.y - 5,
      6,
      { friction: 1, density: 0.001 }
    );
    const wheelRight = Matter.Bodies.circle(
      level.vehicleStart.x + 10,
      level.vehicleStart.y - 5,
      6,
      { friction: 1, density: 0.001 }
    );
    Matter.Composite.add(world, [wheelLeft, wheelRight]);

    Matter.Composite.add(world, [
      Matter.Constraint.create({
        bodyA: vehicle,
        bodyB: wheelLeft,
        pointA: { x: -10, y: 10 },
        stiffness: 0.5,
        length: 0,
      }),
      Matter.Constraint.create({
        bodyA: vehicle,
        bodyB: wheelRight,
        pointA: { x: 10, y: 10 },
        stiffness: 0.5,
        length: 0,
      }),
    ]);

    // Run simulation
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);

    // Apply force to move vehicle
    const forceInterval = setInterval(() => {
      Matter.Body.applyForce(vehicle, vehicle.position, { x: 0.001, y: 0 });
    }, 16);

    // Check for win/fail
    let elapsed = 0;
    const checkInterval = setInterval(() => {
      elapsed += 100;

      // Check if vehicle reached end
      const distToEnd = Math.sqrt(
        (vehicle.position.x - level.vehicleEnd.x) ** 2 +
        (vehicle.position.y - level.vehicleEnd.y) ** 2
      );

      if (distToEnd < 30) {
        // WIN!
        clearInterval(checkInterval);
        clearInterval(forceInterval);
        Matter.Runner.stop(runner);
        setTestResult("passed");
        setLevelComplete(true);
        onGameComplete?.({ won: true, level: levelIndex + 1, budget: budgetUsed });
      } else if (vehicle.position.y > level.height + 50 || elapsed > 15000) {
        // FAIL - fell or timeout
        clearInterval(checkInterval);
        clearInterval(forceInterval);
        Matter.Runner.stop(runner);
        setTestResult("failed");
      }
    }, 100);

    // Cleanup after test
    return () => {
      clearInterval(checkInterval);
      clearInterval(forceInterval);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
    };
  }, [structures, level, levelIndex, budgetUsed, onGameComplete]);

  // Reset level
  const resetLevel = useCallback(() => {
    setStructures([]);
    setBudgetUsed(0);
    setTestResult("untested");
    setLevelComplete(false);

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
    <div className="flex flex-col gap-4">
      {/* Level info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{level.name}</h2>
          <p className="text-sm text-zinc-500">{level.description}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">
            Budget: ${budgetUsed} / ${level.budget}
          </div>
          <div className="text-sm text-zinc-500">
            Level {levelIndex + 1} / {POLYBRIDGE_LEVELS.length}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={level.width}
          height={level.height}
          className="border border-zinc-300 rounded-lg cursor-crosshair"
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

        {/* Test result overlay */}
        {testResult === "passed" && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-lg">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-lg text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Level Complete!</h3>
              <p className="text-zinc-500 mb-4">Budget used: ${budgetUsed}</p>
              {levelIndex < POLYBRIDGE_LEVELS.length - 1 ? (
                <Button onClick={nextLevel}>
                  Next Level <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <div className="text-green-600 font-semibold">
                  All levels completed!
                </div>
              )}
            </div>
          </div>
        )}

        {testResult === "failed" && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-lg">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-lg text-center">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Bridge Failed!</h3>
              <p className="text-zinc-500 mb-4">Try a different design</p>
              <Button onClick={() => setTestResult("untested")} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Tools */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {(["beam", "cable", "road", "delete"] as ToolType[]).map((tool) => (
            <Button
              key={tool}
              size="sm"
              variant={selectedTool === tool ? "default" : "outline"}
              onClick={() => setSelectedTool(tool)}
              className={cn(
                selectedTool === tool && tool !== "delete" && "ring-2 ring-offset-2",
                tool === "delete" && selectedTool === tool && "bg-red-500 hover:bg-red-600"
              )}
            >
              {tool === "delete" ? (
                <Trash2 className="h-4 w-4" />
              ) : (
                tool.charAt(0).toUpperCase() + tool.slice(1)
              )}
            </Button>
          ))}
        </div>

        {selectedTool === "beam" && (
          <div className="flex gap-2 ml-4">
            {(["wood", "steel"] as MaterialType[]).map((mat) => (
              <Button
                key={mat}
                size="sm"
                variant={selectedMaterial === mat ? "default" : "outline"}
                onClick={() => setSelectedMaterial(mat)}
              >
                {MATERIAL_DISPLAY[mat].label} (${MATERIAL_COSTS[mat]}/u)
              </Button>
            ))}
          </div>
        )}

        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            onClick={resetLevel}
            disabled={testResult === "testing"}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={runTest}
            disabled={structures.length === 0 || testResult === "testing"}
          >
            <Play className="h-4 w-4 mr-2" />
            Test Bridge
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-sm text-zinc-500 bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg">
        <strong>How to play:</strong> Click and drag to place structures. Connect green anchor points.
        Use beams for structure, road for vehicle surface, and cables for suspension.
        Click Test Bridge when ready!
      </div>
    </div>
  );
}
