import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale, type Locale } from './i18n/config';

const LOCALE_COOKIE = 'NEXT_LOCALE';

// Create the next-intl middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // Only add prefix for non-default locales
  localeDetection: false, // Disable automatic locale detection - always use English
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, static files, and _next
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for locale in cookie first (user preference)
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value as Locale | undefined;

  // If user has a saved preference and it's valid, use it
  if (cookieLocale && locales.includes(cookieLocale)) {
    // Check if the URL already has the correct locale
    const pathLocale = pathname.split('/')[1] as Locale;
    if (!locales.includes(pathLocale) && cookieLocale !== defaultLocale) {
      // Redirect to the user's preferred locale
      const url = request.nextUrl.clone();
      url.pathname = `/${cookieLocale}${pathname}`;
      return NextResponse.redirect(url);
    }
  }

  // Use the next-intl middleware for all other cases
  // It will handle browser Accept-Language header detection
  return intlMiddleware(request);
}

export const config = {
  // Match all paths except static files and API routes
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
