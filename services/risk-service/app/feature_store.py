from __future__ import annotations

import time
from datetime import UTC, datetime
from typing import Protocol

from redis import Redis
from redis.exceptions import RedisError

from app.models import ApiEvent, RiskFeatures
from app.settings import Settings


class FeatureStore(Protocol):
    name: str

    def record_and_extract(self, event: ApiEvent) -> RiskFeatures:
        ...


class InMemoryFeatureStore:
    name = "memory"

    def __init__(self, window_seconds: int = 300) -> None:
        self._window_seconds = window_seconds
        self._events: list[tuple[float, ApiEvent]] = []
        self._last_seen: dict[str, float] = {}

    def record_and_extract(self, event: ApiEvent) -> RiskFeatures:
        now = time.time()
        user_key = identity_key(event)
        previous_seen = self._last_seen.get(user_key)
        self._last_seen[user_key] = now
        self._events.append((now, event))
        self._events = [(ts, item) for ts, item in self._events if now - ts <= self._window_seconds]

        user_events_1m = [item for ts, item in self._events if item.userId == event.userId and now - ts <= 60]
        user_events_5m = [item for ts, item in self._events if item.userId == event.userId]
        ip_events_5m = [item for _, item in self._events if item.ipAddress == event.ipAddress]

        return RiskFeatures(
            requestCount1m=len(user_events_1m),
            requestCount5m=len(user_events_5m),
            failedRequestCount5m=sum(1 for item in user_events_5m if item.statusCode >= 400),
            endpointDiversity5m=len({item.endpoint for item in user_events_5m}),
            distinctIpCountByUser5m=len({item.ipAddress for item in user_events_5m}),
            distinctUserCountByIp5m=len({item.userId for item in ip_events_5m}),
            secondsSinceLastRequest=round(now - previous_seen, 3) if previous_seen else None,
            offHours=is_off_hours(event.timestamp),
            source=self.name,
        )


class RedisFeatureStore:
    name = "redis"

    def __init__(self, client: Redis, window_seconds: int = 300) -> None:
        self._client = client
        self._window_seconds = window_seconds

    def record_and_extract(self, event: ApiEvent) -> RiskFeatures:
        now = time.time()
        event_marker = f"{event.eventId}:{now}"
        user_key = safe_key(event.userId)
        ip_key = safe_key(event.ipAddress)

        user_requests = f"risk:user:{user_key}:requests"
        user_failed = f"risk:user:{user_key}:failed"
        user_endpoints = f"risk:user:{user_key}:endpoints"
        user_ips = f"risk:user:{user_key}:ips"
        ip_users = f"risk:ip:{ip_key}:users"
        last_seen = f"risk:user:{user_key}:last_seen"

        previous_seen_raw = self._client.get(last_seen)
        previous_seen = float(previous_seen_raw) if previous_seen_raw else None

        pipe = self._client.pipeline()
        pipe.zadd(user_requests, {event_marker: now})
        pipe.zremrangebyscore(user_requests, 0, now - self._window_seconds)
        if event.statusCode >= 400:
            pipe.zadd(user_failed, {event_marker: now})
        pipe.zremrangebyscore(user_failed, 0, now - self._window_seconds)
        pipe.sadd(user_endpoints, event.endpoint)
        pipe.expire(user_endpoints, self._window_seconds)
        pipe.sadd(user_ips, event.ipAddress)
        pipe.expire(user_ips, self._window_seconds)
        pipe.sadd(ip_users, event.userId)
        pipe.expire(ip_users, self._window_seconds)
        pipe.set(last_seen, str(now), ex=self._window_seconds)
        pipe.execute()

        return RiskFeatures(
            requestCount1m=count_since(self._client, user_requests, now - 60),
            requestCount5m=int(self._client.zcard(user_requests)),
            failedRequestCount5m=int(self._client.zcard(user_failed)),
            endpointDiversity5m=int(self._client.scard(user_endpoints)),
            distinctIpCountByUser5m=int(self._client.scard(user_ips)),
            distinctUserCountByIp5m=int(self._client.scard(ip_users)),
            secondsSinceLastRequest=round(now - previous_seen, 3) if previous_seen else None,
            offHours=is_off_hours(event.timestamp),
            source=self.name,
        )


class ResilientFeatureStore:
    name = "redis-with-memory-fallback"

    def __init__(self, primary: FeatureStore, fallback: FeatureStore) -> None:
        self._primary = primary
        self._fallback = fallback

    def record_and_extract(self, event: ApiEvent) -> RiskFeatures:
        try:
            return self._primary.record_and_extract(event)
        except RedisError:
            return self._fallback.record_and_extract(event)


def build_feature_store(settings: Settings) -> FeatureStore:
    fallback = InMemoryFeatureStore(window_seconds=settings.feature_window_seconds)
    try:
        client = Redis.from_url(settings.redis_url, decode_responses=True, socket_connect_timeout=1)
        primary = RedisFeatureStore(client=client, window_seconds=settings.feature_window_seconds)
        return ResilientFeatureStore(primary=primary, fallback=fallback)
    except RedisError:
        return fallback


def count_since(client: Redis, key: str, since: float) -> int:
    return int(client.zcount(key, since, "+inf"))


def identity_key(event: ApiEvent) -> str:
    return event.userId or event.username or event.ipAddress


def safe_key(value: str) -> str:
    return value.replace(":", "_").replace("/", "_").replace(" ", "_")


def is_off_hours(timestamp: str) -> bool:
    try:
        parsed = datetime.fromisoformat(timestamp.replace("Z", "+00:00")).astimezone(UTC)
    except ValueError:
        parsed = datetime.now(UTC)

    return parsed.hour < 6 or parsed.hour >= 22
