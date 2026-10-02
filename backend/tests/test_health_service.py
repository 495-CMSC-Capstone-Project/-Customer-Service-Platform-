from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from backend.app.health_service import check_health


def test_health_is_degraded_when_ai_is_not_configured(monkeypatch):
    for name in ("AI_API_URL", "AI_API_KEY", "AI_MODEL"):
        monkeypatch.delenv(name, raising=False)

    engine = create_engine("sqlite:///:memory:")

    with Session(engine) as db:
        result = check_health(db)

    engine.dispose()

    assert result.status == "DEGRADED"
    assert result.api == "AVAILABLE"
    assert result.application_database == "AVAILABLE"
    assert result.ai_provider == "UNCONFIGURED"


def test_health_is_healthy_when_database_and_ai_config_are_available(
    monkeypatch,
):
    monkeypatch.setenv("AI_API_URL", "https://example.test/v1/chat")
    monkeypatch.setenv("AI_API_KEY", "test-key")
    monkeypatch.setenv("AI_MODEL", "test-model")

    engine = create_engine("sqlite:///:memory:")

    with Session(engine) as db:
        result = check_health(db)

    engine.dispose()

    assert result.status == "HEALTHY"
    assert result.application_database == "AVAILABLE"
    assert result.ai_provider == "CONFIGURED"


def test_health_is_unavailable_when_database_check_fails(monkeypatch):
    class FailingSession:
        def execute(self, statement):
            raise SQLAlchemyError("Database unavailable")

    monkeypatch.setenv("AI_API_URL", "https://example.test/v1/chat")
    monkeypatch.setenv("AI_API_KEY", "test-key")
    monkeypatch.setenv("AI_MODEL", "test-model")

    result = check_health(FailingSession())

    assert result.status == "UNAVAILABLE"
    assert result.api == "AVAILABLE"
    assert result.application_database == "UNAVAILABLE"
    assert result.ai_provider == "CONFIGURED"
