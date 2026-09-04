from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database import Base
from app.models import Conversation, ConversationStatus


def test_conversation_can_be_created():
    engine = create_engine("sqlite:///:memory:")

    Base.metadata.create_all(engine)

    with Session(engine) as session:
        conversation = Conversation(
            conversation_id="conv_test_001",
            customer_id="cust_test_001",
            status=ConversationStatus.ACTIVE,
        )

        session.add(conversation)
        session.commit()

        saved = session.get(Conversation, "conv_test_001")

        assert saved is not None
        assert saved.customer_id == "cust_test_001"
        assert saved.status == ConversationStatus.ACTIVE
