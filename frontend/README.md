# Helvetiq Bank — Frontend

Private digital banking client for the Helvetiq platform. Built to feel like a
Swiss institutional product: restrained typography, hairline structure, paper
and ink, one institutional accent.

This package is the UI layer only. The Helvetiq backend (API Gateway,
identity-service, customer-service, account-service, transaction-service,
payment-service, audit-service, notification-service, PostgreSQL, Kafka,
Prometheus/Grafana/Tempo/Loki) lives in the parent repository and is integrated
later via the adapter layer described below.

---

## Quick start

```bash
cd frontend
pnpm install
pnpm msw:init         # one-time — still useful when toggling back to mocks
pnpm dev
# open http://localhost:5173
```

### Real backend mode

This repository now includes a local `.env.local` wired for the banking backend:

```bash
VITE_USE_MOCKS=false
VITE_API_GATEWAY_URL=http://localhost:8090
VITE_DEV_PROXY_TARGET=http://localhost:8090
```

That means the browser talks directly to the API Gateway on `localhost:8090`.
The gateway allows the local Vite origin (`localhost` / `127.0.0.1` on port
`5173`) through CORS.

Real demo users:

- `yavuz` / `gateway!`
- `fatih` / `gateway123!`
- `marc.steiner` / `OpsPass123`
- `audrey.keller` / `AuditPass123`

Demo credentials:

- **Client (with MFA)** — any email, any password (min. 4 chars). MFA accepts any 6 digits; `000000` triggers the failure state.
- **Operator (no MFA)** — an email starting with `ops@`, any password.

---

## What's in the box

Four prioritized flows are implemented end-to-end against mock data:

| Flow | Route | What it demonstrates |
|---|---|---|
| Login + MFA | `/login` | Zod-validated form, editorial two-panel layout, MFA challenge/verify branch |
| Accounts Overview | `/` | Net position hero, accounts grid, recent activity with semantic money typography |
| Transfer Studio | `/move` | 3-step wizard (Details → Review → Confirm), real quote → confirm flow with idempotency |
| Platform Health | `/ops` | 8-service health grid with uptime, p50/p95/p99, RPS, error rate, Kafka lag |
| Transaction Inspector | `/ops/inspector` | Cross-service trace with Gantt-style timeline and audit correlation |

Each view renders all four explicit states: `loading`, `empty`, `error`, `ready`.

---

## Architecture

### Layer cake (strictly one-way)

```
┌────────────────────────────────────────────────────┐
│  pages/        route-bound composition only       │
│  widgets/      composed sections (AppShell, etc.) │
│  features/     user-story slices (planned)        │
│  entities/     domain models                      │
│  shared/       ui kit, lib, hooks, tokens, i18n   │
│  services/     ports + fake/http adapter families │
│  mocks/        MSW handlers                       │
└────────────────────────────────────────────────────┘
```

### Services (the load-bearing decision)

Components **never** import concrete adapters. They go through the DI container
at `src/services/index.ts`, which resolves to either the `fake/` or `http/`
family based on `VITE_USE_MOCKS`.

```ts
// inside any component
import { services } from '@services';
const r = await services.account.listForCustomer(id);
```

Seven ports, one per backend service:

```
IIdentityService       → identity-service
IAccountService        → account-service
ICustomerService       → customer-service
ITransactionService    → transaction-service
IPaymentService        → payment-service
IAuditService          → audit-service
INotificationService   → notification-service
ICardService           → card domain (future service split)
```

### Swapping mocks for the real gateway

One env change. Zero component changes.

```
# .env.local
VITE_USE_MOCKS=false
VITE_API_GATEWAY_URL=http://localhost:8080
```

Behind the scenes:

1. `services/index.ts` now instantiates the `http/` family instead of `fake/`.
2. `src/main.tsx` no longer starts the MSW worker.
3. The `http/_client.ts` attaches the trace header (`x-helvetiq-trace-id`) on every request.
4. Every adapter's contract is documented in the HTTP class JSDoc — see e.g. `http/identity.http.ts`:

