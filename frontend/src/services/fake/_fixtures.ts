/**
 * Fixtures.
 *
 * A single deterministic in-memory dataset that every `fake/` adapter reads
 * from. Determinism matters: demos and tests must produce the same numbers on
 * every reload. We seed faker accordingly.
 *
 * The shape of each record matches the ports' domain types exactly. When the
 * real backend arrives, these fakes can be deleted and the http/ adapters
 * light up the same domain types.
 */

import { faker } from '@faker-js/faker/locale/de_CH';
import type { Account } from '@entities/account/model';
import type { Customer } from '@entities/customer/model';
import type { Transaction, TransactionStep } from '@entities/transaction/model';
import type { AuditEntry, RiskDecisionEntry, ServiceStatus } from '@entities/audit/model';
import type { Card } from '@entities/card/model';
import type { Notification } from '@services/ports/notification.port';
import { fromMajor } from '@shared/lib/money';

faker.seed(20260420);

// -- Demo customer ------------------------------------------------------------

export const DEMO_CUSTOMER_ID = 'cust_01HV7A3GKQZX';
export const DEMO_OPERATOR_ID = 'op_01HV7A3MN7QY';

const demoCustomer: Customer = {
  id: DEMO_CUSTOMER_ID,
  displayName: 'Elena Brunner',
  email: 'elena.brunner@helvetiq.example',
  phone: '+41 79 123 45 67',
  country: 'CH',
  locale: 'de-CH',
  kycStatus: 'verified',
  segment: 'premier',
  createdAt: '2021-03-14T09:12:00Z',
  lastLoginAt: '2026-04-19T07:42:11Z',
};

// -- Accounts ------------------------------------------------------------------

const iban = (n: string): string => `CH93 0076 2011 6238 ${n.padStart(4, '0')} 1`;

const accounts: Account[] = [
  {
    id: 'acc_current_01',
    iban: iban('5295'),
    displayName: 'Everyday',
    kind: 'current',
    status: 'active',
    currency: 'CHF',
    balance: fromMajor(12_486.32, 'CHF'),
    availableBalance: fromMajor(12_286.32, 'CHF'),
    ownerName: demoCustomer.displayName,
    openedAt: '2021-03-14T09:12:00Z',
    lastActivityAt: '2026-04-19T14:02:00Z',
  },
  {
    id: 'acc_savings_01',
    iban: iban('8814'),
    displayName: 'Reserve',
    kind: 'savings',
    status: 'active',
    currency: 'CHF',
    balance: fromMajor(84_210.0, 'CHF'),
    availableBalance: fromMajor(84_210.0, 'CHF'),
    ownerName: demoCustomer.displayName,
    openedAt: '2021-06-02T10:00:00Z',
    lastActivityAt: '2026-04-01T08:00:00Z',
  },
  {
    id: 'acc_invest_01',
    iban: iban('2207'),
    displayName: 'Invest',
    kind: 'investment',
    status: 'active',
    currency: 'CHF',
    balance: fromMajor(163_904.18, 'CHF'),
    availableBalance: fromMajor(163_904.18, 'CHF'),
    ownerName: demoCustomer.displayName,
    openedAt: '2022-11-19T10:00:00Z',
    lastActivityAt: '2026-04-17T16:30:00Z',
  },
  {
    id: 'acc_pillar3_01',
    iban: iban('4063'),
    displayName: 'Pillar 3a',
    kind: 'pillar3',
    status: 'active',
    currency: 'CHF',
    balance: fromMajor(29_651.1, 'CHF'),
    availableBalance: fromMajor(29_651.1, 'CHF'),
    ownerName: demoCustomer.displayName,
    openedAt: '2023-01-09T10:00:00Z',
    lastActivityAt: '2026-03-31T23:59:00Z',
  },
];

// -- Transactions --------------------------------------------------------------

const swissMerchants = [
  'Migros Winterthur',
  'Coop Pronto Hauptbahnhof',
  'SBB Billettautomat',
  'Zürcher Verkehrsbetriebe',
  'Sprüngli Paradeplatz',
  'Manor Food',
  'Apotheke zur Rose',
  'Swisscom AG',
  'Elektrizitätswerk Winterthur',
  'Kantonsspital Winterthur',
  'Bäckerei Zemp',
  'Restaurant Kronenhalle',
  'Bally Shoe Factories',
  'Digitec Galaxus',
  'IKEA Spreitenbach',
];

const txKinds = [
  'payment.card',
  'transfer.internal',
  'transfer.sepa',
  'payment.qr_bill',
  'payment.standing_order',
  'deposit',
  'fee',
] as const;

