import unittest

from app.models import ApiEvent, RiskFeatures
from app.risk_engine import evaluate_event


class RiskEngineTest(unittest.TestCase):
    def test_allows_normal_authenticated_request(self) -> None:
        decision = evaluate_event(
            ApiEvent(
                userId="cust-1002",
                username="yavuz",
                role="CUSTOMER",
                endpoint="/api/v1/accounts/me",
                httpMethod="GET",
                statusCode=200,
                responseTimeMs=80,
            )
        )

        self.assertEqual("allow", decision.decision)
        self.assertLess(decision.riskScore, 0.30)
        self.assertIn("sensitive_endpoint", decision.reasons)
        self.assertEqual("composite-risk-v1", decision.source)
        self.assertEqual(0.10, decision.ruleScore)
        self.assertEqual(0.0, decision.mlScore)

    def test_reviews_anonymous_failing_sensitive_request(self) -> None:
        decision = evaluate_event(
            ApiEvent(
                userId="anonymous",
                username="anonymous",
                role="ANONYMOUS",
                endpoint="/api/v1/payments",
                httpMethod="POST",
                statusCode=500,
                responseTimeMs=1500,
            )
        )

        self.assertEqual("review", decision.decision)
        self.assertGreaterEqual(decision.ruleScore, 0.60)
        self.assertGreaterEqual(decision.riskScore, 0.30)
        self.assertIn("server_error_response", decision.reasons)
        self.assertIn("anonymous_non_actuator_request", decision.reasons)

    def test_reviews_burst_and_failed_behavior(self) -> None:
        decision = evaluate_event(
            ApiEvent(
                userId="cust-1002",
                username="yavuz",
                role="CUSTOMER",
                endpoint="/api/v1/transactions/transfers",
                httpMethod="POST",
                statusCode=403,
                responseTimeMs=120,
            ),
            RiskFeatures(
                requestCount1m=35,
                requestCount5m=80,
                failedRequestCount5m=8,
                endpointDiversity5m=9,
                distinctIpCountByUser5m=1,
                distinctUserCountByIp5m=1,
                secondsSinceLastRequest=0.2,
                source="redis",
            ),
        )

        self.assertEqual("step_up", decision.decision)
        self.assertGreaterEqual(decision.ruleScore, 0.60)
        self.assertGreaterEqual(decision.riskScore, 0.60)
        self.assertIn("burst_request_frequency", decision.reasons)
        self.assertIn("repeated_failed_requests", decision.reasons)
        self.assertEqual("redis", decision.features.source)


if __name__ == "__main__":
    unittest.main()
