"use client";

export const runtime = "edge";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Paintbrush, CheckCircle2, Copy } from "lucide-react";
import { MCPPlayground } from "@/components/playground/mcp-playground";
import { ChallengeCompletion } from "@/components/challenges";
import { PixelCanvas } from "@/components/canvas";
import { useState } from "react";

const completionSteps = [
  { id: "understand-canvas", title: "Understood the canvas coordinate system (64x64 pixels)" },
  { id: "implement-tools", title: "Implemented all drawing tools (set_pixel, draw_line, draw_circle, draw_rect, fill, clear)" },
  { id: "get-canvas", title: "Implemented get_canvas to return the current image state" },
  { id: "test-drawing", title: "Tested drawing basic shapes in the playground" },
  { id: "draw-art", title: "Created a recognizable drawing using the MCP tools" },
];

const canvasServerCode = `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const WIDTH = 64;
const HEIGHT = 64;

// Canvas state - 2D array of RGB colors
let canvas: [number, number, number][][] = [];
let currentColor: [number, number, number] = [0, 0, 0]; // Black

// Initialize canvas with white background
function initCanvas() {
  canvas = Array(HEIGHT).fill(null).map(() =>
    Array(WIDTH).fill(null).map(() => [255, 255, 255] as [number, number, number])
  );
}
initCanvas();

const server = new McpServer({
  name: "canvas-draw-server",
  version: "1.0.0",
});

// Set the current drawing color
server.tool(
  "set_color",
  "Set the current drawing color (RGB 0-255)",
  {
    r: z.number().min(0).max(255).describe("Red component"),
    g: z.number().min(0).max(255).describe("Green component"),
    b: z.number().min(0).max(255).describe("Blue component"),
  },
  async ({ r, g, b }) => {
    currentColor = [r, g, b];
    return {
      content: [{ type: "text", text: \`Color set to RGB(\${r}, \${g}, \${b})\` }],
    };
  }
);

// Set a single pixel
server.tool(
  "set_pixel",
  "Set a single pixel at (x, y) with the current color",
  {
    x: z.number().int().min(0).max(WIDTH - 1).describe("X coordinate"),
    y: z.number().int().min(0).max(HEIGHT - 1).describe("Y coordinate"),
  },
  async ({ x, y }) => {
    canvas[y][x] = [...currentColor];
    return {
      content: [{ type: "text", text: \`Pixel set at (\${x}, \${y})\` }],
    };
  }
);

// Draw a line using Bresenham's algorithm
server.tool(
  "draw_line",
  "Draw a line from (x1, y1) to (x2, y2)",
  {
    x1: z.number().int().describe("Start X"),
    y1: z.number().int().describe("Start Y"),
    x2: z.number().int().describe("End X"),
    y2: z.number().int().describe("End Y"),
  },
  async ({ x1, y1, x2, y2 }) => {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    let x = x1, y = y1;

    while (true) {
      if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
        canvas[y][x] = [...currentColor];
      }
      if (x === x2 && y === y2) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
    return {
      content: [{ type: "text", text: \`Line drawn from (\${x1}, \${y1}) to (\${x2}, \${y2})\` }],
    };
  }
);

// Draw a circle using midpoint algorithm
server.tool(
  "draw_circle",
  "Draw a circle with center (cx, cy) and radius r",
  {
    cx: z.number().int().describe("Center X"),
    cy: z.number().int().describe("Center Y"),
    r: z.number().int().min(1).describe("Radius"),
    filled: z.boolean().default(false).describe("Fill the circle"),
  },
  async ({ cx, cy, r, filled }) => {
    const setPixelSafe = (x: number, y: number) => {
      if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
        canvas[y][x] = [...currentColor];
      }
    };

    if (filled) {
      for (let y = -r; y <= r; y++) {
        for (let x = -r; x <= r; x++) {
          if (x * x + y * y <= r * r) {
            setPixelSafe(cx + x, cy + y);
          }
        }
      }
    } else {
      let x = 0, y = r;
      let d = 3 - 2 * r;
      while (y >= x) {
        setPixelSafe(cx + x, cy + y); setPixelSafe(cx - x, cy + y);
        setPixelSafe(cx + x, cy - y); setPixelSafe(cx - x, cy - y);
        setPixelSafe(cx + y, cy + x); setPixelSafe(cx - y, cy + x);
        setPixelSafe(cx + y, cy - x); setPixelSafe(cx - y, cy - x);
        x++;
        if (d > 0) { y--; d += 4 * (x - y) + 10; }
        else { d += 4 * x + 6; }
      }
    }
    return {
      content: [{ type: "text", text: \`Circle drawn at (\${cx}, \${cy}) with radius \${r}\` }],
    };
  }
);

// Draw a rectangle
server.tool(
  "draw_rect",
  "Draw a rectangle from (x, y) with given width and height",
  {
    x: z.number().int().describe("Top-left X"),
    y: z.number().int().describe("Top-left Y"),
    width: z.number().int().min(1).describe("Width"),
    height: z.number().int().min(1).describe("Height"),
    filled: z.boolean().default(false).describe("Fill the rectangle"),
  },
  async ({ x, y, width, height, filled }) => {
    const setPixelSafe = (px: number, py: number) => {
      if (px >= 0 && px < WIDTH && py >= 0 && py < HEIGHT) {
        canvas[py][px] = [...currentColor];
      }
    };

    if (filled) {
      for (let py = y; py < y + height; py++) {
        for (let px = x; px < x + width; px++) {
          setPixelSafe(px, py);
        }
      }
    } else {
      for (let px = x; px < x + width; px++) {
        setPixelSafe(px, y);
        setPixelSafe(px, y + height - 1);
      }
      for (let py = y; py < y + height; py++) {
        setPixelSafe(x, py);
        setPixelSafe(x + width - 1, py);
      }
    }
    return {
      content: [{ type: "text", text: \`Rectangle drawn at (\${x}, \${y}) size \${width}x\${height}\` }],
    };
  }
);

// Flood fill
server.tool(
  "fill",
  "Flood fill starting at (x, y) with current color",
  {
    x: z.number().int().min(0).max(WIDTH - 1).describe("Start X"),
    y: z.number().int().min(0).max(HEIGHT - 1).describe("Start Y"),
  },
  async ({ x, y }) => {
    const targetColor = canvas[y][x];
    if (targetColor[0] === currentColor[0] &&
        targetColor[1] === currentColor[1] &&
        targetColor[2] === currentColor[2]) {
      return { content: [{ type: "text", text: "Target color same as fill color" }] };
    }

    const stack: [number, number][] = [[x, y]];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const [cx, cy] = stack.pop()!;
      const key = \`\${cx},\${cy}\`;
      if (visited.has(key)) continue;
      if (cx < 0 || cx >= WIDTH || cy < 0 || cy >= HEIGHT) continue;

      const pixel = canvas[cy][cx];
      if (pixel[0] !== targetColor[0] || pixel[1] !== targetColor[1] || pixel[2] !== targetColor[2]) continue;

      visited.add(key);
      canvas[cy][cx] = [...currentColor];
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    return {
      content: [{ type: "text", text: \`Filled \${visited.size} pixels starting at (\${x}, \${y})\` }],
    };
  }
);

// Clear the canvas
server.tool(
  "clear",
  "Clear the canvas to white",
  {},
  async () => {
    initCanvas();
    return {
      content: [{ type: "text", text: "Canvas cleared" }],
    };
  }
);

// Get canvas as base64 PNG (simplified - returns pixel data)
server.tool(
  "get_canvas",
  "Get the current canvas as a grid of pixel colors",
  {},
  async () => {
    // Return simplified representation
    const rows = canvas.map((row, y) =>
      row.map((pixel, x) =>
        \`\${pixel[0].toString(16).padStart(2, '0')}\${pixel[1].toString(16).padStart(2, '0')}\${pixel[2].toString(16).padStart(2, '0')}\`
      ).join('')
    );
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ width: WIDTH, height: HEIGHT, pixels: rows })
      }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);`;

