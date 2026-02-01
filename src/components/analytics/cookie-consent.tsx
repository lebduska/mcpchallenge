"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { acceptCookies, declineCookies, getCookieConsent } from "./google-analytics";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    if (consent === null) {
      // Small delay so it doesn't flash immediately
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    acceptCookies();
    setShowBanner(false);
  };

  const handleDecline = () => {
    declineCookies();
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shadow-lg animate-in slide-in-from-bottom-5 duration-300">
      <div className="container mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 pr-8">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            We use cookies to analyze site traffic and improve your experience.
            By clicking &quot;Accept&quot;, you consent to our use of cookies.{" "}
            <Link
              href="/privacy"
              className="text-zinc-900 dark:text-zinc-100 underline hover:no-underline"
            >
              Learn more
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDecline}>
            Decline
          </Button>
          <Button size="sm" onClick={handleAccept}>
            Accept
          </Button>
        </div>
        <button
          onClick={handleDecline}
          className="absolute top-2 right-2 sm:hidden p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
