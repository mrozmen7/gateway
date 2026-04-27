import { describe, it, expect } from 'vitest';
import { fromMajor, formatMoney, splitFormatted, negate, isNegative } from './money';

describe('money', () => {
  it('stores values in minor units', () => {
    expect(fromMajor(12.34).amount).toBe(1234);
    expect(fromMajor(0.1).amount).toBe(10);
  });

  it('formats Swiss-style with apostrophe grouping', () => {
    expect(formatMoney(fromMajor(1234.5))).toMatch(/CHF.*1[’'].?234\.50/);
  });

  it('splits into integer and fractional parts', () => {
    const parts = splitFormatted(fromMajor(1234.56));
    expect(parts.int).toMatch(/1[’'].?234/);
    expect(parts.frac).toMatch(/[.,]56/);
  });

  it('negate and isNegative behave correctly', () => {
    const v = fromMajor(10);
    expect(isNegative(v)).toBe(false);
    expect(isNegative(negate(v))).toBe(true);
  });
});
