import type { ICustomerService } from '../ports/customer.port';
import type { Result } from '@shared/lib/result';
import { err, ok } from '@shared/lib/result';
import type { Customer } from '@entities/customer/model';
import { db } from './_fixtures';
import { delay } from './_latency';

export class FakeCustomerService implements ICustomerService {
  async getById(customerId: string): Promise<Result<Customer>> {
    await delay();
    if (customerId !== db.customer.id)
      return err({ kind: 'notFound', message: 'Customer not found.' });
    return ok(db.customer);
  }

  async search(query: string): Promise<Result<readonly Customer[]>> {
    await delay();
    const q = query.toLowerCase();
    const hits = [db.customer].filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q),
    );
    return ok(hits);
  }
}
