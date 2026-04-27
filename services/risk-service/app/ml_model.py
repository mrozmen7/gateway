from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from app.models import ApiEvent, RiskFeatures

FEATURE_NAMES = [
    "request_count_1m",
    "failed_request_count_5m",
    "endpoint_diversity_5m",
    "distinct_ip_count_by_user_5m",
    "distinct_user_count_by_ip_5m",
    "response_time_ms",
    "status_code_bucket",
    "seconds_since_last_request",
    "off_hours",
    "sensitive_endpoint",
    "anonymous_non_actuator",
    "non_get_method",
]


@dataclass(frozen=True)
class MlPrediction:
    score: float
    top_factors: list[str]
    model_version: str
    status: str


class StatisticalAnomalyModel:
    def __init__(
        self,
        *,
        version: str,
        means: dict[str, float],
        stddevs: dict[str, float],
        weights: dict[str, float],
        high_risk_distance: float,
    ) -> None:
        self.version = version
        self.status = "loaded"
        self._means = means
        self._stddevs = stddevs
        self._weights = weights
        self._high_risk_distance = max(high_risk_distance, 1.0)

    def predict(self, event: ApiEvent, features: RiskFeatures) -> MlPrediction:
        vector = extract_feature_vector(event, features)
        contributions: list[tuple[str, float]] = []

        weighted_distance = 0.0
        for name in FEATURE_NAMES:
            value = vector[name]
            mean = self._means.get(name, 0.0)
            stddev = max(self._stddevs.get(name, 1.0), 0.001)
            weight = self._weights.get(name, 1.0)
            z_score = abs(value - mean) / stddev
            contribution = weight * z_score
            contributions.append((name, contribution))
            weighted_distance += contribution

        score = min(round(weighted_distance / self._high_risk_distance, 2), 1.0)
        top_factors = [
            name
            for name, contribution in sorted(contributions, key=lambda item: item[1], reverse=True)[:5]
            if contribution >= 0.75
        ]

        return MlPrediction(
            score=score,
            top_factors=top_factors or ["ml_normal_profile"],
            model_version=self.version,
            status=self.status,
        )


class NoopAnomalyModel:
    version = "none"
    status = "missing"

    def predict(self, _event: ApiEvent, _features: RiskFeatures) -> MlPrediction:
        return MlPrediction(
            score=0.0,
            top_factors=["ml_model_unavailable"],
            model_version=self.version,
            status=self.status,
        )


def load_anomaly_model(path: str, fallback_version: str) -> StatisticalAnomalyModel | NoopAnomalyModel:
    model_path = Path(path)
    if not model_path.is_absolute():
        model_path = Path.cwd() / model_path

    try:
        payload = json.loads(model_path.read_text(encoding="utf-8"))
        return StatisticalAnomalyModel(
            version=str(payload.get("version") or fallback_version),
            means={k: float(v) for k, v in payload["means"].items()},
            stddevs={k: float(v) for k, v in payload["stddevs"].items()},
            weights={k: float(v) for k, v in payload["weights"].items()},
            high_risk_distance=float(payload["highRiskDistance"]),
        )
    except (FileNotFoundError, KeyError, TypeError, ValueError, json.JSONDecodeError):
        return NoopAnomalyModel()


def extract_feature_vector(event: ApiEvent, features: RiskFeatures) -> dict[str, float]:
    seconds_since_last = features.secondsSinceLastRequest
    return {
        "request_count_1m": float(features.requestCount1m),
        "failed_request_count_5m": float(features.failedRequestCount5m),
        "endpoint_diversity_5m": float(features.endpointDiversity5m),
        "distinct_ip_count_by_user_5m": float(features.distinctIpCountByUser5m),
        "distinct_user_count_by_ip_5m": float(features.distinctUserCountByIp5m),
        "response_time_ms": float(event.responseTimeMs),
        "status_code_bucket": status_code_bucket(event.statusCode),
        "seconds_since_last_request": 60.0 if seconds_since_last is None else min(seconds_since_last, 60.0),
        "off_hours": 1.0 if features.offHours else 0.0,
        "sensitive_endpoint": 1.0 if looks_sensitive(event.endpoint) else 0.0,
        "anonymous_non_actuator": 1.0
        if event.userId == "anonymous" and not event.endpoint.startswith("/actuator")
        else 0.0,
        "non_get_method": 0.0 if event.httpMethod.upper() == "GET" else 1.0,
    }


def status_code_bucket(status_code: int) -> float:
    if status_code >= 500:
        return 3.0
    if status_code in {401, 403}:
        return 2.0
    if status_code >= 400:
        return 1.0
    return 0.0


def looks_sensitive(endpoint: str) -> bool:
    sensitive_markers = (
        "/api/v1/accounts",
        "/api/v1/transactions",
        "/api/v1/payments",
        "/api/v1/ops",
    )
    return any(endpoint.startswith(marker) for marker in sensitive_markers)


def train_profile(samples: list[dict[str, float]], weights: dict[str, float]) -> dict[str, Any]:
    means = {name: mean([sample[name] for sample in samples]) for name in FEATURE_NAMES}
    stddevs = {
        name: max(stddev([sample[name] for sample in samples], means[name]), 0.001)
        for name in FEATURE_NAMES
    }
    distances = [
        sum(weights.get(name, 1.0) * abs(sample[name] - means[name]) / stddevs[name] for name in FEATURE_NAMES)
        for sample in samples
    ]
    high_risk_distance = max(percentile(distances, 0.95) * 2.7, 8.0)
    return {
        "means": means,
        "stddevs": stddevs,
        "weights": weights,
        "highRiskDistance": round(high_risk_distance, 4),
    }


def mean(values: list[float]) -> float:
    return sum(values) / len(values)


def stddev(values: list[float], avg: float) -> float:
    return math.sqrt(sum((value - avg) ** 2 for value in values) / len(values))


def percentile(values: list[float], p: float) -> float:
    ordered = sorted(values)
    index = min(round((len(ordered) - 1) * p), len(ordered) - 1)
    return ordered[index]
