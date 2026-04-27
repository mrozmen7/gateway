from datetime import UTC, datetime
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field


class ApiEvent(BaseModel):
    eventId: str = Field(default_factory=lambda: str(uuid4()))
    timestamp: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())
    correlationId: str = "unknown"
    userId: str = "anonymous"
    username: str = "anonymous"
    role: str = "ANONYMOUS"
    ipAddress: str = "unknown"
    userAgent: str = "unknown"
    endpoint: str
    httpMethod: str
    statusCode: int
    responseTimeMs: int
    serviceName: str = "api-gateway"


RiskDecision = Literal["allow", "monitor", "review"]


class RiskFeatures(BaseModel):
    requestCount1m: int = 0
    requestCount5m: int = 0
    failedRequestCount5m: int = 0
    endpointDiversity5m: int = 0
    distinctIpCountByUser5m: int = 0
    distinctUserCountByIp5m: int = 0
    secondsSinceLastRequest: float | None = None
    offHours: bool = False
    source: str = "none"


class RiskEvaluation(BaseModel):
    decisionId: str = Field(default_factory=lambda: str(uuid4()))
    evaluatedAt: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())
    eventId: str
    correlationId: str
    userId: str
    username: str
    ipAddress: str
    endpoint: str
    riskScore: float
    decision: RiskDecision
    reasons: list[str]
    topFactors: list[str] = Field(default_factory=list)
    features: RiskFeatures = Field(default_factory=RiskFeatures)
    source: str = "rule-based-v1"


class HealthResponse(BaseModel):
    status: str
    service: str
    kafkaTopic: str
    featureStore: str
    consumedEvents: int


class ServiceStats(BaseModel):
    consumedEvents: int
    featureStore: str
    lastEvent: ApiEvent | None
    lastDecision: RiskEvaluation | None
