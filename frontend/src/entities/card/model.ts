import type { Money } from '@shared/lib/money';

export type CardNetwork = 'visa' | 'mastercard' | 'amex';
export type CardType = 'debit' | 'credit' | 'virtual';
export type CardStatus = 'active' | 'frozen' | 'blocked' | 'expired';

export interface Card {
  readonly id: string;
  readonly last4: string;
  readonly expiry: string; // MM/YY
  readonly network: CardNetwork;
  readonly type: CardType;
  readonly status: CardStatus;
  readonly holder: string;
  readonly linkedAccountId: string;
  readonly monthlyLimit: Money;
  readonly monthlySpent: Money;
}
