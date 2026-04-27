import type { Result } from '@shared/lib/result';
import type { Transaction, TransactionStatus, TransactionKind } from '@entities/transaction/model';

export interface TransactionFilter {
  readonly accountIds?: readonly string[];
  readonly from?: string; // ISO
  readonly to?: string; // ISO
  readonly status?: readonly TransactionStatus[];
  readonly kind?: readonly TransactionKind[];
  readonly search?: string;
  readonly minAmountMinor?: number;
  readonly maxAmountMinor?: number;
}

export interface TransactionPage {
  readonly items: readonly Transaction[];
  readonly total: number;
  readonly nextCursor: string | null;
}

/** Maps to transaction-service. */
export interface ITransactionService {
  list(params: {
    filter: TransactionFilter;
    cursor?: string;
    limit?: number;
  }): Promise<Result<TransactionPage>>;

  getById(transactionId: string): Promise<Result<Transaction>>;

  /** Follow a payment across the microservice mesh — used by Ops Inspector. */
  getByTraceId(traceId: string): Promise<Result<Transaction>>;
}
