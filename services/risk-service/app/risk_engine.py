from app.models import ApiEvent, RiskDecision, RiskEvaluation


def evaluate_event(event: ApiEvent) -> RiskEvaluation:
    score = 0.0
    reasons: list[str] = []

    if event.statusCode >= 500:
        score += 0.30
        reasons.append("server_error_response")
    elif event.statusCode in {401, 403}:
        score += 0.25
        reasons.append("authorization_failure")
    elif event.statusCode >= 400:
        score += 0.15
        reasons.append("client_error_response")

    if event.responseTimeMs > 1_000:
        score += 0.15
        reasons.append("slow_gateway_response")

    if event.userId == "anonymous" and not event.endpoint.startswith("/actuator"):
        score += 0.20
        reasons.append("anonymous_non_actuator_request")

    if looks_sensitive(event.endpoint):
        score += 0.10
        reasons.append("sensitive_endpoint")

    normalized_score = min(round(score, 2), 1.0)

    return RiskEvaluation(
        eventId=event.eventId,
        correlationId=event.correlationId,
        userId=event.userId,
        username=event.username,
        ipAddress=event.ipAddress,
        endpoint=event.endpoint,
        riskScore=normalized_score,
        decision=decision_for(normalized_score),
        reasons=reasons or ["normal_request"],
    )


def decision_for(score: float) -> RiskDecision:
    if score >= 0.60:
        return "review"
    if score >= 0.30:
        return "monitor"
    return "allow"


def looks_sensitive(endpoint: str) -> bool:
    sensitive_markers = (
        "/api/v1/accounts",
        "/api/v1/transactions",
        "/api/v1/payments",
        "/api/v1/ops",
    )
    return any(endpoint.startswith(marker) for marker in sensitive_markers)
