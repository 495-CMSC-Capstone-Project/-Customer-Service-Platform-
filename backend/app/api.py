import os
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException, Path, status
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
from backend.app.escalation_service import (
    ActiveEscalationExistsError,
    create_escalation,
    ensure_ai_escalation,
)
from backend.app.feedback_service import (
    DuplicateFeedbackError,
    record_feedback,
)
from backend.app.health_service import check_health
from backend.app.models import EscalationReason, ResolutionType


DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


def get_cors_allowed_origins() -> list[str]:
    configured_origins = os.getenv("CORS_ALLOWED_ORIGINS", "")

    if configured_origins.strip():
        return [
            origin.strip()
            for origin in configured_origins.split(",")
            if origin.strip()
        ]

    return DEFAULT_CORS_ORIGINS


CORS_ALLOWED_ORIGINS = get_cors_allowed_origins()


app = FastAPI(title="Customer Service Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
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


class EscalationRequest(BaseModel):
    conversationId: str = Field(min_length=1)
    customerId: str = Field(min_length=1)
    reason: EscalationReason
    summary: str = Field(min_length=1, max_length=1000)


class EscalationResponse(BaseModel):
    ticketId: str
    status: str
    assignedQueue: str


class FeedbackRequest(BaseModel):
    resolutionType: ResolutionType
    successful: bool
    category: str = Field(min_length=1, max_length=100)


class FeedbackResponse(BaseModel):
    feedbackId: str
    status: str


class HealthResponse(BaseModel):
    status: str
    api: str
    applicationDatabase: str
    aiProvider: str
    timestamp: str


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

    if result.escalation_required:
        ensure_ai_escalation(
            db=db,
            conversation=conversation,
            category=result.category,
            customer_message=request.message,
        )

    return ChatResponse(
        conversationId=conversationId,
        messageId=ai_message.message_id,
        response=result.response_text,
        source="AI",
        confidence=result.confidence_score,
        escalated=result.escalation_required,
    )


@app.post(
    "/api/v1/escalations",
    response_model=EscalationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_human_escalation(
    request: EscalationRequest,
    db: Session = Depends(get_db),
) -> EscalationResponse:
    conversation = get_conversation(db, request.conversationId)

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

    try:
        ticket = create_escalation(
            db=db,
            conversation=conversation,
            reason=request.reason,
            summary=request.summary,
        )
    except ActiveEscalationExistsError as exc:
        raise HTTPException(
            status_code=409,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    return EscalationResponse(
        ticketId=ticket.ticket_id,
        status=ticket.status.value,
        assignedQueue=ticket.assigned_queue,
    )


@app.post(
    "/api/v1/conversations/{conversationId}/feedback",
    response_model=FeedbackResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_feedback(
    request: FeedbackRequest,
    conversationId: str = Path(min_length=1),
    db: Session = Depends(get_db),
) -> FeedbackResponse:
    conversation = get_conversation(db, conversationId)

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    try:
        feedback = record_feedback(
            db=db,
            conversation=conversation,
            resolution_type=request.resolutionType,
            successful=request.successful,
            category=request.category,
        )
    except DuplicateFeedbackError as exc:
        raise HTTPException(
            status_code=409,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    return FeedbackResponse(
        feedbackId=feedback.feedback_id,
        status="RECORDED",
    )


@app.get(
    "/api/v1/health",
    response_model=HealthResponse,
)
def health(
    db: Session = Depends(get_db),
) -> HealthResponse:
    result = check_health(db)

    return HealthResponse(
        status=result.status,
        api=result.api,
        applicationDatabase=result.application_database,
        aiProvider=result.ai_provider,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
