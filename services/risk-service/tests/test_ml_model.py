import unittest

from app.ml_model import StatisticalAnomalyModel
from app.models import ApiEvent, RiskFeatures
from app.risk_engine import evaluate_event


class MlModelTest(unittest.TestCase):
    def test_composite_score_includes_ml_anomaly_signal(self) -> None:
        model = StatisticalAnomalyModel(
            version="test-model",
            means={
                "request_count_1m": 3,
                "failed_request_count_5m": 0,
                "endpoint_diversity_5m": 2,
                "distinct_ip_count_by_user_5m": 1,
                "distinct_user_count_by_ip_5m": 1,
                "response_time_ms": 80,
                "status_code_bucket": 0,
                "seconds_since_last_request": 20,
                "off_hours": 0,
                "sensitive_endpoint": 0,
                "anonymous_non_actuator": 0,
                "non_get_method": 0,
            },
            stddevs={name: 1 for name in [
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
            ]},
            weights={name: 1 for name in [
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
            ]},
            high_risk_distance=10,
        )

        decision = evaluate_event(
            ApiEvent(
                userId="cust-1002",
                username="yavuz",
                role="CUSTOMER",
                endpoint="/api/v1/transactions/transfers",
                httpMethod="POST",
                statusCode=200,
                responseTimeMs=300,
            ),
            RiskFeatures(
                requestCount1m=40,
                failedRequestCount5m=1,
                endpointDiversity5m=10,
                secondsSinceLastRequest=0.5,
                source="redis",
            ),
            anomaly_model=model,
        )

        self.assertGreaterEqual(decision.mlScore, 0.60)
        self.assertIn("ml_anomaly_detected", decision.reasons)
        self.assertEqual("test-model", decision.modelVersion)


if __name__ == "__main__":
    unittest.main()
