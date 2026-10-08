import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database import Base
from backend.app.escalation_service import (
    ActiveEscalationExistsError,
    claim_escalation,
    create_escalation,
    ensure_ai_escalation,
    get_active_escalation,
    list_active_escalations,
)
from backend.app.models import (
    Conversation,
    ConversationStatus,
    EscalationReason,
    TicketStatus,
)


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = Session()

    session.add(
        Conversation(
            conversation_id="conv_001",
            customer_id="cust_001",
            status=ConversationStatus.ACTIVE,
        )
    )
    session.commit()

    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def test_create_escalation_persists_ticket_and_updates_conversation(db):
    conversation = db.get(Conversation, "conv_001")

    ticket = create_escalation(
        db=db,
        conversation=conversation,
        reason=EscalationReason.CUSTOMER_REQUEST,
        summary="Customer requested a human representative.",
    )

    assert ticket.ticket_id.startswith("ticket_")
    assert ticket.conversation_id == "conv_001"
    assert ticket.reason == EscalationReason.CUSTOMER_REQUEST
    assert ticket.status == TicketStatus.OPEN
    assert ticket.assigned_queue == "General Support"

    db.refresh(conversation)
    assert conversation.status == ConversationStatus.ESCALATED


def test_create_escalation_rejects_duplicate_active_ticket(db):
    conversation = db.get(Conversation, "conv_001")

    create_escalation(
        db=db,
        conversation=conversation,
        reason=EscalationReason.CUSTOMER_REQUEST,
        summary="First escalation.",
    )

    with pytest.raises(ActiveEscalationExistsError):
        create_escalation(
            db=db,
            conversation=conversation,
            reason=EscalationReason.COMPLEX_ISSUE,
            summary="Second escalation.",
        )


def test_get_active_escalation_returns_existing_ticket(db):
    conversation = db.get(Conversation, "conv_001")

    created = create_escalation(
        db=db,
        conversation=conversation,
        reason=EscalationReason.CUSTOMER_REQUEST,
        summary="Escalate this conversation.",
    )

    found = get_active_escalation(db, "conv_001")

    assert found is not None
    assert found.ticket_id == created.ticket_id


def test_ensure_ai_escalation_maps_ai_failure_to_technical_support(db):
    conversation = db.get(Conversation, "conv_001")

    ticket = ensure_ai_escalation(
        db=db,
        conversation=conversation,
        category="ai_failure",
        customer_message="The assistant failed to respond.",
    )

    assert ticket.reason == EscalationReason.AI_FAILURE
    assert ticket.assigned_queue == "Technical Support"


def test_ensure_ai_escalation_reuses_existing_active_ticket(db):
    conversation = db.get(Conversation, "conv_001")

    first = ensure_ai_escalation(
        db=db,
        conversation=conversation,
        category="escalation",
        customer_message="I need a human.",
    )

    second = ensure_ai_escalation(
        db=db,
        conversation=conversation,
        category="escalation",
        customer_message="I still need a human.",
    )

    assert second.ticket_id == first.ticket_id


def test_list_active_escalations_returns_open_tickets(db):
    conversation = db.get(Conversation, "conv_001")

    ticket = create_escalation(
        db=db,
        conversation=conversation,
        reason=EscalationReason.LOW_CONFIDENCE,
        summary="Low confidence response needs review.",
    )

    tickets = list_active_escalations(db)

    assert len(tickets) == 1
    assert tickets[0].ticket_id == ticket.ticket_id


def test_claim_escalation_moves_open_ticket_to_in_progress(db):
    conversation = db.get(Conversation, "conv_001")

    ticket = create_escalation(
        db=db,
        conversation=conversation,
        reason=EscalationReason.CUSTOMER_REQUEST,
        summary="Customer requested human assistance.",
    )

    claimed = claim_escalation(db, ticket.ticket_id)

    assert claimed.status == TicketStatus.IN_PROGRESS


def test_claim_escalation_rejects_unknown_ticket(db):
    with pytest.raises(LookupError):
        claim_escalation(db, "ticket_missing")
