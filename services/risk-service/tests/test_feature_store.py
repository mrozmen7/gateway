import unittest

from app.feature_store import InMemoryFeatureStore
from app.models import ApiEvent


class FeatureStoreTest(unittest.TestCase):
    def test_extracts_realtime_behavior_features(self) -> None:
        store = InMemoryFeatureStore(window_seconds=300)

        first = store.record_and_extract(
            ApiEvent(
                eventId="first",
                userId="cust-1002",
                username="yavuz",
                endpoint="/api/v1/accounts/me",
                httpMethod="GET",
                statusCode=200,
                responseTimeMs=80,
                ipAddress="10.0.0.1",
            )
        )
        second = store.record_and_extract(
            ApiEvent(
                eventId="second",
                userId="cust-1002",
                username="yavuz",
                endpoint="/api/v1/payments",
                httpMethod="POST",
                statusCode=401,
                responseTimeMs=90,
                ipAddress="10.0.0.2",
            )
        )

        self.assertEqual(1, first.requestCount1m)
        self.assertEqual(2, second.requestCount1m)
        self.assertEqual(1, second.failedRequestCount5m)
        self.assertEqual(2, second.endpointDiversity5m)
        self.assertEqual(2, second.distinctIpCountByUser5m)
        self.assertIsNotNone(second.secondsSinceLastRequest)


if __name__ == "__main__":
    unittest.main()
