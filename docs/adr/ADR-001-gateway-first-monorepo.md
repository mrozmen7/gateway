# ADR-001: Gateway-First Monorepo Foundation

## Status
Accepted

## Date
2026-04-10

## Context

The platform demonstrates an API Gateway and microservices in a banking context. Its initial architecture must be:

- realistic
- structured
- operationally manageable
- simple enough to evolve incrementally

We need a project shape that shows multiple services clearly without creating unnecessary operational chaos at the very beginning.

## Decision

We will start with:

- a single repository
- multiple Spring Boot services under `services/`
- an `api-gateway` as the system entry point
- shared architecture and security documentation at repository root

## Why This Decision Was Chosen

### `Monorepo`
Using one repository keeps the platform easier to operate and reason about as a single deliverable.

Benefits:

- all services visible in one place
- easier onboarding
- simpler documentation structure
- easier comparison across services

### `Gateway-first`
The platform uses an API Gateway as its external entry point.

Benefits:

- request flow is explicit from the first deployment
- security and routing have a clear ownership boundary
- cross-cutting concerns have a natural home

## Consequences

Positive:

- clean initial foundation
- realistic system boundaries
- easier to add Docker, docs, and CI later

Trade-offs:

- not fully production-complete yet
- some large organizations prefer multi-repo once team and deployment boundaries justify it
- service independence is conceptual first, operational later

## Rejected Alternatives

### Single monolith
Rejected because it hides gateway and service boundaries too much.

### Full multi-repo from day one
Rejected because it would add operational overhead before team and deployment boundaries justify it.

### Start without a gateway
Rejected because the platform requires a single external policy and routing boundary.
