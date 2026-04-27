import type { ICardService } from '../ports/card.port';
import type { Result } from '@shared/lib/result';
import { err, ok } from '@shared/lib/result';
import type { Card } from '@entities/card/model';
import type { Money } from '@shared/lib/money';
import { db } from './_fixtures';
import { delay } from './_latency';

export class FakeCardService implements ICardService {
  async listForCustomer(_customerId: string): Promise<Result<readonly Card[]>> {
    await delay();
    return ok(db.cards);
  }

  async getById(cardId: string): Promise<Result<Card>> {
    await delay();
    const c = db.cards.find((x) => x.id === cardId);
    if (!c) return err({ kind: 'notFound', message: 'Card not found.' });
    return ok(c);
  }

  async freeze(cardId: string): Promise<Result<Card>> {
    await delay();
    const i = db.cards.findIndex((x) => x.id === cardId);
    if (i < 0) return err({ kind: 'notFound', message: 'Card not found.' });
    const existing = db.cards[i];
    if (!existing) return err({ kind: 'notFound', message: 'Card not found.' });
    const updated: Card = { ...existing, status: 'frozen' };
    db.cards[i] = updated;
    return ok(updated);
  }

  async unfreeze(cardId: string): Promise<Result<Card>> {
    await delay();
    const i = db.cards.findIndex((x) => x.id === cardId);
    if (i < 0) return err({ kind: 'notFound', message: 'Card not found.' });
    const existing = db.cards[i];
    if (!existing) return err({ kind: 'notFound', message: 'Card not found.' });
    const updated: Card = { ...existing, status: 'active' };
    db.cards[i] = updated;
    return ok(updated);
  }

  async updateMonthlyLimit(cardId: string, limit: Money): Promise<Result<Card>> {
    await delay();
    const i = db.cards.findIndex((x) => x.id === cardId);
    if (i < 0) return err({ kind: 'notFound', message: 'Card not found.' });
    const existing = db.cards[i];
    if (!existing) return err({ kind: 'notFound', message: 'Card not found.' });
    const updated: Card = { ...existing, monthlyLimit: limit };
    db.cards[i] = updated;
    return ok(updated);
  }
}
