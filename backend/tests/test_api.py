from fastapi.testclient import TestClient

from backend.app.api import app
from backend.app.ai_service import AIResponse


client = TestClient(app)


def test_chat_endpoint_returns_ai_response(monkeypatch):
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
    assert data["messageId"].startswith("msg_")
    assert data["response"] == "Here is your response."
    assert data["source"] == "AI"
    assert data["confidence"] == 0.80
    assert data["escalated"] is False


def test_chat_endpoint_returns_escalation_response(monkeypatch):
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
    assert data["messageId"].startswith("msg_")
    assert data["response"] == (
        "I can escalate this conversation to a human agent."
    )
    assert data["source"] == "AI"
    assert data["confidence"] == 0.95
    assert data["escalated"] is True


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
