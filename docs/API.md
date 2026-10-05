# Customer Service Platform API

This document describes the FastAPI endpoints used by the Customer Service Platform.

The final course-project API supports customer messaging, AI-assisted responses, persistent escalation handling, persistent feedback collection, duplicate-request protection, and service health monitoring.

---

## Base Path

All application endpoints use the following API prefix:

```text
/api/v1
```

During local development, the FastAPI backend normally runs at:

```text
http://localhost:8000
```

FastAPI also exposes interactive API documentation at:

```text
http://localhost:8000/docs
```

and the generated OpenAPI schema at:

```text
http://localhost:8000/openapi.json
```

---

## Content Type

Requests and responses use JSON.

```text
Content-Type: application/json
```

---

# 1. Send Conversation Message

## Endpoint

```text
POST /api/v1/conversations/{conversationId}/messages
```

Processes a customer message through the AI service, stores the customer and AI messages, applies request-ID duplicate protection, creates or reuses an escalation when required, and returns the AI response.

## Path Parameter

| Parameter | Type | Required | Description |
| --- | --- | ---: | --- |
| `conversationId` | string | Yes | Identifier for the existing conversation |

## Request Body

```json
{
  "customerId": "cust_001",
  "requestId": "req_example_001",
  "message": "I need help with my account."
}
```

### Request Fields

| Field | Type | Required | Validation | Description |
| --- | --- | ---: | --- | --- |
| `customerId` | string | Yes | Minimum length: 1 | Customer associated with the conversation |
| `requestId` | string | Yes | 1-64 characters | Identifier used to detect repeated submissions |
| `message` | string | Yes | 1-2000 characters | Customer message sent to the AI service |

Whitespace-only messages are rejected even if they pass the initial length validation.

## Successful Response

**Status:** `200 OK`

```json
{
  "conversationId": "conv_001",
  "messageId": "msg_123",
  "response": "I can help you with that.",
  "source": "AI",
  "confidence": 0.91,
  "escalated": false
}
```

### Response Fields

| Field | Type | Description |
| --- | --- | --- |
| `conversationId` | string | Conversation identifier |
| `messageId` | string | Identifier for the saved AI response |
| `response` | string | AI-generated or fallback response text |
| `source` | string | Response source |
| `confidence` | number | Demonstration confidence value from 0.0 to 1.0 |
| `escalated` | boolean | Indicates whether the conversation requires human review |

The `confidence` field is a demonstration score and should not be interpreted as a calibrated probability that an answer is correct.

## Error Responses

| Status | Meaning |
| --- | --- |
| `400 Bad Request` | Invalid request data, whitespace-only message, or AI-service validation failure |
| `403 Forbidden` | Customer does not own the requested conversation |
| `404 Not Found` | Conversation does not exist |
| `409 Conflict` | The same `requestId` already has a stored customer message but the corresponding AI response is not yet available |

## Request ID and Retry Behavior

The message endpoint uses `requestId` to reduce duplicate message creation during retries.

If no stored customer message exists for the supplied `requestId`, the backend processes the request normally.

If a customer message already exists for the same conversation and `requestId`:

1. The backend looks for the corresponding stored AI response.
2. If the AI response exists, the backend returns that previously stored response instead of creating another customer/AI message pair.
3. If the AI response does not yet exist, the backend returns:

```text
409 Conflict
```

with:

```json
{
  "detail": "This request is still being processed."
}
```

This behavior helps prevent duplicate processing when the frontend retries an uncertain request.

## AI Failure Behavior

If the external AI provider cannot successfully complete the request, the AI service can return fallback content and indicate that escalation is required.

In that case, the response may include:

```json
{
  "source": "AI",
  "confidence": 0.0,
  "escalated": true
}
```

The backend then ensures that an active escalation exists for the conversation.

## Escalation Behavior

If the AI determines that human review is required, the backend calls the escalation service.

The escalation service:

1. Reuses an existing active ticket if one already exists.
2. Otherwise creates a persistent ticket.
3. Updates the conversation status to `ESCALATED`.
4. Assigns an escalation reason based on the AI result.
5. Commits the escalation information to the database.

AI-triggered escalation reasons may include:

- `LOW_CONFIDENCE`
- `CUSTOMER_REQUEST`
- `AI_FAILURE`

The model also supports:

- `COMPLEX_ISSUE`

---

# 2. Create Human Escalation

## Endpoint

```text
POST /api/v1/escalations
```

Creates a persistent support ticket for an existing conversation and changes the conversation status to `ESCALATED`.

## Request Body

```json
{
  "conversationId": "conv_001",
  "customerId": "cust_001",
  "reason": "CUSTOMER_REQUEST",
  "summary": "Customer requested assistance from a human support representative."
}
```

