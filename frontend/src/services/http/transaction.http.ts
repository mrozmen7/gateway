import type {
  ITransactionService,
  TransactionFilter,
  TransactionPage,
} from '../ports/transaction.port';
import type { Result } from '@shared/lib/result';
import { err, ok } from '@shared/lib/result';
import type { Transaction } from '@entities/transaction/model';
import { fromMajor } from '@shared/lib/money';
import { http } from './_client';

interface TransactionSummaryDto {
  readonly transactionId: string;
  readonly accountId: string;
  readonly direction: string;
  readonly type: string;
  readonly amount: string;
  readonly currency: string;
  readonly bookingDate: string;
  readonly status: string;
}

interface TransactionDetailDto extends TransactionSummaryDto {
  readonly counterpartyIban?: string;
  readonly description: string;
}

export class HttpTransactionService implements ITransactionService {
  async list(params: {
    filter: TransactionFilter;
    cursor?: string;
    limit?: number;
  }): Promise<Result<TransactionPage>> {
    const response = await http<readonly TransactionSummaryDto[]>('/api/v1/transactions/me');
    if (!response.ok) return response;

    const mapped = response.value.map((item) => mapTransactionSummary(item));
    const filtered = mapped.filter((tx) => applyFilter(tx, params.filter));
    const start = params.cursor ? Number(params.cursor) : 0;
    const limit = params.limit ?? 25;
    const items = filtered.slice(start, start + limit);
    const nextCursor = start + limit < filtered.length ? String(start + limit) : null;

    return ok({ items, total: filtered.length, nextCursor });
  }

  async getById(transactionId: string): Promise<Result<Transaction>> {
    const response = await http<TransactionDetailDto>(`/api/v1/transactions/${transactionId}`);
    if (!response.ok) return response;
    return ok(mapTransactionDetail(response.value));
  }

  getByTraceId(_traceId: string): Promise<Result<Transaction>> {
    return Promise.resolve(
      err({
        kind: 'notFound',
        message:
          'Trace lookup is not yet exposed by the backend. Use a transaction ID for now.',
      }),
    );
  }
}

const applyFilter = (tx: Transaction, filter: TransactionFilter): boolean => {
  if (filter.accountIds?.length && !filter.accountIds.includes(tx.accountId)) return false;
  if (filter.from && tx.bookedAt < filter.from) return false;
  if (filter.to && tx.bookedAt > filter.to) return false;
  if (filter.status?.length && !filter.status.includes(tx.status)) return false;
  if (filter.kind?.length && !filter.kind.includes(tx.kind)) return false;
  if (filter.minAmountMinor !== undefined && Math.abs(tx.amount.amount) < filter.minAmountMinor) return false;
  if (filter.maxAmountMinor !== undefined && Math.abs(tx.amount.amount) > filter.maxAmountMinor) return false;
  if (filter.search) {
    const q = filter.search.toLowerCase();
    const haystack = `${tx.id} ${tx.description} ${tx.counterpartyName} ${tx.counterpartyIban ?? ''}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
};

const mapTransactionSummary = (dto: TransactionSummaryDto): Transaction => ({
  id: dto.transactionId,
  traceId: dto.transactionId,
  accountId: dto.accountId,
  counterpartyName: kindCounterpartyLabel(dto.type, dto.direction),
  amount: moneyFromStrings(dto.amount, dto.currency, dto.direction),
  direction: mapDirection(dto.direction),
  status: mapStatus(dto.status),
  kind: mapKind(dto.type),
  description: transactionDescription(dto.type, dto.direction),
  bookedAt: `${dto.bookingDate}T12:00:00Z`,
  valueAt: `${dto.bookingDate}T12:00:00Z`,
  steps: syntheticSteps(`${dto.bookingDate}T12:00:00Z`, mapStatus(dto.status)),
});

const mapTransactionDetail = (dto: TransactionDetailDto): Transaction => ({
  id: dto.transactionId,
  traceId: dto.transactionId,
  accountId: dto.accountId,
  counterpartyName: dto.description || kindCounterpartyLabel(dto.type, dto.direction),
  ...(dto.counterpartyIban ? { counterpartyIban: dto.counterpartyIban } : {}),
  amount: moneyFromStrings(dto.amount, dto.currency, dto.direction),
  direction: mapDirection(dto.direction),
  status: mapStatus(dto.status),
  kind: mapKind(dto.type),
  description: dto.description,
  bookedAt: `${dto.bookingDate}T12:00:00Z`,
  valueAt: `${dto.bookingDate}T12:00:00Z`,
  steps: syntheticSteps(`${dto.bookingDate}T12:00:00Z`, mapStatus(dto.status)),
});

const moneyFromStrings = (amount: string, currency: string, direction: string) => {
  const major = Number(amount);
  const signedMajor = direction === 'DEBIT' ? -Math.abs(major) : Math.abs(major);
  return fromMajor(signedMajor, normalizeCurrency(currency));
};

const normalizeCurrency = (value: string) =>
  value === 'EUR' || value === 'USD' || value === 'GBP' ? value : 'CHF';

const mapDirection = (value: string): Transaction['direction'] =>
  value === 'CREDIT' ? 'credit' : 'debit';

const mapStatus = (value: string): Transaction['status'] => {
  const normalized = value.toUpperCase();
  if (normalized === 'PENDING') return 'pending';
  if (normalized === 'FAILED') return 'failed';
  if (normalized === 'REJECTED') return 'rejected';
  if (normalized === 'REVERSED') return 'reversed';
  if (normalized === 'PROCESSING') return 'processing';
  return 'posted';
};

const mapKind = (value: string): Transaction['kind'] => {
  const normalized = value.toUpperCase();
  if (normalized === 'CARD') return 'payment.card';
  if (normalized === 'FEE') return 'fee';
  if (normalized === 'SALARY') return 'deposit';
  return 'transfer.internal';
};

const transactionDescription = (type: string, direction: string): string => {
  const normalized = type.toUpperCase();
  if (normalized === 'SALARY') return 'Monthly salary';
  if (normalized === 'CARD') return 'Card payment';
  if (normalized === 'FEE') return 'Service fee';
  return direction === 'DEBIT' ? 'Outgoing transfer' : 'Incoming transfer';
};

const kindCounterpartyLabel = (type: string, direction: string): string => {
  const normalized = type.toUpperCase();
  if (normalized === 'SALARY') return 'Salary';
  if (normalized === 'CARD') return 'Card processor';
  if (normalized === 'FEE') return 'Bank fee';
  return direction === 'DEBIT' ? 'Transfer sent' : 'Transfer received';
};

const syntheticSteps = (startedAt: string, status: Transaction['status']): Transaction['steps'] => {
  const t0 = new Date(startedAt).getTime();
  const timeline = [
    ['api-gateway', 'request.accepted', 12],
    ['identity-service', 'jwt.validated', 8],
    ['customer-service', 'customer.verified', 18],
    ['account-service', 'balance.checked', 34],
    ['transaction-service', 'ledger.booked', 52],
    ['audit-service', 'audit.emitted', 11],
    ['notification-service', 'notification.enqueued', 9],
  ] as const;

  return timeline.map(([service, action, duration], index) => ({
    service,
    action,
    status: status === 'failed' || status === 'rejected' ? (index >= 4 ? 'error' : 'ok') : 'ok',
    startedAt: new Date(t0 + index * 20).toISOString(),
    durationMs: duration,
  }));
};
