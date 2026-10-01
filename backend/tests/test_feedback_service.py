import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database import Base
from backend.app.feedback_service import (
    DuplicateFeedbackError,
    get_feedback,
    record_feedback,
)
from backend.app.models import (
    Conversation,
    ConversationStatus,
    ResolutionType,
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


def test_record_feedback_persists_feedback(db):
    conversation = db.get(Conversation, "conv_001")

    feedback = record_feedback(
        db=db,
        conversation=conversation,
        resolution_type=ResolutionType.AI_RESOLVED,
        successful=True,
        category="ACCOUNT_ACCESS",
    )

    assert feedback.feedback_id.startswith("fb_")
    assert feedback.conversation_id == "conv_001"
    assert feedback.resolution_type == ResolutionType.AI_RESOLVED
    assert feedback.successful is True
    assert feedback.category == "ACCOUNT_ACCESS"


def test_record_feedback_rejects_duplicate(db):
    conversation = db.get(Conversation, "conv_001")

    record_feedback(
        db=db,
        conversation=conversation,
        resolution_type=ResolutionType.AI_RESOLVED,
        successful=True,
        category="ACCOUNT_ACCESS",
    )

    with pytest.raises(DuplicateFeedbackError):
        record_feedback(
            db=db,
            conversation=conversation,
            resolution_type=ResolutionType.HUMAN_RESOLVED,
            successful=True,
            category="ACCOUNT_ACCESS",
        )


def test_get_feedback_returns_existing_feedback(db):
    conversation = db.get(Conversation, "conv_001")

    created = record_feedback(
        db=db,
        conversation=conversation,
        resolution_type=ResolutionType.AI_RESOLVED,
        successful=False,
        category="BILLING",
    )

    found = get_feedback(db, "conv_001")

    assert found is not None
    assert found.feedback_id == created.feedback_id


def test_record_feedback_rejects_blank_category(db):
    conversation = db.get(Conversation, "conv_001")

    with pytest.raises(ValueError):
        record_feedback(
            db=db,
            conversation=conversation,
            resolution_type=ResolutionType.AI_RESOLVED,
            successful=True,
            category="   ",
        )