```
POST /api/v1/auth/login      -> { status, challenge? | session? }
POST /api/v1/auth/mfa/verify -> { session }
GET  /api/v1/auth/session    -> { session | null }
POST /api/v1/auth/logout     -> 204
```

If the gateway diverges from these shapes, the adapter is the only file that changes — entities and UI stay put.

---

## Design system

Tokens live in `src/shared/tokens/tokens.css` as CSS variables. Tailwind references them by name — never hardcode a hex in a component.

- **Paper & ink.** `#FAFAF7` warm off-white, `#0E0E10` near-black.
- **Rules, not shadows.** Hairlines at `#E6E4DE`. Shadows never exceed 1px.
- **Accent.** Graphite navy `#1B2A3A`. Used for the primary action and the login editorial panel only.
- **Semantic money.** Deep green `#14532D` for credit, deep red `#7F1D1D` for debit. Never bright.
- **Typography.** Inter (self-hosted in production) for UI. JetBrains Mono for IDs, timestamps, trace IDs. Tabular figures are enforced on all numeric surfaces.
- **Radii.** Maximum 8px. No `rounded-2xl` anywhere.
- **Motion.** 120–180ms, `cubic-bezier(0.2, 0.8, 0.2, 1)`. Honors `prefers-reduced-motion`.

### Money primitives

Distinctive to a banking UI, rarely found in portfolio projects:

- `<Amount>` — integer part rendered in the display weight, fraction and currency de-emphasized; tabular figures; semantic coloring by direction.
- `<AccountNumber>` — IBAN formatted in monospace with four-character groups; `masked` variant for privacy.
- `<TransactionId>` / `<TraceId>` — click-to-copy mono; copy affordance appears only on hover.
- `<Timestamp>` — three variants (`date-time`, `precise`, `relative`), absolute time always in tooltip.
- `<Status>` — transaction status pill with color-mix tinting for quiet semantics.
- `<HealthDot>` — service health indicator with restrained ping animation.

---

## Stack

- **Vite 5** + **React 18** + **TypeScript 5.6** (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- **TanStack Router** (code-based, type-safe, with beforeLoad guards for persona routing)
- **TanStack Query v5** for server cache
- **Zustand** for session/UI state
- **Tailwind CSS 3.4** (utility layer) + **CSS variables** (tokens)
- **Radix UI** primitives (headless, styled against Helvetiq tokens)
- **React Hook Form + Zod** for validation
- **MSW 2** for network-level mocking
- **date-fns** (Swiss locales) — never dayjs or moment
- **recharts** for balance charts
- **i18next** (EN complete, DE scaffolded)
- **Vitest + RTL** + **Playwright** + **Storybook 8**

---

## Scripts

```bash
pnpm dev             # Vite dev server
pnpm build           # typecheck + production build
pnpm preview         # preview the production build
pnpm test            # Vitest in watch mode
pnpm test:ci         # run once with coverage
pnpm e2e             # Playwright
pnpm lint            # ESLint
pnpm typecheck       # tsc --noEmit
pnpm storybook       # Storybook 8
```

---

## Known scope boundaries

Implemented: Login, Overview, Transfer Studio, Platform Health, Transaction Inspector.

Scaffolded but not implemented yet (routes + entities exist, screens do not): Accounts detail with balance chart, Cards, Documents, Security, Support, Operator Customers & Audit trail.

To add a new feature, the pattern is:

1. Add or refine a method on the relevant `services/ports/*.port.ts`.
2. Update both `fake/` and `http/` implementations.
3. Extend the MSW handlers in `src/mocks/handlers.ts` if needed.
4. Build the page under `src/pages/{client,ops,public}/`.
5. Register it in `src/app/router.ts`.

The architecture is designed so that each of these steps touches one file.
