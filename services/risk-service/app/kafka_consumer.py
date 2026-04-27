import json
import logging
import threading

from kafka import KafkaConsumer

from app.models import ApiEvent
from app.risk_engine import evaluate_event
from app.settings import Settings
from app.state import RiskState

log = logging.getLogger(__name__)


class ApiEventConsumer:
    def __init__(self, settings: Settings, state: RiskState) -> None:
        self._settings = settings
        self._state = state
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return

        self._thread = threading.Thread(target=self._run_forever, name="api-events-consumer", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=5)

    def _run_forever(self) -> None:
        while not self._stop.is_set():
            try:
                self._consume()
            except Exception:
                log.exception("api-events consumer failed; retrying")
                self._stop.wait(3)

    def _consume(self) -> None:
        consumer = KafkaConsumer(
            self._settings.api_events_topic,
            bootstrap_servers=self._settings.kafka_bootstrap_servers,
            group_id=self._settings.kafka_group_id,
            auto_offset_reset="earliest",
            enable_auto_commit=True,
            value_deserializer=lambda raw: json.loads(raw.decode("utf-8")),
            consumer_timeout_ms=1000,
        )

        try:
            while not self._stop.is_set():
                records = consumer.poll(timeout_ms=1000)
                for messages in records.values():
                    for message in messages:
                        self._handle_message(message.value)
        finally:
            consumer.close()

    def _handle_message(self, value: dict) -> None:
        event = ApiEvent.model_validate(value)
        decision = evaluate_event(event)
        self._state.record(event, decision)
        log.info(
            "risk_evaluated event_id=%s user=%s endpoint=%s score=%.2f decision=%s",
            event.eventId,
            event.username,
            event.endpoint,
            decision.riskScore,
            decision.decision,
        )
