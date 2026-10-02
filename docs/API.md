# Customer Service Platform API

This document describes the FastAPI endpoints used by the Customer Service Platform.

The API supports customer messaging, AI-assisted responses, escalation handling, feedback collection, and service health monitoring.

> **Final Release Note:** The conversation message endpoint is already part of the current backend. The escalation, feedback, and health endpoints are implemented in PR #14 (`feature/backend-completion`) and will become part of the final release after that PR is merged.

---

## Base Path

All application endpoints use the following API prefix:

`/api/v1`

During local development, the backend is served separately from the React frontend.

The final production API host and CORS configuration will be documented after deployment configuration is completed.

---

## Content Type

Requests and responses use JSON.

`Content-Type: application/json`

---

# 1. Send Conversation Message

## Endpoint

`POST /api/v1/conversations/{conversationId}/messages`

Processes a customer message through the AI service, stores the customer and AI messages, and returns the AI-generated response.

## Path Parameter

| Parameter | Type | Required | Description |
|---|---|---:|---|
| `conversationId` | string | Yes | Identifier for the existing conversation |

## Request Body

{
  "customerId": "cust_001",
  "message": "I need help with my account."
}

### Request Fields

| Field | Type | Required | Validation | Description |
|---|---|---:|---|---|
| `customerId` | string | Yes | Minimum length: 1 | Customer associated with the conversation |
| `message` | string | Yes | 1-2000 characters | Customer message sent to the AI service |

## Successful Response

**Status:** `200 OK`

{
  "conversationId": "conv_001",
  "messageId": "msg_123",
  "response": "I can help you with that.",
  "source": "AI",
  "confidence": 0.91,
  "escalated": false
}

### Response Fields

| Field | Type | Description |
|---|---|---|
| `conversationId` | string | Conversation identifier |
| `messageId` | string | Identifier for the saved AI response |
| `response` | string | AI-generated response text |
| `source` | string | Response source |
| `confidence` | number | AI confidence score from 0.0 to 1.0 |
| `escalated` | boolean | Indicates whether human escalation is recommended |

## Error Responses

| Status | Meaning |
|---|---|
| `400 Bad Request` | Invalid request data or AI request validation failure |
| `403 Forbidden` | Customer does not own the requested conversation |
| `404 Not Found` | Conversation does not exist |

## Escalation Behavior

If the AI determines that escalation is required, the final-release backend creates or reuses an active escalation ticket and marks the conversation as escalated.

---

# 2. Create Human Escalation

> **Status:** Implemented in PR #14 and pending merge into `main`.

## Endpoint

`POST /api/v1/escalations`

Creates a support ticket for an existing conversation and updates the conversation status to `ESCALATED`.

## Request Body

{
  "conversationId": "conv_001",
  "customerId": "cust_001",
  "reason": "CUSTOMER_REQUEST",
  "summary": "Customer requested assistance from a human support agent."
}

### Request Fields

| Field | Type | Required | Validation | Description |
|---|---|---:|---|---|
| `conversationId` | string | Yes | Minimum length: 1 | Conversation to escalate |
| `customerId` | string | Yes | Minimum length: 1 | Customer associated with the conversation |
| `reason` | enum | Yes | Valid escalation reason | Reason for escalation |
| `summary` | string | Yes | 1-1000 characters | Summary provided to support staff |

## Supported Escalation Reasons

The backend uses the escalation reason values defined by the application data model, including reasons such as:

- `CUSTOMER_REQUEST`
- `LOW_CONFIDENCE`
- `AI_FAILURE`

## Successful Response

**Status:** `201 Created`

{
  "ticketId": "ticket_123",
  "status": "OPEN",
  "assignedQueue": "General Support"
}

### Response Fields

| Field | Type | Description |
|---|---|---|
| `ticketId` | string | Identifier for the created support ticket |
| `status` | string | Current ticket status |
| `assignedQueue` | string | Support queue assigned to the ticket |

## Error Responses

| Status | Meaning |
|---|---|
| `400 Bad Request` | Invalid escalation request |
| `403 Forbidden` | Customer does not own the conversation |
| `404 Not Found` | Conversation does not exist |
| `409 Conflict` | An active escalation already exists for the conversation |

## Persistence Behavior

Creating an escalation:

1. Creates a persistent support ticket.
2. Sets the ticket status to `OPEN`.
3. Updates the related conversation status to `ESCALATED`.
4. Commits the ticket and conversation-status change together.

AI-triggered escalations reuse an existing active ticket when one already exists.

---

