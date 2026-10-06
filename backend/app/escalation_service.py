from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.models import (
    Conversation,
    ConversationStatus,
    EscalationReason,
    Ticket,
    TicketStatus,
)


class ActiveEscalationExistsError(Exception):
    """Raised when a conversation already has an active escalation ticket."""


def get_active_escalation(
    db: Session,
    conversation_id: str,
) -> Ticket | None:
    statement = select(Ticket).where(
        Ticket.conversation_id == conversation_id,
        Ticket.status.in_((TicketStatus.OPEN, TicketStatus.IN_PROGRESS)),
    )
    return db.scalar(statement)


def list_active_escalations(db: Session) -> list[Ticket]:
    """Return open and in-progress escalation tickets for agent review."""
    statement = (
        select(Ticket)
        .where(
            Ticket.status.in_((TicketStatus.OPEN, TicketStatus.IN_PROGRESS)),
        )
        .order_by(Ticket.created_at.desc())
    )
    return list(db.scalars(statement).all())


def claim_escalation(db: Session, ticket_id: str) -> Ticket:
    """
    Move an OPEN escalation ticket to IN_PROGRESS for agent review.

    This is a course-scale agent-queue action, not a production assignment system.
    """
    ticket = db.get(Ticket, ticket_id)

    if ticket is None:
        raise LookupError("Escalation ticket not found")

    if ticket.status == TicketStatus.IN_PROGRESS:
        return ticket

    if ticket.status != TicketStatus.OPEN:
        raise ValueError(
            "Only open escalation tickets can be claimed for review"
        )

    ticket.status = TicketStatus.IN_PROGRESS
    ticket.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ticket)
    return ticket


def create_escalation(
    db: Session,
    conversation: Conversation,
    reason: EscalationReason,
    summary: str,
    assigned_queue: str = "General Support",
) -> Ticket:
    cleaned_summary = summary.strip()

    if not cleaned_summary:
        raise ValueError("summary is required")

    if len(cleaned_summary) > 1000:
        raise ValueError("summary must contain 1-1000 characters")

    existing = get_active_escalation(db, conversation.conversation_id)
    if existing is not None:
        raise ActiveEscalationExistsError(
            "An active escalation already exists for this conversation"
        )

    ticket = Ticket(
        ticket_id=f"ticket_{uuid4().hex}",
        conversation_id=conversation.conversation_id,
        reason=reason,
        summary=cleaned_summary,
        status=TicketStatus.OPEN,
        assigned_queue=assigned_queue,
    )

    conversation.status = ConversationStatus.ESCALATED
    conversation.updated_at = datetime.now(timezone.utc)

    db.add(ticket)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ActiveEscalationExistsError(
            "An active escalation already exists for this conversation"
        ) from exc

    db.refresh(ticket)
    return ticket


def ensure_ai_escalation(
    db: Session,
    conversation: Conversation,
    category: str,
    customer_message: str,
) -> Ticket:
    existing = get_active_escalation(db, conversation.conversation_id)
    if existing is not None:
        return existing

    if category == "ai_failure":
        reason = EscalationReason.AI_FAILURE
        assigned_queue = "Technical Support"
    elif category == "escalation":
        reason = EscalationReason.CUSTOMER_REQUEST
        assigned_queue = "General Support"
    else:
        reason = EscalationReason.LOW_CONFIDENCE
        assigned_queue = "General Support"

    summary = customer_message.strip() or "AI escalation requested"
    if len(summary) > 1000:
        summary = summary[:1000]

    return create_escalation(
        db=db,
        conversation=conversation,
        reason=reason,
        summary=summary,
        assigned_queue=assigned_queue,
    )
