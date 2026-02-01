import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { AuthProvider } from "@/components/auth/auth-provider";
import { locales, localeNames, isRtlLocale, defaultLocale, type Locale } from "@/i18n/config";

const BASE_URL = "https://mcpchallenge.org";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isDefault = locale === defaultLocale;

  // Generate alternates for all locales
  const alternateLanguages: Record<string, string> = {};
  for (const loc of locales) {
    alternateLanguages[loc] = loc === defaultLocale ? BASE_URL : `${BASE_URL}/${loc}`;
  }

  return {
    alternates: {
      canonical: isDefault ? BASE_URL : `${BASE_URL}/${locale}`,
      languages: alternateLanguages,
    },
    openGraph: {
      locale: locale === "en" ? "en_US" : locale,
      alternateLocale: locales.filter((l) => l !== locale),
    },
  };
}

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for the current locale
  const messages = await getMessages();

  const isRtl = isRtlLocale(locale as Locale);

  return (
    <div lang={locale} dir={isRtl ? "rtl" : "ltr"}>
      <NextIntlClientProvider messages={messages}>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </NextIntlClientProvider>
    </div>
  );
}
