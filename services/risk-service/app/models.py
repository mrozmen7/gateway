from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field


class ApiEvent(BaseModel):
    eventId: str = Field(default_factory=lambda: str(uuid4()))
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
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


RiskDecision = Literal["allow", "monitor", "review", "step_up", "block"]


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
    evaluatedAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    eventId: str
    correlationId: str
    userId: str
    username: str
    ipAddress: str
    endpoint: str
    riskScore: float
    ruleScore: float = 0.0
    mlScore: float = 0.0
    decision: RiskDecision
    reasons: list[str]
    topFactors: list[str] = Field(default_factory=list)
    features: RiskFeatures = Field(default_factory=RiskFeatures)
    source: str = "composite-risk-v1"
    modelVersion: str = "none"


class HealthResponse(BaseModel):
    status: str
    service: str
    kafkaTopic: str
    featureStore: str
    consumedEvents: int
    modelVersion: str
    modelStatus: str


class ServiceStats(BaseModel):
    consumedEvents: int
    featureStore: str
    lastEvent: ApiEvent | None
    lastDecision: RiskEvaluation | None
