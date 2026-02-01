export const locales = [
  'en', // English
  'cs', // Czech
  'zh', // Chinese (Simplified)
  'hi', // Hindi
  'es', // Spanish
  'fr', // French
  'ar', // Arabic
  'bn', // Bengali
  'pt', // Portuguese
  'ru', // Russian
  'ja', // Japanese
  'de', // German
  'ko', // Korean
  'vi', // Vietnamese
  'tr', // Turkish
  'it', // Italian
  'th', // Thai
  'pl', // Polish
  'uk', // Ukrainian
  'nl', // Dutch
  'id', // Indonesian
  'el', // Greek
  'ro', // Romanian
  'hu', // Hungarian
  'sv', // Swedish
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  cs: 'Čeština',
  zh: '中文',
  hi: 'हिन्दी',
  es: 'Español',
  fr: 'Français',
  ar: 'العربية',
  bn: 'বাংলা',
  pt: 'Português',
  ru: 'Русский',
  ja: '日本語',
  de: 'Deutsch',
  ko: '한국어',
  vi: 'Tiếng Việt',
  tr: 'Türkçe',
  it: 'Italiano',
  th: 'ไทย',
  pl: 'Polski',
  uk: 'Українська',
  nl: 'Nederlands',
  id: 'Bahasa Indonesia',
  el: 'Ελληνικά',
  ro: 'Română',
  hu: 'Magyar',
  sv: 'Svenska',
};

// ISO 3166-1 alpha-2 country codes for flag-icons
export const localeCountryCodes: Record<Locale, string> = {
  en: 'gb',
  cs: 'cz',
  zh: 'cn',
  hi: 'in',
  es: 'es',
  fr: 'fr',
  ar: 'sa',
  bn: 'bd',
  pt: 'br',
  ru: 'ru',
  ja: 'jp',
  de: 'de',
  ko: 'kr',
  vi: 'vn',
  tr: 'tr',
  it: 'it',
  th: 'th',
  pl: 'pl',
  uk: 'ua',
  nl: 'nl',
  id: 'id',
  el: 'gr',
  ro: 'ro',
  hu: 'hu',
  sv: 'se',
};

// RTL languages
export const rtlLocales: Locale[] = ['ar'];

export function isRtlLocale(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}