### Request Fields

| Field | Type | Required | Validation | Description |
| --- | --- | ---: | --- | --- |
| `conversationId` | string | Yes | Minimum length: 1 | Conversation to escalate |
| `customerId` | string | Yes | Minimum length: 1 | Customer associated with the conversation |
| `reason` | enum | Yes | Valid escalation reason | Reason for escalation |
| `summary` | string | Yes | 1-1000 characters | Summary provided for human review |

## Supported Escalation Reasons

The backend supports:

- `LOW_CONFIDENCE`
- `COMPLEX_ISSUE`
- `CUSTOMER_REQUEST`
- `AI_FAILURE`

## Successful Response

**Status:** `201 Created`

```json
{
  "ticketId": "ticket_123",
  "status": "OPEN",
  "assignedQueue": "General Support"
}
```

### Response Fields

| Field | Type | Description |
| --- | --- | --- |
| `ticketId` | string | Identifier for the created support ticket |
| `status` | string | Current ticket status |
| `assignedQueue` | string | Queue assigned to the ticket |

## Error Responses

| Status | Meaning |
| --- | --- |
| `400 Bad Request` | Invalid escalation request or invalid summary |
| `403 Forbidden` | Customer does not own the conversation |
| `404 Not Found` | Conversation does not exist |
| `409 Conflict` | An active escalation already exists for the conversation |

## Persistence Behavior

Creating a human escalation:

1. Verifies that the conversation exists.
2. Verifies that the supplied customer owns the conversation.
3. Rejects a second active escalation when one already exists.
4. Creates a persistent ticket.
5. Sets the ticket status to `OPEN`.
6. Assigns the default queue `General Support`.
7. Updates the related conversation status to `ESCALATED`.
8. Commits the ticket and conversation-status change.

The database also enforces one active `OPEN` or `IN_PROGRESS` ticket per conversation.

---

# 3. Submit Conversation Feedback

## Endpoint

```text
POST /api/v1/conversations/{conversationId}/feedback
```

Stores persistent final feedback for a conversation.

## Path Parameter

| Parameter | Type | Required | Description |
| --- | --- | ---: | --- |
| `conversationId` | string | Yes | Conversation receiving feedback |

## Request Body

```json
{
  "resolutionType": "AI_RESOLVED",
  "successful": true,
  "category": "Account Support"
}
```

### Request Fields

| Field | Type | Required | Validation | Description |
| --- | --- | ---: | --- | --- |
| `resolutionType` | enum | Yes | Valid resolution type | Indicates how the issue was resolved |
| `successful` | boolean | Yes | `true` or `false` | Whether the interaction successfully resolved the issue |
| `category` | string | Yes | 1-100 characters | Feedback category |

## Resolution Types

The backend supports:

- `AI_RESOLVED`
- `HUMAN_RESOLVED`

## Successful Response

**Status:** `201 Created`

```json
{
  "feedbackId": "fb_123",
  "status": "RECORDED"
}
```

### Response Fields

| Field | Type | Description |
| --- | --- | --- |
| `feedbackId` | string | Identifier for the stored feedback record |
| `status` | string | Confirmation that feedback was recorded |

## Error Responses

| Status | Meaning |
| --- | --- |
| `400 Bad Request` | Invalid feedback data or invalid category |
| `404 Not Found` | Conversation does not exist |
| `409 Conflict` | Final feedback has already been submitted for the conversation |

## Persistence Behavior

Only one final feedback record is stored for each conversation.

The backend:

1. Verifies that the conversation exists.
2. Trims and validates the feedback category.
3. Checks whether feedback already exists.
4. Stores the feedback in the database.
5. Returns `409 Conflict` when duplicate final feedback is submitted.

The database also enforces a unique feedback record per conversation.

---

# 4. Health Check

## Endpoint

```text
GET /api/v1/health
```

Returns the current health of the API, application database, and AI-provider configuration.

## Successful Response

**Status:** `200 OK`

Example:

```json
{
  "status": "HEALTHY",
  "api": "AVAILABLE",
  "applicationDatabase": "AVAILABLE",
  "aiProvider": "CONFIGURED",
  "timestamp": "2026-10-05T20:00:00+00:00"
}
```

### Response Fields

| Field | Type | Description |
| --- | --- | --- |
| `status` | string | Overall backend health |
| `api` | string | API availability |
| `applicationDatabase` | string | Application database availability |
| `aiProvider` | string | AI-provider configuration status |
| `timestamp` | string | UTC timestamp for the health check |

## Overall Health Values

### `HEALTHY`

Returned when:

