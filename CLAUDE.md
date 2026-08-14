# CLAUDE.md

# Gateway Pattern Banking Platform - Project Rules

## Project Overview

This repository contains a production-style banking platform that demonstrates API Gateway and microservice architecture with explicit engineering discipline.

The platform is intentionally structured to be:

- realistic enough for banking-style architecture work
- modular enough to evolve independently by service
- documented enough to support implementation and operations

## Current Architecture Direction

- monorepo at repository root
- one Spring Boot service per folder under `services/`
- `api-gateway` as the front door
- service-specific responsibility boundaries
- repository-level documentation for architecture, ADRs, and security

## Repository Structure

```text
Geteway_Pattern/
  docs/
    adr/
    architecture/
    security/
  infra/
    docker/
    local/
  services/
    api-gateway/
    identity-service/
    customer-service/
    account-service/
    transaction-service/
    payment-service/
    audit-service/
  specs/
```

## Module Boundaries

- `api-gateway`: routing, entry control, gateway policies
- `identity-service`: authentication and token concerns
- `customer-service`: customer profile domain
- `account-service`: accounts and balances
- `transaction-service`: transfers and transaction history
- `payment-service`: payment workflow and idempotency later
- `audit-service`: audit records and compliance events

Services must not absorb each other's responsibilities casually.

## Documentation Rules

- important architecture decisions must be written under `docs/adr/`
- high-level design belongs under `docs/architecture/`
- security expectations belong under `docs/security/`
- phase acceptance criteria belong under `specs/`

## Security Rules

- gateway is the primary client entry point
- authentication logic belongs to `identity-service`
- banking APIs should default to protected access
- public endpoints must be explicitly documented
- auditability must be considered for security-sensitive operations

## Engineering Rules

- keep the gateway free from domain business logic
- keep service names and package names aligned
- prefer explicit structure over magic
- document why a decision was taken, not only what was done
- treat observability and audit as first-class concerns
