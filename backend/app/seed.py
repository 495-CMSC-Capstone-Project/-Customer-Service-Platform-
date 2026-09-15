from backend.app.database import Base, SessionLocal, engine
from backend.app.models import Conversation, ConversationStatus


def seed_demo_data():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        conversation = db.get(Conversation, "conv_001")

        if conversation is None:
            conversation = Conversation(
                conversation_id="conv_001",
                customer_id="cust_001",
                status=ConversationStatus.ACTIVE,
            )

            db.add(conversation)
            db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
