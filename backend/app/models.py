from __future__ import annotations

from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class ConversationStatus(str, PyEnum):
    ACTIVE = "ACTIVE"
    ESCALATED = "ESCALATED"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class SenderType(str, PyEnum):
    CUSTOMER = "CUSTOMER"
    AI = "AI"
    HUMAN = "HUMAN"
    SYSTEM = "SYSTEM"


class TicketStatus(str, PyEnum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class EscalationReason(str, PyEnum):
    LOW_CONFIDENCE = "LOW_CONFIDENCE"
    COMPLEX_ISSUE = "COMPLEX_ISSUE"
    CUSTOMER_REQUEST = "CUSTOMER_REQUEST"
    AI_FAILURE = "AI_FAILURE"


class ResolutionType(str, PyEnum):
    AI_RESOLVED = "AI_RESOLVED"
    HUMAN_RESOLVED = "HUMAN_RESOLVED"


class Conversation(Base):
    __tablename__ = "conversations"

    conversation_id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
    )
    customer_id: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )
    status: Mapped[ConversationStatus] = mapped_column(
        Enum(ConversationStatus, name="conversation_status"),
        nullable=False,
        default=ConversationStatus.ACTIVE,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    messages: Mapped[list["Message"]] = relationship(
        back_populates="conversation"
    )
    tickets: Mapped[list["Ticket"]] = relationship(
        back_populates="conversation"
    )
    feedback: Mapped["Feedback | None"] = relationship(
        back_populates="conversation",
        uselist=False,
    )


class Message(Base):
    __tablename__ = "messages"

    __table_args__ = (
        CheckConstraint(
            "length(message_text) BETWEEN 1 AND 2000",
            name="ck_message_length",
        ),
        CheckConstraint(
            "confidence IS NULL OR "
            "(confidence >= 0 AND confidence <= 1)",
            name="ck_message_confidence",
        ),
        Index(
            "ix_messages_conversation_created",
            "conversation_id",
            "created_at",
        ),
    )

    message_id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
    )
    conversation_id: Mapped[str] = mapped_column(
        ForeignKey("conversations.conversation_id"),
        nullable=False,
    )
    sender_type: Mapped[SenderType] = mapped_column(
        Enum(SenderType, name="sender_type"),
        nullable=False,
    )
    message_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    source: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    confidence: Mapped[float | None] = mapped_column(
        Numeric(4, 3),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    conversation: Mapped["Conversation"] = relationship(
        back_populates="messages"
    )


class Ticket(Base):
    __tablename__ = "tickets"

    __table_args__ = (
        CheckConstraint(
            "length(summary) BETWEEN 1 AND 1000",
            name="ck_ticket_summary_length",
        ),
        Index(
            "ix_tickets_queue_status_created",
            "assigned_queue",
            "status",
            "created_at",
        ),
        Index(
            "uq_active_ticket_per_conversation",
            "conversation_id",
            unique=True,
            postgresql_where=text(
                "status IN ('OPEN', 'IN_PROGRESS')"
            ),
            sqlite_where=text(
                "status IN ('OPEN', 'IN_PROGRESS')"
            ),
        ),
    )

    ticket_id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
    )
    conversation_id: Mapped[str] = mapped_column(
        ForeignKey("conversations.conversation_id"),
        nullable=False,
    )
    reason: Mapped[EscalationReason] = mapped_column(
        Enum(EscalationReason, name="escalation_reason"),
        nullable=False,
    )
    summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    status: Mapped[TicketStatus] = mapped_column(
        Enum(TicketStatus, name="ticket_status"),
        nullable=False,
        default=TicketStatus.OPEN,
    )
    assigned_queue: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    conversation: Mapped["Conversation"] = relationship(
        back_populates="tickets"
    )


class Feedback(Base):
    __tablename__ = "feedback"

    feedback_id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
    )
    conversation_id: Mapped[str] = mapped_column(
        ForeignKey("conversations.conversation_id"),
        nullable=False,
        unique=True,
    )
    resolution_type: Mapped[ResolutionType] = mapped_column(
        Enum(ResolutionType, name="resolution_type"),
        nullable=False,
    )
    successful: Mapped[bool] = mapped_column(
        nullable=False,
    )
    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    conversation: Mapped["Conversation"] = relationship(
        back_populates="feedback"
    )
