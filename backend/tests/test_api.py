from types import SimpleNamespace

from fastapi.testclient import TestClient

from backend.app.ai_service import AIResponse
from backend.app.api import app
from backend.app.database import get_db


client = TestClient(app)


def override_get_db():
    yield object()


app.dependency_overrides[get_db] = override_get_db


def setup_conversation_mocks(monkeypatch, customer_id="cust_001"):
    conversation = SimpleNamespace(
        conversation_id="conv_001",
        customer_id=customer_id,
    )

    monkeypatch.setattr(
        "backend.app.api.get_conversation",
        lambda db, conversation_id: conversation,
    )

    monkeypatch.setattr(
        "backend.app.api.validate_conversation_customer",
        lambda conversation, customer_id: None,
    )

    monkeypatch.setattr(
        "backend.app.api.save_customer_message",
        lambda db, conversation, message_text: None,
    )

    monkeypatch.setattr(
        "backend.app.api.save_ai_message",
        lambda db, conversation, response_text, confidence: SimpleNamespace(
            message_id="msg_001"
        ),
    )


def test_chat_endpoint_returns_ai_response(monkeypatch):
    setup_conversation_mocks(monkeypatch)

    def fake_process_message(customer_id, conversation_id, message):
        return AIResponse(
            response_text="Here is your response.",
            confidence_score=0.80,
            escalation_required=False,
            category="general",
        )

    monkeypatch.setattr(
        "backend.app.api.process_message",
        fake_process_message,
    )

    response = client.post(
        "/api/v1/conversations/conv_001/messages",
        json={
            "customerId": "cust_001",
            "message": "How can I update my account?",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["conversationId"] == "conv_001"
    assert data["messageId"] == "msg_001"
    assert data["response"] == "Here is your response."
    assert data["source"] == "AI"
    assert data["confidence"] == 0.80
    assert data["escalated"] is False


def test_chat_endpoint_returns_escalation_response(monkeypatch):
    setup_conversation_mocks(monkeypatch)

    def fake_process_message(customer_id, conversation_id, message):
        return AIResponse(
            response_text="I can escalate this conversation to a human agent.",
            confidence_score=0.95,
            escalation_required=True,
            category="escalation",
        )

    monkeypatch.setattr(
        "backend.app.api.process_message",
        fake_process_message,
    )

    response = client.post(
        "/api/v1/conversations/conv_001/messages",
        json={
            "customerId": "cust_001",
            "message": "I want to speak to a human representative.",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["conversationId"] == "conv_001"
    assert data["messageId"] == "msg_001"
    assert data["response"] == (
        "I can escalate this conversation to a human agent."
    )
    assert data["source"] == "AI"
    assert data["confidence"] == 0.95
    assert data["escalated"] is True


def test_chat_endpoint_returns_not_found_for_missing_conversation(
    monkeypatch,
):
    monkeypatch.setattr(
        "backend.app.api.get_conversation",
        lambda db, conversation_id: None,
    )

    response = client.post(
        "/api/v1/conversations/conv_missing/messages",
        json={
            "customerId": "cust_001",
            "message": "Hello",
        },
    )

    assert response.status_code == 404


def test_chat_endpoint_returns_forbidden_for_wrong_customer(
    monkeypatch,
):
    conversation = SimpleNamespace(
        conversation_id="conv_001",
        customer_id="cust_other",
    )

    monkeypatch.setattr(
        "backend.app.api.get_conversation",
        lambda db, conversation_id: conversation,
    )

    def fake_validate(conversation, customer_id):
        raise PermissionError(
            "Customer does not have access to this conversation"
        )

    monkeypatch.setattr(
        "backend.app.api.validate_conversation_customer",
        fake_validate,
    )

    response = client.post(
        "/api/v1/conversations/conv_001/messages",
        json={
            "customerId": "cust_001",
            "message": "Hello",
        },
    )

    assert response.status_code == 403


def test_chat_endpoint_returns_bad_request_for_empty_message():
    response = client.post(
        "/api/v1/conversations/conv_001/messages",
        json={
            "customerId": "cust_001",
            "message": "",
        },
    )

    assert response.status_code == 400


def test_chat_endpoint_requires_request_fields():
    response = client.post(
        "/api/v1/conversations/conv_001/messages",
        json={
            "message": "Hello",
        },
    )

    assert response.status_code == 400


def test_chat_endpoint_accepts_one_character_message(monkeypatch):
    setup_conversation_mocks(monkeypatch)

    def fake_process_message(customer_id, conversation_id, message):
        return AIResponse(
            response_text="Response",
            confidence_score=0.80,
            escalation_required=False,
            category="general",
        )

    monkeypatch.setattr(
        "backend.app.api.process_message",
        fake_process_message,
    )

    response = client.post(
        "/api/v1/conversations/conv_001/messages",
        json={
            "customerId": "cust_001",
            "message": "A",
        },
    )

    assert response.status_code == 200


def test_chat_endpoint_accepts_2000_character_message(monkeypatch):
    setup_conversation_mocks(monkeypatch)

    def fake_process_message(customer_id, conversation_id, message):
        return AIResponse(
            response_text="Response",
            confidence_score=0.80,
            escalation_required=False,
            category="general",
        )

    monkeypatch.setattr(
        "backend.app.api.process_message",
        fake_process_message,
    )

    response = client.post(
        "/api/v1/conversations/conv_001/messages",
        json={
            "customerId": "cust_001",
            "message": "A" * 2000,
        },
    )

    assert response.status_code == 200


def test_chat_endpoint_rejects_message_over_2000_characters():
    response = client.post(
        "/api/v1/conversations/conv_001/messages",
        json={
            "customerId": "cust_001",
            "message": "A" * 2001,
        },
    )

    assert response.status_code == 400


def test_chat_endpoint_rejects_blank_customer_id():
    response = client.post(
        "/api/v1/conversations/conv_001/messages",
        json={
            "customerId": "",
            "message": "Hello",
        },
    )

    assert response.status_code == 400
