import type { Result } from '@shared/lib/result';
import type {
  PaymentIntent,
  PaymentQuote,
  PaymentReceipt,
} from '@entities/payment/model';

/** Maps to payment-service. Three-phase flow: quote → confirm → receipt. */
export interface IPaymentService {
  /** Produce a quote for a payment intent. Idempotent. */
  quote(intent: PaymentIntent): Promise<Result<PaymentQuote>>;

  /** Commit a previously returned quote. Server-side idempotency key required. */
  confirm(params: {
    quoteId: string;
    idempotencyKey: string;
  }): Promise<Result<PaymentReceipt>>;

  /** Cancel a still-pending payment. */
  cancel(transactionId: string): Promise<Result<void>>;
}
