import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { de, enGB } from 'date-fns/locale';

const locales = {
  'de-CH': de,
  'en-CH': enGB,
  en: enGB,
  de,
} as const;

type LocaleKey = keyof typeof locales;

const resolveLocale = (locale: string): (typeof locales)[LocaleKey] => {
  return locales[locale as LocaleKey] ?? enGB;
};

const toDate = (v: Date | string): Date => (typeof v === 'string' ? parseISO(v) : v);

/** `17.04.2026` */
export const formatDate = (v: Date | string, locale = 'de-CH'): string =>
  format(toDate(v), 'dd.MM.yyyy', { locale: resolveLocale(locale) });

/** `17.04.2026 · 14:32` */
export const formatDateTime = (v: Date | string, locale = 'de-CH'): string =>
  format(toDate(v), 'dd.MM.yyyy · HH:mm', { locale: resolveLocale(locale) });

/** `14:32:18.041` — used in audit / trace views */
export const formatTimePrecise = (v: Date | string): string =>
  format(toDate(v), 'HH:mm:ss.SSS');

/** `2 min ago`, `3 h ago` */
export const formatRelative = (v: Date | string, locale = 'en'): string =>
  formatDistanceToNowStrict(toDate(v), {
    addSuffix: true,
    locale: resolveLocale(locale),
  });

/** `Apr 17, 2026` — editorial, used in statement headers */
export const formatDateLong = (v: Date | string, locale = 'en'): string =>
  format(toDate(v), 'MMM d, yyyy', { locale: resolveLocale(locale) });
