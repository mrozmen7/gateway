# ADR-004 - HMAC JWT over Keycloak for the Current Runtime

## Status

Accepted

## Context

Earlier phases ran a Keycloak container and configured the gateway as an OAuth2 resource server against its JWK endpoint, while `identity-service` issued its own HMAC-signed JWTs. The result was two parallel authentication mechanisms:

- the gateway expected Keycloak-issued tokens that no service actually produced
- downstream services validated the HMAC tokens that `identity-service` really issued
- the Keycloak container consumed resources without being part of any real flow

Two authentication sources of truth is worse than one simple one: it breaks at runtime, confuses readers, and cannot be explained honestly in a design review.

## Decision

For the current runtime we keep exactly one token mechanism:

- `identity-service` issues HMAC-signed JWTs (HS256) with claims `sub`, `preferred_username`, `role`, `jti`
- the gateway and every downstream service validate the token with the same shared secret
- Keycloak is removed from the runtime until a dedicated OIDC migration phase

## Why

- one authentication model that actually works end to end
- the token flow stays visible and debuggable during local operation
- removing unused infrastructure is better engineering than carrying it "for later"
- a future OIDC migration is a cleaner story when it starts from one working mechanism, not from two broken ones

## Consequences

Positive:

- gateway and downstream services now validate the same tokens the platform actually issues
- smaller, honest runtime footprint
- the shared-secret trade-off is explicit and discussable

Negative:

- shared-secret distribution does not scale to real production trust
- no key rotation, no refresh tokens, no standardized OIDC claims
- role-based authorization depends on a custom `role` claim convention

## Follow-up

A later phase should evaluate a real OIDC provider integration (Keycloak or a managed IdP):

- `identity-service` becomes an OIDC client instead of a token issuer
- services become standard OAuth2 resource servers with JWKS validation
- secrets move out of `application.properties` into environment/secret management
