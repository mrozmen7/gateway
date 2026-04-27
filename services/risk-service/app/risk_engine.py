from app.models import ApiEvent, RiskDecision, RiskEvaluation, RiskFeatures


def evaluate_event(event: ApiEvent, features: RiskFeatures | None = None) -> RiskEvaluation:
    features = features or RiskFeatures()
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

    if features.requestCount1m >= 30:
        score += 0.25
        reasons.append("burst_request_frequency")
    elif features.requestCount1m >= 10:
        score += 0.10
        reasons.append("elevated_request_frequency")

    if features.failedRequestCount5m >= 5:
        score += 0.20
        reasons.append("repeated_failed_requests")

    if features.endpointDiversity5m >= 8:
        score += 0.15
        reasons.append("high_endpoint_diversity")

    if features.distinctIpCountByUser5m >= 3:
        score += 0.15
        reasons.append("multiple_ips_for_user")

    if features.distinctUserCountByIp5m >= 3:
        score += 0.15
        reasons.append("multiple_users_from_ip")

    if features.secondsSinceLastRequest is not None and features.secondsSinceLastRequest < 1:
        score += 0.10
        reasons.append("rapid_repeat_request")

    if features.offHours and looks_sensitive(event.endpoint):
        score += 0.05
        reasons.append("off_hours_sensitive_access")

    normalized_score = min(round(score, 2), 1.0)
    top_factors = reasons[:5] if reasons else ["normal_request"]

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
        topFactors=top_factors,
        features=features,
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
