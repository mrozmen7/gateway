# Synchronous Service-to-Service Communication

## Purpose

This document describes the initial synchronous orchestration flow in the banking platform.

Phase 4 proved that multiple protected business services could answer meaningful requests through the gateway.

Phase 5 goes one level deeper:

- `transaction-service` now calls downstream services before creating a transfer
- `payment-service` now calls downstream services before creating a payment
- `audit-service` now accepts internal audit writes from other services
- `account-service` lets authenticated users create additional accounts for local development and testing

## Architecture

In microservice systems, a service often needs information owned by another service.

That does not mean we should copy all data everywhere.

Instead, we create a controlled `service-to-service communication` path.

`Service-to-service communication` means one backend service calling another backend service directly to complete a business flow.

## Transfer Flow

```mermaid
sequenceDiagram
    participant Y as Yavuz
    participant G as API Gateway
    participant T as Transaction Service
    participant A as Account Service
    participant C as Customer Service
    participant D as Audit Service

    Y->>G: 1. POST /api/v1/transactions/transfers
    G->>T: 2. Route request with bearer token
    T->>T: 3. Validate caller role and correlation id
    T->>A: 4. Verify debtor account through internal API
    A-->>T: 5. Return owner and account status
    T->>C: 6. Load customer eligibility through internal API
    C-->>T: 7. Return KYC and risk metadata
    T->>T: 8. Apply banking rules and create transfer record
    T->>D: 9. Write audit event through internal API
    D-->>T: 10. Accept audit event
    T-->>G: 11. Return transfer response
    G-->>Y: 12. Return final response
```

## Payment Flow

```mermaid
sequenceDiagram
    participant Y as Yavuz
    participant G as API Gateway
    participant P as Payment Service
    participant A as Account Service
    participant C as Customer Service
    participant D as Audit Service

    Y->>G: 1. POST /api/v1/payments
    G->>P: 2. Route request with bearer token
    P->>A: 3. Verify debtor account
    A-->>P: 4. Return account ownership
    P->>C: 5. Load customer eligibility
    C-->>P: 6. Return KYC and risk metadata
    P->>P: 7. Apply payment rules and create payment record
    P->>D: 8. Write audit event
    D-->>P: 9. Accept audit event
    P-->>G: 10. Return payment response
    G-->>Y: 11. Return final response
```

## Terms

### `Synchronous call`
A direct request-response call where one service waits for the other service before continuing.

### `Downstream service`
A service being called by another service during a flow.

### `Orchestration`
One service coordinating multiple steps in a business process.

### `Timeout`
The maximum time a service will wait for a downstream call.

### `Retry`
Trying the same downstream call again after a temporary failure.

### `Correlation propagation`
Passing the same `X-Correlation-Id` through all services so one user request can be traced end to end.

### `Internal API`
A backend-only API meant for service-to-service use, not for direct public clients.

## Operational Impact

This is the first phase where the platform behaves like a distributed banking system instead of a set of isolated APIs.

That is a major milestone because most production complexity in microservices comes from the space between services, not only from the code inside each service.

The platform is no longer limited to seeded accounts; new accounts can be created through Swagger to validate downstream ownership checks.
