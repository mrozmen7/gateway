import type { ICardService } from '../ports/card.port';
import type { Result } from '@shared/lib/result';
import type { Card } from '@entities/card/model';
import type { Money } from '@shared/lib/money';
import { http } from './_client';

export class HttpCardService implements ICardService {
  listForCustomer(customerId: string): Promise<Result<readonly Card[]>> {
    return http(`/api/v1/customers/${customerId}/cards`);
  }
  getById(cardId: string): Promise<Result<Card>> {
    return http(`/api/v1/cards/${cardId}`);
  }
  freeze(cardId: string): Promise<Result<Card>> {
    return http(`/api/v1/cards/${cardId}/freeze`, { method: 'POST' });
  }
  unfreeze(cardId: string): Promise<Result<Card>> {
    return http(`/api/v1/cards/${cardId}/unfreeze`, { method: 'POST' });
  }
  updateMonthlyLimit(cardId: string, limit: Money): Promise<Result<Card>> {
    return http(`/api/v1/cards/${cardId}/limit`, { method: 'PUT', body: { limit } });
  }
}
