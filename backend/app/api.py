from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from backend.app.ai_service import process_message


app = FastAPI(title="Customer Service Platform API")


class ChatRequest(BaseModel):
    customerId: str
    conversationId: str
    message: str


class ChatResponse(BaseModel):
    responseText: str
    confidenceScore: float
    escalationRequired: bool
    category: str


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    """
    Process a customer message through the AI orchestration service.
    """

    try:
        result = process_message(
            customer_id=request.customerId,
            conversation_id=request.conversationId,
            message=request.message,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    return ChatResponse(
        responseText=result.response_text,
        confidenceScore=result.confidence_score,
        escalationRequired=result.escalation_required,
        category=result.category,
    )
