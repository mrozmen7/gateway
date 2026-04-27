/**
 * Service container.
 *
 * Components never import concrete adapters. They import `services` from here,
 * which resolves to either the `fake/` or `http/` implementation family based
 * on the VITE_USE_MOCKS flag. The moment the real API Gateway is ready, flip
 * the flag — zero component changes required.
 */

import type { IIdentityService } from './ports/identity.port';
import type { IAccountService } from './ports/account.port';
import type { ICustomerService } from './ports/customer.port';
import type { ITransactionService } from './ports/transaction.port';
import type { IPaymentService } from './ports/payment.port';
import type { IAuditService } from './ports/audit.port';
import type { INotificationService } from './ports/notification.port';
import type { ICardService } from './ports/card.port';

import { env } from '@shared/config/env';

import { FakeIdentityService } from './fake/identity.fake';
import { FakeAccountService } from './fake/account.fake';
import { FakeCustomerService } from './fake/customer.fake';
import { FakeTransactionService } from './fake/transaction.fake';
import { FakePaymentService } from './fake/payment.fake';
import { FakeAuditService } from './fake/audit.fake';
import { FakeNotificationService } from './fake/notification.fake';
import { FakeCardService } from './fake/card.fake';

import { HttpIdentityService } from './http/identity.http';
import { HttpAccountService } from './http/account.http';
import { HttpCustomerService } from './http/customer.http';
import { HttpTransactionService } from './http/transaction.http';
import { HttpPaymentService } from './http/payment.http';
import { HttpAuditService } from './http/audit.http';
import { HttpNotificationService } from './http/notification.http';

export interface ServiceContainer {
  readonly identity: IIdentityService;
  readonly account: IAccountService;
  readonly customer: ICustomerService;
  readonly transaction: ITransactionService;
  readonly payment: IPaymentService;
  readonly audit: IAuditService;
  readonly notification: INotificationService;
  readonly card: ICardService;
}

const buildContainer = (): ServiceContainer => {
  if (env.useMocks) {
    return {
      identity: new FakeIdentityService(),
      account: new FakeAccountService(),
      customer: new FakeCustomerService(),
      transaction: new FakeTransactionService(),
      payment: new FakePaymentService(),
      audit: new FakeAuditService(),
      notification: new FakeNotificationService(),
      card: new FakeCardService(),
    };
  }

  return {
    identity: new HttpIdentityService(),
    account: new HttpAccountService(),
    customer: new HttpCustomerService(),
    transaction: new HttpTransactionService(),
    payment: new HttpPaymentService(),
    audit: new HttpAuditService(),
    notification: new HttpNotificationService(),
    card: new FakeCardService(),
  };
};

export const services: ServiceContainer = buildContainer();
