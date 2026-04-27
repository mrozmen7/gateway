import type { IPaymentService } from '../ports/payment.port';
import type { Result } from '@shared/lib/result';
import { err, ok } from '@shared/lib/result';
import type {
  PaymentIntent,
  PaymentQuote,
  PaymentReceipt,
} from '@entities/payment/model';
import { fromMajor } from '@shared/lib/money';
import { isValidIban } from '@shared/lib/iban';
import { delay } from './_latency';

/**
 * Quote cache — keyed by quoteId. Real backend would hold these in a short-TTL
 * cache on payment-service. Idempotency map prevents double-submit.
 */
const quoteCache = new Map<string, PaymentQuote>();
const idempotencyMap = new Map<string, PaymentReceipt>();

const feeFor = (intent: PaymentIntent): number => {
  switch (intent.rail) {
    case 'internal':
      return 0;
    case 'sepa':
      return 0;
    case 'sepa_instant':
      return 120; // CHF 1.20 minor
    case 'swift':
      return 2500; // CHF 25.00
    case 'qr_bill':
      return 0;
  }
};

const arrivalFor = (intent: PaymentIntent): string => {
  const now = Date.now();
  const shift: Record<typeof intent.rail, number> = {
    internal: 0,
    qr_bill: 1000 * 60 * 2,
    sepa_instant: 1000 * 60,
    sepa: 1000 * 60 * 60 * 24,
    swift: 1000 * 60 * 60 * 24 * 3,
  };
  return new Date(now + shift[intent.rail]).toISOString();
};

export class FakePaymentService implements IPaymentService {
  async quote(intent: PaymentIntent): Promise<Result<PaymentQuote>> {
    await delay(260, 520);
    if (intent.amount.amount <= 0)
      return err({ kind: 'validation', message: 'Amount must be greater than zero.' });
    if (!isValidIban(intent.counterpartyIban))
      return err({
        kind: 'validation',
        message: 'Invalid IBAN.',
        details: { counterpartyIban: 'Check the IBAN and try again.' },
      });
    const quoteId = `qte_${Math.random().toString(36).slice(2, 12)}`;
    const quote: PaymentQuote = {
      intent,
      estimatedFee: fromMajor(feeFor(intent) / 100, intent.amount.currency),
      estimatedArrival: arrivalFor(intent),
      quoteExpiresAt: new Date(Date.now() + 1000 * 60 * 2).toISOString(),
      quoteId,
    };
    quoteCache.set(quoteId, quote);
    return ok(quote);
  }

  async confirm(params: {
    quoteId: string;
    idempotencyKey: string;
  }): Promise<Result<PaymentReceipt>> {
    await delay(340, 640);
    const existing = idempotencyMap.get(params.idempotencyKey);
    if (existing) return ok(existing);

    const quote = quoteCache.get(params.quoteId);
    if (!quote) return err({ kind: 'notFound', message: 'Quote expired. Re-quote.' });
    if (new Date(quote.quoteExpiresAt).getTime() < Date.now())
      return err({ kind: 'conflict', message: 'Quote expired. Re-quote.' });

    const receipt: PaymentReceipt = {
      transactionId: `tx_${Math.random().toString(36).slice(2, 14)}`,
      traceId: Math.random().toString(16).slice(2, 18).padEnd(16, '0'),
      acceptedAt: new Date().toISOString(),
    };
    idempotencyMap.set(params.idempotencyKey, receipt);
    quoteCache.delete(params.quoteId);
    return ok(receipt);
  }

  async cancel(_transactionId: string): Promise<Result<void>> {
    await delay();
    return ok(undefined);
  }
}
