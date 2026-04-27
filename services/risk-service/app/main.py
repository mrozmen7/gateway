import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Query

from app.kafka_consumer import ApiEventConsumer
from app.models import ApiEvent, HealthResponse, RiskEvaluation, ServiceStats
from app.risk_engine import evaluate_event
from app.settings import settings
from app.state import RiskState

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

state = RiskState(maxlen=settings.event_buffer_size)
consumer = ApiEventConsumer(settings=settings, state=state)


@asynccontextmanager
async def lifespan(_: FastAPI):
    consumer.start()
    yield
    consumer.stop()


app = FastAPI(
    title="Risk Service API",
    version="0.1.0",
    description="Consumes gateway API events and produces explainable first-pass risk evaluations.",
    lifespan=lifespan,
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="UP",
        service=settings.service_name,
        kafkaTopic=settings.api_events_topic,
        consumedEvents=state.consumed_events(),
    )


@app.post("/risk/evaluate", response_model=RiskEvaluation)
def risk_evaluate(event: ApiEvent) -> RiskEvaluation:
    decision = evaluate_event(event)
    state.record(event, decision)
    return decision


@app.get("/risk/stats", response_model=ServiceStats)
def risk_stats() -> ServiceStats:
    return ServiceStats(
        consumedEvents=state.consumed_events(),
        lastEvent=state.last_event(),
        lastDecision=state.last_decision(),
    )


@app.get("/risk/decisions", response_model=list[RiskEvaluation])
def recent_decisions(limit: int = Query(default=25, ge=1, le=200)) -> list[RiskEvaluation]:
    return state.recent_decisions(limit=limit)
