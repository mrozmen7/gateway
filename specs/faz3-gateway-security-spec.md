# Faz 3 - API Gateway and Security Foundation Spec

## Objective

Turn the Phase 2 project skeleton into the first working runtime shape of the banking platform.

## Scope

- define service ports
- define gateway routes
- implement login endpoint in `identity-service`
- issue signed bearer tokens
- secure the gateway entry flow
- secure the first downstream business service
- expose placeholder endpoints for the remaining services

## Acceptance Criteria

- [x] all services have explicit `server.port` values
- [x] gateway has path-based routes for all core services
- [x] `identity-service` exposes `POST /api/v1/auth/login`
- [x] `identity-service` can issue signed access tokens
- [x] gateway protects all non-auth API paths
- [x] `account-service` exposes protected account endpoints
- [x] correlation IDs are attached at the gateway
- [x] route and port documentation exists

## Out of Scope

- database-backed identity storage
- persistent account storage
- advanced RBAC matrix
- refresh tokens
- Docker Compose runtime
- service discovery