# 3. Submit Conversation Feedback

> **Status:** Implemented in PR #14 and pending merge into `main`.

## Endpoint

`POST /api/v1/conversations/{conversationId}/feedback`

Stores final feedback for a conversation.

## Path Parameter

| Parameter | Type | Required | Description |
|---|---|---:|---|
| `conversationId` | string | Yes | Conversation receiving feedback |

## Request Body

{
  "resolutionType": "AI_RESOLVED",
  "successful": true,
  "category": "Account Support"
}

### Request Fields

| Field | Type | Required | Validation | Description |
|---|---|---:|---|---|
| `resolutionType` | enum | Yes | Valid resolution type | Indicates how the issue was resolved |
| `successful` | boolean | Yes | `true` or `false` | Whether the interaction successfully resolved the issue |
| `category` | string | Yes | 1-100 characters | Feedback category |

## Resolution Types

Resolution values are defined by the backend data model and include:

- `AI_RESOLVED`
- `HUMAN_RESOLVED`

## Successful Response

**Status:** `201 Created`

{
  "feedbackId": "fb_123",
  "status": "RECORDED"
}

## Error Responses

| Status | Meaning |
|---|---|
| `400 Bad Request` | Invalid feedback data |
| `404 Not Found` | Conversation does not exist |
| `409 Conflict` | Feedback has already been submitted for the conversation |

## Persistence Behavior

Only one final feedback record is stored for each conversation. Duplicate feedback submissions return `409 Conflict`.

---

# 4. Health Check

> **Status:** Implemented in PR #14 and pending merge into `main`.

## Endpoint

`GET /api/v1/health`

Returns the current health of the API, application database, and AI provider configuration.

## Successful Response

**Status:** `200 OK`

Example:

{
  "status": "HEALTHY",
  "api": "AVAILABLE",
  "applicationDatabase": "AVAILABLE",
  "aiProvider": "CONFIGURED",
  "timestamp": "2026-10-01T20:00:00+00:00"
}

### Response Fields

| Field | Type | Description |
|---|---|---|
| `status` | string | Overall backend health |
| `api` | string | API availability |
| `applicationDatabase` | string | Application database availability |
| `aiProvider` | string | AI provider configuration status |
| `timestamp` | string | UTC timestamp for the health check |

## Overall Health Values

### `HEALTHY`

Returned when:

- the application database is available; and
- the AI provider environment variables are configured.

### `DEGRADED`

Returned when:

- the application database is available; but
- one or more required AI provider environment variables are not configured.

### `UNAVAILABLE`

Returned when:

- the application database cannot be reached.

---

# Validation and Error Handling

The FastAPI application validates incoming request bodies using Pydantic models.

Invalid request data returns:

`400 Bad Request`

with a response such as:

{
  "detail": "Invalid request data"
}

Other endpoint-specific errors may include:

{
  "detail": "Conversation not found"
}

or:

{
  "detail": "An active escalation already exists for this conversation"
}

---

# AI Provider Configuration

The backend AI integration uses the following environment variables:

- `AI_API_URL`
- `AI_API_KEY`
- `AI_MODEL`

The health endpoint reports the AI provider as `CONFIGURED` only when all required values are present.

Sensitive credentials such as `AI_API_KEY` must be stored in environment variables and must not be committed to the repository.

---

# Local Development

The application currently supports a local React frontend and FastAPI backend.

The frontend development origins currently allowed by the backend are:

- `http://localhost:5173`
- `http://127.0.0.1:5173`

Production API routing and the production CORS allowlist are tracked separately and will be finalized as part of deployment configuration.

---

# Testing and Quality Evidence

The backend final-release work is covered by automated unit, API, and PostgreSQL integration tests.

Current PR #14 CI results:

- 58 backend tests passing
- 90.37% total backend code coverage
- 80% minimum backend coverage threshold enforced by CI
- PostgreSQL integration testing included
- coverage XML generated and uploaded as a GitHub Actions artifact

Final project documentation will be updated with consolidated frontend and backend quality metrics after all final-release pull requests are merged.

---

# Final Release Integration Notes

The following work remains part of final integration:

- Connect the frontend feedback workflow to the persistent backend feedback API.
- Connect frontend escalation behavior to the persistent backend escalation functionality.
- Coordinate frontend timeout and safe retry behavior with the backend.
- Configure production API routing.
- Configure the production CORS allowlist.
- Complete deployment and performance benchmarking.

These items are being tracked separately so that implemented functionality is not represented as production-ready before final integration and deployment are complete.
