# Customer Service Platform Architecture

This document describes the final course-project architecture of the Customer Service Platform and how the major frontend, backend, database, AI, and support components interact.

The system is designed as a modular AI-assisted customer-support platform that allows customers to submit support messages, receive AI-generated responses, provide feedback, and escalate conversations for human review when needed.

---

## 1. Architecture Overview

The Customer Service Platform uses a layered architecture with the following major areas:

- React and TypeScript frontend
- FastAPI backend API
- AI orchestration and provider services
- PostgreSQL persistence
- conversation and message services
- escalation and ticket services
- feedback services
- health monitoring
- automated testing and CI workflows

The architecture separates user-interface concerns from backend business logic, AI-provider communication, and persistence so that each area can be developed, tested, and maintained independently.

---

## 2. High-Level System Flow

A typical customer-support interaction follows this sequence:

1. The customer signs in to the frontend.
2. The customer opens an existing conversation.
3. The customer submits a support message.
4. The frontend generates or reuses a `requestId`.
5. The frontend sends the message to the FastAPI backend.
6. The backend validates the request, conversation, and customer relationship.
7. The backend checks the `requestId` for duplicate or in-progress processing.
8. The customer message is stored.
9. The backend passes the message to the AI orchestration layer.
10. The AI provider returns a response.
11. The backend stores the AI response.
12. If human review is required, the backend creates or reuses an active escalation ticket.
13. The backend returns the response to the frontend.
14. The frontend displays the AI-generated response and escalation state.
15. The customer can later submit final resolution feedback.
16. The feedback record is stored persistently by the backend.

---

## 3. Frontend Layer

The frontend is implemented with React and TypeScript.

Its responsibilities include:

- prototype sign-in and protected navigation
- conversation display
- message composition and sending
- AI-response display
- conversation navigation
- conversation search, filtering, and sorting
- feedback controls
- escalation messaging
- error display
- preservation of message drafts
- retry and recovery behavior
- request-ID management
- API-response validation

The frontend communicates with the backend through REST API requests rather than directly accessing the database or AI provider.

---

## 4. Frontend State and Recovery

The final-release frontend includes logic for preserving conversation state during common failure and navigation scenarios.

Examples include:

- retaining a draft when a send fails
- restoring a draft after navigating away and returning
- preventing overlapping message sends
- preventing a delayed response from replacing a newer draft
- keeping conversation state separated between conversations
- preserving the same `requestId` when retrying the same pending message
- handling a `409 Conflict` when the backend reports that the same request is still being processed
- using a 35-second request timeout

These behaviors reduce the risk of lost customer input and duplicate message processing and are covered by automated frontend tests.

---

## 5. Backend API Layer

The backend is implemented with FastAPI.

The API layer is responsible for:

- validating incoming requests
- validating conversation ownership
- detecting duplicate or in-progress message requests
- calling conversation services
- calling AI services
- persisting messages
- creating or reusing escalation tickets
- recording feedback
- exposing backend health information
- returning structured JSON responses
- handling API errors

The primary API prefix is:

```text
/api/v1
```

---

## 6. Conversation Message Flow

The primary customer-message endpoint is:

```text
POST /api/v1/conversations/{conversationId}/messages
```

The message-processing flow is:

1. Receive the request.
2. Validate the request fields.
3. Validate that the conversation exists.
4. Verify that the customer is associated with the conversation.
5. Check whether the supplied `requestId` has already been used.
6. If the request is new, save the customer message.
7. Send the message to the AI service.
8. Receive the AI response and confidence information.
9. Save the AI response.
10. Evaluate whether escalation is required.
11. Create or reuse an escalation ticket when needed.
12. Return the response to the frontend.

This endpoint connects the frontend conversation experience to backend persistence, AI processing, escalation handling, and duplicate-request protection.

---

## 7. Request ID and Duplicate Protection

Each customer-message request includes a required `requestId`.

The frontend retains the same `requestId` when retrying the same pending customer message.

The backend uses the value to reduce duplicate processing.

If a stored customer message already exists for the same conversation and `requestId`:

1. The backend searches for the corresponding stored AI response.
2. If the AI response exists, the previously stored response is returned.
3. If the AI response is not yet available, the backend returns:

