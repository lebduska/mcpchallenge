"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/auth/user-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

function Logo({ className }: { className?: string }) {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 210 210"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M105 10 L195 40 L195 100 C195 155 105 195 105 195 C105 195 15 155 15 100 L15 40 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="11"
      />
      <text
        x="105"
        y="115"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="58"
        fontWeight="700"
        fill="currentColor"
      >
        MCP
      </text>
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  const navItems = [
    { href: "/challenges", label: t("challenges") },
    // Hidden until 100+ records:
    // { href: "/snippets", label: t("snippets") },
    // { href: "/gallery", label: t("gallery") },
    // { href: "/leaderboard", label: t("leaderboard") },
  ];

  // Remove locale prefix from pathname for comparison
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800 dark:bg-zinc-950/95 dark:supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link href="/" className="mr-6 flex items-center gap-2">
          <Logo className="text-zinc-900 dark:text-zinc-50" />
          <span className="text-lg font-bold">Challenge</span>
        </Link>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors hover:text-zinc-900 dark:hover:text-zinc-50",
                pathWithoutLocale === item.href || pathWithoutLocale.startsWith(item.href + "/")
                  ? "text-zinc-900 dark:text-zinc-50"
                  : "text-zinc-600 dark:text-zinc-400"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center space-x-2">
          <ThemeToggle />
          {/* <LanguageSwitcher /> */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