const buildSteps = (kindId: string): TransactionStep[] => {
  const base = new Date('2026-04-19T10:00:00Z').getTime();
  const ms = (ts: number): string => new Date(base + ts).toISOString();
  if (kindId.startsWith('transfer') || kindId.startsWith('payment')) {
    return [
      { service: 'api-gateway', action: 'ingress.accept', status: 'ok', startedAt: ms(0), durationMs: 4 },
      { service: 'identity-service', action: 'session.validate', status: 'ok', startedAt: ms(4), durationMs: 7 },
      { service: 'customer-service', action: 'customer.load', status: 'ok', startedAt: ms(11), durationMs: 12 },
      { service: 'account-service', action: 'account.checkFunds', status: 'ok', startedAt: ms(23), durationMs: 18 },
      { service: 'payment-service', action: 'payment.route', status: 'ok', startedAt: ms(41), durationMs: 34 },
      { service: 'transaction-service', action: 'transaction.post', status: 'ok', startedAt: ms(75), durationMs: 22 },
      { service: 'audit-service', action: 'audit.emit', status: 'ok', startedAt: ms(97), durationMs: 3, note: 'via outbox → kafka' },
      { service: 'notification-service', action: 'notify.push', status: 'ok', startedAt: ms(100), durationMs: 11 },
    ];
  }
  return [
    { service: 'account-service', action: 'ledger.post', status: 'ok', startedAt: ms(0), durationMs: 9 },
    { service: 'audit-service', action: 'audit.emit', status: 'ok', startedAt: ms(9), durationMs: 2 },
  ];
};

const genTxId = (): string =>
  `tx_${faker.string.alphanumeric({ length: 20, casing: 'lower' })}`;
const genTraceId = (): string =>
  faker.string.hexadecimal({ length: 16, casing: 'lower', prefix: '' });

const buildTransactions = (): Transaction[] => {
  const out: Transaction[] = [];
  const now = new Date('2026-04-19T15:00:00Z').getTime();
  for (let i = 0; i < 140; i += 1) {
    const kind = faker.helpers.arrayElement(txKinds);
    const direction = kind === 'deposit' ? 'credit' : faker.helpers.weightedArrayElement([
      { weight: 0.8, value: 'debit' as const },
      { weight: 0.2, value: 'credit' as const },
    ]);
    const majorAbs = faker.number.float({ min: 4.5, max: kind === 'deposit' ? 3400 : 420, fractionDigits: 2 });
    const signed = direction === 'debit' ? -majorAbs : majorAbs;
    const booked = new Date(now - i * 1000 * 60 * 60 * faker.number.float({ min: 0.4, max: 8 })).toISOString();
    const status = faker.helpers.weightedArrayElement([
      { weight: 0.82, value: 'posted' as const },
      { weight: 0.08, value: 'pending' as const },
      { weight: 0.05, value: 'processing' as const },
      { weight: 0.03, value: 'rejected' as const },
      { weight: 0.02, value: 'reversed' as const },
    ]);
    const counterparty =
      kind === 'payment.card'
        ? faker.helpers.arrayElement(swissMerchants)
        : kind === 'transfer.internal'
          ? 'Own account — Reserve'
          : faker.person.fullName();
    const reference = faker.helpers.maybe(() => faker.finance.routingNumber(), {
      probability: 0.35,
    });
    const transactionBase = {
      id: genTxId(),
      traceId: genTraceId(),
      accountId: faker.helpers.arrayElement(accounts).id,
      counterpartyName: counterparty,
      amount: fromMajor(signed, 'CHF'),
      direction,
      status,
      kind,
      description:
        kind === 'payment.card'
          ? `Card payment — ${counterparty}`
          : kind === 'transfer.internal'
            ? 'Transfer between own accounts'
            : kind === 'transfer.sepa'
              ? `SEPA — ${counterparty}`
              : kind === 'payment.qr_bill'
                ? 'Swiss QR-bill'
                : kind === 'fee'
                  ? 'Monthly account fee'
                  : kind === 'deposit'
                    ? 'Salary'
                    : 'Transaction',
      bookedAt: booked,
      valueAt: booked,
      steps: buildSteps(kind),
    };
    out.push({
      ...transactionBase,
      ...(reference ? { reference } : {}),
      ...(kind.startsWith('transfer')
        ? { counterpartyIban: iban(String(faker.number.int({ min: 1000, max: 9999 }))) }
        : {}),
    });
  }
  return out.sort((a, b) => b.bookedAt.localeCompare(a.bookedAt));
};

const transactions = buildTransactions();

// -- Cards ---------------------------------------------------------------------