```text
409 Conflict
```

This design reduces the chance that a network interruption or frontend retry creates duplicate customer and AI message pairs.

---

## 8. AI Orchestration Layer

The AI layer is separated from the main API route logic.

The AI service is responsible for:

- sending requests to the configured external AI provider
- receiving AI-generated responses
- returning response text
- returning confidence information
- identifying escalation conditions
- handling provider failures
- returning fallback behavior when appropriate

The backend uses environment-based configuration for the AI provider.

Required environment variables include:

- `AI_API_URL`
- `AI_API_KEY`
- `AI_MODEL`

This design keeps AI-provider configuration separate from application code and allows another OpenAI-compatible provider to be used without redesigning the application.

---

## 9. AI Failure and Escalation Behavior

The system can identify situations where human review may be appropriate.

Examples include:

- customer request for human assistance
- low AI confidence
- AI provider failure

The backend escalation service maps these situations to escalation reasons.

Supported escalation reasons include:

- `LOW_CONFIDENCE`
- `COMPLEX_ISSUE`
- `CUSTOMER_REQUEST`
- `AI_FAILURE`

When escalation is required, the backend creates or reuses an active escalation ticket and updates the conversation status.

---

## 10. Escalation and Ticket Layer

The persistent escalation service is integrated into the final backend.

The escalation service is responsible for:

- locating an existing active escalation
- preventing duplicate active escalation tickets
- creating support tickets
- assigning an escalation reason
- assigning a support queue
- updating the conversation status
- committing the ticket and conversation-status update

A conversation that is escalated is updated to:

```text
ESCALATED
```

A new support ticket begins with:

```text
OPEN
```

The default queue is:

```text
General Support
```

The escalation service keeps ticket-management logic separate from API route logic.

---

## 11. Feedback Layer

Persistent feedback functionality is integrated into the final backend and frontend workflow.

The feedback service is responsible for:

- storing final conversation feedback
- recording resolution type
- recording whether the interaction was successful
- recording a feedback category
- preventing duplicate final feedback for the same conversation

Supported resolution types include:

- `AI_RESOLVED`
- `HUMAN_RESOLVED`

Only one final feedback record is stored for each conversation.

Duplicate feedback submissions return:

```text
409 Conflict
```

---

## 12. Database Layer

The backend uses SQLAlchemy for database interaction.

PostgreSQL is the persistent database used by the application and final integration testing.

The data layer supports application entities including:

- conversations
- messages
- tickets
- feedback

Database access is isolated from frontend code and handled through backend services.

This separation allows persistence behavior to be tested independently of the user interface.

---

## 13. Conversation Persistence

The conversation service is responsible for:

- retrieving conversations
- validating that a customer owns a conversation
- retrieving customer messages by request ID
- saving customer messages
- saving AI messages
- updating conversation information

The backend API relies on this service rather than directly implementing persistence logic inside each route.

This keeps conversation-related data access reusable and easier to test.

---

## 14. Transactional Escalation Update

When an escalation is created:

1. A ticket is created.
2. The ticket is assigned an escalation reason.
3. The ticket status is set to `OPEN`.
4. The conversation status is changed to `ESCALATED`.
5. The ticket and conversation changes are committed.

This helps avoid a state where a support ticket exists but the related conversation does not reflect the escalation.

---

## 15. Health Monitoring

The backend provides:

```text
GET /api/v1/health
```

The health service checks:

- API availability
- application database availability
- AI-provider configuration

The health service can report:

- `HEALTHY`
- `DEGRADED`
- `UNAVAILABLE`

The application database component reports whether database access is available.

The AI-provider component reports whether the required provider environment variables are configured.

The health endpoint checks AI-provider configuration only. It does not send a live request to the external AI provider.

---

## 16. Error Handling

The backend uses structured HTTP responses for invalid or failed requests.

Examples include:

- `400 Bad Request`
- `403 Forbidden`
- `404 Not Found`
- `409 Conflict`

The frontend also includes handling for infrastructure-level conditions such as:

- `401 Unauthorized`
- `429 Too Many Requests`
- `503 Service Unavailable`

