"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Trash2, Download, Upload, Check, Loader2, ExternalLink } from "lucide-react";

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

// Mona Lisa drawing commands - Enhanced version with sfumato effect
const monaLisaCommands: DrawCommand[] = [
  // ============ BACKGROUND - Sfumato landscape ============
  // Sky gradient (top to bottom)
  { type: "set_color", params: { r: 82, g: 107, b: 115 } },
  { type: "draw_rect", params: { x: 0, y: 0, width: 64, height: 8, filled: true } },
  { type: "set_color", params: { r: 86, g: 115, b: 120 } },
  { type: "draw_rect", params: { x: 0, y: 8, width: 64, height: 8, filled: true } },
  { type: "set_color", params: { r: 90, g: 120, b: 118 } },
  { type: "draw_rect", params: { x: 0, y: 16, width: 64, height: 8, filled: true } },
  { type: "set_color", params: { r: 85, g: 110, b: 105 } },
  { type: "draw_rect", params: { x: 0, y: 24, width: 64, height: 8, filled: true } },

  // Distant mountains (hazy)
  { type: "set_color", params: { r: 95, g: 115, b: 110 } },
  { type: "draw_line", params: { x1: 0, y1: 22, x2: 12, y2: 15 } },
  { type: "draw_line", params: { x1: 12, y1: 15, x2: 20, y2: 20 } },
  { type: "draw_line", params: { x1: 44, y1: 20, x2: 52, y2: 14 } },
  { type: "draw_line", params: { x1: 52, y1: 14, x2: 63, y2: 22 } },

  // Landscape layers
  { type: "set_color", params: { r: 75, g: 95, b: 80 } },
  { type: "draw_rect", params: { x: 0, y: 28, width: 64, height: 10, filled: true } },
  { type: "set_color", params: { r: 65, g: 82, b: 68 } },
  { type: "draw_rect", params: { x: 0, y: 38, width: 64, height: 10, filled: true } },
  { type: "set_color", params: { r: 55, g: 70, b: 58 } },
  { type: "draw_rect", params: { x: 0, y: 48, width: 64, height: 16, filled: true } },

  // Winding river/path left
  { type: "set_color", params: { r: 100, g: 120, b: 110 } },
  { type: "draw_line", params: { x1: 0, y1: 30, x2: 8, y2: 38 } },
  { type: "draw_line", params: { x1: 8, y1: 38, x2: 3, y2: 48 } },
  { type: "draw_line", params: { x1: 3, y1: 48, x2: 10, y2: 60 } },
  { type: "set_color", params: { r: 90, g: 110, b: 100 } },
  { type: "draw_line", params: { x1: 1, y1: 31, x2: 9, y2: 39 } },

  // Winding river/path right
  { type: "set_color", params: { r: 100, g: 120, b: 110 } },
  { type: "draw_line", params: { x1: 63, y1: 30, x2: 56, y2: 38 } },
  { type: "draw_line", params: { x1: 56, y1: 38, x2: 60, y2: 48 } },
  { type: "draw_line", params: { x1: 60, y1: 48, x2: 54, y2: 60 } },

  // Bridge on right
  { type: "set_color", params: { r: 80, g: 90, b: 75 } },
  { type: "draw_line", params: { x1: 50, y1: 32, x2: 58, y2: 32 } },
  { type: "draw_line", params: { x1: 52, y1: 33, x2: 56, y2: 33 } },

  // ============ PARAPET / BALUSTRADE ============
  { type: "set_color", params: { r: 90, g: 80, b: 70 } },
  { type: "draw_rect", params: { x: 0, y: 50, width: 18, height: 14, filled: true } },
  { type: "draw_rect", params: { x: 46, y: 50, width: 18, height: 14, filled: true } },
  { type: "set_color", params: { r: 100, g: 90, b: 80 } },
  { type: "draw_line", params: { x1: 0, y1: 50, x2: 18, y2: 50 } },
  { type: "draw_line", params: { x1: 46, y1: 50, x2: 63, y2: 50 } },

  // Column hints
  { type: "set_color", params: { r: 110, g: 100, b: 90 } },
  { type: "draw_line", params: { x1: 5, y1: 50, x2: 5, y2: 64 } },
  { type: "draw_line", params: { x1: 58, y1: 50, x2: 58, y2: 64 } },

  // ============ HAIR - Dark with auburn highlights ============
  // Base hair color
  { type: "set_color", params: { r: 28, g: 20, b: 15 } },
  { type: "draw_rect", params: { x: 17, y: 8, width: 30, height: 48, filled: true } },

  // Hair curves left
  { type: "draw_circle", params: { cx: 17, cy: 32, r: 8, filled: true } },
  { type: "draw_circle", params: { cx: 15, cy: 45, r: 6, filled: true } },

  // Hair curves right
  { type: "draw_circle", params: { cx: 47, cy: 32, r: 8, filled: true } },
  { type: "draw_circle", params: { cx: 49, cy: 45, r: 6, filled: true } },

  // Hair top volume
  { type: "draw_circle", params: { cx: 32, cy: 10, r: 12, filled: true } },

  // Hair texture/waves
  { type: "set_color", params: { r: 38, g: 28, b: 22 } },
  { type: "draw_line", params: { x1: 20, y1: 15, x2: 18, y2: 35 } },
  { type: "draw_line", params: { x1: 23, y1: 12, x2: 20, y2: 40 } },
  { type: "draw_line", params: { x1: 44, y1: 15, x2: 46, y2: 35 } },
  { type: "draw_line", params: { x1: 41, y1: 12, x2: 44, y2: 40 } },

  // Hair highlights
  { type: "set_color", params: { r: 50, g: 38, b: 30 } },
  { type: "draw_line", params: { x1: 25, y1: 14, x2: 24, y2: 30 } },
  { type: "draw_line", params: { x1: 39, y1: 14, x2: 40, y2: 30 } },

  // Veil (sheer fabric on hair)
  { type: "set_color", params: { r: 35, g: 28, b: 24 } },
  { type: "draw_line", params: { x1: 22, y1: 8, x2: 42, y2: 8 } },
  { type: "draw_line", params: { x1: 21, y1: 9, x2: 43, y2: 9 } },
  { type: "draw_line", params: { x1: 20, y1: 10, x2: 44, y2: 10 } },

  // ============ FACE - Soft sfumato shading ============
  // Face base
  { type: "set_color", params: { r: 205, g: 175, b: 145 } },
  { type: "draw_circle", params: { cx: 32, cy: 28, r: 12, filled: true } },

  // Forehead
  { type: "set_color", params: { r: 215, g: 185, b: 155 } },
  { type: "draw_circle", params: { cx: 32, cy: 20, r: 9, filled: true } },

  // Forehead highlight
  { type: "set_color", params: { r: 225, g: 198, b: 170 } },
  { type: "draw_circle", params: { cx: 32, cy: 18, r: 5, filled: true } },

  // Cheeks
  { type: "set_color", params: { r: 210, g: 175, b: 150 } },
  { type: "draw_circle", params: { cx: 25, cy: 30, r: 5, filled: true } },
  { type: "draw_circle", params: { cx: 39, cy: 30, r: 5, filled: true } },

  // Jaw/chin
  { type: "set_color", params: { r: 200, g: 168, b: 140 } },
  { type: "draw_circle", params: { cx: 32, cy: 38, r: 6, filled: true } },

  // Face shadow left
  { type: "set_color", params: { r: 185, g: 155, b: 125 } },
  { type: "draw_circle", params: { cx: 22, cy: 28, r: 4, filled: true } },

  // Neck
  { type: "set_color", params: { r: 195, g: 165, b: 138 } },
  { type: "draw_rect", params: { x: 26, y: 40, width: 12, height: 12, filled: true } },

  // Neck shadow
  { type: "set_color", params: { r: 175, g: 145, b: 118 } },
  { type: "draw_rect", params: { x: 26, y: 44, width: 5, height: 8, filled: true } },

  // ============ EYES - The mysterious gaze ============
  // Eye sockets shadow
  { type: "set_color", params: { r: 180, g: 150, b: 125 } },
  { type: "draw_circle", params: { cx: 27, cy: 25, r: 4, filled: true } },
  { type: "draw_circle", params: { cx: 37, cy: 25, r: 4, filled: true } },

  // Eye whites
  { type: "set_color", params: { r: 240, g: 235, b: 228 } },
  { type: "draw_rect", params: { x: 24, y: 24, width: 6, height: 3, filled: true } },
  { type: "draw_rect", params: { x: 34, y: 24, width: 6, height: 3, filled: true } },

  // Irises
  { type: "set_color", params: { r: 65, g: 50, b: 40 } },
  { type: "draw_circle", params: { cx: 27, cy: 25, r: 2, filled: true } },
  { type: "draw_circle", params: { cx: 37, cy: 25, r: 2, filled: true } },

  // Pupils
  { type: "set_color", params: { r: 15, g: 10, b: 8 } },
  { type: "set_pixel", params: { x: 27, y: 25 } },
  { type: "set_pixel", params: { x: 28, y: 25 } },
  { type: "set_pixel", params: { x: 37, y: 25 } },
  { type: "set_pixel", params: { x: 38, y: 25 } },

  // Eye highlights
  { type: "set_color", params: { r: 255, g: 255, b: 255 } },
  { type: "set_pixel", params: { x: 26, y: 24 } },
  { type: "set_pixel", params: { x: 36, y: 24 } },

  // Upper eyelids
  { type: "set_color", params: { r: 140, g: 110, b: 90 } },
  { type: "draw_line", params: { x1: 23, y1: 23, x2: 30, y2: 23 } },
  { type: "draw_line", params: { x1: 34, y1: 23, x2: 41, y2: 23 } },

  // Lower eyelids
  { type: "set_color", params: { r: 175, g: 148, b: 125 } },
  { type: "draw_line", params: { x1: 24, y1: 27, x2: 30, y2: 27 } },
  { type: "draw_line", params: { x1: 34, y1: 27, x2: 40, y2: 27 } },

  // Eyebrows (subtle, she had thin brows)
  { type: "set_color", params: { r: 120, g: 95, b: 75 } },
  { type: "draw_line", params: { x1: 23, y1: 20, x2: 30, y2: 19 } },
  { type: "draw_line", params: { x1: 34, y1: 19, x2: 41, y2: 20 } },

  // ============ NOSE ============
  { type: "set_color", params: { r: 190, g: 160, b: 132 } },
  { type: "draw_line", params: { x1: 32, y1: 26, x2: 32, y2: 33 } },
  { type: "set_color", params: { r: 180, g: 150, b: 122 } },
  { type: "draw_line", params: { x1: 33, y1: 27, x2: 33, y2: 32 } },

  // Nose tip highlight
  { type: "set_color", params: { r: 210, g: 180, b: 152 } },
  { type: "set_pixel", params: { x: 31, y: 32 } },

  // Nostrils hint
  { type: "set_color", params: { r: 160, g: 130, b: 105 } },
  { type: "set_pixel", params: { x: 30, y: 33 } },
  { type: "set_pixel", params: { x: 34, y: 33 } },

  // ============ THE FAMOUS SMILE ============
  // Upper lip
  { type: "set_color", params: { r: 175, g: 130, b: 115 } },
  { type: "draw_line", params: { x1: 28, y1: 36, x2: 32, y2: 35 } },
  { type: "draw_line", params: { x1: 32, y1: 35, x2: 36, y2: 36 } },

  // The subtle smile curve
  { type: "set_color", params: { r: 165, g: 115, b: 100 } },
  { type: "draw_line", params: { x1: 29, y1: 37, x2: 32, y2: 38 } },
  { type: "draw_line", params: { x1: 32, y1: 38, x2: 35, y2: 37 } },

  // Lip shadow/depth
  { type: "set_color", params: { r: 145, g: 100, b: 85 } },
  { type: "set_pixel", params: { x: 32, y: 36 } },

  // Corner shadows (the enigmatic part!)
  { type: "set_color", params: { r: 175, g: 145, b: 125 } },
  { type: "set_pixel", params: { x: 27, y: 37 } },
  { type: "set_pixel", params: { x: 37, y: 37 } },

  // Lower lip highlight
  { type: "set_color", params: { r: 195, g: 155, b: 140 } },
  { type: "set_pixel", params: { x: 31, y: 37 } },
  { type: "set_pixel", params: { x: 33, y: 37 } },

  // ============ DRESS ============
  // Dark dress base
  { type: "set_color", params: { r: 35, g: 30, b: 25 } },
  { type: "draw_rect", params: { x: 18, y: 48, width: 28, height: 16, filled: true } },

  // Dress folds
  { type: "set_color", params: { r: 45, g: 38, b: 32 } },
  { type: "draw_line", params: { x1: 22, y1: 50, x2: 24, y2: 64 } },
  { type: "draw_line", params: { x1: 40, y1: 50, x2: 42, y2: 64 } },
  { type: "draw_line", params: { x1: 32, y1: 52, x2: 32, y2: 64 } },

  // Neckline
  { type: "set_color", params: { r: 55, g: 45, b: 38 } },
  { type: "draw_line", params: { x1: 24, y1: 48, x2: 32, y2: 52 } },
  { type: "draw_line", params: { x1: 32, y1: 52, x2: 40, y2: 48 } },

  // Chest/décolletage
  { type: "set_color", params: { r: 200, g: 170, b: 142 } },
  { type: "draw_circle", params: { cx: 32, cy: 50, r: 5, filled: true } },

  // Gold trim hint
  { type: "set_color", params: { r: 120, g: 100, b: 60 } },
  { type: "draw_line", params: { x1: 25, y1: 48, x2: 32, y2: 51 } },
  { type: "draw_line", params: { x1: 32, y1: 51, x2: 39, y2: 48 } },

  // ============ HANDS ============
  // Right hand (viewer's left)
  { type: "set_color", params: { r: 195, g: 165, b: 138 } },
  { type: "draw_rect", params: { x: 18, y: 55, width: 10, height: 7, filled: true } },
  { type: "draw_circle", params: { cx: 23, cy: 58, r: 4, filled: true } },

  // Left hand (viewer's right)
  { type: "draw_rect", params: { x: 36, y: 55, width: 10, height: 7, filled: true } },
  { type: "draw_circle", params: { cx: 41, cy: 58, r: 4, filled: true } },

  // Finger details
  { type: "set_color", params: { r: 175, g: 145, b: 120 } },
  { type: "draw_line", params: { x1: 20, y1: 57, x2: 20, y2: 61 } },
  { type: "draw_line", params: { x1: 22, y1: 56, x2: 22, y2: 61 } },
  { type: "draw_line", params: { x1: 24, y1: 56, x2: 24, y2: 61 } },
  { type: "draw_line", params: { x1: 39, y1: 57, x2: 39, y2: 61 } },
  { type: "draw_line", params: { x1: 41, y1: 56, x2: 41, y2: 61 } },
  { type: "draw_line", params: { x1: 43, y1: 56, x2: 43, y2: 61 } },

  // Wrist/sleeve
  { type: "set_color", params: { r: 50, g: 42, b: 35 } },
  { type: "draw_line", params: { x1: 18, y1: 55, x2: 28, y2: 55 } },
  { type: "draw_line", params: { x1: 36, y1: 55, x2: 46, y2: 55 } },

  // ============ FINAL DETAILS ============
  // Face contour softening
  { type: "set_color", params: { r: 195, g: 165, b: 140 } },
  { type: "draw_line", params: { x1: 20, y1: 25, x2: 20, y2: 35 } },
  { type: "draw_line", params: { x1: 44, y1: 25, x2: 44, y2: 35 } },

  // Chin definition
  { type: "set_color", params: { r: 180, g: 150, b: 125 } },
  { type: "draw_line", params: { x1: 27, y1: 40, x2: 37, y2: 40 } },

  // Hair frame around face
  { type: "set_color", params: { r: 32, g: 24, b: 18 } },
  { type: "draw_line", params: { x1: 19, y1: 18, x2: 21, y2: 38 } },
  { type: "draw_line", params: { x1: 45, y1: 18, x2: 43, y2: 38 } },

  // Subtle cheek blush
  { type: "set_color", params: { r: 215, g: 175, b: 155 } },
  { type: "set_pixel", params: { x: 25, y: 32 } },
  { type: "set_pixel", params: { x: 39, y: 32 } },
];

