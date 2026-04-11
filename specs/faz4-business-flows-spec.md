# Faz 4 - Core Business Flows Spec

## Objective

Turn the secure Phase 3 foundation into the first meaningful banking runtime with protected domain flows across the core services.

## Scope

- implement protected customer profile and KYC endpoints
- implement protected transaction history and transfer initiation endpoints
- implement protected payment history and payment initiation endpoints
- implement protected audit feed endpoints
- enrich Swagger/OpenAPI contracts for the new business services
- validate all business flows through the gateway

## Acceptance Criteria

- [x] `customer-service` exposes `GET /api/v1/customers/me`
- [x] `customer-service` exposes `GET /api/v1/customers/me/kyc`
- [x] `transaction-service` exposes `GET /api/v1/transactions/me`
- [x] `transaction-service` exposes `POST /api/v1/transactions/transfers`
- [x] `payment-service` exposes `GET /api/v1/payments/me`
- [x] `payment-service` exposes `POST /api/v1/payments`
- [x] `audit-service` exposes `GET /api/v1/audit/events/me`
- [x] `audit-service` exposes `GET /api/v1/audit/events/security`
- [x] all four services validate bearer tokens locally
- [x] all four services expose Swagger/OpenAPI with bearer auth metadata
- [x] the new business flows are reachable through `api-gateway`

## Validation Notes

- gateway login returns a JWT for `lena.meyer`
- customer profile and KYC endpoints return protected data through the gateway
- transaction history returns seeded entries and transfer creation appends a new pending transfer
- payment history returns seeded entries and payment creation appends a new submitted payment
- audit personal feed returns customer-specific events
- audit security feed returns `403` for `CUSTOMER` and succeeds for `AUDITOR`

## Out of Scope

- persistent storage
- inter-service REST calls between business services
- Kafka / outbox
- idempotency keys
- fraud checks
- ledger-grade monetary accounting