The current backend does not implement production authentication or rate limiting.

The frontend translates API errors into user-facing behavior and preserves message drafts when possible so that failed sends can be retried.

---

## 17. Authentication and Authorization

The frontend currently includes a prototype authentication flow.

Protected frontend routes require the user to be signed in.

The prototype stores the customer identifier in browser `localStorage`.

The backend message and escalation workflows validate that the supplied customer is associated with the requested conversation.

This approach is suitable for the course-project demonstration but is not intended to represent a production identity-management system.

A production system would require stronger authentication, authorization, session management, and security controls.

---

## 18. CORS and API Routing

During local development, the backend allows frontend requests from:

- `http://localhost:5173`
- `http://127.0.0.1:5173`

The allowed origins can be configured using:

```text
CORS_ALLOWED_ORIGINS
```

Multiple origins can be supplied as a comma-separated list.

The frontend backend URL can be configured using:

```text
VITE_API_BASE_URL
```

This allows the frontend and backend to be hosted separately without hard-coding production addresses into the application.

Production deployments should use only the intended frontend origins.

---

## 19. CI Architecture

The repository uses GitHub Actions for automated quality checks.

The frontend workflow includes:

- repository checkout
- Node.js setup
- dependency installation
- linting
- automated tests
- coverage threshold enforcement
- production build
- bundle-size validation
- quality-evidence artifact upload
- production-build artifact upload

The backend workflow includes:

- repository checkout
- Python setup
- PostgreSQL service initialization
- dependency installation
- Python syntax checking
- automated backend tests
- PostgreSQL integration testing
- coverage enforcement
- coverage artifact generation and upload

These workflows provide repeatable evidence that both frontend and backend components continue to satisfy automated quality checks.

---

## 20. Final Frontend Quality Evidence

The final recorded frontend evidence includes:

- **61 tests passing**
- **7 test files**
- **90.28% statement coverage**
- **82.60% branch coverage**
- **97.41% function coverage**
- **91.08% line coverage**
- lint validation
- production build validation
- bundle-size validation

The configured minimum frontend coverage thresholds are:

- Statements: 85%
- Lines: 85%
- Functions: 80%
- Branches: 75%

The frontend workflow also produces quality-evidence and production-build artifacts.

---

## 21. Final Backend Quality Evidence

The final recorded backend evidence includes:

- **66 backend tests passing**
- **90.93% total backend code coverage**
- **80% minimum backend coverage threshold enforced by CI**
- PostgreSQL integration testing
- Python syntax validation
- coverage reporting through GitHub Actions

These results provide automated evidence for the final backend implementation.

---

## 22. Performance Measurement

The project includes a controlled local API benchmark using:

```text
scripts/benchmark_api.py
```

The final recorded benchmark on October 5, 2026 produced:

- **50 of 50 measured requests successful**
- **5.97 ms median response time**
- **6.71 ms 95th-percentile response time**
- **5.55 ms minimum**
- **8.87 ms maximum**
- **110 stored messages including warm-up requests**

The benchmark exercises the FastAPI handler and message persistence using:

- FastAPI's in-process test client
- an isolated in-memory SQLite database
- sequential requests at concurrency one
- a controlled AI response

The benchmark excludes:

- browser rendering
- HTTP network transport
- PostgreSQL latency
- live external AI-provider latency
- concurrent production traffic

The result is therefore an in-process handler baseline and should not be interpreted as a production-capacity or end-user latency measurement.

---

## 23. Architecture Component Relationships

The primary request path can be represented as:

```text
Customer
   ↓
React Frontend
   ↓
FastAPI API
   ↓
Conversation Service
   ↓
AI Service
   ↓
External AI Provider
```

Persistence flows include:

```text
FastAPI API
   ↓
Conversation Service
   ↓
PostgreSQL
```

Escalation flow:

```text
FastAPI API / AI Processing
   ↓
Escalation Service
   ↓
Ticket Persistence
   ↓
PostgreSQL
```

Feedback flow:

```text
React Frontend
   ↓
FastAPI API
   ↓
Feedback Service
   ↓
PostgreSQL
```

Health flow:

```text
FastAPI API
   ↓
Health Service
   ↓
Database and AI Configuration Checks
```