export default function CanvasDrawChallengePage() {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(canvasServerCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/challenges"
            className="inline-flex items-center text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Challenges
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Paintbrush className="h-8 w-8 text-pink-500" />
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Canvas Drawing Server
            </h1>
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
              Build Server
            </Badge>
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
              Intermediate
            </Badge>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Build an MCP server with canvas drawing primitives. Then challenge an AI to draw the Mona Lisa!
          </p>
        </div>

        {/* Learning Goals */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What You&apos;ll Learn</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
              <li>• Managing stateful server data (the canvas pixel array)</li>
              <li>• Implementing drawing algorithms (Bresenham&apos;s line, midpoint circle)</li>
              <li>• Complex tool interactions (set_color affects subsequent draws)</li>
              <li>• Returning structured data (canvas state as JSON)</li>
            </ul>
          </CardContent>
        </Card>

        {/* Tool Specification */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Required Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                <code className="text-pink-600 dark:text-pink-400 font-bold">set_color</code>
                <p className="text-zinc-600 dark:text-zinc-400 mt-1">Set RGB color (0-255 each)</p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                <code className="text-pink-600 dark:text-pink-400 font-bold">set_pixel</code>
                <p className="text-zinc-600 dark:text-zinc-400 mt-1">Draw single pixel at (x, y)</p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                <code className="text-pink-600 dark:text-pink-400 font-bold">draw_line</code>
                <p className="text-zinc-600 dark:text-zinc-400 mt-1">Line from (x1,y1) to (x2,y2)</p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                <code className="text-pink-600 dark:text-pink-400 font-bold">draw_circle</code>
                <p className="text-zinc-600 dark:text-zinc-400 mt-1">Circle at (cx, cy) with radius r</p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                <code className="text-pink-600 dark:text-pink-400 font-bold">draw_rect</code>
                <p className="text-zinc-600 dark:text-zinc-400 mt-1">Rectangle at (x, y) with size</p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                <code className="text-pink-600 dark:text-pink-400 font-bold">fill</code>
                <p className="text-zinc-600 dark:text-zinc-400 mt-1">Flood fill from (x, y)</p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                <code className="text-pink-600 dark:text-pink-400 font-bold">clear</code>
                <p className="text-zinc-600 dark:text-zinc-400 mt-1">Reset canvas to white</p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                <code className="text-pink-600 dark:text-pink-400 font-bold">get_canvas</code>
                <p className="text-zinc-600 dark:text-zinc-400 mt-1">Return current pixel data</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Canvas Demo */}
        <div className="mb-6">
          <PixelCanvas />
        </div>

        {/* Canvas Info */}
        <Card className="mb-6 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-600 dark:text-blue-400">
              Canvas Specification
            </CardTitle>
          </CardHeader>
          <CardContent className="text-zinc-600 dark:text-zinc-400">
            <ul className="space-y-2">
              <li>• <strong>Size:</strong> 64 x 64 pixels</li>
              <li>• <strong>Coordinates:</strong> (0,0) is top-left, (63,63) is bottom-right</li>
              <li>• <strong>Colors:</strong> RGB format, each component 0-255</li>
              <li>• <strong>Default:</strong> White background (255, 255, 255)</li>
            </ul>
          </CardContent>
        </Card>

        {/* Playground */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Canvas Draw MCP Server
              <button
                onClick={copyCode}
                className="text-sm px-3 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center gap-1"
              >
                {copied ? (
                  <><CheckCircle2 className="h-4 w-4 text-green-500" /> Copied!</>
                ) : (
                  <><Copy className="h-4 w-4" /> Copy</>
                )}
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MCPPlayground
              initialCode={canvasServerCode}
              height="600px"
              showToolTester={true}
              title="Canvas Server"
              description="Pixel art drawing tools"
            />
          </CardContent>
        </Card>

        {/* The Challenge */}
        <Card className="mb-6 border-pink-200 dark:border-pink-800 bg-gradient-to-br from-pink-50 to-amber-50 dark:from-pink-950 dark:to-amber-950">
          <CardHeader>
            <CardTitle className="text-pink-600 dark:text-pink-400 flex items-center gap-2">
              <span className="text-2xl">🎨</span> The Ultimate Challenge: Draw Mona Lisa
            </CardTitle>
          </CardHeader>
          <CardContent className="text-zinc-700 dark:text-zinc-300">
            <p className="mb-4">
              Once your server is working, connect it to Claude or another AI and give it this prompt:
            </p>
            <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-pink-200 dark:border-pink-800 font-mono text-sm mb-4">
              &quot;Using only the canvas drawing tools available, create the best possible
              representation of the Mona Lisa on a 64x64 pixel canvas. Be creative with
              the limited resolution!&quot;
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Tip: At 64x64 pixels, focus on the iconic elements - her face shape,
              mysterious smile, dark hair, and the famous pose.
            </p>
          </CardContent>
        </Card>

        {/* Bonus */}
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="text-amber-600 dark:text-amber-400">
              Bonus Extensions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-zinc-600 dark:text-zinc-400">
            <ul className="space-y-2">
              <li>• <code className="px-1 bg-zinc-100 dark:bg-zinc-800 rounded">draw_ellipse</code> - For more natural shapes</li>
              <li>• <code className="px-1 bg-zinc-100 dark:bg-zinc-800 rounded">draw_bezier</code> - Smooth curves</li>
              <li>• <code className="px-1 bg-zinc-100 dark:bg-zinc-800 rounded">undo</code> - Revert last operation</li>
              <li>• <code className="px-1 bg-zinc-100 dark:bg-zinc-800 rounded">export_png</code> - Save as actual image file</li>
            </ul>
          </CardContent>
        </Card>

        {/* Progress Tracking */}
        <ChallengeCompletion
          challengeId="canvas-draw"
          steps={completionSteps}
        />
      </div>
    </div>
  );
}
