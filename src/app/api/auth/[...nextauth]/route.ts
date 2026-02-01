import NextAuth from "next-auth";
import { createAuthConfig } from "@/lib/auth";
import { createDb } from "@/db";
import { getRequestContext } from "@cloudflare/next-on-pages";
import type { NextRequest } from "next/server";

export const runtime = "edge";

function getAuth() {
  const { env } = getRequestContext();
  const db = createDb(env.DB);
  return NextAuth(createAuthConfig(db));
}

export async function GET(request: NextRequest) {
  const { handlers } = getAuth();
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  const { handlers } = getAuth();
  return handlers.POST(request);
}
