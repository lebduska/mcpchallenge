"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Settings, Terminal, Wifi, Bot } from "lucide-react";
import type { RoomInfo } from "./types";

interface RoomConfigProps {
  roomInfo: RoomInfo;
}

interface CopyButtonProps {
  text: string;
  type: string;
  copiedConfig: string | null;
  onCopy: (text: string, type: string) => void;
}

function CopyButton({ text, type, copiedConfig, onCopy }: CopyButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1"
      onClick={() => onCopy(text, type)}
    >
      {copiedConfig === type ? (
        <>
          <Check className="h-3 w-3" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          Copy
        </>
      )}
    </Button>
  );
}

export function RoomConfig({ roomInfo }: RoomConfigProps) {
  const [copiedConfig, setCopiedConfig] = useState<string | null>(null);

  const mcpBaseUrl = process.env.NEXT_PUBLIC_MCP_URL || "https://mcp.mcpchallenge.org";
  const mcpUrl = `${mcpBaseUrl}/${roomInfo.gameType}?room=${roomInfo.roomId}`;

  // Claude Desktop config
  const claudeConfig = {
    mcpServers: {
      [roomInfo.gameType]: {
        command: "npx",
        args: [
          "-y",
          "@anthropic/mcp-proxy",
          mcpUrl,
        ],
      },
    },
  };

  // Cursor config
  const cursorConfig = {
    mcp: {
      servers: {
        [roomInfo.gameType]: {
          url: mcpUrl,
          transport: "http",
        },
      },
    },
  };

  // Direct curl example
  const curlExample = `# List available tools
curl -X POST ${mcpUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool (e.g., new_game)
curl -X POST ${mcpUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"new_game","arguments":{}}}'`;

  // Auto-Identify snippet
  const autoIdentifySnippet = `// Call immediately after connecting to identify your agent:
await mcp.call("agent.identify", {
  sessionNonce: "${roomInfo.sessionNonce ?? "SESSION_NONCE"}",
  name: "YourAgent",
  model: "your-model-id",
  client: "YourClient",
  // Optional fields:
  strategy: "Description of your strategy",
  repo: "https://github.com/your/repo",
  envVars: ["SOME_VAR"],  // Names only, no values!
  share: "private"  // "private" | "unlisted" | "public"
});`;

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedConfig(type);
    setTimeout(() => setCopiedConfig(null), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-5 w-5" />
          MCP Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Room Info */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-zinc-500">Room ID:</span>
            <Badge variant="outline" className="font-mono">
              {roomInfo.roomId}
            </Badge>
            {roomInfo.sessionNonce && (
              <>
                <span className="text-zinc-500 ml-2">Session:</span>
                <Badge variant="outline" className="font-mono text-xs bg-purple-500/10 border-purple-500/30">
                  {roomInfo.sessionNonce.slice(0, 8)}...
                </Badge>
              </>
            )}
          </div>

          {/* Configuration Tabs */}
          <Tabs defaultValue="claude" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="claude">Claude</TabsTrigger>
              <TabsTrigger value="cursor">Cursor</TabsTrigger>
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="identify" className="gap-1">
                <Bot className="h-3 w-3" />
                Agent
              </TabsTrigger>
            </TabsList>

            {/* Claude Desktop */}
            <TabsContent value="claude" className="space-y-2">
              <p className="text-sm text-zinc-500">
                Add this to your <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">claude_desktop_config.json</code>:
              </p>
              <div className="relative">
                <pre className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-xs font-mono overflow-x-auto">
                  {JSON.stringify(claudeConfig, null, 2)}
                </pre>
                <div className="absolute top-2 right-2">
                  <CopyButton
                    text={JSON.stringify(claudeConfig, null, 2)}
                    type="claude"
                    copiedConfig={copiedConfig}
                    onCopy={copyToClipboard}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Cursor */}
            <TabsContent value="cursor" className="space-y-2">
              <p className="text-sm text-zinc-500">
                Add this to your Cursor MCP settings:
              </p>
              <div className="relative">
                <pre className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-xs font-mono overflow-x-auto">
                  {JSON.stringify(cursorConfig, null, 2)}
                </pre>
                <div className="absolute top-2 right-2">
                  <CopyButton
                    text={JSON.stringify(cursorConfig, null, 2)}
                    type="cursor"
                    copiedConfig={copiedConfig}
                    onCopy={copyToClipboard}
                  />
                </div>
              </div>
            </TabsContent>

            {/* cURL */}
            <TabsContent value="curl" className="space-y-2">
              <p className="text-sm text-zinc-500">
                Test the MCP server directly with cURL:
              </p>
              <div className="relative">
                <pre className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {curlExample}
                </pre>
                <div className="absolute top-2 right-2">
                  <CopyButton
                    text={curlExample}
                    type="curl"
                    copiedConfig={copiedConfig}
                    onCopy={copyToClipboard}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Agent Identify */}
            <TabsContent value="identify" className="space-y-2">
              <p className="text-sm text-zinc-500">
                Identify your agent to show its info on the board:
              </p>
              <div className="relative">
                <pre className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {autoIdentifySnippet}
                </pre>
                <div className="absolute top-2 right-2">
                  <CopyButton
                    text={autoIdentifySnippet}
                    type="identify"
                    copiedConfig={copiedConfig}
                    onCopy={copyToClipboard}
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                Call <code className="bg-zinc-800 px-1 rounded">agent.identify</code> once after connecting.
                The <code className="bg-zinc-800 px-1 rounded">sessionNonce</code> prevents spoofing.
              </p>
            </TabsContent>
          </Tabs>

          {/* Direct URL */}
          <div className="pt-2 border-t space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Terminal className="h-4 w-4 text-zinc-500" />
              <span className="text-zinc-500">MCP URL:</span>
              <code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-xs flex-1 overflow-x-auto">
                {mcpUrl}
              </code>
              <CopyButton
                text={mcpUrl}
                type="url"
                copiedConfig={copiedConfig}
                onCopy={copyToClipboard}
              />
            </div>
            {roomInfo.wsUrl && (
              <div className="flex items-center gap-2 text-sm">
                <Wifi className="h-4 w-4 text-purple-500" />
                <span className="text-zinc-500">WebSocket URL:</span>
                <code className="bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded text-xs flex-1 overflow-x-auto text-purple-700 dark:text-purple-300">
                  {roomInfo.wsUrl}
                </code>
                <CopyButton
                  text={roomInfo.wsUrl}
                  type="ws"
                  copiedConfig={copiedConfig}
                  onCopy={copyToClipboard}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
