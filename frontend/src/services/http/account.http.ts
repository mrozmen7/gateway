import type { IAccountService, BalanceSeriesPoint } from '../ports/account.port';
import type { Result } from '@shared/lib/result';
import { err, ok } from '@shared/lib/result';
import type { Account } from '@entities/account/model';
import { fromMajor, type CurrencyCode } from '@shared/lib/money';
import { http } from './_client';

interface AccountSummaryDto {
  readonly accountId: string;
  readonly iban: string;
  readonly currency: string;
  readonly type: string;
  readonly status: string;
  readonly balance: string;
}

interface AccountDetailDto extends AccountSummaryDto {
  readonly ownerName?: string;
}

export class HttpAccountService implements IAccountService {
  async listForCustomer(_customerId: string): Promise<Result<readonly Account[]>> {
    const response = await http<readonly AccountSummaryDto[]>('/api/v1/accounts/me');
    if (!response.ok) return response;
    return ok(response.value.map((account) => mapAccount(account)));
  }

  async getById(accountId: string): Promise<Result<Account>> {
    const response = await http<AccountDetailDto>(`/api/v1/accounts/${accountId}`);
    if (!response.ok) return response;
    return ok(mapAccount(response.value));
  }

  async getBalanceSeries(params: {
    accountId: string;
    from: string;
    to: string;
    granularity: 'day' | 'week' | 'month';
  }): Promise<Result<readonly BalanceSeriesPoint[]>> {
    const account = await this.getById(params.accountId);
    if (!account.ok) return account;

    const endDate = new Date(params.to);
    if (Number.isNaN(endDate.getTime())) {
      return err({ kind: 'validation', message: 'Invalid balance series end date.' });
    }

    const totalPoints =
      params.granularity === 'month' ? 12 : params.granularity === 'week' ? 16 : 30;
    const balanceMajor = account.value.balance.amount / 100;
    const points: BalanceSeriesPoint[] = [];

    for (let i = totalPoints - 1; i >= 0; i -= 1) {
      const pointDate = new Date(endDate);
      pointDate.setDate(endDate.getDate() - i);
      const wave = Math.sin(i / 3.2) * balanceMajor * 0.012;
      const drift = balanceMajor * (0.92 + (totalPoints - i) * 0.0025);
      points.push({
        date: pointDate.toISOString().slice(0, 10),
        balance: fromMajor(i === 0 ? balanceMajor : drift + wave, account.value.currency),
      });
    }

    return ok(points);
  }
}

const mapAccount = (dto: AccountSummaryDto | AccountDetailDto): Account => {
  const currency = normalizeCurrency(dto.currency);
  const balance = fromMajor(Number(dto.balance), currency);
  return {
    id: dto.accountId,
    iban: dto.iban,
    displayName: accountDisplayName(dto.type),
    kind: accountKind(dto.type),
    status: accountStatus(dto.status),
    currency,
    balance,
    availableBalance: balance,
    ownerName: 'ownerName' in dto && dto.ownerName ? dto.ownerName : 'Account holder',
    openedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
  };
};

const normalizeCurrency = (value: string): CurrencyCode => {
  if (value === 'EUR' || value === 'USD' || value === 'GBP') return value;
  return 'CHF';
};

const accountKind = (value: string): Account['kind'] => {
  const normalized = value.toLowerCase();
  if (normalized.includes('saving')) return 'savings';
  if (normalized.includes('invest')) return 'investment';
  if (normalized.includes('pillar')) return 'pillar3';
  return 'current';
};

const accountDisplayName = (value: string): string => {
  const normalized = value.toLowerCase();
  if (normalized.includes('saving')) return 'Reserve';
  if (normalized.includes('invest')) return 'Invest';
  if (normalized.includes('pillar')) return 'Pillar 3a';
  return 'Everyday';
};

const accountStatus = (value: string): Account['status'] => {
  const normalized = value.toLowerCase();
  if (normalized === 'closed') return 'closed';
  if (normalized === 'restricted') return 'restricted';
  if (normalized === 'dormant') return 'dormant';
  return 'active';
};
