"use client";

export const runtime = "edge";

import { Suspense, useMemo } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, ExternalLink, AlertTriangle } from "lucide-react";

const PROD_DOMAIN = "mcpchallenge.org";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  // Check if we're on pages.dev (dev environment)
  const isDevEnvironment = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.location.hostname.includes("pages.dev");
  }, []);

  const handleRedirectToProd = () => {
    const prodSignInUrl = `https://${PROD_DOMAIN}/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    window.location.href = prodSignInUrl;
  };

  const providers = [
    {
      id: "google",
      name: "Google",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      ),
      color: "bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200",
    },
    {
      id: "github",
      name: "GitHub",
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      ),
      color: "bg-zinc-900 hover:bg-zinc-800 text-white",
    },
    // TODO: Uncomment when LinkedIn OAuth credentials are configured
    // {
    //   id: "linkedin",
    //   name: "LinkedIn",
    //   icon: (
    //     <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    //       <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    //     </svg>
    //   ),
    //   color: "bg-[#0077B5] hover:bg-[#006699] text-white",
    // },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to MCP Challenge</CardTitle>
            <CardDescription>
              Sign in to track your progress, earn achievements, and compete on the leaderboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
                {error === "OAuthAccountNotLinked"
                  ? "This email is already associated with another account. Please sign in with the original provider."
                  : "An error occurred during sign in. Please try again."}
              </div>
            )}

            {isDevEnvironment ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200">
                        Development Environment
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        You&apos;re on the preview site. Sign in is only available on the production site.
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full h-12"
                  onClick={handleRedirectToProd}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Continue to {PROD_DOMAIN}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {providers.map((provider) => (
                  <Button
                    key={provider.id}
                    variant="outline"
                    className={`w-full h-12 ${provider.color}`}
                    onClick={() => signIn(provider.id, { callbackUrl })}
                  >
                    {provider.icon}
                    <span className="ml-3">Continue with {provider.name}</span>
                  </Button>
                ))}
              </div>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-zinc-950 px-2 text-muted-foreground">
                  Why sign in?
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <p className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Track your challenge completions
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Earn achievements and badges
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Compete on the global leaderboard
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Share your progress on social media
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-zinc-500 mt-6">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-zinc-900 dark:hover:text-zinc-50">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-zinc-900 dark:hover:text-zinc-50">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center">Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
