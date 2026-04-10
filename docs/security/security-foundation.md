# Security Foundation

## Purpose

This document defines the first security principles for the banking platform.

In banking systems, security is not an add-on. It is part of the architecture from the beginning.

## Security Goals

Our initial goals are:

- verify every caller correctly
- prevent unauthorized access
- keep sensitive banking flows behind controlled entry points
- capture security-relevant actions for audit

## Core Security Model

### 1. `api-gateway` is the front door
Client traffic should enter through the gateway.

Why:

- central policy enforcement
- consistent request filtering
- easier logging and traceability

### 2. `identity-service` handles identity concerns
Authentication logic belongs to `identity-service`, not to business services.

Why:

- cleaner boundaries
- centralized auth logic
- easier evolution of login and token strategy

### 3. JWT-based access
We plan to use `JWT` for stateless access control.

`JWT` means `JSON Web Token`.

Why:

- scalable for distributed services
- each service or gateway can validate the token
- common industry approach for modern APIs

### 4. Audit matters from day one
Security-sensitive actions should be traceable.

Examples:

- login attempts
- privileged access
- payment initiation
- transfer initiation

## Terms

### `JWT`
A signed token carrying identity and access-related claims.

### `Claim`
A piece of information inside a token, such as user ID or role.

### `Stateless authentication`
Authentication where the server does not need a stored web session for every request.

### `RBAC`
`Role-Based Access Control`.
Permissions are granted based on roles such as customer, operator, or admin.

### `PII`
`Personally Identifiable Information`.
Sensitive personal data such as name, email, address, or identity number.

## Initial Security Rules

- all non-public business APIs will require authentication
- public endpoints must be explicit and minimal
- business services should trust verified identity, not raw client claims
- sensitive flows should later include correlation IDs and audit entries

## What We Will Add Later

- role and permission checks
- service-to-service trust model
- secret management
- rate limiting
- stronger audit event modeling
