/**
 * Money — a tiny domain type for monetary values.
 *
 * Values are stored as minor units (integer cents). Never as floats.
 * When the real backend lands, it is expected to return { amount, currency }
 * shaped the same way — if not, the adapter normalizes before it reaches
 * the UI.
 */

export type CurrencyCode = 'CHF' | 'EUR' | 'USD' | 'GBP';

export interface Money {
  /** Integer minor units (e.g. 12345 => CHF 123.45). May be negative. */
  readonly amount: number;
  readonly currency: CurrencyCode;
}

export const money = (amount: number, currency: CurrencyCode = 'CHF'): Money => ({
  amount: Math.trunc(amount),
  currency,
});

export const fromMajor = (major: number, currency: CurrencyCode = 'CHF'): Money =>
  money(Math.round(major * 100), currency);

export const toMajor = (m: Money): number => m.amount / 100;

export const add = (a: Money, b: Money): Money => {
  if (a.currency !== b.currency) throw new Error('Currency mismatch');
  return { amount: a.amount + b.amount, currency: a.currency };
};

export const subtract = (a: Money, b: Money): Money => {
  if (a.currency !== b.currency) throw new Error('Currency mismatch');
  return { amount: a.amount - b.amount, currency: a.currency };
};

export const negate = (m: Money): Money => ({ amount: -m.amount, currency: m.currency });

export const isNegative = (m: Money): boolean => m.amount < 0;
export const isZero = (m: Money): boolean => m.amount === 0;

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  CHF: 'CHF',
  EUR: '€',
  USD: '$',
  GBP: '£',
};

export interface FormatMoneyOptions {
  /** Default is 'de-CH' which renders 1'234.56 (Swiss apostrophe grouping). */
  readonly locale?: string;
  /** 'sign' => always show + or -. 'negative' => show only -. Default 'negative'. */
  readonly sign?: 'sign' | 'negative' | 'none';
  /** Hide the currency token entirely. Useful inside AccountCard headers. */
  readonly hideCurrency?: boolean;
  /** Show digits as grouped only (e.g. for large display numerals). */
  readonly compact?: boolean;
}

/**
 * Format a Money value Swiss-style.
 *   CHF 1'234.56
 *   CHF -1'234.56 (when sign is 'negative' or 'sign' and value is negative)
 *   CHF +1'234.56 (when sign is 'sign' and value is positive)
 */
export const formatMoney = (m: Money, opts: FormatMoneyOptions = {}): string => {
  const { locale = 'de-CH', sign = 'negative', hideCurrency = false, compact = false } = opts;

  const major = Math.abs(m.amount) / 100;
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: compact ? 0 : 2,
  }).format(major);

  const prefix = m.amount < 0 ? '−' : sign === 'sign' ? '+' : '';

  if (hideCurrency) return `${prefix}${formatted}`;
  return `${CURRENCY_SYMBOLS[m.currency]} ${prefix}${formatted}`;
};

/**
 * Split a formatted amount into integer and fractional parts.
 * Used by the display <Amount> primitive to render fraction digits smaller
 * than integer digits — a common editorial convention for money typography.
 */
export const splitFormatted = (m: Money, locale = 'de-CH'): { int: string; frac: string } => {
  const major = Math.abs(m.amount) / 100;
  const parts = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).formatToParts(major);

  let int = '';
  let frac = '';
  let seenDecimal = false;
  for (const p of parts) {
    if (p.type === 'decimal') {
      seenDecimal = true;
      frac = p.value;
      continue;
    }
    if (seenDecimal) frac += p.value;
    else int += p.value;
  }
  return { int, frac };
};
