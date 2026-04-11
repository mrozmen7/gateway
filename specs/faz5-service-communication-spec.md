# Faz 5 - Service-to-Service Communication Spec

## Objective

Turn the Phase 4 business APIs into a more realistic banking runtime by adding synchronous downstream service calls, internal trust rules, and audit writes.

## Scope

- expose internal account verification API in `account-service`
- expose internal customer eligibility API in `customer-service`
- expose internal audit write API in `audit-service`
- implement downstream orchestration in `transaction-service`
- implement downstream orchestration in `payment-service`
- propagate correlation IDs through transfer and payment creation flows
- add timeout and retry behavior for synchronous internal calls
- keep internal APIs hidden from Swagger/OpenAPI
- validate the full flow through the gateway

## Acceptance Criteria

- [x] `account-service` exposes `GET /internal/accounts/{accountId}/verification`
- [x] `customer-service` exposes `GET /internal/customers/{username}/eligibility`
- [x] `audit-service` exposes `POST /internal/audit/events`
- [x] all three internal APIs require `X-Internal-Api-Key`
- [x] `transaction-service` calls account, customer, and audit services during transfer creation
- [x] `payment-service` calls account, customer, and audit services during payment creation
- [x] transfer and payment responses now always return a correlation ID
- [x] newly created transfer and payment events appear in `GET /api/v1/audit/events/me`
- [x] public Swagger contracts do not expose `/internal/**` paths
- [x] the Phase 5 orchestration flow is verified through the gateway

## Validation Notes

- local smoke test script: [infra/local/phase5-smoke-test.sh](/Users/yvz.o/Desktop/projects/Geteway_Pattern/infra/local/phase5-smoke-test.sh)
- verified login through `api-gateway`
- verified transfer creation through `transaction-service`
- verified payment creation through `payment-service`
- verified both operations append audit events through `audit-service`
- verified `transactions/me` and `payments/me` include the new records

## Out of Scope

- persistent databases
- Kafka / asynchronous choreography
- circuit breakers
- distributed tracing backend
- idempotency keys
- contract testing
