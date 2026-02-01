"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";

const GA_MEASUREMENT_ID = "G-FM35KECLVH";
export const COOKIE_CONSENT_KEY = "cookie-consent";

// External store for cookie consent
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(COOKIE_CONSENT_KEY);
}

function getServerSnapshot() {
  return null;
}

export function GoogleAnalytics() {
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Don't render scripts until consent is given
  if (consent !== "accepted") {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}

export function acceptCookies() {
  localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
  // Dispatch storage event to trigger re-render
  window.dispatchEvent(new StorageEvent("storage", { key: COOKIE_CONSENT_KEY }));
  // Reload to properly initialize GA
  window.location.reload();
}

export function declineCookies() {
  localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
  window.dispatchEvent(new StorageEvent("storage", { key: COOKIE_CONSENT_KEY }));
}

export function getCookieConsent(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(COOKIE_CONSENT_KEY);
}
