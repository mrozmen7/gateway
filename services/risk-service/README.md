# Risk Service

Python FastAPI service for API security risk evaluation.

It consumes gateway events from Kafka topic `api-events`, writes short-lived behavior features to Redis, evaluates each request with an explainable rule-based score plus an ML anomaly score, and exposes the latest decisions for local verification.

## Endpoints

```text
GET  /health
GET  /risk/stats
GET  /risk/decisions?limit=25
POST /risk/evaluate
```

## Local Run

```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8091
```

Docker Compose runs it as part of the banking stack:

```bash
docker compose -f infra/docker/docker-compose.yml up -d risk-service
```

## Decisions

- `allow`: normal traffic
- `monitor`: elevated risk signal, keep observing
- `review`: suspicious enough for operator review
- `step_up`: high risk, require stronger verification in a future adaptive gateway phase
- `block`: critical risk, suitable for temporary deny/blocklist in a future adaptive gateway phase

This phase is observe-only. The service computes `step_up` and `block` decisions, but the API Gateway does not yet enforce them.

## AI / ML Anomaly Model

The model is versioned under:

```text
models/v1.0.0/
  model.json
  feature_schema.json
  metrics.json
  model_card.md
```

Training is deterministic and dependency-light:

```bash
PYTHONPATH=. python scripts/train_anomaly_model.py
```

The current model is a weighted statistical anomaly profile trained on synthetic banking API traffic. It is intentionally explainable and portfolio-safe:

- `ruleScore`: deterministic security rules
- `mlScore`: distance from learned normal traffic profile
- `riskScore`: composite score, currently `0.60 * ruleScore + 0.40 * mlScore`
- `modelVersion`: version of the loaded anomaly profile

This is an AI-augmented prototype, not a production fraud model. Production use would require real labeled data, monitoring, fairness/bias checks, governance review, and human override workflows.

## Real-Time Features

Redis stores short-lived behavior counters:

- requests per user in the last 1 minute
- requests per user in the last 5 minutes
- failed requests per user in the last 5 minutes
- endpoint diversity per user
- distinct IP count per user
- distinct user count per IP
- last request timestamp

The feature store is deliberately separate from the Kafka consumer so tests can use an in-memory store and the Compose runtime can use Redis.
