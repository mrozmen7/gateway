# Port and Route Plan

## Purpose

This document defines the first runtime map of the platform.

In a microservice system, two things must be clear very early:

- which service listens on which port
- which URL path is routed to which service

## Port Plan

| Service | Port | Purpose |
|---|---:|---|
| `api-gateway` | `8080` | entry point for all client traffic |
| `identity-service` | `8081` | login and token issuance |
| `account-service` | `8082` | account and balance access |
| `customer-service` | `8083` | customer profile boundary |
| `transaction-service` | `8084` | transaction boundary |
| `payment-service` | `8085` | payment boundary |
| `audit-service` | `8086` | audit boundary |

Local demo note:
In this workspace, `8080` may already be occupied by another desktop process. For live testing, the gateway can be started on `8090` with a runtime override while keeping the architectural default as `8080`.

## Route Plan

| External Path | Downstream Service | Why |
|---|---|---|
| `/api/v1/auth/**` | `identity-service` | auth should be centralized |
| `/api/v1/accounts/**` | `account-service` | accounts own account data |
| `/api/v1/customers/**` | `customer-service` | customer boundary stays isolated |
| `/api/v1/transactions/**` | `transaction-service` | transaction logic is separate from accounts |
| `/api/v1/payments/**` | `payment-service` | payment workflows are separate from transfers |
| `/api/v1/audit/**` | `audit-service` | audit data belongs to audit boundary |

## Why This Matters

This is the first practical lesson in microservice topology.

`Topology` means the shape of the running system:

- what services exist
- how they are addressed
- how requests travel between them
