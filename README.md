# Gateway Pattern Banking Platform

## Project Vision

This repository contains a production-style digital banking platform built to teach API Gateway and Microservices from the ground up.

The goal is not to build a toy CRUD project. The goal is to learn how a real engineering team in a bank would think about:

- service boundaries
- API Gateway responsibilities
- authentication and authorization
- payment and transaction flows
- audit and compliance
- event-driven integration
- infrastructure and operational readiness

We are building this project in a way that supports learning from junior level to senior level.

## Why This Project Exists

In real banking systems, requests do not go directly from a mobile app to a database.

Requests typically pass through an `API Gateway`, then reach multiple backend services that each own a specific business area.

This project exists to teach:

- why we split systems into services
- when a gateway should be used
- what belongs in the gateway and what does not
- how banking systems handle security, state, and audit
- how teams document architecture decisions before building too much code

## Current Phase

We are in `Phase 3: API Gateway and Security Foundation`.

At this stage we are:

- assigning service ports
- turning the gateway into the system entry point
- introducing login and token issuance
- protecting the first business endpoint through the gateway
- documenting the runtime flow for the first secure banking calls

We are not yet implementing full business logic or persistent storage.

## Documentation Map

This repository follows a documentation-first structure inspired by production-style backend projects.

- architecture overview: [docs/architecture/system-overview.md](/Users/yvz.o/Desktop/projects/Geteway_Pattern/docs/architecture/system-overview.md)
- detailed system design: [docs/architecture/system-design.md](/Users/yvz.o/Desktop/projects/Geteway_Pattern/docs/architecture/system-design.md)
- port and route plan: [docs/architecture/port-route-plan.md](/Users/yvz.o/Desktop/projects/Geteway_Pattern/docs/architecture/port-route-plan.md)
- failure scenarios: [docs/architecture/failure-scenarios.md](/Users/yvz.o/Desktop/projects/Geteway_Pattern/docs/architecture/failure-scenarios.md)
- service catalog: [docs/architecture/service-catalog.md](/Users/yvz.o/Desktop/projects/Geteway_Pattern/docs/architecture/service-catalog.md)
- security foundation: [docs/security/security-foundation.md](/Users/yvz.o/Desktop/projects/Geteway_Pattern/docs/security/security-foundation.md)
- architecture decisions: [docs/adr](/Users/yvz.o/Desktop/projects/Geteway_Pattern/docs/adr)
- phase specifications: [specs](/Users/yvz.o/Desktop/projects/Geteway_Pattern/specs)

## Core Services

### `api-gateway`
Single entry point for client traffic.

Responsibilities:

- request routing
- token validation
- rate limiting later
- correlation ID propagation later
- central traffic policy enforcement

### `identity-service`
Authentication and identity boundary.

Responsibilities:

- login
- token issuing
- user identity verification
- role and permission model later

### `customer-service`
Customer profile boundary.

Responsibilities:

- customer information
- onboarding profile data
- KYC-related basic attributes later

### `account-service`
Account boundary.

Responsibilities:

- bank accounts
- balances
- account status

### `transaction-service`
Transaction ledger boundary.

Responsibilities:

- transfer initiation
- transaction history
- transaction state handling

### `payment-service`
Payment flow boundary.

Responsibilities:

- payment initiation
- payment orchestration
- idempotency handling later

### `audit-service`
Audit and compliance boundary.

Responsibilities:

- audit trail
- security event storage
- compliance-friendly record keeping

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
```

## Key Terms

### `API Gateway`
The front door of the system. Clients send requests here first.

### `Microservice`
A service that owns one clear responsibility and can evolve independently.

### `Service Boundary`
The limit of what a service is responsible for. Clear boundaries reduce chaos.

### `Authentication`
Verifying who a user is.

### `Authorization`
Checking what an authenticated user is allowed to do.

### `Audit`
Keeping trustworthy records of critical actions.

### `Idempotency`
Making sure the same request does not produce the same payment or transfer twice.

## Working Principles

- document important decisions
- keep service responsibilities clear
- do not put business logic in the gateway
- design for traceability and auditability
- prefer professional clarity over quick hacks

## Repository Rules

The repository-level engineering rules live in:

- [CLAUDE.md](/Users/yvz.o/Desktop/projects/Geteway_Pattern/CLAUDE.md)

This file explains:

- repository structure
- module responsibilities
- documentation expectations
- security rules
- coding discipline we want to keep throughout the project

## What Comes Next

Next steps after this foundation:

1. define shared ports and runtime configuration
2. assign ports to each service
3. introduce Docker-based local infrastructure
4. add the first gateway routes
5. connect gateway to identity and account services
6. start implementing the first real banking flows
