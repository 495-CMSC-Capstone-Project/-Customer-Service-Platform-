from __future__ import annotations

from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.models import Conversation, Feedback, ResolutionType


class DuplicateFeedbackError(Exception):
    """Raised when final feedback already exists for a conversation."""


def get_feedback(
    db: Session,
    conversation_id: str,
) -> Feedback | None:
    statement = select(Feedback).where(
        Feedback.conversation_id == conversation_id
    )
    return db.scalar(statement)


def record_feedback(
    db: Session,
    conversation: Conversation,
    resolution_type: ResolutionType,
    successful: bool,
    category: str,
) -> Feedback:
    cleaned_category = category.strip()

    if not cleaned_category:
        raise ValueError("category is required")

    if len(cleaned_category) > 100:
        raise ValueError("category must contain 1-100 characters")

    if get_feedback(db, conversation.conversation_id) is not None:
        raise DuplicateFeedbackError(
            "Feedback already exists for this conversation"
        )

    feedback = Feedback(
        feedback_id=f"fb_{uuid4().hex}",
        conversation_id=conversation.conversation_id,
        resolution_type=resolution_type,
        successful=successful,
        category=cleaned_category,
    )

    db.add(feedback)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise DuplicateFeedbackError(
            "Feedback already exists for this conversation"
        ) from exc

    db.refresh(feedback)
    return feedback
