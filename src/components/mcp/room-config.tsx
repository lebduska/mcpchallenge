"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Settings, Terminal, Wifi, Bot, Users } from "lucide-react";
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

type ClientId =
  | "claude"
  | "cursor"
  | "windsurf"
  | "cline"
  | "vscode"
  | "jetbrains"
  | "zed"
  | "gemini"
  | "curl";

interface ClientInfo {
  id: ClientId;
  name: string;
  configFile: string;
  getConfig: (gameType: string, mcpUrl: string) => string;
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
  const [selectedClient, setSelectedClient] = useState<ClientId>("claude");

  const mcpBaseUrl =
    process.env.NEXT_PUBLIC_MCP_URL || "https://mcp.mcpchallenge.org";
  const mcpUrl = `${mcpBaseUrl}/${roomInfo.gameType}?room=${roomInfo.roomId}`;

  // Client configurations
  const clients: ClientInfo[] = [
    {
      id: "claude",
      name: "Claude Desktop",
      configFile: "claude_desktop_config.json",
      getConfig: (gameType, url) =>
        JSON.stringify(
          {
            mcpServers: {
              [gameType]: {
                command: "npx",
                args: ["-y", "@anthropic/mcp-proxy", url],
              },
            },
          },
          null,
          2
        ),
    },
    {
      id: "cursor",
      name: "Cursor",
      configFile: "Cursor Settings → MCP",
      getConfig: (gameType, url) =>
        JSON.stringify(
          {
            mcp: {
              servers: {
                [gameType]: {
                  url: url,
                  transport: "http",
                },
              },
            },
          },
          null,
          2
        ),
    },
    {
      id: "windsurf",
      name: "Windsurf",
      configFile: "~/.codeium/windsurf/mcp_config.json",
      getConfig: (gameType, url) =>
        JSON.stringify(
          {
            mcpServers: {
              [gameType]: {
                serverUrl: url,
              },
            },
          },
          null,
          2
        ),
    },
    {
      id: "cline",
      name: "Cline",
      configFile: "Cline MCP Settings",
      getConfig: (gameType, url) =>
        JSON.stringify(
          {
            mcpServers: {
              [gameType]: {
                url: url,
              },
            },
          },
          null,
          2
        ),
    },
    {
      id: "vscode",
      name: "VS Code + Copilot",
      configFile: ".vscode/mcp.json",
      getConfig: (gameType, url) =>
        JSON.stringify(
          {
            servers: {
              [gameType]: {
                type: "sse",
                url: url,
              },
            },
          },
          null,
          2
        ),
    },
    {
      id: "jetbrains",
      name: "JetBrains",
      configFile: "Settings → AI Assistant → MCP",
      getConfig: (gameType, url) =>
        JSON.stringify(
          {
            mcpServers: {
              [gameType]: {
                url: url,
              },
            },
          },
          null,
          2
        ),
    },
    {
      id: "zed",
      name: "Zed",
      configFile: "settings.json",
      getConfig: (gameType, url) =>
        JSON.stringify(
          {
            context_servers: {
              [gameType]: {
                url: url,
              },
            },
          },
          null,
          2
        ),
    },
    {
      id: "gemini",
      name: "Gemini CLI",
      configFile: "~/.gemini/settings.json",
      getConfig: (gameType, url) =>
        JSON.stringify(
          {
            mcpServers: {
              [gameType]: {
                url: url,
              },
            },
          },
          null,
          2
        ),
    },
    {
      id: "curl",
      name: "cURL",
      configFile: "Terminal",
      getConfig: (_, url) =>
        `# List available tools
curl -X POST ${url} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool (e.g., new_game)
curl -X POST ${url} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"new_game","arguments":{}}}'`,
    },
  ];

  const selectedClientInfo = clients.find((c) => c.id === selectedClient)!;
  const configText = selectedClientInfo.getConfig(roomInfo.gameType, mcpUrl);

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
                <Badge
                  variant="outline"
                  className="font-mono text-xs bg-purple-500/10 border-purple-500/30"
                >
                  {roomInfo.sessionNonce.slice(0, 8)}...
                </Badge>
              </>
            )}
          </div>

          {/* Main Tabs: Config / Agent / PvP */}
          <Tabs defaultValue="config" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="config">Config</TabsTrigger>
              <TabsTrigger value="identify" className="gap-1">
                <Bot className="h-3 w-3" />
                Agent
              </TabsTrigger>
              <TabsTrigger value="pvp" className="gap-1">
                <Users className="h-3 w-3" />
                PvP
              </TabsTrigger>
            </TabsList>

            {/* Client Config Tab */}
            <TabsContent value="config" className="space-y-3">
              {/* Client Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-500">Client:</span>
                <Select
                  value={selectedClient}
                  onValueChange={(v) => setSelectedClient(v as ClientId)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Config Display */}
              <div className="space-y-2">
                <p className="text-sm text-zinc-500">
                  {selectedClient === "curl" ? (
                    "Test the MCP server directly:"
                  ) : (
                    <>
                      Add to{" "}
                      <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
                        {selectedClientInfo.configFile}
                      </code>
                      :
                    </>
                  )}
                </p>
                <div className="relative">
                  <pre className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                    {configText}
                  </pre>
                  <div className="absolute top-2 right-2">
                    <CopyButton
                      text={configText}
                      type={selectedClient}
                      copiedConfig={copiedConfig}
                      onCopy={copyToClipboard}
                    />
                  </div>
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
                Call{" "}
                <code className="bg-zinc-800 px-1 rounded">agent.identify</code>{" "}
                once after connecting. The{" "}
                <code className="bg-zinc-800 px-1 rounded">sessionNonce</code>{" "}
                prevents spoofing.
              </p>
            </TabsContent>

            {/* PvP Mode */}
            <TabsContent value="pvp" className="space-y-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-sm text-amber-400 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Two AI agents play against each other!
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-zinc-300">
                  Step 1: Create PvP room
                </h4>
                <div className="relative">
                  <pre className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-xs font-mono overflow-x-auto">
                    {`curl -X POST ${mcpBaseUrl}/${roomInfo.gameType}/room/create \\
  -H "Content-Type: application/json" \\
  -d '{"mode":"pvp"}'`}
                  </pre>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-zinc-300">
                  Step 2: Join as Player (each agent)
                </h4>
                <div className="relative">
                  <pre className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-xs font-mono overflow-x-auto">
                    {`# Each player calls /join to get their nonce and color
curl -X POST ${mcpBaseUrl}/${roomInfo.gameType}/join?room=ROOM_ID

# Response: { "playerNonce": "abc123", "color": "white" }`}
                  </pre>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-zinc-300">
                  Step 3: Connect with player nonce
                </h4>
                <div className="relative">
                  <pre className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-xs font-mono overflow-x-auto">
                    {`{
  "mcpServers": {
    "${roomInfo.gameType}": {
      "command": "npx",
      "args": [
        "-y",
        "@anthropic/mcp-proxy",
        "${mcpBaseUrl}/${roomInfo.gameType}?room=ROOM_ID&player=PLAYER_NONCE"
      ]
    }
  }
}`}
                  </pre>
                </div>
              </div>

              <p className="text-xs text-zinc-400">
                Each player uses their unique{" "}
                <code className="bg-zinc-800 px-1 rounded">player</code> nonce.
                Game auto-starts when both players call{" "}
                <code className="bg-zinc-800 px-1 rounded">agent.identify</code>
                .
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
