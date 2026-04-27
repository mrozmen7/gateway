import type { IPaymentService } from '../ports/payment.port';
import type { Result } from '@shared/lib/result';
import { err, ok } from '@shared/lib/result';
import type {
  PaymentIntent,
  PaymentQuote,
  PaymentReceipt,
} from '@entities/payment/model';
import { http } from './_client';
import { fromMajor } from '@shared/lib/money';

interface TransferResponseDto {
  readonly transactionId: string;
  readonly bookingReference: string;
  readonly status: string;
  readonly amount: string;
  readonly currency: string;
  readonly requestedBy: string;
  readonly correlationId: string;
}

const quoteCache = new Map<string, PaymentQuote>();

export class HttpPaymentService implements IPaymentService {
  async quote(intent: PaymentIntent): Promise<Result<PaymentQuote>> {
    if (intent.amount.amount <= 0) {
      return err({ kind: 'validation', message: 'Amount must be greater than zero.' });
    }

    const feeMinor =
      intent.rail === 'swift' ? 2500 : intent.rail === 'sepa_instant' ? 120 : 0;
    const arrivalShiftMs =
      intent.rail === 'internal'
        ? 15_000
        : intent.rail === 'sepa_instant'
          ? 60_000
          : intent.rail === 'swift'
            ? 3 * 24 * 60 * 60 * 1000
            : 24 * 60 * 60 * 1000;

    const quoteId = crypto.randomUUID();
    const quote: PaymentQuote = {
      intent,
      estimatedFee: fromMajor(feeMinor / 100, intent.amount.currency),
      estimatedArrival: new Date(Date.now() + arrivalShiftMs).toISOString(),
      quoteExpiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
      quoteId,
    };
    quoteCache.set(quoteId, quote);
    return ok(quote);
  }

  confirm(params: {
    quoteId: string;
    idempotencyKey: string;
  }): Promise<Result<PaymentReceipt>> {
    return (async () => {
      const quote = quoteCache.get(params.quoteId);
      if (!quote) {
        return err({ kind: 'notFound', message: 'Quote expired. Please re-quote.' });
      }

      const transfer = await http<TransferResponseDto>('/api/v1/transactions/transfers', {
        method: 'POST',
        body: {
          fromAccountId: quote.intent.sourceAccountId,
          toIban: quote.intent.counterpartyIban,
          amount: String(Math.abs(quote.intent.amount.amount / 100)),
          currency: quote.intent.amount.currency,
          description: quote.intent.reference || quote.intent.note || quote.intent.counterpartyName,
        },
        idempotencyKey: params.idempotencyKey,
      });

      if (!transfer.ok) return transfer;
      quoteCache.delete(params.quoteId);

      return ok({
        transactionId: transfer.value.transactionId,
        traceId: transfer.value.correlationId,
        acceptedAt: new Date().toISOString(),
      });
    })();
  }

  cancel(_transactionId: string): Promise<Result<void>> {
    return Promise.resolve(ok(undefined));
  }
}
