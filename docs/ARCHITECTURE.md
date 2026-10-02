# Customer Service Platform Architecture

This document describes the architecture of the Customer Service Platform and how the major frontend, backend, database, AI, and support components interact.

The system is designed as a modular AI-assisted customer support platform that allows customers to submit support messages, receive AI-generated responses, provide feedback, and escalate conversations for human review when needed.

> **Final Release Note:** This document reflects the current final-release architecture and distinguishes between functionality already integrated into `main` and functionality implemented in open final-release pull requests that is still pending merge or frontend/backend integration.

---

## 1. Architecture Overview

The Customer Service Platform uses a layered architecture with the following major areas:

- React frontend
- FastAPI backend API
- AI orchestration and provider services
- PostgreSQL persistence
- conversation and message services
- escalation and ticket services
- feedback services
- health monitoring
- CI/CD quality workflows

The architecture separates user-interface concerns from backend business logic and persistence so that each area can be tested and maintained independently.

---

## 2. High-Level System Flow

A typical customer-support interaction follows this sequence:

1. The customer signs in to the frontend.
2. The customer opens an existing conversation.
3. The frontend sends the customer's message to the FastAPI backend.
4. The backend validates the conversation and customer relationship.
5. The customer message is stored.
6. The backend passes the message to the AI orchestration layer.
7. The AI provider returns a response.
8. The backend stores the AI response.
9. The frontend displays the AI-generated response.
10. If escalation is required, the backend can create or reuse an escalation ticket.
11. The customer can later provide feedback about the support interaction.

---

## 3. Frontend Layer

The frontend is implemented with React and TypeScript.

Its responsibilities include:

- sign-in and protected navigation
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

The frontend communicates with the backend through API requests rather than directly accessing the database or AI provider.

---

## 4. Frontend State and Recovery

The final-release frontend includes logic for preserving conversation state during common failure and navigation scenarios.

Examples include:

- retaining a draft when a send fails
- restoring a draft after navigating away and returning
- preventing overlapping message sends
- preventing a delayed response from replacing a newer draft
- keeping conversation state separated between conversations

These behaviors reduce the risk of lost customer input and are covered by automated frontend tests.

> **Integration Note:** Frontend and backend timeout/retry coordination is still tracked as remaining final-release integration work.

---

## 5. Backend API Layer

The backend is implemented with FastAPI.

The API layer is responsible for:

- validating incoming requests
- validating conversation ownership
- calling conversation services
- calling AI services
- persisting messages
- creating escalation tickets
- recording feedback
- exposing backend health information
- returning structured JSON responses
- handling API errors

The primary API prefix is:

`/api/v1`

---

## 6. Conversation Message Flow

The primary customer-message endpoint is:

`POST /api/v1/conversations/{conversationId}/messages`

The message-processing flow is:

1. Receive the request.
2. Validate the conversation exists.
3. Verify that the customer is associated with the conversation.
4. Save the customer message.
5. Send the message to the AI service.
6. Receive the AI response and confidence information.
7. Save the AI response.
8. Evaluate whether escalation is required.
9. Return the response to the frontend.

This endpoint connects the frontend conversation experience to backend persistence and AI processing.

---

## 7. AI Orchestration Layer

The AI layer is separated from the main API route logic.

The AI service is responsible for:

- sending requests to the configured AI provider
- receiving AI-generated responses
- returning response text
- returning confidence information
- identifying escalation conditions
- handling provider failures

The backend uses environment-based configuration for the AI provider.

Required environment variables include:

- `AI_API_URL`
- `AI_API_KEY`
- `AI_MODEL`

This design keeps AI-provider configuration separate from application code.

---

## 8. AI Failure and Escalation Behavior

The system can identify situations where human review may be appropriate.

Examples include:

- customer request for human assistance
- low AI confidence
- AI provider failure

The backend escalation service maps these situations to escalation reasons and support queues.

Examples include:

- `CUSTOMER_REQUEST`
- `LOW_CONFIDENCE`
- `AI_FAILURE`

When escalation is required, the backend can create or reuse an active ticket.

---

## 9. Escalation and Ticket Layer

