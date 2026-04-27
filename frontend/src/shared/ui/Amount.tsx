import { type HTMLAttributes } from 'react';
import { cn } from '@shared/lib/cn';
import { splitFormatted, type Money } from '@shared/lib/money';

interface AmountProps extends HTMLAttributes<HTMLSpanElement> {
  readonly value: Money;
  /** 'sm' = inline (list row). 'md' = card emphasis. 'lg' = hero numeral. */
  readonly size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Tint credit/debit by direction. Default true. */
  readonly semantic?: boolean;
  /** Always show + for credit. */
  readonly signed?: boolean;
  /** Hide the currency token. */
  readonly hideCurrency?: boolean;
  /** Hide the fractional part (e.g. in sparkline tooltips). */
  readonly hideFraction?: boolean;
  readonly locale?: string;
}

/**
 * Money display. Integer part and fractional part are rendered in distinct
 * weights — an editorial convention that gives typography the job of
 * emphasizing magnitude. Tabular figures are enforced by CSS.
 */
export const Amount = ({
  value,
  size = 'sm',
  semantic = true,
  signed = false,
  hideCurrency = false,
  hideFraction = false,
  locale = 'de-CH',
  className,
  ...rest
}: AmountProps) => {
  const { int, frac } = splitFormatted(value, locale);
  const negative = value.amount < 0;
  const sign = negative ? '−' : signed ? '+' : '';
  const fracDigits = frac.replace(/\D/g, ''); // "00" from ".00"

  const sizeCls = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }[size];

  const weightCls = {
    sm: 'font-medium',
    md: 'font-medium',
    lg: 'font-semibold tracking-tight',
    xl: 'font-semibold tracking-tight',
  }[size];

  const colorCls = !semantic
    ? 'text-ink'
    : negative
      ? 'text-[var(--color-debit)]'
      : signed
        ? 'text-[var(--color-credit)]'
        : 'text-ink';

  return (
    <span
      className={cn(
        'tabular inline-flex items-baseline gap-1',
        sizeCls,
        weightCls,
        colorCls,
        className,
      )}
      {...rest}
    >
      {!hideCurrency ? (
        <span className="text-ink-subtle text-[0.72em] font-normal tracking-wider uppercase">
          {value.currency}
        </span>
      ) : null}
      <span>
        {sign}
        {int}
      </span>
      {!hideFraction ? (
        <span className="text-ink-subtle text-[0.66em] font-normal">.{fracDigits}</span>
      ) : null}
    </span>
  );
};
