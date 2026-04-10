# Faz 2 - Foundation Architecture Spec

## Objective

Build the structural foundation of the banking platform before implementing business-heavy behavior.

## Scope

- create service skeletons
- define repository structure
- define architecture and security documents
- define initial service catalog
- define initial architecture decision records

## Included Services

- api-gateway
- identity-service
- customer-service
- account-service
- transaction-service
- payment-service
- audit-service

## Acceptance Criteria

- [x] all core service folders exist under `services/`
- [x] each service contains a valid Spring Boot starter skeleton
- [x] root `README.md` exists
- [x] root engineering rules document exists
- [x] architecture documentation exists
- [x] security foundation documentation exists
- [x] at least one ADR exists
- [x] root `docs/`, `infra/`, and `specs/` structure exists

## Out of Scope

- full JWT implementation
- gateway route implementation
- Docker Compose runtime
- business endpoints
- persistence design details
- CI/CD pipeline execution
