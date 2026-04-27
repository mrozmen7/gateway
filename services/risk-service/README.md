# Risk Service

Python FastAPI service for first-pass API security risk evaluation.

It consumes gateway events from Kafka topic `api-events`, evaluates each request with an explainable rule-based score, and exposes the latest decisions for local verification.

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

This phase is observe-only. Adaptive blocking and step-up authentication belong to later phases.
