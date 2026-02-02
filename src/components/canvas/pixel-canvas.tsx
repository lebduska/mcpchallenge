"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Trash2, Download } from "lucide-react";

const WIDTH = 64;
const HEIGHT = 64;
const PIXEL_SIZE = 6;

type RGB = [number, number, number];
type Canvas = RGB[][];

function createEmptyCanvas(): Canvas {
  return Array(HEIGHT)
    .fill(null)
    .map(() =>
      Array(WIDTH)
        .fill(null)
        .map(() => [255, 255, 255] as RGB)
    );
}

// Bresenham's line algorithm
function drawLinePixels(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): [number, number][] {
  const pixels: [number, number][] = [];
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;
  let x = x1,
    y = y1;

  while (true) {
    if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
      pixels.push([x, y]);
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
  return pixels;
}

// Midpoint circle algorithm
function drawCirclePixels(
  cx: number,
  cy: number,
  r: number,
  filled: boolean
): [number, number][] {
  const pixels: [number, number][] = [];
  const addPixel = (x: number, y: number) => {
    if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
      pixels.push([x, y]);
    }
  };

  if (filled) {
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r) {
          addPixel(cx + x, cy + y);
        }
      }
    }
  } else {
    let x = 0,
      y = r;
    let d = 3 - 2 * r;
    while (y >= x) {
      addPixel(cx + x, cy + y);
      addPixel(cx - x, cy + y);
      addPixel(cx + x, cy - y);
      addPixel(cx - x, cy - y);
      addPixel(cx + y, cy + x);
      addPixel(cx - y, cy + x);
      addPixel(cx + y, cy - x);
      addPixel(cx - y, cy - x);
      x++;
      if (d > 0) {
        y--;
        d += 4 * (x - y) + 10;
      } else {
        d += 4 * x + 6;
      }
    }
  }
  return pixels;
}

function drawRectPixels(
  x: number,
  y: number,
  width: number,
  height: number,
  filled: boolean
): [number, number][] {
  const pixels: [number, number][] = [];
  const addPixel = (px: number, py: number) => {
    if (px >= 0 && px < WIDTH && py >= 0 && py < HEIGHT) {
      pixels.push([px, py]);
    }
  };

  if (filled) {
    for (let py = y; py < y + height; py++) {
      for (let px = x; px < x + width; px++) {
        addPixel(px, py);
      }
    }
  } else {
    for (let px = x; px < x + width; px++) {
      addPixel(px, y);
      addPixel(px, y + height - 1);
    }
    for (let py = y; py < y + height; py++) {
      addPixel(x, py);
      addPixel(x + width - 1, py);
    }
  }
  return pixels;
}

interface DrawCommand {
  type: "set_color" | "set_pixel" | "draw_line" | "draw_circle" | "draw_rect" | "fill" | "clear";
  params: Record<string, number | boolean>;
  delay?: number;
}

