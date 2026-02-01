"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTransition, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { locales, localeNames, localeCountryCodes, type Locale } from "@/i18n/config";
import "flag-icons/css/flag-icons.min.css";

function setCookie(name: string, value: string, days: number) {
  if (typeof window !== "undefined") {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    window.document.cookie = `${name}=${value};path=/;expires=${expires.toUTCString()}`;
  }
}

function FlagIcon({ code, className = "" }: { code: string; className?: string }) {
  return (
    <span
      className={`fi fi-${code} fis ${className}`}
      style={{
        width: '1.25rem',
        height: '1.25rem',
        borderRadius: '50%',
        display: 'inline-block',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    />
  );
}

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = useCallback((newLocale: Locale) => {
    // Set cookie for persistence
    setCookie("NEXT_LOCALE", newLocale, 365);

    // Get the current path without locale prefix
    const segments = pathname.split("/");
    const currentLocale = segments[1];

    let newPath: string;
    if (locales.includes(currentLocale as Locale)) {
      // Replace existing locale
      segments[1] = newLocale === "en" ? "" : newLocale;
      newPath = segments.filter(Boolean).join("/") || "/";
      if (!newPath.startsWith("/")) newPath = "/" + newPath;
    } else {
      // No locale in path, add new one
      newPath = newLocale === "en" ? pathname : `/${newLocale}${pathname}`;
    }

    startTransition(() => {
      router.push(newPath);
      router.refresh();
    });
  }, [pathname, router]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-2"
          disabled={isPending}
        >
          <FlagIcon code={localeCountryCodes[locale]} />
          <span className="hidden sm:inline">{localeNames[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <FlagIcon code={localeCountryCodes[loc]} />
              <span>{localeNames[loc]}</span>
            </span>
            {loc === locale && <Check className="h-4 w-4 ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
