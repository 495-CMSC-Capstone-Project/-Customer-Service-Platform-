import pytest

from backend.app.ai_service import process_message


def test_process_message_returns_general_response():
    result = process_message(
        customer_id="cust_001",
        conversation_id="conv_001",
        message="How can I update my account information?",
    )

    assert result.response_text
    assert result.confidence_score == 0.80
    assert result.escalation_required is False
    assert result.category == "general"


def test_process_message_detects_escalation_request():
    result = process_message(
        customer_id="cust_001",
        conversation_id="conv_001",
        message="I want to speak to a human representative.",
    )

    assert result.response_text
    assert result.confidence_score == 0.95
    assert result.escalation_required is True
    assert result.category == "escalation"


@pytest.mark.parametrize(
    "customer_id, conversation_id, message",
    [
        ("", "conv_001", "Hello"),
        ("cust_001", "", "Hello"),
        ("cust_001", "conv_001", ""),
        ("   ", "conv_001", "Hello"),
        ("cust_001", "   ", "Hello"),
        ("cust_001", "conv_001", "   "),
    ],
)
def test_process_message_rejects_missing_required_values(
    customer_id,
    conversation_id,
    message,
):
    with pytest.raises(ValueError):
        process_message(
            customer_id=customer_id,
            conversation_id=conversation_id,
            message=message,
        )
