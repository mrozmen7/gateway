from app.ml_model import MlPrediction, NoopAnomalyModel
from app.models import ApiEvent, RiskDecision, RiskEvaluation, RiskFeatures


def evaluate_event(
    event: ApiEvent,
    features: RiskFeatures | None = None,
    anomaly_model: NoopAnomalyModel | None = None,
    rule_weight: float = 0.60,
    ml_weight: float = 0.40,
) -> RiskEvaluation:
    features = features or RiskFeatures()
    rule_score, reasons = evaluate_rules(event, features)
    ml_prediction = anomaly_model.predict(event, features) if anomaly_model else MlPrediction(
        score=0.0,
        top_factors=["ml_model_unavailable"],
        model_version="none",
        status="missing",
    )

    composite_score = min(round((rule_weight * rule_score) + (ml_weight * ml_prediction.score), 2), 1.0)
    merged_reasons = reasons.copy()
    if ml_prediction.score >= 0.60:
        merged_reasons.append("ml_anomaly_detected")
    elif ml_prediction.score >= 0.30:
        merged_reasons.append("ml_elevated_anomaly_score")

    top_factors = (merged_reasons + ml_prediction.top_factors)[:7] if merged_reasons else ml_prediction.top_factors

    return RiskEvaluation(
        eventId=event.eventId,
        correlationId=event.correlationId,
        userId=event.userId,
        username=event.username,
        ipAddress=event.ipAddress,
        endpoint=event.endpoint,
        riskScore=composite_score,
        ruleScore=rule_score,
        mlScore=ml_prediction.score,
        decision=decision_for(composite_score),
        reasons=merged_reasons or ["normal_request"],
        topFactors=top_factors or ["normal_request"],
        features=features,
        modelVersion=ml_prediction.model_version,
    )


def evaluate_rules(event: ApiEvent, features: RiskFeatures) -> tuple[float, list[str]]:
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

    return min(round(score, 2), 1.0), reasons


def decision_for(score: float) -> RiskDecision:
    if score >= 0.85:
        return "block"
    if score >= 0.60:
        return "step_up"
    if score >= 0.30:
        return "review"
    if score >= 0.15:
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
