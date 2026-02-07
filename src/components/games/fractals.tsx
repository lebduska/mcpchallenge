"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, RotateCcw, Download, Sparkles, TreePine, Snowflake, FlameKindling } from "lucide-react";
import {
  fractalsEngine,
  FRACTAL_PRESETS,
  type FractalState,
  type ColorScheme,
} from "@mcpchallenge/game-engines";

const CANVAS_SIZE = 512;
const DISPLAY_SIZE = 400;

interface FractalsGameProps {
  onComplete?: (state: FractalState) => void;
}

const PRESET_ICONS: Record<string, React.ReactNode> = {
  tree: <TreePine className="h-4 w-4" />,
  plant: <Sparkles className="h-4 w-4" />,
  dragon: <FlameKindling className="h-4 w-4" />,
  koch: <Snowflake className="h-4 w-4" />,
  sierpinski: <Sparkles className="h-4 w-4" />,
  snowflake: <Snowflake className="h-4 w-4" />,
  hilbert: <Sparkles className="h-4 w-4" />,
};

const COLOR_SCHEMES: { value: ColorScheme; label: string }[] = [
  { value: "depth", label: "Depth Gradient" },
  { value: "rainbow", label: "Rainbow" },
  { value: "forest", label: "Forest" },
  { value: "fire", label: "Fire" },
  { value: "ocean", label: "Ocean" },
  { value: "monochrome", label: "Monochrome" },
];

export function FractalsGame({ onComplete }: FractalsGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<FractalState>(() =>
    fractalsEngine.newGame({ width: CANVAS_SIZE, height: CANVAS_SIZE })
  );
  const [isRendering, setIsRendering] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("tree");
  const [colorScheme, setColorScheme] = useState<ColorScheme>("depth");
  const [iterations, setIterations] = useState(4);
  const [angle, setAngle] = useState(22.5);

  // Render pixels to canvas
  const renderToCanvas = useCallback((state: FractalState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height, pixels } = state.canvas;
    const imageData = ctx.createImageData(width, height);

    for (let i = 0; i < pixels.length; i++) {
      imageData.data[i] = pixels[i];
    }

    ctx.putImageData(imageData, 0, 0);
  }, []);

  // Generate and render fractal
  const generateFractal = useCallback(async () => {
    setIsRendering(true);

    // Small delay to show loading state
    await new Promise((r) => setTimeout(r, 50));

    // Set parameters
    let state = gameState;
    const paramResult = fractalsEngine.makeMove(state, {
      action: "set_parameters",
      params: { angle, iterations },
    });
    if (paramResult.valid) state = paramResult.state;

    // Render with selected color scheme
    const renderResult = fractalsEngine.makeMove(state, {
      action: "render",
      params: { colorScheme },
    });

    if (renderResult.valid) {
      setGameState(renderResult.state);
      renderToCanvas(renderResult.state);
      onComplete?.(renderResult.state);
    }

    setIsRendering(false);
  }, [gameState, angle, iterations, colorScheme, renderToCanvas, onComplete]);

  // Load preset
  const loadPreset = useCallback(
    (presetName: string) => {
      setSelectedPreset(presetName);
      const preset = FRACTAL_PRESETS[presetName];
      if (preset) {
        setAngle(preset.angle);
        setIterations(preset.iterations);
      }

      const result = fractalsEngine.makeMove(gameState, {
        action: "new_fractal",
        params: { preset: presetName },
      });

      if (result.valid) {
        setGameState(result.state);
        // Clear canvas
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
          }
        }
      }
    },
    [gameState]
  );

  // Reset to initial state
  const reset = useCallback(() => {
    loadPreset("tree");
  }, [loadPreset]);

  // Download as PNG
  const downloadImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `fractal-${selectedPreset}-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [selectedPreset]);

  // Initial render
  useEffect(() => {
    generateFractal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Canvas */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              L-System Fractal
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {gameState.stats.segmentsDrawn.toLocaleString()} segments
              </Badge>
              <Badge variant="outline" className="text-xs">
                depth: {gameState.stats.maxDepth}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center p-4 bg-zinc-100 dark:bg-zinc-900">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-inner"
            style={{
              width: DISPLAY_SIZE,
              height: DISPLAY_SIZE,
              imageRendering: "auto",
            }}
          />
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Presets */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Preset</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.keys(FRACTAL_PRESETS).map((preset) => (
                <Button
                  key={preset}
                  variant={selectedPreset === preset ? "default" : "outline"}
                  size="sm"
                  onClick={() => loadPreset(preset)}
                  className="capitalize"
                >
                  {PRESET_ICONS[preset]}
                  <span className="ml-1">{preset}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Color Scheme */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Color Scheme</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={colorScheme} onValueChange={(v) => setColorScheme(v as ColorScheme)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLOR_SCHEMES.map((scheme) => (
                  <SelectItem key={scheme.value} value={scheme.value}>
                    {scheme.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Iterations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex justify-between">
              <span>Iterations</span>
              <span className="font-mono text-muted-foreground">{iterations}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Slider
              value={[iterations]}
              onValueChange={([v]) => setIterations(v)}
              min={1}
              max={12}
              step={1}
            />
          </CardContent>
        </Card>

        {/* Angle */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex justify-between">
              <span>Angle</span>
              <span className="font-mono text-muted-foreground">{angle.toFixed(1)}°</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Slider
              value={[angle]}
              onValueChange={([v]) => setAngle(v)}
              min={5}
              max={120}
              step={0.5}
            />
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-3">
        <Button onClick={generateFractal} disabled={isRendering} size="lg">
          {isRendering ? (
            <>
              <span className="animate-spin mr-2">⚙</span>
              Rendering...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Generate
            </>
          )}
        </Button>
        <Button variant="outline" onClick={reset} size="lg">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <Button variant="outline" onClick={downloadImage} size="lg">
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>

      {/* Grammar Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">L-System Grammar</CardTitle>
        </CardHeader>
        <CardContent className="font-mono text-xs space-y-1">
          <div>
            <span className="text-muted-foreground">Axiom:</span>{" "}
            <span className="text-purple-600 dark:text-purple-400">{gameState.axiom}</span>
          </div>
          <div className="text-muted-foreground">Rules:</div>
          {gameState.rules.map((rule, i) => (
            <div key={i} className="pl-4">
              <span className="text-blue-600 dark:text-blue-400">{rule.symbol}</span>
              <span className="text-muted-foreground"> → </span>
              <span className="text-green-600 dark:text-green-400">{rule.replacement}</span>
              {rule.probability < 1 && (
                <span className="text-orange-500 ml-2">({(rule.probability * 100).toFixed(0)}%)</span>
              )}
            </div>
          ))}
          {gameState.expandedString && (
            <div className="mt-2 text-muted-foreground">
              Expanded: {gameState.expandedString.length.toLocaleString()} symbols
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default FractalsGame;