// Mona Lisa drawing commands
const monaLisaCommands: DrawCommand[] = [
  // Background - sky
  { type: "set_color", params: { r: 86, g: 125, b: 134 } },
  { type: "draw_rect", params: { x: 0, y: 0, width: 64, height: 30, filled: true } },

  // Background - landscape
  { type: "set_color", params: { r: 67, g: 82, b: 61 } },
  { type: "draw_rect", params: { x: 0, y: 30, width: 64, height: 34, filled: true } },

  // Hair left
  { type: "set_color", params: { r: 35, g: 25, b: 20 } },
  { type: "draw_rect", params: { x: 18, y: 12, width: 12, height: 42, filled: true } },

  // Hair right
  { type: "draw_rect", params: { x: 34, y: 12, width: 12, height: 42, filled: true } },

  // Hair top
  { type: "draw_rect", params: { x: 22, y: 10, width: 20, height: 8, filled: true } },

  // Face
  { type: "set_color", params: { r: 210, g: 180, b: 150 } },
  { type: "draw_circle", params: { cx: 32, cy: 28, r: 11, filled: true } },

  // Forehead highlight
  { type: "set_color", params: { r: 225, g: 195, b: 165 } },
  { type: "draw_circle", params: { cx: 32, cy: 22, r: 6, filled: true } },

  // Neck
  { type: "set_color", params: { r: 200, g: 170, b: 140 } },
  { type: "draw_rect", params: { x: 27, y: 38, width: 10, height: 10, filled: true } },

  // Eye whites
  { type: "set_color", params: { r: 245, g: 240, b: 235 } },
  { type: "draw_circle", params: { cx: 27, cy: 26, r: 3, filled: true } },
  { type: "draw_circle", params: { cx: 37, cy: 26, r: 3, filled: true } },

  // Irises
  { type: "set_color", params: { r: 70, g: 50, b: 40 } },
  { type: "draw_circle", params: { cx: 28, cy: 26, r: 2, filled: true } },
  { type: "draw_circle", params: { cx: 38, cy: 26, r: 2, filled: true } },

  // Pupils
  { type: "set_color", params: { r: 20, g: 15, b: 10 } },
  { type: "set_pixel", params: { x: 28, y: 26 } },
  { type: "set_pixel", params: { x: 38, y: 26 } },

  // Eye highlights
  { type: "set_color", params: { r: 255, g: 255, b: 255 } },
  { type: "set_pixel", params: { x: 27, y: 25 } },
  { type: "set_pixel", params: { x: 37, y: 25 } },

  // Eyebrows
  { type: "set_color", params: { r: 60, g: 45, b: 35 } },
  { type: "draw_line", params: { x1: 24, y1: 22, x2: 31, y2: 21 } },
  { type: "draw_line", params: { x1: 33, y1: 21, x2: 40, y2: 22 } },

  // Nose shadow
  { type: "set_color", params: { r: 180, g: 150, b: 120 } },
  { type: "draw_line", params: { x1: 32, y1: 27, x2: 32, y2: 32 } },
  { type: "draw_line", params: { x1: 33, y1: 28, x2: 33, y2: 31 } },

  // Nose tip
  { type: "set_color", params: { r: 195, g: 165, b: 135 } },
  { type: "draw_line", params: { x1: 30, y1: 32, x2: 34, y2: 32 } },

  // The famous smile!
  { type: "set_color", params: { r: 170, g: 110, b: 100 } },
  { type: "draw_line", params: { x1: 28, y1: 35, x2: 32, y2: 36 } },
  { type: "draw_line", params: { x1: 32, y1: 36, x2: 36, y2: 35 } },

  // Lips
  { type: "set_color", params: { r: 185, g: 130, b: 115 } },
  { type: "draw_line", params: { x1: 29, y1: 34, x2: 35, y2: 34 } },

  // Cheek blush
  { type: "set_color", params: { r: 215, g: 175, b: 155 } },
  { type: "draw_circle", params: { cx: 24, cy: 31, r: 2, filled: true } },
  { type: "draw_circle", params: { cx: 40, cy: 31, r: 2, filled: true } },

  // Dress
  { type: "set_color", params: { r: 45, g: 35, b: 30 } },
  { type: "draw_rect", params: { x: 18, y: 46, width: 28, height: 18, filled: true } },

  // Dress neckline
  { type: "set_color", params: { r: 195, g: 165, b: 135 } },
  { type: "draw_circle", params: { cx: 32, cy: 48, r: 6, filled: true } },

  // Hands
  { type: "set_color", params: { r: 200, g: 170, b: 140 } },
  { type: "draw_rect", params: { x: 14, y: 54, width: 10, height: 8, filled: true } },
  { type: "draw_rect", params: { x: 40, y: 54, width: 10, height: 8, filled: true } },

  // Hand details
  { type: "set_color", params: { r: 180, g: 150, b: 120 } },
  { type: "draw_line", params: { x1: 16, y1: 56, x2: 16, y2: 60 } },
  { type: "draw_line", params: { x1: 18, y1: 56, x2: 18, y2: 60 } },
  { type: "draw_line", params: { x1: 46, y1: 56, x2: 46, y2: 60 } },
  { type: "draw_line", params: { x1: 48, y1: 56, x2: 48, y2: 60 } },

  // Landscape details - winding path left
  { type: "set_color", params: { r: 90, g: 100, b: 80 } },
  { type: "draw_line", params: { x1: 0, y1: 35, x2: 10, y2: 42 } },
  { type: "draw_line", params: { x1: 0, y1: 38, x2: 8, y2: 45 } },
  { type: "draw_line", params: { x1: 10, y1: 42, x2: 5, y2: 50 } },

  // Landscape details - winding path right
  { type: "draw_line", params: { x1: 63, y1: 35, x2: 54, y2: 42 } },
  { type: "draw_line", params: { x1: 63, y1: 38, x2: 56, y2: 45 } },
  { type: "draw_line", params: { x1: 54, y1: 42, x2: 58, y2: 50 } },

  // Mountains in background
  { type: "set_color", params: { r: 75, g: 95, b: 85 } },
  { type: "draw_line", params: { x1: 0, y1: 32, x2: 8, y2: 25 } },
  { type: "draw_line", params: { x1: 8, y1: 25, x2: 15, y2: 30 } },
  { type: "draw_line", params: { x1: 49, y1: 30, x2: 56, y2: 25 } },
  { type: "draw_line", params: { x1: 56, y1: 25, x2: 63, y2: 32 } },

  // Chin shadow
  { type: "set_color", params: { r: 175, g: 145, b: 115 } },
  { type: "draw_line", params: { x1: 27, y1: 38, x2: 37, y2: 38 } },

  // Hair shine
  { type: "set_color", params: { r: 55, g: 40, b: 35 } },
  { type: "draw_line", params: { x1: 22, y1: 15, x2: 22, y2: 25 } },
  { type: "draw_line", params: { x1: 42, y1: 15, x2: 42, y2: 25 } },
];

