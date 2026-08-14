# ADR-002 - Synchronous Internal REST for Phase 5

## Status

Accepted

## Context

Phase 4 proved public business APIs through the gateway, but the services were still mostly isolated.

The platform needs a direct service-to-service integration path for business flows before asynchronous integration is introduced.

The question was:

How should `transaction-service` and `payment-service` obtain account ownership, customer eligibility, and audit write capabilities before Kafka and persistence are introduced?

## Decision

For Phase 5 we use synchronous internal REST endpoints protected by a shared internal API key.

Specifically:

- `account-service` exposes internal account verification
- `customer-service` exposes internal eligibility lookup
- `audit-service` exposes internal audit write
- `transaction-service` and `payment-service` call these endpoints with timeout and retry

## Why

- the flow stays explicit and operable during the initial integration stage
- the runtime shape matches real microservice orchestration
- we can demonstrate downstream dependency risk clearly
- we delay Kafka until the next architectural phase on purpose

## Consequences

Positive:

- stronger real-world microservice understanding
- visible downstream dependency chain
- clear place to discuss timeout, retry, and orchestration

Negative:

- tighter runtime coupling than event-driven integration
- business success currently depends on synchronous audit write success
- shared internal API key trust is a transitional model, not a complete production trust strategy

## Follow-up

Later phases should evaluate:

- event-driven audit publication
- service-to-service identity beyond shared API keys
- circuit breakers and richer resilience
