/**
 * Rate Limiting Utility for Cloudflare Workers
 *
 * Uses KV for distributed rate limiting across edge locations.
 * Supports sliding window algorithm with configurable presets.
 */

/**
 * Rate limit configuration preset
 */
export interface RateLimitConfig {
  /** Maximum number of requests in the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Prefix for KV keys */
  keyPrefix: string;
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining requests in current window */
  remaining: number;
  /** Unix timestamp when the limit resets */
  resetAt: number;
  /** Seconds until reset */
  retryAfter: number;
}

/**
 * Predefined rate limit presets for different use cases
 */
export const RateLimitPresets = {
  // Challenge completion - 30/hour per user
  CHALLENGE_COMPLETE: {
    maxRequests: 30,
    windowSeconds: 3600,
    keyPrefix: "complete",
  },
  // MCP proxy - 100/minute per IP (AI agents need higher limits)
  MCP_PROXY: {
    maxRequests: 100,
    windowSeconds: 60,
    keyPrefix: "mcp",
  },
  // Gallery upload - 10/hour per IP
  GALLERY_UPLOAD: {
    maxRequests: 10,
    windowSeconds: 3600,
    keyPrefix: "upload",
  },
  // Comments - 20/hour per user
  COMMENTS: {
    maxRequests: 20,
    windowSeconds: 3600,
    keyPrefix: "comment",
  },
  // Ideas/voting - 50/hour per user
  IDEAS: {
    maxRequests: 50,
    windowSeconds: 3600,
    keyPrefix: "ideas",
  },
  // General API - 200/minute per IP
  GENERAL: {
    maxRequests: 200,
    windowSeconds: 60,
    keyPrefix: "api",
  },
} as const;

/**
 * Get client IP from request headers (Cloudflare-aware)
 */
export function getClientIP(request: Request): string {
  // Cloudflare provides the real IP
  const cfIP = request.headers.get("CF-Connecting-IP");
  if (cfIP) return cfIP;

  // Fallback to X-Forwarded-For
  const xff = request.headers.get("X-Forwarded-For");
  if (xff) return xff.split(",")[0].trim();

  // Last resort
  return "unknown";
}

/**
 * Check rate limit using Cloudflare KV
 *
 * @param kv - KV namespace for storing counters
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit check result
 */
export async function checkRateLimit(
  kv: KVNamespace,
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % config.windowSeconds);
  const key = `${config.keyPrefix}:${identifier}:${windowStart}`;

  const currentStr = await kv.get(key);
  const current = currentStr ? parseInt(currentStr, 10) : 0;

  const resetAt = windowStart + config.windowSeconds;
  const retryAfter = resetAt - now;

  if (current >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter,
    };
  }

  // Increment counter with TTL
  await kv.put(key, String(current + 1), {
    expirationTtl: config.windowSeconds,
  });

  return {
    allowed: true,
    remaining: config.maxRequests - current - 1,
    resetAt,
    retryAfter,
  };
}

/**
 * Create rate limit response headers
 */
export function rateLimitHeaders(
  result: RateLimitResult,
  config: RateLimitConfig
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(config.maxRequests),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetAt),
    ...(result.allowed ? {} : { "Retry-After": String(result.retryAfter) }),
  };
}

/**
 * Create a 429 Too Many Requests response
 */
export function rateLimitExceededResponse(
  result: RateLimitResult,
  config: RateLimitConfig,
  message?: string
): Response {
  return Response.json(
    {
      error: message || "Rate limit exceeded. Please try again later.",
      retryAfter: result.retryAfter,
    },
    {
      status: 429,
      headers: rateLimitHeaders(result, config),
    }
  );
}