const cards: Card[] = [
  {
    id: 'card_01',
    last4: '4218',
    expiry: '09/28',
    network: 'visa',
    type: 'debit',
    status: 'active',
    holder: 'ELENA BRUNNER',
    linkedAccountId: 'acc_current_01',
    monthlyLimit: fromMajor(5000, 'CHF'),
    monthlySpent: fromMajor(1284.5, 'CHF'),
  },
  {
    id: 'card_02',
    last4: '7731',
    expiry: '04/27',
    network: 'mastercard',
    type: 'credit',
    status: 'active',
    holder: 'ELENA BRUNNER',
    linkedAccountId: 'acc_current_01',
    monthlyLimit: fromMajor(10_000, 'CHF'),
    monthlySpent: fromMajor(2_416.8, 'CHF'),
  },
];

// -- Platform health -----------------------------------------------------------

const services_: ServiceStatus[] = [
  { service: 'api-gateway', health: 'healthy', version: '1.14.2', uptimePct: 99.98, p50LatencyMs: 12, p95LatencyMs: 48, p99LatencyMs: 112, requestsPerMin: 4820, errorRatePct: 0.02, lastCheckedAt: '2026-04-20T15:41:00Z' },
  { service: 'identity-service', health: 'healthy', version: '2.3.0', uptimePct: 99.995, p50LatencyMs: 8, p95LatencyMs: 31, p99LatencyMs: 84, requestsPerMin: 1210, errorRatePct: 0.01, lastCheckedAt: '2026-04-20T15:41:00Z' },
  { service: 'customer-service', health: 'healthy', version: '1.8.4', uptimePct: 99.97, p50LatencyMs: 14, p95LatencyMs: 52, p99LatencyMs: 141, requestsPerMin: 640, errorRatePct: 0.03, lastCheckedAt: '2026-04-20T15:41:00Z' },
  { service: 'account-service', health: 'healthy', version: '3.1.1', uptimePct: 99.99, p50LatencyMs: 18, p95LatencyMs: 71, p99LatencyMs: 182, requestsPerMin: 2104, errorRatePct: 0.01, lastCheckedAt: '2026-04-20T15:41:00Z' },
  { service: 'payment-service', health: 'degraded', version: '2.0.9', uptimePct: 99.82, p50LatencyMs: 42, p95LatencyMs: 318, p99LatencyMs: 1204, requestsPerMin: 318, errorRatePct: 0.41, kafkaLag: 1284, lastCheckedAt: '2026-04-20T15:41:00Z' },
  { service: 'transaction-service', health: 'healthy', version: '2.2.0', uptimePct: 99.96, p50LatencyMs: 22, p95LatencyMs: 88, p99LatencyMs: 214, requestsPerMin: 1490, errorRatePct: 0.04, kafkaLag: 18, lastCheckedAt: '2026-04-20T15:41:00Z' },
  { service: 'audit-service', health: 'healthy', version: '1.5.3', uptimePct: 99.998, p50LatencyMs: 6, p95LatencyMs: 19, p99LatencyMs: 44, requestsPerMin: 3920, errorRatePct: 0.0, kafkaLag: 0, lastCheckedAt: '2026-04-20T15:41:00Z' },
  { service: 'notification-service', health: 'healthy', version: '1.2.7', uptimePct: 99.94, p50LatencyMs: 28, p95LatencyMs: 102, p99LatencyMs: 248, requestsPerMin: 512, errorRatePct: 0.11, lastCheckedAt: '2026-04-20T15:41:00Z' },
];

// -- Audit ---------------------------------------------------------------------

const auditEntries: AuditEntry[] = Array.from({ length: 60 }).map((_, i) => {
  const ts = new Date(Date.now() - i * 1000 * 60 * faker.number.int({ min: 2, max: 40 })).toISOString();
  return {
    id: `aud_${faker.string.alphanumeric({ length: 14, casing: 'lower' })}`,
    timestamp: ts,
    actorId: faker.helpers.arrayElement([DEMO_CUSTOMER_ID, DEMO_OPERATOR_ID, 'system']),
    actorDisplayName: faker.helpers.arrayElement(['Elena Brunner', 'J. Meier (ops)', 'system']),
    actorType: faker.helpers.arrayElement(['customer', 'operator', 'system']),
    action: faker.helpers.arrayElement([
      'auth.login',
      'auth.mfa.verify',
      'account.view',
      'payment.confirm',
      'card.freeze',
      'customer.update',
      'session.revoke',
    ]),
    resource: 'account',
    resourceId: faker.helpers.arrayElement(accounts).id,
    severity: faker.helpers.weightedArrayElement([
      { weight: 0.6, value: 'info' as const },
      { weight: 0.25, value: 'notice' as const },
      { weight: 0.12, value: 'warning' as const },
      { weight: 0.03, value: 'critical' as const },
    ]),
    traceId: genTraceId(),
    ipAddress: faker.internet.ipv4(),
    userAgent: 'Mozilla/5.0 (Macintosh)',
  };
});

