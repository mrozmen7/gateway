import type { Result } from '@shared/lib/result';
import type { Account } from '@entities/account/model';
import type { Money } from '@shared/lib/money';

export interface BalanceSeriesPoint {
  readonly date: string; // ISO (date only)
  readonly balance: Money;
}

/** Maps to account-service. */
export interface IAccountService {
  listForCustomer(customerId: string): Promise<Result<readonly Account[]>>;

  getById(accountId: string): Promise<Result<Account>>;

  /** Time series for the account detail balance chart. */
  getBalanceSeries(params: {
    accountId: string;
    from: string;
    to: string;
    granularity: 'day' | 'week' | 'month';
  }): Promise<Result<readonly BalanceSeriesPoint[]>>;
}
