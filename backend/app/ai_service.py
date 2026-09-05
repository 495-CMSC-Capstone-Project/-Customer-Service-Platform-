from dataclasses import dataclass

from backend.app.ai_provider import AIProviderError, generate_ai_response


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
        return AIResponse(
            response_text=(
                "I understand that you would like additional assistance. "
                "I can escalate this conversation to a human agent."
            ),
            confidence_score=0.95,
            escalation_required=True,
            category="escalation",
        )

    try:
        response_text = generate_ai_response(message)
    except AIProviderError:
        return AIResponse(
            response_text=(
                "The AI assistant is temporarily unavailable. "
                "Please try again or request help from a human agent."
            ),
            confidence_score=0.0,
            escalation_required=True,
            category="ai_failure",
        )

    return AIResponse(
        response_text=response_text,
        confidence_score=0.80,
        escalation_required=False,
        category="general",
    )
