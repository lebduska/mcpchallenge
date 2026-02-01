import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: "76ba5514-f20d-495a-a7df-2ff06d394448",
    token: process.env.CLOUDFLARE_API_TOKEN!,
  },
});
