import unittest

from app.models import ApiEvent
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
        self.assertGreaterEqual(decision.riskScore, 0.60)
        self.assertIn("server_error_response", decision.reasons)
        self.assertIn("anonymous_non_actuator_request", decision.reasons)


if __name__ == "__main__":
    unittest.main()
