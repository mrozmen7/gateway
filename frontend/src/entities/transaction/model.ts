import type { Money } from '@shared/lib/money';

export type TransactionDirection = 'credit' | 'debit';

export type TransactionStatus =
  | 'pending' // accepted, not yet posted
  | 'processing' // routing through payment rails
  | 'posted' // settled on ledger
  | 'reversed' // posted then reversed
  | 'rejected' // validation or rail rejection
  | 'failed'; // system failure

export type TransactionKind =
  | 'transfer.internal'
  | 'transfer.sepa'
  | 'transfer.swift'
  | 'payment.qr_bill'
  | 'payment.card'
  | 'payment.standing_order'
  | 'deposit'
  | 'withdrawal'
  | 'fee'
  | 'interest';

/** Where this transaction has been across the microservice mesh. */
export interface TransactionStep {
  readonly service:
    | 'api-gateway'
    | 'identity-service'
    | 'customer-service'
    | 'account-service'
    | 'payment-service'
    | 'transaction-service'
    | 'audit-service'
    | 'notification-service';
  readonly action: string;
  readonly status: 'ok' | 'pending' | 'error';
  readonly startedAt: string;
  readonly durationMs: number;
  readonly note?: string;
}

export interface Transaction {
  readonly id: string;
  readonly traceId: string;
  readonly accountId: string;
  readonly counterpartyName: string;
  readonly counterpartyIban?: string;
  readonly amount: Money;
  readonly direction: TransactionDirection;
  readonly status: TransactionStatus;
  readonly kind: TransactionKind;
  readonly description: string;
  readonly bookedAt: string; // ISO — ledger-posted time
  readonly valueAt: string; // ISO — value date
  readonly reference?: string;
  readonly steps: readonly TransactionStep[];
}

export const txStatusLabel: Record<TransactionStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  posted: 'Posted',
  reversed: 'Reversed',
  rejected: 'Rejected',
  failed: 'Failed',
};

export const txKindLabel: Record<TransactionKind, string> = {
  'transfer.internal': 'Internal transfer',
  'transfer.sepa': 'SEPA transfer',
  'transfer.swift': 'SWIFT transfer',
  'payment.qr_bill': 'QR-bill payment',
  'payment.card': 'Card payment',
  'payment.standing_order': 'Standing order',
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  fee: 'Fee',
  interest: 'Interest',
};
