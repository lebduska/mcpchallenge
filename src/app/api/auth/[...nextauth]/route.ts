import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import type { NextRequest } from "next/server";

export const runtime = "edge";

interface CloudflareEnv {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  AUTH_SECRET: string;
  DB?: D1Database;
}

function getAuth() {
  const { env } = getRequestContext();
  const cfEnv = env as CloudflareEnv;

  const config: NextAuthConfig = {
    providers: [
      GitHub({
        clientId: cfEnv.GITHUB_CLIENT_ID,
        clientSecret: cfEnv.GITHUB_CLIENT_SECRET,
      }),
    ],
    secret: cfEnv.AUTH_SECRET,
    session: {
      strategy: "jwt",
    },
    trustHost: true,
    pages: {
      signIn: "/auth/signin",
      error: "/auth/error",
    },
    callbacks: {
      async session({ session, token }) {
        if (token.sub && session.user) {
          session.user.id = token.sub;
        }
        return session;
      },
    },
  };

  return NextAuth(config);
}

export async function GET(request: NextRequest) {
  const { handlers } = getAuth();
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  const { handlers } = getAuth();
  return handlers.POST(request);
}