export function PixelCanvas() {
  const [canvas, setCanvas] = useState<Canvas>(createEmptyCanvas);
  const [currentColor, setCurrentColor] = useState<RGB>([0, 0, 0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [commandIndex, setCommandIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
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

  const uploadToGallery = useCallback(async () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;

    setIsUploading(true);
    setUploadedUrl(null);

    try {
      const dataUrl = canvasRef.current.toDataURL("image/png");

      const response = await fetch("/api/gallery/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: "canvas-draw",
          imageData: dataUrl,
          title: "Mona Lisa",
        }),
      });

      const data = (await response.json()) as { shareUrl?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadedUrl(data.shareUrl || null);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
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

          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              onClick={drawMonaLisa}
              disabled={isDrawing || isUploading}
              className="bg-pink-600 hover:bg-pink-700"
            >
              <Play className="h-4 w-4 mr-2" />
              {isDrawing ? "Drawing..." : "Draw Mona Lisa"}
            </Button>
            <Button onClick={clearCanvas} variant="outline" disabled={isDrawing || isUploading}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button onClick={downloadImage} variant="outline" disabled={isDrawing || isUploading}>
              <Download className="h-4 w-4 mr-2" />
              Save PNG
            </Button>
            <Button
              onClick={uploadToGallery}
              variant="outline"
              disabled={isDrawing || isUploading}
              className={uploadedUrl ? "border-green-500 text-green-500" : ""}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : uploadedUrl ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {isUploading ? "Saving..." : uploadedUrl ? "Saved!" : "Save to Gallery"}
            </Button>
            {uploadedUrl && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(uploadedUrl, "_blank")}
                title="Open in gallery"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
