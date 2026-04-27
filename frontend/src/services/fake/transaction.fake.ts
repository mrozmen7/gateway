import type {
  ITransactionService,
  TransactionFilter,
  TransactionPage,
} from '../ports/transaction.port';
import type { Result } from '@shared/lib/result';
import { err, ok } from '@shared/lib/result';
import type { Transaction } from '@entities/transaction/model';
import { db } from './_fixtures';
import { delay } from './_latency';

const applyFilter = (tx: Transaction, f: TransactionFilter): boolean => {
  if (f.accountIds && f.accountIds.length > 0 && !f.accountIds.includes(tx.accountId))
    return false;
  if (f.from && tx.bookedAt < f.from) return false;
  if (f.to && tx.bookedAt > f.to) return false;
  if (f.status && f.status.length > 0 && !f.status.includes(tx.status)) return false;
  if (f.kind && f.kind.length > 0 && !f.kind.includes(tx.kind)) return false;
  if (
    f.minAmountMinor !== undefined &&
    Math.abs(tx.amount.amount) < f.minAmountMinor
  )
    return false;
  if (
    f.maxAmountMinor !== undefined &&
    Math.abs(tx.amount.amount) > f.maxAmountMinor
  )
    return false;
  if (f.search) {
    const q = f.search.toLowerCase();
    const hay = `${tx.counterpartyName} ${tx.description} ${tx.reference ?? ''}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
};

export class FakeTransactionService implements ITransactionService {
  async list(params: {
    filter: TransactionFilter;
    cursor?: string;
    limit?: number;
  }): Promise<Result<TransactionPage>> {
    await delay();
    const limit = params.limit ?? 25;
    const filtered = db.transactions.filter((t) => applyFilter(t, params.filter));
    const start = params.cursor ? Number(params.cursor) : 0;
    const slice = filtered.slice(start, start + limit);
    const next = start + limit < filtered.length ? String(start + limit) : null;
    return ok({ items: slice, total: filtered.length, nextCursor: next });
  }

  async getById(transactionId: string): Promise<Result<Transaction>> {
    await delay();
    const tx = db.transactions.find((t) => t.id === transactionId);
    if (!tx) return err({ kind: 'notFound', message: 'Transaction not found.' });
    return ok(tx);
  }

  async getByTraceId(traceId: string): Promise<Result<Transaction>> {
    await delay();
    const tx = db.transactions.find((t) => t.traceId === traceId);
    if (!tx) return err({ kind: 'notFound', message: 'Trace not found.' });
    return ok(tx);
  }
}
