# ADR-003: Account Service Owns Balance Posting

## Status
Accepted

## Context

The platform started with gateway-first service-to-service verification and orchestration.

At that stage:
- transfers were recorded in `transaction-service`
- payments were recorded in `payment-service`
- balances were not truly moved
- the destination IBAN of a transfer was not validated against a real account

To move the system closer to a real banking platform, we needed a clearer ownership model for balances.

## Decision

`account-service` is the single owner of:
- account existence
- IBAN ownership
- current account balance
- debit/credit posting for internal account movements

Other services may orchestrate business flows, but they may not mutate balances directly.

As a result:
- `transaction-service` calls `account-service` to settle transfers
- `payment-service` calls `account-service` to debit debtor accounts
- `transaction-service` keeps the transfer ledger
- `payment-service` keeps the payment business record

## Consequences

### Positive
- service boundaries are cleaner
- balance changes happen in one ownership domain
- target IBAN validation is centralized
- future audit and reconciliation become easier

### Negative
- transfer and payment flows now depend more heavily on `account-service`
- there is still no asynchronous decoupling yet
- eventual consistency and outbox concerns are deferred to a later phase

## Notes

This establishes the correct ownership boundary for the platform. A future design may separate:
- customer-facing available balance
- immutable ledger postings
- settlement and reconciliation events