---

## 24. Original System Design Components

The earlier system design specification identified a broader target architecture including:

- React frontend
- API/backend layer
- authentication
- customer service
- conversation service
- ticket and escalation service
- AI orchestration service
- knowledge base
- external LLM
- human-agent interface
- feedback and analytics
- application database
- existing customer database

The final course implementation focuses on the components necessary for the working MVP and final demonstration.

Not every conceptual component from the original design is implemented as a separate production service.

---

## 25. Implemented Final-Release Scope

The final implemented scope includes:

- React customer-support interface
- FastAPI backend
- conversation validation
- customer ownership validation
- customer and AI message persistence
- request-ID duplicate protection
- AI-provider integration
- AI response handling
- AI failure fallback behavior
- escalation recommendations
- persistent escalation ticket service
- frontend escalation state
- persistent feedback service
- frontend feedback integration
- conversation search and filtering
- draft recovery and retry behavior
- 35-second frontend request timeout
- backend health monitoring
- PostgreSQL persistence
- PostgreSQL integration testing
- automated frontend tests
- automated backend tests
- CI quality gates
- production frontend build validation
- bundle-size validation
- local API performance benchmarking

---

## 26. Deployment Status

The repository does not currently include a production deployment workflow or a hosted production environment.

The architecture is prepared for separate frontend and backend hosting through environment-based configuration.

A production deployment would require:

- hosted frontend environment
- hosted FastAPI backend
- hosted PostgreSQL database
- production `DATABASE_URL`
- production API base URL
- AI-provider environment variables
- secure secrets management
- production CORS allowlist
- deployment verification
- monitoring and observability
- authentication and authorization
- rate limiting
- scalability and reliability validation
- rollback procedures

The current project documents local application behavior, automated CI, integration testing, and performance benchmarking without claiming a completed production deployment.

If a hosted deployment is completed later, this section should be updated with the actual deployment environment and verification evidence.

---

## 27. Architecture Strengths

The final architecture provides several advantages:

- clear separation between frontend and backend responsibilities
- service-based backend organization
- persistent PostgreSQL support
- configurable AI-provider integration
- separation between API, AI, persistence, escalation, feedback, and health responsibilities
- duplicate-request protection
- frontend retry and draft recovery behavior
- automated tests across multiple layers
- CI quality gates
- explicit handling of escalation and feedback
- clear distinction between prototype behavior and backend-confirmed actions
- environment-based deployment configuration
- ability to extend components independently

These characteristics support maintainability and make the application easier to test, evaluate, and extend.

---

## 28. Architecture Limitations

The project remains a course-scale implementation rather than a fully deployed enterprise customer-support platform.

Current limitations include:

- prototype authentication
- no completed production deployment
- no live human-agent dashboard
- no fully integrated production knowledge-base service
- no direct connection between the customer and a live human representative
- no production authentication or authorization
- no production rate limiting
- no production monitoring or observability
- large-scale concurrency has not been demonstrated
- benchmark results are local handler measurements rather than production performance measurements

These limitations should be considered when describing the system during the final presentation or written evaluation.

---

## 29. Final Architecture Validation

The final architecture is supported by:

- automated frontend tests
- automated backend tests
- PostgreSQL integration tests
- backend and frontend code-coverage measurements
- GitHub Actions CI results
- frontend production-build validation
- bundle-size validation
- health-check functionality
- controlled API performance benchmarking
- AI-response demonstration evidence
- escalation-flow evidence
- persistent-feedback evidence
- pull-request and code-review evidence
- contribution-history evidence

The final evidence demonstrates that the implemented system operates consistently with the documented architecture within the scope of the course-project environment.

Production deployment verification is not currently included because the application has not yet been deployed to a hosted production environment.

---

## 30. Related Documentation

Additional documentation includes:

- `docs/API.md` for API endpoint details
- `docs/USER_GUIDE.md` for user workflows
- `docs/SECURITY_RISKS_AND_ROADMAP.md` for security limitations and future improvements
- `docs/evidence/README.md` for final testing, CI, benchmark, review, and application-flow evidence
- `README.md` for project setup, development instructions, and repository information