const riskDecisions: RiskDecisionEntry[] = [
  {
    decisionId: 'risk_demo_01',
    evaluatedAt: new Date(Date.now() - 45_000).toISOString(),
    eventId: 'evt_api_burst',
    correlationId: 'corr_burst_001',
    userId: 'cust-burst',
    username: 'burst.user',
    ipAddress: '10.10.10.10',
    endpoint: '/api/v1/accounts/me',
    riskScore: 0.3,
    ruleScore: 0.22,
    mlScore: 0.42,
    decision: 'monitor',
    reasons: ['sensitive_endpoint', 'elevated_request_frequency', 'ml_elevated_anomaly_score'],
    topFactors: ['request_count_1m', 'elevated_request_frequency', 'rapid_repeat_request'],
    features: {
      requestCount1m: 12,
      requestCount5m: 13,
      failedRequestCount5m: 0,
      endpointDiversity5m: 1,
      distinctIpCountByUser5m: 1,
      distinctUserCountByIp5m: 1,
      secondsSinceLastRequest: 0.01,
      offHours: false,
      source: 'redis',
    },
    source: 'composite-risk-v1',
    modelVersion: 'v1.0.0',
  },
  {
    decisionId: 'risk_demo_02',
    evaluatedAt: new Date(Date.now() - 90_000).toISOString(),
    eventId: 'evt_payment_failure',
    correlationId: 'corr_payment_401',
    userId: 'anonymous',
    username: 'anonymous',
    ipAddress: '192.168.65.1',
    endpoint: '/api/v1/payments',
    riskScore: 0.75,
    ruleScore: 0.72,
    mlScore: 0.81,
    decision: 'step_up',
    reasons: [
      'server_error_response',
      'slow_gateway_response',
      'anonymous_non_actuator_request',
      'sensitive_endpoint',
      'ml_anomaly_detected',
    ],
    topFactors: ['server_error_response', 'anonymous_non_actuator_request', 'failed_request_count_5m'],
    features: {
      requestCount1m: 3,
      requestCount5m: 8,
      failedRequestCount5m: 5,
      endpointDiversity5m: 4,
      distinctIpCountByUser5m: 1,
      distinctUserCountByIp5m: 2,
      secondsSinceLastRequest: 0.2,
      offHours: false,
      source: 'redis',
    },
    source: 'composite-risk-v1',
    modelVersion: 'v1.0.0',
  },
  {
    decisionId: 'risk_demo_03',
    evaluatedAt: new Date(Date.now() - 130_000).toISOString(),
    eventId: 'evt_prometheus',
    correlationId: 'corr_prom_001',
    userId: 'anonymous',
    username: 'anonymous',
    ipAddress: '172.18.0.10',
    endpoint: '/actuator/prometheus',
    riskScore: 0,
    ruleScore: 0,
    mlScore: 0,
    decision: 'allow',
    reasons: ['normal_request'],
    topFactors: ['normal_request'],
    features: {
      requestCount1m: 4,
      requestCount5m: 20,
      failedRequestCount5m: 0,
      endpointDiversity5m: 1,
      distinctIpCountByUser5m: 1,
      distinctUserCountByIp5m: 1,
      secondsSinceLastRequest: 14.9,
      offHours: false,
      source: 'redis',
    },
    source: 'composite-risk-v1',
    modelVersion: 'v1.0.0',
  },
];

// -- Notifications -------------------------------------------------------------

const notifications: Notification[] = [
  {
    id: 'not_01',
    title: 'Salary received',
    body: 'Your monthly salary of CHF 8,400.00 was credited to Everyday.',
    severity: 'success',
    channel: 'in_app',
    createdAt: '2026-04-19T06:03:00Z',
    readAt: null,
  },
  {
    id: 'not_02',
    title: 'Card payment declined',
    body: 'A payment at Bally Shoe Factories was declined due to a daily limit.',
    severity: 'warning',
    channel: 'in_app',
    createdAt: '2026-04-18T19:51:00Z',
    readAt: '2026-04-19T07:10:00Z',
    actionHref: '/cards/card_01',
  },
  {
    id: 'not_03',
    title: 'New device signed in',
    body: 'A new session started from a MacBook in Winterthur.',
    severity: 'info',
    channel: 'in_app',
    createdAt: '2026-04-18T09:00:00Z',
    readAt: '2026-04-18T09:01:00Z',
    actionHref: '/security',
  },
];

// -- Exports -------------------------------------------------------------------

export const db = {
  customer: demoCustomer,
  accounts,
  transactions,
  cards,
  services: services_,
  audit: auditEntries,
  riskDecisions,
  notifications,
};
