from collections import deque
from threading import Lock

from app.models import ApiEvent, RiskEvaluation


class RiskState:
    def __init__(self, maxlen: int) -> None:
        self._lock = Lock()
        self._events: deque[ApiEvent] = deque(maxlen=maxlen)
        self._decisions: deque[RiskEvaluation] = deque(maxlen=maxlen)
        self._consumed_events = 0

    def record(self, event: ApiEvent, decision: RiskEvaluation) -> None:
        with self._lock:
            self._events.append(event)
            self._decisions.append(decision)
            self._consumed_events += 1

    def consumed_events(self) -> int:
        with self._lock:
            return self._consumed_events

    def last_event(self) -> ApiEvent | None:
        with self._lock:
            return self._events[-1] if self._events else None

    def last_decision(self) -> RiskEvaluation | None:
        with self._lock:
            return self._decisions[-1] if self._decisions else None

    def recent_decisions(self, limit: int = 25) -> list[RiskEvaluation]:
        with self._lock:
            return list(self._decisions)[-limit:]
