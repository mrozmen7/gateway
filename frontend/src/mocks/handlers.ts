/**
 * MSW handlers.
 *
 * These exist to make the future HTTP contract real during development.
 * Every handler intercepts a /api/v1/* endpoint and delegates to the fake
 * adapter family, then returns the unwrapped value as JSON. When the real
 * gateway lands, these handlers are deleted and the http/ adapter stubs call
 * the real endpoints directly with the same shapes.
 */

import { http, HttpResponse } from 'msw';
import { FakeIdentityService } from '@services/fake/identity.fake';
import { FakeAccountService } from '@services/fake/account.fake';
import { FakeCustomerService } from '@services/fake/customer.fake';
import { FakeTransactionService } from '@services/fake/transaction.fake';
import { FakePaymentService } from '@services/fake/payment.fake';
import { FakeAuditService } from '@services/fake/audit.fake';
import { FakeNotificationService } from '@services/fake/notification.fake';
import { FakeCardService } from '@services/fake/card.fake';

const identity = new FakeIdentityService();
const account = new FakeAccountService();
const customer = new FakeCustomerService();
const transaction = new FakeTransactionService();
const payment = new FakePaymentService();
const audit = new FakeAuditService();
const notification = new FakeNotificationService();
const card = new FakeCardService();

// -- helpers ------------------------------------------------------------------

const unwrap = async <T>(
  p: Promise<
    | { ok: true; value: T }
    | { ok: false; error: { kind: string; message: string; status?: number } }
  >,
): Promise<Response> => {
  const r = await p;
  if (r.ok) return HttpResponse.json(r.value as Parameters<typeof HttpResponse.json>[0]);
  const statusMap: Record<string, number> = {
    network: 503,
    unauthorized: 401,
    forbidden: 403,
    notFound: 404,
    validation: 422,
    conflict: 409,
    rateLimited: 429,
    server: 500,
    unknown: 500,
  };
  const status = statusMap[r.error.kind] ?? 500;
  return HttpResponse.json({ message: r.error.message, kind: r.error.kind }, { status });
};

// -- handlers -----------------------------------------------------------------

export const handlers = [
  // Auth
  http.post('*/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    return unwrap(identity.login(body));
  }),
  http.post('*/api/v1/auth/mfa/verify', async ({ request }) => {
    const body = (await request.json()) as { challengeId: string; code: string };
    return unwrap(identity.verifyMfa(body));
  }),
  http.get('*/api/v1/auth/session', () => unwrap(identity.currentSession())),
  http.post('*/api/v1/auth/logout', () => unwrap(identity.logout())),

  // Customers
  http.get('*/api/v1/customers/:id', ({ params }) =>
    unwrap(customer.getById(String(params['id']))),
  ),
  http.get('*/api/v1/customers/search', ({ request }) => {
    const url = new URL(request.url);
    return unwrap(customer.search(url.searchParams.get('q') ?? ''));
  }),

  // Accounts
  http.get('*/api/v1/customers/:id/accounts', ({ params }) =>
    unwrap(account.listForCustomer(String(params['id']))),
  ),
  http.get('*/api/v1/accounts/:id', ({ params }) =>
    unwrap(account.getById(String(params['id']))),
  ),
  http.get('*/api/v1/accounts/:id/balance-series', ({ params, request }) => {
    const url = new URL(request.url);
    return unwrap(
      account.getBalanceSeries({
        accountId: String(params['id']),
        from: url.searchParams.get('from') ?? '',
        to: url.searchParams.get('to') ?? '',
        granularity:
          (url.searchParams.get('granularity') as 'day' | 'week' | 'month') ?? 'day',
      }),
    );
  }),

  // Transactions
  http.post('*/api/v1/transactions', async ({ request }) => {
    const body = (await request.json()) as Parameters<
      FakeTransactionService['list']
    >[0];
    return unwrap(transaction.list(body));
  }),
  http.get('*/api/v1/transactions/:id', ({ params }) =>
    unwrap(transaction.getById(String(params['id']))),
  ),
  http.get('*/api/v1/transactions/by-trace/:trace', ({ params }) =>
    unwrap(transaction.getByTraceId(String(params['trace']))),
  ),

  // Payments
  http.post('*/api/v1/payments/quote', async ({ request }) =>
    unwrap(payment.quote((await request.json()) as never)),
  ),
  http.post('*/api/v1/payments/confirm', async ({ request }) => {
    const idempotencyKey = request.headers.get('idempotency-key') ?? '';
    const body = (await request.json()) as { quoteId: string };
    return unwrap(payment.confirm({ quoteId: body.quoteId, idempotencyKey }));
  }),
  http.post('*/api/v1/payments/:id/cancel', ({ params }) =>
    unwrap(payment.cancel(String(params['id']))),
  ),

  // Audit / ops
  http.post('*/api/v1/audit', async ({ request }) => {
    const body = (await request.json()) as Parameters<FakeAuditService['list']>[0];
    return unwrap(audit.list(body));
  }),
  http.get('*/api/v1/audit/by-trace/:trace', ({ params }) =>
    unwrap(audit.getByTraceId(String(params['trace']))),
  ),
  http.get('*/api/v1/ops/platform-health', () => unwrap(audit.platformHealth())),

  // Notifications
  http.get('*/api/v1/notifications', ({ request }) => {
    const url = new URL(request.url);
    return unwrap(
      notification.list({ unreadOnly: url.searchParams.get('unreadOnly') === 'true' }),
    );
  }),
  http.post('*/api/v1/notifications/:id/read', ({ params }) =>
    unwrap(notification.markRead(String(params['id']))),
  ),
  http.post('*/api/v1/notifications/read-all', () => unwrap(notification.markAllRead())),

  // Cards
  http.get('*/api/v1/customers/:id/cards', ({ params }) =>
    unwrap(card.listForCustomer(String(params['id']))),
  ),
  http.get('*/api/v1/cards/:id', ({ params }) =>
    unwrap(card.getById(String(params['id']))),
  ),
  http.post('*/api/v1/cards/:id/freeze', ({ params }) =>
    unwrap(card.freeze(String(params['id']))),
  ),
  http.post('*/api/v1/cards/:id/unfreeze', ({ params }) =>
    unwrap(card.unfreeze(String(params['id']))),
  ),
];
