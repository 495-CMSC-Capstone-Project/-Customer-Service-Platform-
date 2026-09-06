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
        "/api/chat",
        json={
            "customerId": "cust_001",
            "conversationId": "conv_001",
            "message": "How can I update my account?",
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "responseText": "Here is your response.",
        "confidenceScore": 0.80,
        "escalationRequired": False,
        "category": "general",
    }


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
        "/api/chat",
        json={
            "customerId": "cust_001",
            "conversationId": "conv_001",
            "message": "I want to speak to a human representative.",
        },
    )

    assert response.status_code == 200
    assert response.json()["escalationRequired"] is True
    assert response.json()["category"] == "escalation"


def test_chat_endpoint_returns_bad_request_for_invalid_input(monkeypatch):
    def fake_process_message(customer_id, conversation_id, message):
        raise ValueError("message is required")

    monkeypatch.setattr(
        "backend.app.api.process_message",
        fake_process_message,
    )

    response = client.post(
        "/api/chat",
        json={
            "customerId": "cust_001",
            "conversationId": "conv_001",
            "message": "",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "message is required"


def test_chat_endpoint_requires_request_fields():
    response = client.post(
        "/api/chat",
        json={
            "customerId": "cust_001",
            "message": "Hello",
        },
    )

    assert response.status_code == 422
