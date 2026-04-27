import type { Result } from '@shared/lib/result';
import type { Card } from '@entities/card/model';
import type { Money } from '@shared/lib/money';

export interface ICardService {
  listForCustomer(customerId: string): Promise<Result<readonly Card[]>>;
  getById(cardId: string): Promise<Result<Card>>;
  freeze(cardId: string): Promise<Result<Card>>;
  unfreeze(cardId: string): Promise<Result<Card>>;
  updateMonthlyLimit(cardId: string, limit: Money): Promise<Result<Card>>;
}
