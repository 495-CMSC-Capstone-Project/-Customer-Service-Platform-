"""Measure the local message handler with SQLite and a controlled AI response.

This is an in-process benchmark, not a live provider or network load test.
Run from the repository root: python scripts/benchmark_api.py
"""

import json
import math
import os
import platform
import statistics
import sys
from pathlib import Path
from time import perf_counter
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
# Never connect this benchmark to a configured production database.
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.api import app
from backend.app.database import Base, get_db
from backend.app.models import Conversation, ConversationStatus, Message


def main():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    sessions = sessionmaker(bind=engine)
    Base.metadata.create_all(engine)
    with sessions() as db:
        db.add(Conversation(
            conversation_id="conv_benchmark",
            customer_id="cust_benchmark",
            status=ConversationStatus.ACTIVE,
        ))
        db.commit()

    def benchmark_db():
        with sessions() as db:
            yield db

    previous_override = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = benchmark_db
    warmups = 5
    samples = 50
    latencies = []
    successes = 0
    try:
        with patch("backend.app.ai_service.generate_ai_response", return_value="Open your account settings."), TestClient(app) as client:
            for index in range(warmups + samples):
                started = perf_counter()
                response = client.post(
                    "/api/v1/conversations/conv_benchmark/messages",
                    json={"customerId": "cust_benchmark", "requestId": f"benchmark-{index}", "message": "How can I update my account?"},
                )
                elapsed_ms = (perf_counter() - started) * 1000
                data = response.json()
                if response.status_code != 200 or data.get("response") != "Open your account settings." or data.get("escalated") is not False:
                    raise RuntimeError(f"Unexpected benchmark response: HTTP {response.status_code}")
                if index >= warmups:
                    latencies.append(elapsed_ms)
                    successes += 1
        with sessions() as db:
            rows = db.scalar(select(func.count()).select_from(Message))
        expected_rows = 2 * (warmups + samples)
        if rows != expected_rows:
            raise RuntimeError(f"Expected {expected_rows} stored messages, found {rows}")
        ordered = sorted(latencies)
        print(json.dumps({
            "method": "FastAPI TestClient, in-process, sequential requests",
            "database": "isolated in-memory SQLite with real message persistence",
            "ai_provider": "controlled response; external provider not called",
            "python": platform.python_version(),
            "platform": platform.system(),
            "warmups": warmups,
            "measured_requests": samples,
            "concurrency": 1,
            "successful_requests": successes,
            "median_ms": round(statistics.median(latencies), 2),
            "p95_ms": round(ordered[math.ceil(0.95 * samples) - 1], 2),
            "min_ms": round(min(latencies), 2),
            "max_ms": round(max(latencies), 2),
            "persisted_messages_including_warmups": rows,
            "limits": "Excludes browser, HTTP network, PostgreSQL, and live AI latency; not evidence of production scale.",
        }, indent=2))
    finally:
        if previous_override is None:
            app.dependency_overrides.pop(get_db, None)
        else:
            app.dependency_overrides[get_db] = previous_override
        engine.dispose()


if __name__ == "__main__":
    main()
