from fastapi import Depends, FastAPI, HTTPException, Path
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.app.ai_service import process_message
from backend.app.conversation_service import (
    get_conversation,
    save_ai_message,
    save_customer_message,
    validate_conversation_customer,
)
from backend.app.database import get_db


app = FastAPI(title="Customer Service Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    customerId: str = Field(min_length=1)
    message: str = Field(min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    conversationId: str
    messageId: str
    response: str
    source: str
    confidence: float = Field(ge=0.0, le=1.0)
    escalated: bool


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={"detail": "Invalid request data"},
    )


@app.post(
    "/api/v1/conversations/{conversationId}/messages",
    response_model=ChatResponse,
)
def chat(
    request: ChatRequest,
    conversationId: str = Path(min_length=1),
    db: Session = Depends(get_db),
) -> ChatResponse:
    """
    Process a customer message through the AI orchestration service,
    persist the conversation messages, and return the public API response.
    """

    conversation = get_conversation(
        db,
        conversationId,
    )

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    try:
        validate_conversation_customer(
            conversation,
            request.customerId,
        )
    except PermissionError as exc:
        raise HTTPException(
            status_code=403,
            detail=str(exc),
        ) from exc

    save_customer_message(
        db,
        conversation,
        request.message,
    )

    try:
        result = process_message(
            customer_id=request.customerId,
            conversation_id=conversationId,
            message=request.message,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    ai_message = save_ai_message(
        db,
        conversation,
        result.response_text,
        result.confidence_score,
    )

    return ChatResponse(
        conversationId=conversationId,
        messageId=ai_message.message_id,
        response=result.response_text,
        source="AI",
        confidence=result.confidence_score,
        escalated=result.escalation_required,
    )
