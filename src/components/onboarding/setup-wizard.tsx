"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, Terminal, Copy, ExternalLink, Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WizardStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface SetupWizardProps {
  challengeId: string;
  onComplete?: () => void;
  onSkip?: () => void;
  className?: string;
}

const CodeBlock = ({ code, language = "bash" }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="relative group">
      <pre className="p-4 bg-zinc-900 dark:bg-zinc-950 rounded-lg overflow-x-auto">
        <code className={`language-${language} text-sm text-zinc-100`}>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className={cn(
          "absolute top-2 right-2 p-2 rounded-md transition-all",
          "bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white",
          "opacity-0 group-hover:opacity-100 focus:opacity-100"
        )}
        title="Copy to clipboard"
      >
        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
};

export function SetupWizard({ challengeId, onComplete, onSkip, className }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const mcpEndpoint = `https://mcp.mcpchallenge.org/${challengeId}`;

  const steps: WizardStep[] = [
    {
      id: "install",
      title: "Install MCP SDK",
      description: "Add the MCP client to your project",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Install the official MCP TypeScript SDK:
          </p>
          <CodeBlock code="npm install @modelcontextprotocol/sdk" />
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            Or use yarn/pnpm if you prefer.
          </p>
        </div>
      ),
    },
    {
      id: "connect",
      title: "Connect to Server",
      description: "Copy this code to connect",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Create a new file and paste this code:
          </p>
          <CodeBlock
            language="typescript"
            code={`import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const client = new Client({
  name: "my-mcp-client",
  version: "1.0.0",
});

// Connect to the challenge server
const transport = new SSEClientTransport(
  new URL("${mcpEndpoint}")
);

await client.connect(transport);
console.log("Connected! Tools:", await client.listTools());`}
          />
        </div>
      ),
    },
    {
      id: "play",
      title: "Make Your First Move",
      description: "Call a tool and see the result",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Now call a tool to interact with the game:
          </p>
          <CodeBlock
            language="typescript"
            code={`// Get the current game state
const result = await client.callTool({
  name: "get_board",
  arguments: {},
});

console.log(result.content);

// Make a move (example for tic-tac-toe)
await client.callTool({
  name: "make_move",
  arguments: { position: 4 }, // Center square
});`}
          />
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <p className="text-sm text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Watch the game board update in real-time!
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = useCallback(() => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  }, [currentStep, steps.length, onComplete]);

  const handleStepClick = useCallback((index: number) => {
    if (index <= Math.max(...Array.from(completedSteps), currentStep)) {
      setCurrentStep(index);
    }
  }, [completedSteps, currentStep]);

  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className={cn("rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden", className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Rocket className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-white">Quick Start Guide</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Get connected in 3 steps</p>
            </div>
          </div>
          {onSkip && (
            <Button variant="ghost" size="sm" onClick={onSkip} className="text-zinc-500">
              Skip for now
            </Button>
          )}
        </div>
      </div>

      {/* Step indicators */}
      <div className="px-6 py-3 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => handleStepClick(index)}
              disabled={index > Math.max(...Array.from(completedSteps), currentStep) + 1}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                index === currentStep
                  ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
                  : completedSteps.has(index)
                  ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                  : "text-zinc-400 dark:text-zinc-600",
                index <= Math.max(...Array.from(completedSteps), currentStep) + 1
                  ? "cursor-pointer hover:opacity-80"
                  : "cursor-not-allowed"
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center w-5 h-5 rounded-full text-xs",
                  index === currentStep
                    ? "bg-purple-500 text-white"
                    : completedSteps.has(index)
                    ? "bg-emerald-500 text-white"
                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                )}
              >
                {completedSteps.has(index) ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              <span className="hidden sm:inline">{step.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <Terminal className="h-5 w-5 text-purple-500" />
                {steps[currentStep].title}
              </h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {steps[currentStep].description}
              </p>
            </div>
            {steps[currentStep].content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
        <a
          href="https://modelcontextprotocol.io/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Full MCP Docs
        </a>
        <Button onClick={handleNext} className="gap-2">
          {isLastStep ? (
            <>
              <Sparkles className="h-4 w-4" />
              Start Playing
            </>
          ) : (
            <>
              Next Step
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
