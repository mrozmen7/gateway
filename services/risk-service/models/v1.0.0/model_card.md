# Model Card: API Security Anomaly Profile v1.0.0

## Intended Use

Portfolio/demo anomaly detection for banking API security events. The model flags traffic that deviates from a synthetic normal API profile and feeds an explainable composite risk score.

## Not Intended For

Production fraud detection, fully automated account blocking, or regulated decisioning without human review, real labeled data, bias testing, and monitoring.

## Algorithm

Weighted statistical anomaly profile over real-time request features. It behaves like a lightweight anomaly detector: higher weighted distance from normal traffic produces a higher ML anomaly score.

## Features

Request frequency, failed request count, endpoint diversity, distinct IP/user signals, response time, status bucket, off-hours indicator, sensitive endpoint indicator, anonymous non-actuator access, and HTTP method class.

## Governance Note

This is compliance-aware, not compliance-certified. Decisions remain explainable through rule score, ML score, top factors, model version, and audit-friendly output.
