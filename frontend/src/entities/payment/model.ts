import type { Money } from '@shared/lib/money';

export type PaymentRail = 'internal' | 'sepa' | 'sepa_instant' | 'swift' | 'qr_bill';

export interface PaymentIntent {
  readonly sourceAccountId: string;
  readonly counterpartyName: string;
  readonly counterpartyIban: string;
  readonly amount: Money;
  readonly rail: PaymentRail;
  readonly reference?: string;
  readonly scheduledFor?: string; // ISO, omit for immediate
  readonly note?: string;
}

export interface PaymentQuote {
  readonly intent: PaymentIntent;
  readonly estimatedFee: Money;
  readonly estimatedArrival: string; // ISO
  readonly fxRate?: number;
  readonly quoteExpiresAt: string;
  readonly quoteId: string;
}

export interface PaymentReceipt {
  readonly transactionId: string;
  readonly traceId: string;
  readonly acceptedAt: string;
}
