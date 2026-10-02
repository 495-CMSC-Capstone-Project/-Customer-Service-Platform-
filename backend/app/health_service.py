from __future__ import annotations

import os
from dataclasses import dataclass

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session


@dataclass
class HealthResult:
    status: str
    api: str
    application_database: str
    ai_provider: str


def check_health(db: Session) -> HealthResult:
    try:
        db.execute(text("SELECT 1"))
        database_status = "AVAILABLE"
    except SQLAlchemyError:
        database_status = "UNAVAILABLE"

    ai_configured = all(
        os.getenv(name, "").strip()
        for name in ("AI_API_URL", "AI_API_KEY", "AI_MODEL")
    )
    ai_status = "CONFIGURED" if ai_configured else "UNCONFIGURED"

    if database_status == "UNAVAILABLE":
        overall_status = "UNAVAILABLE"
    elif ai_status == "UNCONFIGURED":
        overall_status = "DEGRADED"
    else:
        overall_status = "HEALTHY"

    return HealthResult(
        status=overall_status,
        api="AVAILABLE",
        application_database=database_status,
        ai_provider=ai_status,
    )
