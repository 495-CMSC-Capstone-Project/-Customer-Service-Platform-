from dataclasses import dataclass


@dataclass
class AIResponse:
    response_text: str
    confidence_score: float
    escalation_required: bool
    category: str


def process_message(
    customer_id: str,
    conversation_id: str,
    message: str,
) -> AIResponse:
    """
    Process a customer message and return a structured AI response.

    This is the initial Alpha implementation of the AI orchestration layer.
    A real LLM provider can be connected later without changing the
    response contract used by the rest of the application.
    """

    if not customer_id.strip():
        raise ValueError("customer_id is required")

    if not conversation_id.strip():
        raise ValueError("conversation_id is required")

    if not message.strip():
        raise ValueError("message is required")

    normalized_message = message.lower()

    escalation_keywords = (
        "human",
        "representative",
        "manager",
        "supervisor",
        "complaint",
    )

    escalation_required = any(
        keyword in normalized_message for keyword in escalation_keywords
    )

    if escalation_required:
        response_text = (
            "I understand that you would like additional assistance. "
            "I can escalate this conversation to a human agent."
        )
        confidence_score = 0.95
        category = "escalation"
    else:
        response_text = (
            "Thank you for your message. "
            "The AI assistant is processing your customer service request."
        )
        confidence_score = 0.80
        category = "general"

    return AIResponse(
        response_text=response_text,
        confidence_score=confidence_score,
        escalation_required=escalation_required,
        category=category,
    )
