import type { IAccountService, BalanceSeriesPoint } from '../ports/account.port';
import type { Result } from '@shared/lib/result';
import { err, ok } from '@shared/lib/result';
import type { Account } from '@entities/account/model';
import { fromMajor } from '@shared/lib/money';
import { db } from './_fixtures';
import { delay } from './_latency';

export class FakeAccountService implements IAccountService {
  async listForCustomer(_customerId: string): Promise<Result<readonly Account[]>> {
    await delay();
    return ok(db.accounts);
  }

  async getById(accountId: string): Promise<Result<Account>> {
    await delay();
    const acc = db.accounts.find((a) => a.id === accountId);
    if (!acc) return err({ kind: 'notFound', message: 'Account not found.' });
    return ok(acc);
  }

  async getBalanceSeries(params: {
    accountId: string;
    from: string;
    to: string;
    granularity: 'day' | 'week' | 'month';
  }): Promise<Result<readonly BalanceSeriesPoint[]>> {
    await delay();
    const acc = db.accounts.find((a) => a.id === params.accountId);
    if (!acc) return err({ kind: 'notFound', message: 'Account not found.' });

    // Synthesize a smooth series ending at the current balance.
    const end = acc.balance.amount / 100;
    const points = 90;
    const out: BalanceSeriesPoint[] = [];
    let cursor = new Date(params.to);
    let value = end * 0.82;
    for (let i = 0; i < points; i += 1) {
      // Slow upward drift with modest weekly variance
      const drift = (end - value) * 0.022;
      const noise = Math.sin(i / 4) * end * 0.004 + (Math.random() - 0.5) * end * 0.008;
      value += drift + noise;
      out.unshift({
        date: cursor.toISOString().slice(0, 10),
        balance: fromMajor(Math.round(value * 100) / 100, acc.currency),
      });
      cursor = new Date(cursor.getTime() - 1000 * 60 * 60 * 24);
    }
    // Final point exactly equals current balance
    const last = out[out.length - 1];
    if (last) out[out.length - 1] = { ...last, balance: acc.balance };
    return ok(out);
  }
}
