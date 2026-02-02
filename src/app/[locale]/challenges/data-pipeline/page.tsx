"use client";

export const runtime = "edge";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Workflow, CheckCircle2, Lightbulb, ArrowRight } from "lucide-react";
import { MCPPlayground } from "@/components/playground/mcp-playground";
import { ChallengeCompletion } from "@/components/challenges";

const completionSteps = [
  { id: "understand-pipeline", title: "Understood the ETL pipeline concept (Load → Transform → Output)" },
  { id: "create-load", title: "Created load tools for JSON and CSV data" },
  { id: "create-transform", title: "Created transform tools (filter, map, sort)" },
  { id: "create-aggregate", title: "Created aggregate tool (sum, avg, min, max, count)" },
  { id: "create-output", title: "Created output tool with multiple formats (json, table, count)" },
  { id: "test-full", title: "Tested a full pipeline from load to output" },
];

const dataPipelineCode = `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "data-pipeline-server",
  version: "1.0.0",
});

// Pipeline state - stores intermediate results
let pipelineData: any = null;

// === Input Tools ===

server.tool(
  "pipeline_load_json",
  "Load JSON data into the pipeline",
  {
    json: z.string().describe("JSON string to parse and load"),
  },
  async ({ json }) => {
    try {
      pipelineData = JSON.parse(json);
      return {
        content: [{
          type: "text",
          text: \`Loaded \${Array.isArray(pipelineData) ? pipelineData.length + " items" : "object"} into pipeline\`,
        }],
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: \`Invalid JSON: \${e.message}\` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "pipeline_load_csv",
  "Load CSV data into the pipeline",
  {
    csv: z.string().describe("CSV string with header row"),
  },
  async ({ csv }) => {
    const lines = csv.trim().split("\\n");
    const headers = lines[0].split(",").map(h => h.trim());
    pipelineData = lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim());
      return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
    });
    return {
      content: [{
        type: "text",
        text: \`Loaded \${pipelineData.length} rows with columns: \${headers.join(", ")}\`,
      }],
    };
  }
);

// === Transform Tools ===

server.tool(
  "pipeline_filter",
  "Filter pipeline data by a condition",
  {
    field: z.string().describe("Field name to filter on"),
    operator: z.enum(["eq", "neq", "gt", "lt", "contains"]).describe("Comparison operator"),
    value: z.string().describe("Value to compare against"),
  },
  async ({ field, operator, value }) => {
    if (!Array.isArray(pipelineData)) {
      return { content: [{ type: "text", text: "Pipeline must contain an array" }], isError: true };
    }

    const before = pipelineData.length;
    pipelineData = pipelineData.filter(item => {
      const fieldValue = String(item[field] ?? "");
      switch (operator) {
        case "eq": return fieldValue === value;
        case "neq": return fieldValue !== value;
        case "gt": return Number(fieldValue) > Number(value);
        case "lt": return Number(fieldValue) < Number(value);
        case "contains": return fieldValue.includes(value);
      }
    });

    return {
      content: [{
        type: "text",
        text: \`Filtered: \${before} → \${pipelineData.length} items\`,
      }],
    };
  }
);

server.tool(
  "pipeline_map",
  "Transform each item using a field expression",
  {
    expression: z.string().describe("JS expression using 'item' variable, e.g., '{ name: item.name, total: item.price * item.qty }'"),
  },
  async ({ expression }) => {
    if (!Array.isArray(pipelineData)) {
      return { content: [{ type: "text", text: "Pipeline must contain an array" }], isError: true };
    }

    try {
      const fn = new Function("item", \`return \${expression}\`);
      pipelineData = pipelineData.map(fn);
      return {
        content: [{ type: "text", text: \`Transformed \${pipelineData.length} items\` }],
      };
    } catch (e) {
      return { content: [{ type: "text", text: \`Expression error: \${e.message}\` }], isError: true };
    }
  }
);

server.tool(
  "pipeline_sort",
  "Sort pipeline data by a field",
  {
    field: z.string().describe("Field name to sort by"),
    order: z.enum(["asc", "desc"]).default("asc").describe("Sort order"),
  },
  async ({ field, order }) => {
    if (!Array.isArray(pipelineData)) {
      return { content: [{ type: "text", text: "Pipeline must contain an array" }], isError: true };
    }

    pipelineData.sort((a, b) => {
      const aVal = a[field], bVal = b[field];
      const cmp = typeof aVal === "number" ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return order === "desc" ? -cmp : cmp;
    });

    return { content: [{ type: "text", text: \`Sorted by \${field} (\${order})\` }] };
  }
);

// === Aggregate Tools ===

server.tool(
  "pipeline_aggregate",
  "Aggregate numeric values",
  {
    field: z.string().describe("Numeric field to aggregate"),
    operation: z.enum(["sum", "avg", "min", "max", "count"]).describe("Aggregation operation"),
  },
  async ({ field, operation }) => {
    if (!Array.isArray(pipelineData)) {
      return { content: [{ type: "text", text: "Pipeline must contain an array" }], isError: true };
    }

    const values = pipelineData.map(item => Number(item[field])).filter(n => !isNaN(n));
    let result: number;

    switch (operation) {
      case "sum": result = values.reduce((a, b) => a + b, 0); break;
      case "avg": result = values.reduce((a, b) => a + b, 0) / values.length; break;
      case "min": result = Math.min(...values); break;
      case "max": result = Math.max(...values); break;
      case "count": result = values.length; break;
    }

    return {
      content: [{ type: "text", text: \`\${operation}(\${field}) = \${result}\` }],
    };
  }
);

// === Output Tools ===

server.tool(
  "pipeline_output",
  "Get the current pipeline data",
  {
    format: z.enum(["json", "table", "count"]).default("json").describe("Output format"),
  },
  async ({ format }) => {
    if (pipelineData === null) {
      return { content: [{ type: "text", text: "Pipeline is empty" }], isError: true };
    }

    switch (format) {
      case "count":
        return {
          content: [{ type: "text", text: \`Count: \${Array.isArray(pipelineData) ? pipelineData.length : 1}\` }],
        };
      case "table":
        if (!Array.isArray(pipelineData) || pipelineData.length === 0) {
          return { content: [{ type: "text", text: JSON.stringify(pipelineData, null, 2) }] };
        }
        const headers = Object.keys(pipelineData[0]);
        const rows = pipelineData.map(item => headers.map(h => String(item[h] ?? "")).join(" | "));
        return {
          content: [{
            type: "text",
            text: headers.join(" | ") + "\\n" + "-".repeat(40) + "\\n" + rows.join("\\n"),
          }],
        };
      default:
        return {
          content: [{ type: "text", text: JSON.stringify(pipelineData, null, 2) }],
        };
    }
  }
);

server.tool(
  "pipeline_clear",
  "Clear the pipeline data",
  {},
  async () => {
    pipelineData = null;
    return { content: [{ type: "text", text: "Pipeline cleared" }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);`;