> **Current Status:** Persistent escalation functionality is implemented in PR #14 and is pending merge into `main`.

The escalation service is responsible for:

- locating an existing active escalation
- preventing duplicate active escalation tickets
- creating support tickets
- assigning an escalation reason
- assigning a support queue
- updating the conversation status
- committing the ticket and conversation-status update together

A conversation that is escalated is updated to:

`ESCALATED`

A new support ticket begins with the status:

`OPEN`

The escalation service helps keep ticket creation separate from API route logic.

---

## 10. Feedback Layer

> **Current Status:** Persistent feedback functionality is implemented in PR #14 and is pending merge into `main`.

The feedback service is responsible for:

- storing final conversation feedback
- recording resolution type
- recording whether the interaction was successful
- recording a feedback category
- preventing duplicate final feedback for the same conversation

Example resolution types include:

- `AI_RESOLVED`
- `HUMAN_RESOLVED`

The frontend feedback workflow will be connected to this persistent backend service during final integration.

---

## 11. Database Layer

The backend uses SQLAlchemy for database interaction.

PostgreSQL is the intended persistent database for the final application.

The data layer supports application entities such as:

- conversations
- messages
- tickets
- feedback

Database access is isolated from frontend code and handled through backend services.

This separation allows persistence behavior to be tested independently of the user interface.

---

## 12. Conversation Persistence

The conversation service is responsible for:

- retrieving conversations
- validating that a customer owns a conversation
- saving customer messages
- saving AI messages
- updating conversation information

The backend API relies on this service rather than directly implementing persistence logic inside each route.

This keeps conversation-related data access reusable and easier to test.

---

## 13. Transactional Escalation Update

The final-release escalation design updates the support ticket and conversation status together.

When an escalation is created:

1. A ticket is created.
2. The ticket is assigned an escalation reason.
3. The ticket status is set to `OPEN`.
4. The conversation status is changed to `ESCALATED`.
5. The changes are committed together.

This helps avoid a state where a support ticket exists but the related conversation does not reflect the escalation.

---

## 14. Health Monitoring

> **Current Status:** The backend health service is implemented in PR #14 and is pending merge into `main`.

The health endpoint is:

`GET /api/v1/health`

It checks:

- API availability
- application database availability
- AI provider configuration

The health service can report:

- `HEALTHY`
- `DEGRADED`
- `UNAVAILABLE`

This provides a simple operational view of backend readiness.

---

## 15. Error Handling

The backend uses structured HTTP responses for invalid or failed requests.

Examples include:

- `400 Bad Request`
- `403 Forbidden`
- `404 Not Found`
- `409 Conflict`
- `429 Too Many Requests`
- `503 Service Unavailable`

The frontend is responsible for translating these responses into user-facing error behavior.

The final-release frontend also preserves message drafts when possible so that failed sends can be retried.

---

## 16. Authentication and Authorization

The frontend currently includes a prototype authentication flow.

Protected frontend routes require the user to be signed in.

The backend message and escalation workflows also validate that a customer is associated with the requested conversation.

The current authentication approach is suitable for the course project prototype but is not intended to represent a full production identity-management system.

---

## 17. CORS and API Routing

During local development, the backend currently allows frontend requests from:

- `http://localhost:5173`
- `http://127.0.0.1:5173`

Production API routing and the final CORS allowlist are still being finalized.

This work is tracked separately because development origins should not automatically be treated as production configuration.

---

## 18. CI/CD Architecture

The repository uses GitHub Actions for automated quality checks.

The frontend workflow includes:

- dependency installation
- linting
- automated tests
- coverage thresholds
- production build
- bundle-size validation
- quality-evidence artifact upload
- production-build artifact upload

The backend workflow includes:

- PostgreSQL service initialization
- dependency installation
- Python syntax checking
- automated backend tests
- PostgreSQL integration tests
- coverage enforcement
- coverage artifact generation and upload

These workflows provide repeatable evidence that both frontend and backend components continue to pass automated checks.

---

## 19. Current Frontend Quality Evidence

Current frontend CI results include:

