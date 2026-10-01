import os
import uuid

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from backend.app.database import Base
from backend.app.models import (
    Conversation,
    ConversationStatus,
    Message,
    SenderType,
)


TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

if not TEST_DATABASE_URL:
    pytest.skip(
        "TEST_DATABASE_URL is not configured",
        allow_module_level=True,
    )


def test_postgresql_conversation_message_persistence():
    engine = create_engine(
        TEST_DATABASE_URL,
        pool_pre_ping=True,
    )

    Base.metadata.create_all(bind=engine)

    conversation_id = f"postgres_test_conv_{uuid.uuid4().hex}"
    message_id = f"postgres_test_msg_{uuid.uuid4().hex}"
    customer_id = f"postgres_test_customer_{uuid.uuid4().hex}"

    with Session(engine) as session:
        conversation = Conversation(
            conversation_id=conversation_id,
            customer_id=customer_id,
            status=ConversationStatus.ACTIVE,
        )

        message = Message(
            message_id=message_id,
            conversation_id=conversation_id,
            sender_type=SenderType.CUSTOMER,
            message_text="PostgreSQL integration test message",
        )

        session.add(conversation)
        session.add(message)
        session.commit()

    with Session(engine) as session:
        saved_conversation = session.get(
            Conversation,
            conversation_id,
        )
        saved_message = session.get(
            Message,
            message_id,
        )

        assert saved_conversation is not None
        assert saved_conversation.customer_id == customer_id
        assert saved_conversation.status == ConversationStatus.ACTIVE

        assert saved_message is not None
        assert saved_message.conversation_id == conversation_id
        assert saved_message.sender_type == SenderType.CUSTOMER
        assert saved_message.message_text == "PostgreSQL integration test message"

        session.delete(saved_message)
        session.delete(saved_conversation)
        session.commit()

    engine.dispose()


def test_postgresql_escalation_and_feedback_persistence():
    from backend.app.escalation_service import create_escalation
    from backend.app.feedback_service import record_feedback
    from backend.app.models import (
        EscalationReason,
        Feedback,
        ResolutionType,
        Ticket,
        TicketStatus,
    )

    engine = create_engine(
        TEST_DATABASE_URL,
        pool_pre_ping=True,
    )

    Base.metadata.create_all(bind=engine)

    conversation_id = f"postgres_test_conv_{uuid.uuid4().hex}"
    customer_id = f"postgres_test_customer_{uuid.uuid4().hex}"

    with Session(engine) as session:
        conversation = Conversation(
            conversation_id=conversation_id,
            customer_id=customer_id,
            status=ConversationStatus.ACTIVE,
        )

        session.add(conversation)
        session.commit()

        ticket = create_escalation(
            db=session,
            conversation=conversation,
            reason=EscalationReason.CUSTOMER_REQUEST,
            summary="PostgreSQL escalation integration test",
        )

        feedback = record_feedback(
            db=session,
            conversation=conversation,
            resolution_type=ResolutionType.HUMAN_RESOLVED,
            successful=True,
            category="INTEGRATION_TEST",
        )

        ticket_id = ticket.ticket_id
        feedback_id = feedback.feedback_id

    with Session(engine) as session:
        saved_conversation = session.get(Conversation, conversation_id)
        saved_ticket = session.get(Ticket, ticket_id)
        saved_feedback = session.get(Feedback, feedback_id)

        assert saved_conversation is not None
        assert saved_conversation.status == ConversationStatus.ESCALATED

        assert saved_ticket is not None
        assert saved_ticket.status == TicketStatus.OPEN
        assert saved_ticket.reason == EscalationReason.CUSTOMER_REQUEST

        assert saved_feedback is not None
        assert saved_feedback.resolution_type == ResolutionType.HUMAN_RESOLVED
        assert saved_feedback.successful is True

        session.delete(saved_feedback)
        session.delete(saved_ticket)
        session.delete(saved_conversation)
        session.commit()

    engine.dispose()
