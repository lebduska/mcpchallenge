"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/auth/user-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  const navItems = [
    { href: "/learn", label: t("learn") },
    { href: "/playground", label: t("playground") },
    { href: "/challenges", label: t("challenges") },
    { href: "/achievements", label: t("achievements") },
    { href: "/showcase", label: "Showcase" },
  ];

  // Remove locale prefix from pathname for comparison
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800 dark:bg-zinc-950/95 dark:supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="text-xl font-bold">MCP Challenge</span>
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
