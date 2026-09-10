from fastapi import FastAPI, HTTPException, Path
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from backend.app.ai_service import process_message


app = FastAPI(title="Customer Service Platform API")


class ChatRequest(BaseModel):
    customerId: str = Field(min_length=1)
    message: str = Field(min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    responseText: str
    confidenceScore: float
    escalationRequired: bool
    category: str


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
) -> ChatResponse:
    """
    Process a customer message through the AI orchestration service.
    """

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

    return ChatResponse(
        responseText=result.response_text,
        confidenceScore=result.confidence_score,
        escalationRequired=result.escalation_required,
        category=result.category,
    )
