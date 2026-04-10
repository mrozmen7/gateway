# ADR-001: Gateway-First Monorepo Foundation

## Status
Accepted

## Date
2026-04-10

## Context

The project is intended to teach production-style API Gateway and Microservices in a banking context.

The learner is new to microservices, so the architecture must be:

- realistic
- structured
- teachable
- simple enough to evolve step by step

We need a project shape that shows multiple services clearly without creating unnecessary operational chaos at the very beginning.

## Decision

We will start with:

- a single repository
- multiple Spring Boot services under `services/`
- an `api-gateway` as the system entry point
- shared architecture and security documentation at repository root

## Why This Decision Was Chosen

### `Monorepo`
Using one repository makes it easier to learn and reason about the whole platform.

Benefits:

- all services visible in one place
- easier onboarding
- simpler documentation structure
- easier comparison across services

### `Gateway-first`
The project is specifically about learning API Gateway and Microservices together.

Benefits:

- request flow becomes visible from day one
- security and routing can be taught early
- cross-cutting concerns have a natural home

## Consequences

Positive:

- clean training-oriented foundation
- realistic system boundaries
- easier to add Docker, docs, and CI later

Trade-offs:

- not fully production-complete yet
- monorepo is easier for learning, but some large organizations prefer multi-repo
- service independence is conceptual first, operational later

## Rejected Alternatives

### Single monolith
Rejected because it hides gateway and service boundaries too much.

### Full multi-repo from day one
Rejected because it would add overhead before the learner understands the system.

### Start without a gateway
Rejected because the educational goal is explicitly gateway-centered.
