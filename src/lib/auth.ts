import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
// TODO: Uncomment when OAuth credentials are configured
// import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
// import LinkedIn from "next-auth/providers/linkedin";
import type { NextAuthConfig } from "next-auth";
import { createDb } from "@/db";

export function createAuthConfig(db: ReturnType<typeof createDb>): NextAuthConfig {
  return {
    adapter: DrizzleAdapter(db) as NextAuthConfig["adapter"],
    providers: [
      // TODO: Uncomment when Google OAuth credentials are configured
      // Google({
      //   clientId: process.env.GOOGLE_CLIENT_ID!,
      //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // }),
      GitHub({
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      }),
      // TODO: Uncomment when LinkedIn OAuth credentials are configured
      // LinkedIn({
      //   clientId: process.env.LINKEDIN_CLIENT_ID!,
      //   clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      // }),
    ],
    session: {
      strategy: "jwt", // JWT for edge compatibility
    },
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
      async jwt({ token, user, trigger, session }) {
        if (user) {
          token.sub = user.id;
        }
        // Handle session update (e.g., username change)
        if (trigger === "update" && session) {
          return { ...token, ...session.user };
        }
        return token;
      },
    },
    events: {
      async createUser({ user }) {
        // Create user stats entry when a new user is created
        // This will be handled by the adapter or a trigger
        console.log("New user created:", user.id);
      },
    },
  };
}

// Type augmentation for session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      username?: string | null;
    };
  }
}
