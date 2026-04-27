import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from app.feature_store import build_feature_store
from app.kafka_consumer import ApiEventConsumer
from app.models import ApiEvent, HealthResponse, RiskEvaluation, ServiceStats
from app.risk_engine import evaluate_event
from app.settings import settings
from app.state import RiskState

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

state = RiskState(maxlen=settings.event_buffer_size)
feature_store = build_feature_store(settings)
consumer = ApiEventConsumer(settings=settings, state=state, feature_store=feature_store)


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="UP",
        service=settings.service_name,
        kafkaTopic=settings.api_events_topic,
        featureStore=feature_store.name,
        consumedEvents=state.consumed_events(),
    )


@app.post("/risk/evaluate", response_model=RiskEvaluation)
def risk_evaluate(event: ApiEvent) -> RiskEvaluation:
    features = feature_store.record_and_extract(event)
    decision = evaluate_event(event, features)
    state.record(event, decision)
    return decision


@app.get("/risk/stats", response_model=ServiceStats)
def risk_stats() -> ServiceStats:
    return ServiceStats(
        consumedEvents=state.consumed_events(),
        featureStore=feature_store.name,
        lastEvent=state.last_event(),
        lastDecision=state.last_decision(),
    )


@app.get("/risk/decisions", response_model=list[RiskEvaluation])
def recent_decisions(limit: int = Query(default=25, ge=1, le=200)) -> list[RiskEvaluation]:
    return state.recent_decisions(limit=limit)
