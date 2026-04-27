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
    source: str = "rule-based-v0"


class HealthResponse(BaseModel):
    status: str
    service: str
    kafkaTopic: str
    consumedEvents: int


class ServiceStats(BaseModel):
    consumedEvents: int
    lastEvent: ApiEvent | None
    lastDecision: RiskEvaluation | None
