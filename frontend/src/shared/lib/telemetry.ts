/**
 * Telemetry — stub implementation.
 *
 * Every tracked user action calls track(). Today this logs to console so the
 * call sites are visible during development. Later this will POST to
 * notification-service / audit-service via the gateway. The call sites exist
 * now so that hook-up is purely wiring, not a refactor.
 */

export type TrackedEvent =
  | { type: 'auth.login.submitted'; email: string }
  | { type: 'auth.login.succeeded'; userId: string }
  | { type: 'auth.login.failed'; reason: string }
  | { type: 'auth.mfa.submitted' }
  | { type: 'auth.logout' }
  | { type: 'nav.route.changed'; path: string }
  | { type: 'accounts.overview.viewed' }
  | { type: 'account.opened'; accountId: string }
  | { type: 'transfer.started' }
  | { type: 'transfer.step'; step: number }
  | { type: 'transfer.submitted'; amount: number; currency: string }
  | { type: 'transfer.confirmed'; transactionId: string }
  | { type: 'ops.transaction.inspected'; transactionId: string }
  | { type: 'ops.service.drilldown'; service: string };

export const track = (event: TrackedEvent): void => {
  // eslint-disable-next-line no-console
  console.debug(
    '%c[track]%c %s',
    'color:#1B2A3A;font-weight:600',
    'color:inherit',
    event.type,
    event,
  );
};
