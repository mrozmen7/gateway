from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(populate_by_name=True)

    service_name: str = Field(default="risk-service", alias="RISK_SERVICE_NAME")
    kafka_bootstrap_servers: str = Field(default="localhost:9092", alias="KAFKA_BOOTSTRAP_SERVERS")
    api_events_topic: str = Field(default="api-events", alias="API_EVENTS_TOPIC")
    kafka_group_id: str = Field(default="risk-service", alias="KAFKA_GROUP_ID")
    event_buffer_size: int = Field(default=100, alias="RISK_EVENT_BUFFER_SIZE")


settings = Settings()
