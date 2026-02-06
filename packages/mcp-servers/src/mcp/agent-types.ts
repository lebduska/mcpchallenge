// Agent Identity Types and Sanitization
// Used for MCP agent.identify tool

export interface AgentIdentity {
  name: string;
  model: string;
  client: string;
  strategy?: string;
  repo?: string;
  envVars?: string[];  // NAMES ONLY - never values
  share: "private" | "unlisted" | "public";
}

export interface AgentIdentifyParams {
  sessionNonce: string;
  name: string;
  model: string;
  client: string;
  strategy?: string;
  repo?: string;
  envVars?: string[];
  share?: "private" | "unlisted" | "public";
}

export interface AgentSnapshot {
  schemaVersion: 1;
  identity: AgentIdentity;
  identifiedAt: number;
}

// Patterns that indicate secret/sensitive values - reject these
const SECRET_PATTERNS = [
  /token/i,
  /key/i,
  /secret/i,
  /password/i,
  /auth/i,
  /credential/i,
  /^[a-zA-Z0-9+/]{40,}={0,2}$/,  // Long base64 strings
  /^[a-f0-9]{40,}$/i,            // Long hex strings
  /^sk-[a-zA-Z0-9]+$/,           // OpenAI key pattern
  /^ghp_[a-zA-Z0-9]+$/,          // GitHub PAT pattern
  /^xox[pboa]-[a-zA-Z0-9-]+$/,   // Slack token pattern
  /^AKIA[A-Z0-9]{16}$/,          // AWS access key pattern
];

/**
 * Check if a value looks like a secret/sensitive data
 */
export function isSecretLike(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  return SECRET_PATTERNS.some(pattern => pattern.test(value));
}

/**
 * Validate environment variable name format
 * Only uppercase letters, numbers, underscores allowed
 */
function isValidEnvVarName(name: string): boolean {
  return /^[A-Z_][A-Z0-9_]*$/i.test(name) && name.length <= 50;
}

/**
 * Sanitize and validate agent identity input
 * Returns null if validation fails
 */
export function sanitizeAgentIdentity(input: unknown): AgentIdentity | null {
  if (!input || typeof input !== "object") return null;

  const params = input as Record<string, unknown>;
  const { name, model, client, strategy, repo, envVars, share } = params;

  // Required fields validation
  if (typeof name !== "string" || name.length === 0 || name.length > 100) {
    return null;
  }
  if (typeof model !== "string" || model.length === 0 || model.length > 100) {
    return null;
  }
  if (typeof client !== "string" || client.length === 0 || client.length > 100) {
    return null;
  }

  // Reject secret-like values in required fields
  if (isSecretLike(name) || isSecretLike(model) || isSecretLike(client)) {
    return null;
  }

  // Build sanitized identity
  const sanitized: AgentIdentity = {
    name: name.trim().slice(0, 100),
    model: model.trim().slice(0, 100),
    client: client.trim().slice(0, 100),
    share: (share === "unlisted" || share === "public") ? share : "private",
  };

  // Optional: strategy
  if (typeof strategy === "string" && strategy.length > 0 && strategy.length <= 500) {
    if (!isSecretLike(strategy)) {
      sanitized.strategy = strategy.trim().slice(0, 500);
    }
  }

  // Optional: repo URL (must be https)
  if (typeof repo === "string" && repo.startsWith("https://") && repo.length <= 200) {
    // Basic URL validation
    try {
      const url = new URL(repo);
      if (url.protocol === "https:") {
        sanitized.repo = repo.slice(0, 200);
      }
    } catch {
      // Invalid URL, skip
    }
  }

  // Optional: envVars (names only, no values)
  if (Array.isArray(envVars)) {
    const validNames = envVars
      .filter((v): v is string => typeof v === "string" && isValidEnvVarName(v))
      .map(v => v.toUpperCase())
      .slice(0, 20);  // Max 20 env var names

    if (validNames.length > 0) {
      sanitized.envVars = validNames;
    }
  }

  return sanitized;
}

/**
 * Create an AgentSnapshot from validated identity
 */
export function createAgentSnapshot(identity: AgentIdentity): AgentSnapshot {
  return {
    schemaVersion: 1,
    identity,
    identifiedAt: Date.now(),
  };
}
