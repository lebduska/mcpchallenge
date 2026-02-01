import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { createDb } from "@/db";
import { users, userStats } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

export const runtime = "edge";

interface CloudflareEnv {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  AUTH_SECRET: string;
  DB: D1Database;
}

function getAuth() {
  const { env } = getRequestContext();
  const cfEnv = env as CloudflareEnv;
  const db = createDb(cfEnv.DB);

  const config: NextAuthConfig = {
    providers: [
      Google({
        clientId: cfEnv.GOOGLE_CLIENT_ID,
        clientSecret: cfEnv.GOOGLE_CLIENT_SECRET,
      }),
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
      async signIn({ user, account, profile }) {
        if (!user.email) return false;

        // Check if user exists
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, user.email),
        });

        if (!existingUser) {
          // Create new user
          const userId = crypto.randomUUID();
          // Generate username from profile (GitHub uses login, Google uses email prefix)
          const username = (profile?.login as string) ||
            user.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
          await db.insert(users).values({
            id: userId,
            email: user.email,
            name: user.name || null,
            image: user.image || null,
            username,
          });
          // Create user stats
          await db.insert(userStats).values({
            userId,
            totalPoints: 0,
            level: 1,
            challengesCompleted: 0,
            achievementsUnlocked: 0,
            currentStreak: 0,
            longestStreak: 0,
          });
          // Store the new user ID for JWT
          user.id = userId;
        } else {
          // Update existing user info
          await db.update(users)
            .set({
              name: user.name || existingUser.name,
              image: user.image || existingUser.image,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existingUser.id));
          user.id = existingUser.id;
        }
        return true;
      },
      async session({ session, token }) {
        if (token.sub && session.user) {
          session.user.id = token.sub;
        }
        return session;
      },
      async jwt({ token, user }) {
        if (user?.id) {
          token.sub = user.id;
        }
        return token;
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
