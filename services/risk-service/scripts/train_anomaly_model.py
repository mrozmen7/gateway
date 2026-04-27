from __future__ import annotations

import json
import random
from pathlib import Path

from app.ml_model import FEATURE_NAMES, train_profile

ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "models" / "v1.0.0"


def main() -> None:
    random.seed(42)
    normal_samples = [normal_request() for _ in range(1_200)]
    attack_samples = [attack_request() for _ in range(350)]

    weights = {
        "request_count_1m": 1.25,
        "failed_request_count_5m": 1.45,
        "endpoint_diversity_5m": 1.15,
        "distinct_ip_count_by_user_5m": 1.30,
        "distinct_user_count_by_ip_5m": 1.30,
        "response_time_ms": 0.55,
        "status_code_bucket": 1.35,
        "seconds_since_last_request": 0.80,
        "off_hours": 0.50,
        "sensitive_endpoint": 0.65,
        "anonymous_non_actuator": 1.20,
        "non_get_method": 0.55,
    }

    profile = train_profile(normal_samples, weights)
    model = {
        "version": "v1.0.0",
        "algorithm": "weighted_statistical_anomaly_profile",
        "trainedOn": "synthetic banking API traffic",
        **profile,
    }

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    write_json(MODEL_DIR / "model.json", model)
    write_json(
        MODEL_DIR / "feature_schema.json",
        {
            "version": "v1.0.0",
            "features": [{"name": name, "type": "number"} for name in FEATURE_NAMES],
        },
    )
    write_json(MODEL_DIR / "metrics.json", evaluate(model, normal_samples, attack_samples))
    (MODEL_DIR / "model_card.md").write_text(model_card(), encoding="utf-8")


def normal_request() -> dict[str, float]:
    return {
        "request_count_1m": clipped_gauss(4, 2, 1, 12),
        "failed_request_count_5m": random.choice([0, 0, 0, 1]),
        "endpoint_diversity_5m": clipped_gauss(3, 1, 1, 6),
        "distinct_ip_count_by_user_5m": random.choice([1, 1, 1, 2]),
        "distinct_user_count_by_ip_5m": random.choice([1, 1, 2]),
        "response_time_ms": clipped_gauss(90, 45, 15, 350),
        "status_code_bucket": random.choice([0, 0, 0, 0, 1]),
        "seconds_since_last_request": clipped_gauss(18, 16, 1, 60),
        "off_hours": 1.0 if random.random() < 0.08 else 0.0,
        "sensitive_endpoint": 1.0 if random.random() < 0.45 else 0.0,
        "anonymous_non_actuator": 0.0,
        "non_get_method": 1.0 if random.random() < 0.25 else 0.0,
    }


def attack_request() -> dict[str, float]:
    scenario = random.choice(["burst", "credential_stuffing", "scraping", "account_takeover"])
    if scenario == "burst":
        return base_attack(requests=60, failed=3, diversity=5, users_per_ip=2, status=0)
    if scenario == "credential_stuffing":
        return base_attack(requests=35, failed=28, diversity=2, users_per_ip=12, status=2)
    if scenario == "scraping":
        return base_attack(requests=45, failed=2, diversity=18, users_per_ip=1, status=0)
    return base_attack(requests=20, failed=8, diversity=9, users_per_ip=4, status=2, ips_per_user=5)


def base_attack(
    *,
    requests: int,
    failed: int,
    diversity: int,
    users_per_ip: int,
    status: int,
    ips_per_user: int = 1,
) -> dict[str, float]:
    return {
        "request_count_1m": clipped_gauss(requests, 10, 10, 120),
        "failed_request_count_5m": clipped_gauss(failed, 5, 0, 80),
        "endpoint_diversity_5m": clipped_gauss(diversity, 3, 1, 30),
        "distinct_ip_count_by_user_5m": clipped_gauss(ips_per_user, 1, 1, 8),
        "distinct_user_count_by_ip_5m": clipped_gauss(users_per_ip, 3, 1, 25),
        "response_time_ms": clipped_gauss(260, 130, 30, 1_800),
        "status_code_bucket": float(status),
        "seconds_since_last_request": clipped_gauss(0.6, 0.4, 0.05, 3),
        "off_hours": 1.0 if random.random() < 0.35 else 0.0,
        "sensitive_endpoint": 1.0,
        "anonymous_non_actuator": 1.0 if random.random() < 0.20 else 0.0,
        "non_get_method": 1.0 if random.random() < 0.70 else 0.0,
    }


def clipped_gauss(avg: float, sigma: float, low: float, high: float) -> float:
    return round(min(max(random.gauss(avg, sigma), low), high), 3)


def evaluate(
    model: dict[str, object],
    normal_samples: list[dict[str, float]],
    attack_samples: list[dict[str, float]],
) -> dict[str, float | str]:
    threshold = 0.60
    normal_scores = [score(model, sample) for sample in normal_samples]
    attack_scores = [score(model, sample) for sample in attack_samples]
    false_positive_rate = sum(1 for item in normal_scores if item >= threshold) / len(normal_scores)
    true_positive_rate = sum(1 for item in attack_scores if item >= threshold) / len(attack_scores)
    return {
        "version": "v1.0.0",
        "threshold": threshold,
        "normalScoreP95": round(sorted(normal_scores)[round(len(normal_scores) * 0.95)], 3),
        "attackScoreP50": round(sorted(attack_scores)[round(len(attack_scores) * 0.50)], 3),
        "syntheticTruePositiveRate": round(true_positive_rate, 3),
        "syntheticFalsePositiveRate": round(false_positive_rate, 3),
        "note": "Synthetic metrics are for portfolio/demo validation, not production claims.",
    }


def score(model: dict[str, object], sample: dict[str, float]) -> float:
    means = model["means"]
    stddevs = model["stddevs"]
    weights = model["weights"]
    high_risk_distance = float(model["highRiskDistance"])
    distance = sum(
        float(weights[name]) * abs(sample[name] - float(means[name])) / max(float(stddevs[name]), 0.001)
        for name in FEATURE_NAMES
    )
    return min(distance / high_risk_distance, 1.0)


def write_json(path: Path, payload: object) -> None:
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def model_card() -> str:
    return """# Model Card: API Security Anomaly Profile v1.0.0

## Intended Use

Portfolio/demo anomaly detection for banking API security events. The model flags traffic that deviates from a synthetic normal API profile and feeds an explainable composite risk score.

## Not Intended For

Production fraud detection, fully automated account blocking, or regulated decisioning without human review, real labeled data, bias testing, and monitoring.

## Algorithm

Weighted statistical anomaly profile over real-time request features. It behaves like a lightweight anomaly detector: higher weighted distance from normal traffic produces a higher ML anomaly score.

## Features

Request frequency, failed request count, endpoint diversity, distinct IP/user signals, response time, status bucket, off-hours indicator, sensitive endpoint indicator, anonymous non-actuator access, and HTTP method class.

## Governance Note

This is compliance-aware, not compliance-certified. Decisions remain explainable through rule score, ML score, top factors, model version, and audit-friendly output.
"""


if __name__ == "__main__":
    main()
