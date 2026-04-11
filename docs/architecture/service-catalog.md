# Service Catalog

## Purpose

This document lists each service and its intended role in the system.

## Services

### `api-gateway`
The front door of the platform.

Owns:

- routing
- gateway-level security enforcement
- cross-cutting request policies

Does not own:

- account balance rules
- payment business logic
- customer domain rules

### `identity-service`
The identity and authentication service.

Owns:

- login
- token lifecycle
- verified identity context

### `customer-service`
The customer domain service.

Owns:

- profile data
- customer attributes
- customer-facing identity details later
- internal customer eligibility answers for downstream banking flows

### `account-service`
The account domain service.

Owns:

- account records
- account state
- balances
- internal account verification answers for downstream banking flows

### `transaction-service`
The transaction history and ledger-facing service.

Owns:

- transfer records
- transaction states
- transaction query history
- synchronous orchestration for transfer initiation

### `payment-service`
The payment workflow service.

Owns:

- payment initiation
- payment-specific orchestration
- synchronous downstream verification before payment creation
- idempotency later

### `audit-service`
The audit and compliance service.

Owns:

- traceable action records
- security-sensitive event logging
- review-friendly audit trails
- internal audit write API for downstream services
