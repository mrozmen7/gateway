# Phase 4 Business Flows

## Purpose

This document describes the first realistic banking user journeys now supported by the platform.

Phase 3 proved the security foundation.  
Phase 4 proves that multiple protected business services can now answer meaningful banking questions through the gateway.

## Supported User Journeys

### 1. Login and Profile Read

- client logs in through `api-gateway`
- gateway routes `/api/v1/auth/login` to `identity-service`
- the returned JWT is used to call `/api/v1/customers/me`
- `customer-service` returns the authenticated user's profile

### 2. Customer KYC Read

- client sends bearer token to `/api/v1/customers/me/kyc`
- gateway routes to `customer-service`
- `customer-service` returns KYC and risk metadata bound to the authenticated principal

### 3. Transaction History and Transfer

- client calls `/api/v1/transactions/me`
- gateway routes to `transaction-service`
- `transaction-service` returns seeded transaction history for the authenticated user
- client can then call `POST /api/v1/transactions/transfers`
- `transaction-service` creates a new pending transfer entry for the authenticated user's account

### 4. Payment History and Payment Creation

- client calls `/api/v1/payments/me`
- gateway routes to `payment-service`
- `payment-service` returns existing bill payments for the authenticated user
- client can then call `POST /api/v1/payments`
- `payment-service` creates a new submitted payment

### 5. Audit Feed Access

- client calls `/api/v1/audit/events/me`
- gateway routes to `audit-service`
- `audit-service` returns visible audit events for the authenticated principal
- privileged users with role `OPS` or `AUDITOR` can call `/api/v1/audit/events/security`
- regular customers are denied

## Why This Phase Matters

This is the first phase where the platform feels like a real microservice system rather than a secure scaffold.

Each service now owns a clear protected business answer:

- `customer-service` owns customer profile and KYC views
- `account-service` owns account visibility
- `transaction-service` owns transfer and transaction state
- `payment-service` owns bill payment state
- `audit-service` owns compliance-oriented audit views

## Architectural Lesson

The gateway still owns traffic.

The business services own business decisions.

That separation is one of the most important habits in production microservice design.
