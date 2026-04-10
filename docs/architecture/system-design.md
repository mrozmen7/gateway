# System Design

## Goal

This document gives the more detailed system-level view of the banking platform.

It is the technical companion to the simpler system overview document.

## High-Level Runtime Design

```mermaid
flowchart TB
    Client["Client Apps
    Mobile
    Web
    Ops"] --> Gateway["API Gateway"]

    Gateway --> Identity["Identity Service"]
    Gateway --> Customer["Customer Service"]
    Gateway --> Account["Account Service"]
    Gateway --> Transaction["Transaction Service"]
    Gateway --> Payment["Payment Service"]
    Gateway --> Audit["Audit Service"]
```

## Why This Shape Fits Banking

Banking systems usually separate responsibilities because different concerns have different risk profiles.

- login and token flows are security critical
- account data is balance critical
- transaction history is audit critical
- payments are duplicate-sensitive
- audit records are compliance critical

If these responsibilities are mixed too early, it becomes difficult to reason about ownership and risk.

## Intended Request Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant G as API Gateway
    participant I as Identity Service
    participant A as Account Service

    C->>G: GET /accounts/{id}
    G->>I: validate token or auth contract
    I-->>G: authenticated identity
    G->>A: route request with verified identity
    A-->>G: account response
    G-->>C: filtered response
```

## Important Terms

### `Verified identity`
An identity that has passed authentication and is trusted by the platform.

### `Routing contract`
The rule set that decides which path goes to which backend service.

### `Boundary ownership`
The idea that each service owns a clear area of the system.

## Phase 2 Scope

In Phase 2, this architecture is mostly structural.

That means:

- services exist
- repository structure exists
- documentation exists
- runtime configuration is not fully complete yet

The business behavior will start in later phases.
