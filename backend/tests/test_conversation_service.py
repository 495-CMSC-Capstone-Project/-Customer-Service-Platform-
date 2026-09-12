import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.conversation_service import (
    get_conversation,
    save_ai_message,
    save_customer_message,
    validate_conversation_customer,
)
from backend.app.database import Base
from backend.app.models import (
    Conversation,
    ConversationStatus,
    SenderType,
)


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")

    Base.metadata.create_all(bind=engine)

    Session = sessionmaker(
        bind=engine,
        autocommit=False,
        autoflush=False,
    )

    session = Session()

    conversation = Conversation(
        conversation_id="conv_001",
        customer_id="cust_001",
        status=ConversationStatus.ACTIVE,
    )

    session.add(conversation)
    session.commit()

    try:
        yield session
    finally:
        session.close()


def test_get_conversation_returns_existing_conversation(db):
    conversation = get_conversation(
        db,
        "conv_001",
    )

    assert conversation is not None
    assert conversation.conversation_id == "conv_001"
    assert conversation.customer_id == "cust_001"


def test_get_conversation_returns_none_when_missing(db):
    conversation = get_conversation(
        db,
        "conv_missing",
    )

    assert conversation is None


def test_validate_conversation_customer_accepts_owner(db):
    conversation = get_conversation(
        db,
        "conv_001",
    )

    validate_conversation_customer(
        conversation,
        "cust_001",
    )


def test_validate_conversation_customer_rejects_wrong_customer(db):
    conversation = get_conversation(
        db,
        "conv_001",
    )

    with pytest.raises(PermissionError):
        validate_conversation_customer(
            conversation,
            "cust_other",
        )


def test_save_customer_message(db):
    conversation = get_conversation(
        db,
        "conv_001",
    )

    message = save_customer_message(
        db,
        conversation,
        "How can I update my account?",
    )

    assert message.message_id.startswith("msg_")
    assert message.conversation_id == "conv_001"
    assert message.sender_type == SenderType.CUSTOMER
    assert message.message_text == "How can I update my account?"
    assert message.source is None
    assert message.confidence is None


def test_save_ai_message(db):
    conversation = get_conversation(
        db,
        "conv_001",
    )

    message = save_ai_message(
        db,
        conversation,
        "Here is your response.",
        0.80,
    )

    assert message.message_id.startswith("msg_")
    assert message.conversation_id == "conv_001"
    assert message.sender_type == SenderType.AI
    assert message.message_text == "Here is your response."
    assert message.source == "AI"
    assert float(message.confidence) == 0.80