export function PixelCanvas() {
  const [canvas, setCanvas] = useState<Canvas>(createEmptyCanvas);
  const [currentColor, setCurrentColor] = useState<RGB>([0, 0, 0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [commandIndex, setCommandIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const renderCanvas = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const [r, g, b] = canvas[y][x];
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
      }
    }
  }, [canvas]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const executeCommand = useCallback(
    (cmd: DrawCommand, currentCanvas: Canvas, color: RGB): { canvas: Canvas; color: RGB } => {
      const newCanvas = currentCanvas.map((row) => row.map((pixel) => [...pixel] as RGB));
      let newColor = color;

      const setPixel = (x: number, y: number) => {
        if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
          newCanvas[y][x] = [...newColor];
        }
      };

      switch (cmd.type) {
        case "set_color":
          newColor = [cmd.params.r as number, cmd.params.g as number, cmd.params.b as number];
          break;
        case "set_pixel":
          setPixel(cmd.params.x as number, cmd.params.y as number);
          break;
        case "draw_line":
          drawLinePixels(
            cmd.params.x1 as number,
            cmd.params.y1 as number,
            cmd.params.x2 as number,
            cmd.params.y2 as number
          ).forEach(([x, y]) => setPixel(x, y));
          break;
        case "draw_circle":
          drawCirclePixels(
            cmd.params.cx as number,
            cmd.params.cy as number,
            cmd.params.r as number,
            cmd.params.filled as boolean
          ).forEach(([x, y]) => setPixel(x, y));
          break;
        case "draw_rect":
          drawRectPixels(
            cmd.params.x as number,
            cmd.params.y as number,
            cmd.params.width as number,
            cmd.params.height as number,
            cmd.params.filled as boolean
          ).forEach(([x, y]) => setPixel(x, y));
          break;
        case "clear":
          return { canvas: createEmptyCanvas(), color: newColor };
      }

      return { canvas: newCanvas, color: newColor };
    },
    []
  );

  const drawMonaLisa = useCallback(async () => {
    setIsDrawing(true);
    setCommandIndex(0);

    let currentCanvas = createEmptyCanvas();
    let color: RGB = [0, 0, 0];

    setCanvas(currentCanvas);

    for (let i = 0; i < monaLisaCommands.length; i++) {
      const result = executeCommand(monaLisaCommands[i], currentCanvas, color);
      currentCanvas = result.canvas;
      color = result.color;

      setCanvas([...currentCanvas]);
      setCurrentColor(color);
      setCommandIndex(i + 1);

      // Delay between commands for animation effect
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    setIsDrawing(false);
  }, [executeCommand]);

  const clearCanvas = useCallback(() => {
    setCanvas(createEmptyCanvas());
    setCommandIndex(0);
  }, []);

  const downloadImage = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;

    const link = document.createElement("a");
    link.download = "mona-lisa-64x64.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Live Canvas (64×64)</span>
          <span className="text-sm font-normal text-zinc-500">
            {commandIndex}/{monaLisaCommands.length} commands
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden shadow-lg">
            <canvas
              ref={canvasRef}
              width={WIDTH * PIXEL_SIZE}
              height={HEIGHT * PIXEL_SIZE}
              className="block"
              style={{ imageRendering: "pixelated" }}
            />
          </div>

          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded border border-zinc-300 dark:border-zinc-700"
              style={{ backgroundColor: `rgb(${currentColor.join(",")})` }}
              title={`RGB(${currentColor.join(", ")})`}
            />
            <span className="text-sm text-zinc-500">Current Color</span>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={drawMonaLisa}
              disabled={isDrawing}
              className="bg-pink-600 hover:bg-pink-700"
            >
              <Play className="h-4 w-4 mr-2" />
              {isDrawing ? "Drawing..." : "Draw Mona Lisa"}
            </Button>
            <Button onClick={clearCanvas} variant="outline" disabled={isDrawing}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button onClick={downloadImage} variant="outline" disabled={isDrawing}>
              <Download className="h-4 w-4 mr-2" />
              Save PNG
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
