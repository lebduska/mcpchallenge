"use client";

export const runtime = "edge";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: "Server Configuration Error",
    description: "There's a problem with the server configuration. Please try again later.",
  },
  AccessDenied: {
    title: "Access Denied",
    description: "You don't have permission to sign in. Please contact support if you believe this is an error.",
  },
  Verification: {
    title: "Verification Error",
    description: "The verification link has expired or has already been used. Please request a new one.",
  },
  OAuthSignin: {
    title: "OAuth Sign In Error",
    description: "An error occurred while trying to sign in with the OAuth provider. Please try again.",
  },
  OAuthCallback: {
    title: "OAuth Callback Error",
    description: "An error occurred while processing the OAuth callback. Please try again.",
  },
  OAuthCreateAccount: {
    title: "Account Creation Error",
    description: "Could not create your account. The email might already be in use with another provider.",
  },
  EmailCreateAccount: {
    title: "Account Creation Error",
    description: "Could not create your account using email. Please try again or use a different method.",
  },
  Callback: {
    title: "Callback Error",
    description: "An error occurred during the authentication callback. Please try again.",
  },
  OAuthAccountNotLinked: {
    title: "Account Not Linked",
    description: "This email is already associated with another account. Please sign in with the original provider.",
  },
  SessionRequired: {
    title: "Session Required",
    description: "Please sign in to access this page.",
  },
  Default: {
    title: "Authentication Error",
    description: "An unexpected error occurred during authentication. Please try again.",
  },
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "Default";
  const errorInfo = errorMessages[error] || errorMessages.Default;

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
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl">{errorInfo.title}</CardTitle>
            <CardDescription>{errorInfo.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/auth/signin">Try Again</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Go to Home</Link>
              </Button>
            </div>

            <p className="text-center text-xs text-zinc-500 mt-4">
              Error code: {error}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center">Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
