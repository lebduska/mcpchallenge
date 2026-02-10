/// <reference types="@cloudflare/workers-types" />

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    R2_GALLERY: R2Bucket;
    RATE_LIMIT: KVNamespace;
    GAME_ROOM: DurableObjectNamespace;
    ENVIRONMENT: string;
    AUTH_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
    LINKEDIN_CLIENT_ID: string;
    LINKEDIN_CLIENT_SECRET: string;
  }
}

export {};
