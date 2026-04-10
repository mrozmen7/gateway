# Failure Scenarios

## Purpose

This document records early failure thinking for the platform.

Even before full implementation, good teams ask:

- what can fail
- what is the impact
- what would protect us later

## 1. `identity-service` unavailable

- effect: users may not be able to authenticate
- impact: gateway may reject protected requests
- later protection: retries only where safe, health checks, degraded-mode thinking

## 2. `api-gateway` misrouting

- effect: request reaches the wrong service or no service
- impact: incorrect behavior or 404/5xx responses
- later protection: route tests, explicit route config, contract validation

## 3. `account-service` down

- effect: account details and balance checks fail
- impact: banking operations depending on account state cannot continue
- later protection: health indicators, timeout policies, dependency awareness

## 4. duplicate payment request

- effect: same payment may be attempted twice
- impact: double processing risk
- later protection: idempotency keys in `payment-service`

## 5. audit events not captured

- effect: actions happen without trustworthy records
- impact: compliance and incident review become weak
- later protection: centralized audit write rules, reliable event publishing later

## Why This Matters

Failure thinking is a senior engineering habit.

We do not wait for production incidents before asking what can break.
