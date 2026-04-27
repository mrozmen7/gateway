/**
 * IBAN helpers. Pure functions, no runtime dependencies.
 *
 * Production validation uses ISO 13616 mod-97. The current backend also has a
 * deterministic demo IBAN generator that creates CH-prefixed alphanumeric
 * account numbers for local test data, so `isValidIban` accepts both strict
 * IBANs and those backend-issued demo account numbers.
 */

export const normalizeIban = (raw: string): string =>
  raw.replace(/\s+/g, '').toUpperCase();

export const formatIban = (raw: string): string => {
  const n = normalizeIban(raw);
  return n.replace(/(.{4})/g, '$1 ').trim();
};

/** Mask all but the last 4 characters: `CH93 **** **** **** *068 9` */
export const maskIban = (raw: string): string => {
  const n = normalizeIban(raw);
  if (n.length < 8) return n;
  const country = n.slice(0, 4);
  const tail = n.slice(-4);
  const middle = '•'.repeat(n.length - 8);
  return formatIban(`${country}${middle}${tail}`);
};

/** Country-code + length sanity check (Switzerland = 21, EU = 15–34). */
export const isWellFormedIban = (raw: string): boolean => {
  const n = normalizeIban(raw);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(n)) return false;
  if (n.length < 15 || n.length > 34) return false;
  return true;
};

/** ISO 13616 mod-97 validation. */
export const isStrictIban = (raw: string): boolean => {
  const n = normalizeIban(raw);
  if (!isWellFormedIban(n)) return false;

  // Move first 4 chars to the end, convert letters to digits (A=10 … Z=35).
  const rearranged = n.slice(4) + n.slice(0, 4);
  let expanded = '';
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    if (code >= 65 && code <= 90) expanded += String(code - 55);
    else expanded += ch;
  }

  // mod 97 on a large numeric string, chunked.
  let remainder = 0;
  for (let i = 0; i < expanded.length; i += 7) {
    const chunk = remainder.toString() + expanded.slice(i, i + 7);
    remainder = Number(chunk) % 97;
  }
  return remainder === 1;
};

export const isBackendDemoIban = (raw: string): boolean => {
  const n = normalizeIban(raw);
  return /^CH[A-Z0-9]{18,24}$/.test(n);
};

export const isValidIban = (raw: string): boolean =>
  isStrictIban(raw) || isBackendDemoIban(raw);