const pipelineSteps = [
  { icon: "📥", name: "Load", tools: ["load_json", "load_csv"] },
  { icon: "🔄", name: "Transform", tools: ["filter", "map", "sort"] },
  { icon: "📊", name: "Aggregate", tools: ["aggregate"] },
  { icon: "📤", name: "Output", tools: ["output", "clear"] },
];

export default function DataPipelineChallengePage() {
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
            <Workflow className="h-8 w-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Data Pipeline
            </h1>
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
              Use Tools
            </Badge>
            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
              Advanced
            </Badge>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Chain multiple MCP tools to process and transform data step by step.
          </p>
        </div>

        {/* Pipeline Visualization */}
        <Card className="mb-6 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <Workflow className="h-5 w-5" />
              Pipeline Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between flex-wrap gap-4">
              {pipelineSteps.map((step, i) => (
                <div key={step.name} className="flex items-center gap-2">
                  <div className="text-center">
                    <div className="text-2xl">{step.icon}</div>
                    <div className="font-medium">{step.name}</div>
                    <div className="text-xs text-zinc-500">{step.tools.join(", ")}</div>
                  </div>
                  {i < pipelineSteps.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-zinc-400" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Example Usage */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Example: Process Sales Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg text-sm overflow-x-auto">
{`1. load_csv: "product,price,qty\\nApple,1.5,100\\nBanana,0.75,200\\nOrange,2,50"
2. filter: field="qty", operator="gt", value="50"
3. map: "{ product: item.product, total: item.price * item.qty }"
4. sort: field="total", order="desc"
5. output: format="table"`}
            </pre>
          </CardContent>
        </Card>

        {/* Playground */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Data Pipeline MCP Server</CardTitle>
          </CardHeader>
          <CardContent>
            <MCPPlayground
              initialCode={dataPipelineCode}
              height="500px"
              showToolTester={true}
              title="Data Pipeline Server"
              description="ETL-style data processing"
            />
          </CardContent>
        </Card>

        {/* Success Criteria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Success Criteria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Load data from JSON or CSV
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Filter, transform, and sort data
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Calculate aggregates (sum, avg, min, max)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Output in multiple formats
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Progress Tracking */}
        <ChallengeCompletion
          challengeId="data-pipeline"
          steps={completionSteps}
        />
      </div>
    </div>
  );
}
