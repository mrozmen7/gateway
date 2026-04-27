import type { Money, CurrencyCode } from '@shared/lib/money';

export type AccountKind = 'current' | 'savings' | 'investment' | 'pillar3';
export type AccountStatus = 'active' | 'dormant' | 'closed' | 'restricted';

export interface Account {
  readonly id: string;
  readonly iban: string;
  readonly displayName: string;
  readonly kind: AccountKind;
  readonly status: AccountStatus;
  readonly currency: CurrencyCode;
  readonly balance: Money;
  readonly availableBalance: Money;
  readonly ownerName: string;
  readonly openedAt: string; // ISO
  readonly lastActivityAt: string; // ISO
}

export const accountKindLabel: Record<AccountKind, string> = {
  current: 'Current',
  savings: 'Savings',
  investment: 'Investment',
  pillar3: 'Pillar 3a',
};
