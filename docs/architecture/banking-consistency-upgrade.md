# Banking Consistency Upgrade

This document captures the first production-oriented upgrade of the training platform after the initial gateway and service-to-service communication phases.

## What changed

### 1. Target IBAN validation
- Transfers no longer accept any destination IBAN as free text.
- `transaction-service` now calls `account-service` to verify that the target IBAN belongs to a real active account inside the platform.
- If the IBAN is unknown, the transfer is rejected before any ledger row is created.

### 2. Real balance posting
- `account-service` is now the owner of account balances.
- Transfers call an internal posting endpoint that debits the source account and credits the target account in one transactional boundary.
- Payments call a dedicated internal debit endpoint that reduces the debtor account balance.

### 3. Double-entry transfer ledger
- `transaction-service` now persists two rows for a booked transfer:
  - a `DEBIT` leg for the sender
  - a `CREDIT` leg for the receiver
- Both legs share the same business `transactionId` and `bookingReference`.

### 4. Idempotency keys
- `transaction-service` and `payment-service` accept `Idempotency-Key`.
- Repeating the same key for the same user now returns the original result instead of creating duplicate money movement.
- A local in-process monitor was added on top of the persistent idempotency table to protect the single-instance training environment against concurrent duplicate requests.

### 5. Persistent storage
- `account-service`, `transaction-service`, and `payment-service` now use file-based `H2` databases.
- Data survives a service restart, which is essential for realistic banking flows.

## Why this matters

Before this upgrade the platform was useful for learning routing and service boundaries, but money movement was still mostly a logical demo.

After this upgrade the platform more closely reflects real banking concerns:
- the target account must exist
- balances must move in the service that owns them
- ledger history must capture both sides of a transfer
- retries must not create duplicate financial effects
- data must survive process restarts

## Current trade-offs

This is still an educational system, so some production-grade concerns remain intentionally simplified:
- no external beneficiary validation beyond internal IBAN ownership
- no durable distributed lock for idempotency across multiple service replicas
- no event-driven posting/outbox yet
- no immutable accounting ledger separated from account balances yet

These are good candidates for the next phase.
