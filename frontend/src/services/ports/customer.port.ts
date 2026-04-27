import type { Result } from '@shared/lib/result';
import type { Customer } from '@entities/customer/model';

export interface ICustomerService {
  getById(customerId: string): Promise<Result<Customer>>;
  search(query: string, limit?: number): Promise<Result<readonly Customer[]>>;
}
