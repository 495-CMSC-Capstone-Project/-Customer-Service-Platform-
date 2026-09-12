from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy.orm import Session

from backend.app.models import (
    Conversation,
    Message,
    SenderType,
)


def get_conversation(
    db: Session,
    conversation_id: str,
) -> Conversation | None:
    return db.get(Conversation, conversation_id)


def validate_conversation_customer(
    conversation: Conversation,
    customer_id: str,
) -> None:
    if conversation.customer_id != customer_id:
        raise PermissionError(
            "Customer does not have access to this conversation"
        )


def save_customer_message(
    db: Session,
    conversation: Conversation,
    message_text: str,
) -> Message:
    message = Message(
        message_id=f"msg_{uuid4().hex}",
        conversation_id=conversation.conversation_id,
        sender_type=SenderType.CUSTOMER,
        message_text=message_text,
        source=None,
        confidence=None,
    )

    conversation.updated_at = datetime.now(timezone.utc)

    db.add(message)
    db.commit()
    db.refresh(message)

    return message


def save_ai_message(
    db: Session,
    conversation: Conversation,
    response_text: str,
    confidence: float,
) -> Message:
    message = Message(
        message_id=f"msg_{uuid4().hex}",
        conversation_id=conversation.conversation_id,
        sender_type=SenderType.AI,
        message_text=response_text,
        source="AI",
        confidence=confidence,
    )

    conversation.updated_at = datetime.now(timezone.utc)

    db.add(message)
    db.commit()
    db.refresh(message)

    return message