- the application database is available; and
- all required AI-provider environment variables are configured.

### `DEGRADED`

Returned when:

- the application database is available; but
- one or more required AI-provider environment variables are missing.

### `UNAVAILABLE`

Returned when:

- the application database cannot be reached.

## Component Values

The API component currently reports:

```text
AVAILABLE
```

The application database reports either:

```text
AVAILABLE
```

or:

```text
UNAVAILABLE
```

The AI provider reports either:

```text
CONFIGURED
```

or:

```text
UNCONFIGURED
```

The health check verifies AI configuration only. It does not send a live request to the external AI provider.

---

# Validation and Error Handling

The FastAPI application validates incoming request bodies using Pydantic models.

Validation errors are converted to:

```text
400 Bad Request
```

with:

```json
{
  "detail": "Invalid request data"
}
```

Other endpoint-specific errors may include:

```json
{
  "detail": "Conversation not found"
}
```

```json
{
  "detail": "An active escalation already exists for this conversation"
}
```

```json
{
  "detail": "Feedback already exists for this conversation"
}
```

```json
{
  "detail": "This request is still being processed."
}
```

---

# AI Provider Configuration

The backend AI integration uses the following environment variables:

- `AI_API_URL`
- `AI_API_KEY`
- `AI_MODEL`

The health endpoint reports the AI provider as `CONFIGURED` only when all three required values are present and nonempty.

Sensitive credentials such as `AI_API_KEY` must be stored in environment variables and must not be committed to the repository.

The backend expects an OpenAI-compatible chat-response format.

---

# CORS and Local Development

The application supports a local React frontend and FastAPI backend.

The default frontend development origins allowed by the backend are:

- `http://localhost:5173`
- `http://127.0.0.1:5173`

The allowed origins can be overridden with:

```text
CORS_ALLOWED_ORIGINS
```

Multiple origins can be supplied as a comma-separated list.

Example:

```text
CORS_ALLOWED_ORIGINS=https://frontend.example.com,https://admin.example.com
```

The backend currently allows credentials and all HTTP methods and headers for origins in the configured allowlist.

Production deployments should configure only the required production frontend origins.

---

# Frontend Integration

The React frontend communicates with the FastAPI backend through the defined REST API.

The current frontend:

- sends customer messages through the conversation-message endpoint;
- includes a `requestId` with customer-message submissions;
- preserves the same `requestId` when retrying the same pending message;
- handles a `409 Conflict` when a request is still being processed;
- submits live-conversation feedback through the persistent feedback endpoint;
- displays escalation state when human review is required;
- uses a 35-second frontend request timeout.

The application does not currently connect the customer directly to a live human representative.

---

# Testing and Quality Evidence

The final backend implementation is covered by automated unit, API, and PostgreSQL integration tests.

The final recorded backend evidence includes:

- **66 backend tests passing**
- **90.93% total backend code coverage**
- **80% minimum backend coverage threshold enforced by CI**
- PostgreSQL integration testing
- Coverage reporting through GitHub Actions

The frontend final evidence includes:

- **61 tests passing**
- **7 test files**
- **90.28% statement coverage**
- **82.60% branch coverage**
- **97.41% function coverage**
- **91.08% line coverage**

Final testing, coverage, CI, benchmark, review, and application-flow evidence is available in:

[docs/evidence/README.md](evidence/README.md)

---

# Performance Measurement

The project includes a controlled local API benchmark using:

```text
scripts/benchmark_api.py
```

The final recorded benchmark on October 5, 2026 used Python 3.13.5 and produced:

- **50 of 50 measured requests successful**
- **5.97 ms median response time**
- **6.71 ms 95th-percentile response time**
- **5.55 ms minimum**
- **8.87 ms maximum**
- **110 stored messages including warm-up requests**

The benchmark uses:

- FastAPI's in-process test client
- an isolated in-memory SQLite database
- sequential requests at concurrency one
- a controlled AI response

It excludes:

- browser rendering
- HTTP network latency
- PostgreSQL latency
- live external AI-provider latency
- concurrent production traffic

The result is therefore a local handler baseline and not a production-capacity claim.

---

# Deployment Status

The repository does not currently include a production deployment workflow or hosted production environment.

The final project documents:

- CI execution
- local application behavior
- API integration
- testing and coverage
- local performance benchmarking
- pull-request review evidence

A production deployment would require additional configuration and validation, including:

- hosted frontend and backend environments
- production PostgreSQL configuration
- secure secrets management
- production CORS configuration
- authentication and authorization
- monitoring and observability
- rate limiting
- scalability and reliability testing
- deployment verification
- rollback procedures

The current API documentation therefore describes the implemented final course-project behavior without claiming production deployment.