- 53 frontend tests passing
- 7 of 7 test files passing
- 92.41% line coverage
- 91.42% statement coverage
- 83.91% branch coverage
- 97.29% function coverage
- lint checks passing
- production build passing
- bundle-size checks passing

The frontend workflow also produces:

- a frontend quality-evidence artifact
- a production-build artifact

---

## 20. Current Backend Quality Evidence

Current PR #14 backend CI results include:

- 58 backend tests passing
- 90.37% total backend code coverage
- 80% minimum backend coverage threshold enforced in CI
- PostgreSQL integration testing
- Python syntax checking
- generated coverage XML artifact

These results provide automated evidence for the backend final-release work.

---

## 21. Architecture Component Relationships

The major relationships can be represented as:

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

The backend also communicates with:

FastAPI API  
↓  
Conversation Service  
↓  
PostgreSQL  

FastAPI API  
↓  
Escalation Service  
↓  
Ticket Persistence  

FastAPI API  
↓  
Feedback Service  
↓  
Feedback Persistence  

FastAPI API  
↓  
Health Service  
↓  
Database and AI Configuration Checks

---

## 22. Original System Design Components

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

The final course implementation focuses on the components necessary for the working MVP and final-release demonstration.

Not every conceptual component from the original design is implemented as a separate production service.

---

## 23. Implemented Final-Release Scope

The implemented or near-final scope includes:

- React customer-support interface
- FastAPI backend
- conversation validation
- customer and AI message persistence
- AI-provider integration
- AI response handling
- escalation recommendations
- persistent escalation ticket service
- persistent feedback service
- conversation search and filtering
- draft recovery and retry behavior
- automated frontend tests
- automated backend tests
- PostgreSQL integration testing
- CI quality gates
- backend health monitoring

---

## 24. Remaining Integration Work

The following work remains before the final system is considered fully integrated:

- merge the final frontend quality PR
- merge the backend completion PR
- connect frontend feedback to persistent backend feedback
- connect frontend escalation behavior to persistent backend tickets
- coordinate frontend/backend timeout and retry behavior
- configure production API routing
- configure production CORS
- complete deployment
- complete final performance benchmarking
- finalize production documentation

---

## 25. Deployment Considerations

The final production deployment architecture has not yet been finalized.

Deployment work will need to define:

- frontend hosting location
- backend hosting location
- production API base URL
- production environment variables
- database connection configuration
- AI-provider configuration
- CORS allowlist
- deployment verification
- health-check access
- performance and reliability measurements

The final documentation will be updated after deployment decisions are completed.

---

## 26. Architecture Strengths

The current architecture provides several advantages:

- separation between frontend and backend responsibilities
- service-based backend organization
- persistent database support
- independent AI-provider configuration
- automated tests across multiple layers
- CI quality gates
- explicit handling of escalation and feedback
- clear distinction between demo behavior and backend-confirmed actions
- ability to extend components independently

These characteristics support maintainability and make the final application easier to evaluate and demonstrate.

---

## 27. Architecture Limitations

The current project remains a course-scale implementation rather than a fully deployed enterprise customer-support platform.

Current limitations include:

- prototype authentication
- no completed production deployment yet
- no completed human-agent dashboard
- no fully integrated production knowledge-base service
- frontend/backend escalation integration still pending
- frontend/backend persistent feedback integration still pending
- production routing and CORS still pending
- large-scale concurrency has not yet been demonstrated
- final performance benchmarks are still pending

These limitations should be considered when describing the system during the final presentation or written evaluation.

---

## 28. Final Architecture Validation

The final architecture should be validated through:

- automated frontend tests
- automated backend tests
- PostgreSQL integration tests
- code coverage
- CI workflow results
- production build validation
- bundle-size checks
- deployment verification
- health checks
- API performance benchmarks
- end-to-end demonstration of the final customer-support workflow

This evidence will be used to show that the final implementation operates consistently with the documented architecture.

---

## 29. Related Documentation

Additional documentation includes:

- `docs/API.md` for API endpoint details
- `docs/USER_GUIDE.md` for user workflows
- `README.md` for project setup and repository information

The README and this architecture document should receive a final cleanup after the remaining final-release pull requests are merged and the deployment configuration is complete.
