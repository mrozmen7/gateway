import { type HTMLAttributes, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@shared/lib/cn';
import { formatIban, maskIban } from '@shared/lib/iban';
import { formatDateTime, formatTimePrecise, formatRelative } from '@shared/lib/date';
import type {
  TransactionStatus,
} from '@entities/transaction/model';
import type { ServiceHealth } from '@entities/audit/model';

// -- AccountNumber ------------------------------------------------------------

interface AccountNumberProps extends HTMLAttributes<HTMLSpanElement> {
  readonly iban: string;
  readonly masked?: boolean;
}
export const AccountNumber = ({ iban, masked, className, ...rest }: AccountNumberProps) => (
  <span
    className={cn(
      'font-mono text-xs tracking-[0.04em] text-ink-muted tabular',
      className,
    )}
    {...rest}
  >
    {masked ? maskIban(iban) : formatIban(iban)}
  </span>
);

// -- Copy-to-clipboard helper -------------------------------------------------

const CopyableMono = ({
  text,
  label,
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);
  const onCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };
  return (
    <button
      type="button"
      onClick={() => {
        void onCopy();
      }}
      aria-label={label ? `Copy ${label}` : 'Copy'}
      className={cn(
        'group inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted',
        'hover:text-ink transition-colors duration-120 ease-swiss',
        className,
      )}
    >
      <span className="tabular">{text}</span>
      {copied ? (
        <Check className="h-3 w-3 text-[var(--color-credit)]" />
      ) : (
        <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
};

// -- TransactionId / TraceId --------------------------------------------------

export const TransactionId = ({ id, className }: { id: string; className?: string }) => (
  <CopyableMono text={id} label="transaction id" {...(className ? { className } : {})} />
);

export const TraceId = ({ id, className }: { id: string; className?: string }) => (
  <CopyableMono text={id} label="trace id" {...(className ? { className } : {})} />
);

// -- Timestamp ----------------------------------------------------------------

interface TimestampProps {
  readonly value: string;
  /** 'date-time' (default) = dd.MM.yyyy · HH:mm. 'precise' = HH:mm:ss.SSS */
  readonly variant?: 'date-time' | 'precise' | 'relative';
  readonly className?: string;
}
export const Timestamp = ({ value, variant = 'date-time', className }: TimestampProps) => {
  const formatted =
    variant === 'precise'
      ? formatTimePrecise(value)
      : variant === 'relative'
        ? formatRelative(value)
        : formatDateTime(value);
  const abs = formatDateTime(value);
  return (
    <span
      title={abs}
      className={cn('tabular text-xs text-ink-muted', className)}
    >
      {formatted}
    </span>
  );
};

// -- Status (transaction) -----------------------------------------------------

const txStatusStyle: Record<TransactionStatus, string> = {
  pending: 'text-ink-muted bg-paper-sunken',
  processing: 'text-[var(--color-warning)] bg-[color-mix(in_srgb,var(--color-warning)_12%,transparent)]',
  posted: 'text-[var(--color-credit)] bg-[color-mix(in_srgb,var(--color-credit)_10%,transparent)]',
  reversed: 'text-ink-muted bg-paper-sunken',
  rejected: 'text-[var(--color-debit)] bg-[color-mix(in_srgb,var(--color-debit)_10%,transparent)]',
  failed: 'text-[var(--color-debit)] bg-[color-mix(in_srgb,var(--color-debit)_10%,transparent)]',
};

const txStatusLabels: Record<TransactionStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  posted: 'Posted',
  reversed: 'Reversed',
  rejected: 'Rejected',
  failed: 'Failed',
};

export const Status = ({
  status,
  className,
}: {
  status: TransactionStatus;
  className?: string;
}) => (
  <span
    className={cn(
      'inline-flex items-center h-5 px-1.5 text-2xs font-medium tracking-[0.04em] uppercase',
      'rounded-sm',
      txStatusStyle[status],
      className,
    )}
  >
    {txStatusLabels[status]}
  </span>
);

// -- HealthDot (service) ------------------------------------------------------

export const HealthDot = ({ health }: { health: ServiceHealth }) => {
  const color =
    health === 'healthy'
      ? 'var(--color-credit)'
      : health === 'degraded'
        ? 'var(--color-warning)'
        : 'var(--color-debit)';
  return (
    <span
      aria-label={health}
      className="relative inline-flex h-2 w-2"
    >
      <span
        className="absolute inset-0 rounded-full opacity-30 animate-ping"
        style={{ background: color, animationDuration: '2.4s' }}
      />
      <span
        className="relative inline-block h-2 w-2 rounded-full"
        style={{ background: color }}
      />
    </span>
  );
};

// -- DeltaPill ----------------------------------------------------------------

export const DeltaPill = ({
  value,
  suffix = '%',
}: {
  value: number;
  suffix?: string;
}) => {
  const positive = value >= 0;
  return (
    <span
      className={cn(
        'tabular inline-flex items-center h-5 px-1.5 rounded-sm text-2xs font-medium',
        positive
          ? 'text-[var(--color-credit)] bg-[color-mix(in_srgb,var(--color-credit)_10%,transparent)]'
          : 'text-[var(--color-debit)] bg-[color-mix(in_srgb,var(--color-debit)_10%,transparent)]',
      )}
    >
      {positive ? '+' : '−'}
      {Math.abs(value).toFixed(2)}
      {suffix}
    </span>
  );
};
