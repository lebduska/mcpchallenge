// MCP Protocol Server Implementation
// Pure JSON-RPC 2.0 based MCP protocol handler

import type {
  MCPRequest,
  MCPResponse,
  MCPNotification,
  MCPTool,
  InitializeParams,
  InitializeResult,
  ToolsListResult,
  ToolCallParams,
  ToolCallResult,
  CommandLogEntry,
} from "./types";

export interface MCPServerConfig {
  name: string;
  version: string;
  tools: MCPTool[];
  onToolCall: (
    name: string,
    args: Record<string, unknown>
  ) => Promise<ToolCallResult>;
  onCommand?: (entry: CommandLogEntry) => void;
}

export class MCPServer {
  private config: MCPServerConfig;
  private initialized = false;

  constructor(config: MCPServerConfig) {
    this.config = config;
  }

  async handleMessage(message: string): Promise<string> {
    let request: MCPRequest | MCPNotification;

    try {
      request = JSON.parse(message);
    } catch {
      return JSON.stringify(this.errorResponse(null, -32700, "Parse error"));
    }

    // Log the request
    this.logCommand({
      timestamp: Date.now(),
      type: "request",
      id: "id" in request ? request.id : undefined,
      method: request.method,
      params: request.params,
    });

    // Handle notification (no id = no response expected)
    if (!("id" in request)) {
      await this.handleNotification(request as MCPNotification);
      return "";
    }

    // Handle request
    const response = await this.handleRequest(request as MCPRequest);

    // Log the response
    this.logCommand({
      timestamp: Date.now(),
      type: "response",
      id: response.id,
      result: response.result,
      error: response.error?.message,
    });

    return JSON.stringify(response);
  }

  private async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    const { id, method, params } = request;

    try {
      switch (method) {
        case "initialize":
          return this.handleInitialize(id, params as unknown as InitializeParams);

        case "initialized":
          // Client acknowledges initialization
          return this.successResponse(id, {});

        case "tools/list":
          return this.handleToolsList(id);

        case "tools/call":
          return await this.handleToolCall(id, params as unknown as ToolCallParams);

        case "ping":
          return this.successResponse(id, {});

        default:
          return this.errorResponse(id, -32601, `Method not found: ${method}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal error";
      return this.errorResponse(id, -32603, message);
    }
  }

  private async handleNotification(notification: MCPNotification): Promise<void> {
    const { method } = notification;

    switch (method) {
      case "notifications/cancelled":
        // Handle cancellation if needed
        break;
      case "notifications/progress":
        // Handle progress updates if needed
        break;
    }
  }

  private handleInitialize(
    id: string | number,
    params: InitializeParams
  ): MCPResponse {
    this.initialized = true;

    const result: InitializeResult = {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: this.config.name,
        version: this.config.version,
      },
    };

    return this.successResponse(id, result);
  }

  private handleToolsList(id: string | number): MCPResponse {
    const result: ToolsListResult = {
      tools: this.config.tools,
    };

    return this.successResponse(id, result);
  }

  private async handleToolCall(
    id: string | number,
    params: ToolCallParams
  ): Promise<MCPResponse> {
    const { name, arguments: args = {} } = params;

    // Find the tool
    const tool = this.config.tools.find((t) => t.name === name);
    if (!tool) {
      return this.errorResponse(id, -32602, `Unknown tool: ${name}`);
    }

    // Log tool call
    this.logCommand({
      timestamp: Date.now(),
      type: "request",
      id,
      toolName: name,
      params: args,
    });

    try {
      const result = await this.config.onToolCall(name, args);

      // Log tool result
      this.logCommand({
        timestamp: Date.now(),
        type: "response",
        id,
        toolName: name,
        result: result.content,
        error: result.isError ? "Tool execution failed" : undefined,
      });

      return this.successResponse(id, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tool execution failed";

      // Log error
      this.logCommand({
        timestamp: Date.now(),
        type: "response",
        id,
        toolName: name,
        error: message,
      });

      return this.successResponse(id, {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      });
    }
  }

  private successResponse(id: string | number, result: unknown): MCPResponse {
    return {
      jsonrpc: "2.0",
      id,
      result,
    };
  }

  private errorResponse(
    id: string | number | null,
    code: number,
    message: string
  ): MCPResponse {
    return {
      jsonrpc: "2.0",
      id: id ?? 0,
      error: { code, message },
    };
  }

  private logCommand(entry: CommandLogEntry): void {
    this.config.onCommand?.(entry);
  }
}

// Helper to create text content for tool responses
export function textContent(text: string): ToolCallResult {
  return {
    content: [{ type: "text", text }],
  };
}

// Helper to create error content for tool responses
export function errorContent(message: string): ToolCallResult {
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}
