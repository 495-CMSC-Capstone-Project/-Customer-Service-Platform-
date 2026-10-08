# Customer Service Platform

## Project Overview

The Customer Service Platform gives customers an AI-assisted first response to support questions while identifying when a conversation may require human review.

The final course-project release integrates a React and TypeScript customer interface with a FastAPI backend. The backend manages conversations and messages, communicates with an external AI provider, persists escalation and feedback records, provides health monitoring, and uses PostgreSQL for application data.

The system uses a modular architecture so that the frontend, backend services, database, and AI provider can be developed and tested independently while communicating through defined interfaces.

The platform can create and persist escalation records when a conversation requires human review. The current demonstration does not directly connect the customer to a live human representative.

## Final Release Features

The final implementation includes:

- Customer support message entry through a React web interface
- Frontend-to-backend communication through a REST API
- Message validation
- Request ID handling for duplicate-message protection
- Conversation ownership validation
- AI response generation through an external AI provider
- AI confidence information
- Persistent escalation handling for conversations requiring human review
- Prototype human-agent review queue (`/agent-review`) for open escalations
- AI confidence meter display on assistant messages
- Persistent resolution feedback for live support conversations
- Backend health-check service
- Docker Compose local deployment for frontend, backend, and PostgreSQL
- Conversation search, status filters, sorting, and sample conversation details
- Draft recovery and retry controls
- Customer and AI message persistence
- PostgreSQL database integration
- Error handling for invalid requests, duplicate/in-progress operations, and unavailable services
- Automated backend unit and API tests
- PostgreSQL integration testing
- Automated frontend tests and coverage enforcement
- Frontend linting and production build validation
- Frontend bundle-size validation
- GitHub Actions CI workflows
- Code-review and project evidence documentation

## Technology Stack

### Frontend

- React 19
- TypeScript
- Vite
- Vitest
- Oxlint

### Backend

- Python
- FastAPI
- Uvicorn
- SQLAlchemy
- Pydantic
- HTTPX

### Database

- PostgreSQL
- psycopg2

### Testing and CI/CD

- Pytest
- pytest-cov
- Vitest
- GitHub Actions
- Frontend coverage enforcement
- Frontend lint and build checks
- Frontend bundle-size validation
- Backend automated tests
- PostgreSQL integration testing

## Repository Structure

```text
Customer-Service-Platform/
├── .github/
│   └── workflows/
│       ├── backend-tests.yml
│       └── frontend-ci.yml
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── ai_provider.py
│   │   ├── ai_service.py
│   │   ├── api.py
│   │   ├── conversation_service.py
│   │   ├── database.py
│   │   ├── escalation_service.py
│   │   ├── feedback_service.py
│   │   ├── health_service.py
│   │   ├── models.py
│   │   └── seed.py
│   │
│   ├── tests/
│   ├── __init__.py
│   └── requirements.txt
│
├── docs/
│   ├── evidence/
│   │   ├── README.md
│   │   ├── ai-flow.png
│   │   ├── backend-pytest.txt
│   │   ├── backend-test-coverage.png
│   │   ├── benchmark.json
│   │   ├── ci-backend-tests.png
│   │   ├── ci-frontend-tests.png
│   │   ├── contribution-evidence.png
│   │   ├── escalation-flow.png
│   │   ├── feedback-flow.png
│   │   ├── frontend-coverage.txt
│   │   ├── frontend-test-coverage.png
│   │   ├── performance-benchmark.png
│   │   └── pr-code-review.png
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── SECURITY_RISKS_AND_ROADMAP.md
│   └── USER_GUIDE.md
│
├── frontend/
│   ├── public/
│   ├── scripts/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── vitest.config.ts
│
├── scripts/
│   └── benchmark_api.py
│
├── .gitignore
└── README.md
```

## Prerequisites

Before running the application locally, install:

- Python 3.12 or a compatible supported Python version
- Node.js 22 and npm, as used by frontend CI
- PostgreSQL
- Git, if working with a cloned repository

A compatible external AI provider is also required for live AI responses.

## Backend Setup

From the repository root, create a Python virtual environment:

```powershell
py -m venv .venv
```

On Windows PowerShell, activate it with:

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks script activation, the virtual environment's Python executable can be used directly.

Install the backend dependencies:

```powershell
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

The backend uses packages including:

```text
fastapi
uvicorn
sqlalchemy
psycopg2-binary
pydantic
pytest
httpx
```

## Database Configuration

The backend uses PostgreSQL for application data.

Create a PostgreSQL database named:

```text
customer_service
```

The application reads the database connection from the `DATABASE_URL` environment variable.

Example:

```text
DATABASE_URL=postgresql+psycopg2://username:password@localhost:5432/customer_service
```

If `DATABASE_URL` is not provided, the current backend configuration defaults to:

```text
postgresql+psycopg2://localhost/customer_service
```

Use credentials appropriate for your local PostgreSQL installation.

### Seed Demo Data

The application uses a demo conversation for integration testing and the live demonstration.

After PostgreSQL is configured, run:

```powershell
.\.venv\Scripts\python.exe -m backend.app.seed
```

This creates the required database tables if necessary and adds the demo conversation:

```text
Conversation ID: conv_001
Customer ID: cust_001
```

## AI Provider Configuration

The backend communicates with an external AI provider through a provider-agnostic interface.

Configure the following environment variables before running live AI responses:

```text
AI_API_URL
AI_API_KEY
AI_MODEL
```

Example format:

```text
AI_API_URL=<provider-endpoint>
AI_API_KEY=<api-key>
AI_MODEL=<model-name>
```

Do not commit API keys or other secrets to the repository.

The current integration expects an OpenAI-compatible chat response format.

During integration testing, Groq was used successfully with:

```text
AI_API_URL=https://api.groq.com/openai/v1/chat/completions
AI_MODEL=openai/gpt-oss-20b
AI_API_KEY=<your-api-key>
```

Groq is not hard-coded into the application. Another compatible provider can be used by changing the environment variables.

If the AI provider cannot be reached, the backend returns a fallback response and marks the request for escalation.

## Running the Backend

From the repository root, run:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.app.api:app --reload
```

The backend will normally be available at:

```text
http://localhost:8000
```

## API Endpoints

The primary customer-message endpoint is:

```text
POST /api/v1/conversations/{conversationId}/messages
```

For the demo conversation:

```text
POST /api/v1/conversations/conv_001/messages
```

Example request body:

```json
{
  "customerId": "cust_001",
  "requestId": "req_example_001",
  "message": "I need help with my account."
}
```

A successful response follows this structure:

```json
{
  "conversationId": "conv_001",
  "messageId": "msg_example",
  "response": "AI-generated response",
  "source": "AI",
  "confidence": 0.8,
  "escalated": false
}
```

Additional backend endpoints include:

```text
POST /api/v1/escalations
GET  /api/v1/escalations
POST /api/v1/escalations/{ticketId}/claim
POST /api/v1/conversations/{conversationId}/feedback
GET  /api/v1/health
```

### API Contract

FastAPI serves interactive API documentation at:

```text
http://localhost:8000/docs
```

and the generated OpenAPI schema at:

```text
http://localhost:8000/openapi.json
```

| Field | Type | Rule |
| --- | --- | --- |
| `conversationId` in the path | string | Required; must identify a stored conversation. |
| `customerId` in the request | string | Required and nonempty; must match that conversation's customer. This is a demo identifier, not authenticated identity. |
| `requestId` in the request | string | Required, 1–64 characters; used to identify repeated message submissions. |
| `message` in the request | string | 1–2,000 characters; whitespace-only messages are rejected. |
| `conversationId` in the response | string | Must match the requested conversation. |
| `messageId` in the response | string | ID of the saved assistant message. |
| `response` | string | Assistant text, including fallback text if the provider is unavailable. |
| `source` | string | Currently `AI` from the message endpoint; the frontend also accepts `HUMAN`. |
| `confidence` | number | 0–1; a demonstration score, not measured answer accuracy. |
| `escalated` | boolean | Indicates that the conversation requires or has entered human-review escalation. |

The customer-message endpoint returns:

- `400` for invalid request data
- `403` for a mismatched customer ID
- `404` for a missing conversation
- `409` when an earlier request with the same request ID has stored the customer message but its AI response is still incomplete

If both the customer message and AI response already exist for the same `requestId`, the backend returns the previously stored AI response instead of creating another message pair. This reduces duplicate processing during retries.

Provider failures currently return a successful API response with fallback text, confidence `0.0`, and `escalated: true`.

The escalation endpoint can return `409` when an active escalation already exists for a conversation.

The feedback endpoint can return `409` when final feedback has already been recorded for a conversation.

The frontend also handles `401`, `429`, and `503` responses if infrastructure returns them. The current backend does not implement production authentication or rate limiting.

## Frontend Setup

Move into the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm ci
```

If PowerShell blocks `npm.ps1`, use:

```powershell
npm.cmd ci
```

Start the Vite development server:

```bash
npm run dev
```

or, if needed on PowerShell:

```powershell
npm.cmd run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

The frontend sends customer messages and feedback requests to the FastAPI backend.

When `VITE_API_BASE_URL` is not configured for local development, the frontend uses relative API paths or the local development configuration.

## Frontend Commands

Run the development server:

```bash
npm run dev
```

Run Oxlint:

```bash
npm run lint
```

Run frontend unit tests:

```bash
npm test
```

Run frontend tests with enforced coverage thresholds and generate coverage reports:

```bash
npm run test:coverage
```

Build the frontend:

```bash
npm run build
```

After building, verify that the production JavaScript and CSS bundles remain within the documented gzip-size budgets:

```bash
npm run check:bundle-size
```

Preview the production build:

```bash
npm run preview
```

## Running the Full Application

To run the application end to end:

1. Start PostgreSQL.
2. Configure `DATABASE_URL`.
3. Run the database seed script.
4. Configure `AI_API_URL`, `AI_API_KEY`, and `AI_MODEL`.
5. Start the FastAPI backend.
6. Start the React frontend.
7. Open the frontend in a browser at `http://localhost:5173`.
8. Sign in using the demo customer ID.
9. Open the live demo conversation.
10. Submit a customer support message.
11. Confirm that the AI response is returned and displayed.
12. Confirm that customer and AI messages are persisted.
13. Trigger an escalation when human review is needed.
14. Submit resolution feedback and confirm it is recorded.

The primary live demonstration uses:

```text
Conversation ID: conv_001
Customer ID: cust_001
```

## Error Handling

The frontend provides user-facing handling for several API conditions, including:

- `400` - Invalid request
- `401` - Session not authorized
- `403` - Customer does not have access to the conversation
- `404` - Conversation not found
- `409` - Duplicate/in-progress message request or duplicate feedback
- `429` - Too many requests
- `503` - Service temporarily unavailable

Unexpected service errors are handled through a general fallback message.

Successful API responses are checked for required fields and the expected conversation ID before being added to visible history.

The frontend uses a 35-second request timeout. Failed sends keep the draft available for retry and do not update the local conversation timestamp. Drafts and retry errors survive in-app navigation.

The frontend retains the same `requestId` when retrying the same pending customer message. The backend uses that identifier to reduce duplicate processing. If both the previously stored customer message and AI reply are available, the stored AI response is returned. If the customer message exists but processing has not completed, the backend returns `409` so the frontend can ask the user to wait before retrying.

The interface disables message submission while a request is being processed to further reduce accidental duplicate submissions.

## Testing

### Backend Tests

From the repository root, run:

```bash
pytest backend/tests
```

Backend tests cover areas including:

- AI service behavior
- External AI provider handling
- Database models
- Conversation service behavior
- Request ID handling
- API validation
- Conversation ownership
- Message-length boundaries
- Escalation service behavior
- Feedback persistence and duplicate protection
- Health service behavior
- Successful and failed API responses
- PostgreSQL integration

Some backend unit tests use an in-memory SQLite database so that every unit test does not require a running PostgreSQL instance.

To include the PostgreSQL integration test, point `TEST_DATABASE_URL` at a separate test database. The integration test creates required tables, writes temporary rows, and removes its test data.

The final recorded backend test evidence contains:

- **66 passing tests**
- **90.93% overall backend coverage**
- **80% minimum CI coverage gate**
- PostgreSQL integration testing

The backend GitHub Actions workflow runs on `ubuntu-latest`, starts a PostgreSQL service, checks Python syntax, runs the backend tests with coverage, and uploads the coverage report.

Final testing evidence is available in:

[docs/evidence/README.md](docs/evidence/README.md)

### Frontend Validation

From the `frontend` directory, run:

```bash
npm run lint
npm run test:coverage
npm run build
npm run check:bundle-size
```

The final recorded frontend suite contains:

- **61 passing tests**
- **7 test files**
- **90.28% statement coverage**
- **82.60% branch coverage**
- **97.41% function coverage**
- **91.08% line coverage**

The configured minimum frontend coverage thresholds are:

- Statements: 85%
- Lines: 85%
- Functions: 80%
- Branches: 75%

The coverage scope includes the API client, authentication state and dialog, support state, chat, feedback, conversation filtering, conversation pages, and support helpers.

These are scoped frontend coverage figures and should not be interpreted as whole-system coverage or as a live-provider end-to-end performance measurement.

The frontend CI workflow also verifies:

- Oxlint
- Coverage thresholds
- TypeScript/Vite production build
- Production JavaScript and CSS bundle-size limits
- Upload of frontend quality evidence
- Upload of the production build artifact

See the [frontend guide](frontend/README.md) for additional frontend behavior and development information.

## Local API Performance Measurement

From the repository root, using the backend environment:

```powershell
.\.venv\Scripts\python.exe scripts\benchmark_api.py
```

The benchmark exercises the FastAPI handler and real message persistence in an isolated in-memory SQLite database. The external AI provider is replaced with a controlled response so that provider/network latency does not affect the handler baseline.

The benchmark performs five warm-up requests followed by 50 sequential measured requests at concurrency one.

The final recorded benchmark on October 5, 2026 used Python 3.13.5 and produced:

- **50 of 50 measured requests successful**
- **5.97 ms median response time**
- **6.71 ms 95th-percentile response time**
- **5.55 ms minimum**
- **8.87 ms maximum**
- **110 stored messages including warm-up requests**

Repeat runs will vary with the machine and system load.

These figures exclude:

- Browser rendering
- HTTP network transport
- PostgreSQL latency
- Live external AI-provider latency
- Concurrent production traffic

The result is therefore an in-process handler baseline and is not a claim of production-scale capacity or end-user response time.

The raw benchmark data and screenshot are available in:

[docs/evidence/README.md](docs/evidence/README.md)

## CI/CD

GitHub Actions is used to automatically validate project changes.

The backend CI process includes:

- Repository checkout
- Python setup
- PostgreSQL service startup
- Backend dependency installation
- Python syntax validation
- Backend unit/API testing
- PostgreSQL integration testing
- 80% minimum backend coverage enforcement
- Coverage report upload

The frontend CI process includes:

- Repository checkout
- Node.js setup
- Dependency installation
- Oxlint
- Frontend tests
- Coverage threshold enforcement
- TypeScript/Vite production build
- Production bundle-size validation
- Quality-evidence artifact upload
- Production-build artifact upload

Pull requests should have successful CI checks before they are merged into `main`.

Feature branches are reviewed through pull requests before completed work is incorporated into the main branch.

Final project evidence is stored in:

[docs/evidence/](docs/evidence/)

The evidence package includes:

- Backend CI evidence
- Frontend CI evidence
- Backend test and coverage results
- Frontend test and coverage results
- Raw local test output
- Performance benchmark data
- Pull-request and code-review evidence
- Contribution history evidence
- AI-response flow evidence
- Escalation-flow evidence
- Persistent-feedback evidence

The evidence files document successful CI and local application behavior. They do not represent a production deployment.

## Local Container Deployment

A Docker Compose stack is available for reproducible local deployment evidence:

```bash
docker compose up --build
```

- Frontend: `http://localhost:8080`
- Backend/API docs: `http://localhost:8000/docs`
- Agent review queue: `http://localhost:8080/agent-review`

Full steps and evidence checklist: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Deployment Requirements

For a separately hosted frontend, this project uses an explicit backend CORS allowlist.

Configure the frontend with:

```text
VITE_API_BASE_URL=<backend-base-url>
```

Configure the backend with:

```text
CORS_ALLOWED_ORIGINS=<frontend-origin>
```

Multiple frontend origins can be supplied as a comma-separated list:

```text
CORS_ALLOWED_ORIGINS=<frontend-origin-1>,<frontend-origin-2>
```

When `CORS_ALLOWED_ORIGINS` is not set, the backend defaults to the local Vite development origins:

```text
http://localhost:5173
http://127.0.0.1:5173
```

Production deployments should use only the intended frontend origins. A wildcard (`*`) should not be used as a substitute for configuring the actual deployed origins.

Setting `VITE_API_BASE_URL` alone does not authorize cross-origin browser requests; the frontend origin must also be allowed by the backend.

The frontend request timeout is 35 seconds. The external AI-provider timeout is configured separately by the backend/provider implementation.

The final course-project release is hosted on Render with a React static frontend, FastAPI backend, and PostgreSQL database. Deployment validation confirmed that the public API, application database, and external AI provider were available, and the deployed application successfully completed the AI response, escalation, and persistent feedback flows.

Frontend:
https://customer-service-frontend-we6r.onrender.com

Backend:
https://customer-service-platform-upus.onrender.com

Deployment screenshots and validation evidence are available in:

[docs/evidence/](docs/evidence/)

This hosted deployment demonstrates the completed course-project release but is not intended to represent a fully hardened enterprise production environment.

Additional production hardening would include:

- Production authentication and authorization
- Rate limiting
- Centralized monitoring and observability
- Larger-scale concurrency and reliability testing
- Automated deployment and rollback procedures
- Additional security hardening
- Higher-availability infrastructure

## Development Workflow

Development work is performed using feature branches and pull requests.

Typical workflow:

```text
Create feature branch
        ↓
Implement and test changes
        ↓
Push changes
        ↓
Open or update pull request
        ↓
Run automated CI checks
        ↓
Peer review
        ↓
Address feedback
        ↓
Merge approved changes into main
```

Draft pull requests may be used while a feature or integration effort is still under active development.

The project repository includes evidence of pull-request review, requested changes, follow-up commits, approvals, and merges.

## Team Members and Contributions

- **Makida Abebe (`makida-abebe`)** — Led major backend and integration work across the project. Contributions included AI orchestration and external provider integration, AI API integration, chat message handling, backend persistence, health checks, persistent feedback integration, request-ID/idempotency and retry handling, production CORS configuration, benchmarking updates, final API/user guide/architecture documentation, and overall final-release documentation.

- **Julian Chavez (`Juls2Worlds`)** — Contributed to the backend database foundation and PostgreSQL integration testing, helping establish the persistent data layer and validate database behavior.

- **Tyresz Brash (`TyreszB`)** — Developed major customer-facing frontend functionality, including the customer homepage, prototype support pages, and authentication modals. Also contributed to final project evidence updates.

- **Sebastianna Chan (`sebastiannak`)** — Improved frontend chat recovery, feedback behavior, and quality gates, including reliability and user-state handling improvements.

- **Kierra Cunningham (`KierraC4`)** — Improved frontend API reliability and CI coverage and added the security, risks, controls, and future roadmap documentation.

- **Sean Chase (`seanvchase`)** — Added the frontend CI workflow, helping establish automated frontend validation for testing, coverage, build, and quality checks.

- **Sean Davis** — Built on the team final release with attributable enhancements: prototype agent review queue (list/claim escalations), AI confidence meter UX, Docker Compose local deployment + deployment guide, and related tests/docs. See [docs/CONTRIBUTIONS_SEAN_DAVIS.md](docs/CONTRIBUTIONS_SEAN_DAVIS.md) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Security Notes

- **Prototype Authentication:** The current demonstration uses a prototype customer sign-in mechanism that stores the customer ID in browser `localStorage`. This is intended for demonstration purposes only and is not a production authentication implementation.
- API keys and database credentials should not be committed to source control.
- Sensitive configuration should be supplied through environment variables.
- Backend requests are validated before processing.
- Conversation access is checked against the requesting customer ID.
- The frontend communicates with the backend through the defined REST API rather than accessing the database or external AI provider directly.
- CORS origins are explicitly configurable.
- Request IDs help reduce duplicate message processing during retries.
- Duplicate final feedback and duplicate active escalation records are rejected.
- Production use would require stronger authentication, authorization, rate limiting, monitoring, secrets management, and security hardening.

Additional security risks, controls, and future improvements are documented in:

[docs/SECURITY_RISKS_AND_ROADMAP.md](docs/SECURITY_RISKS_AND_ROADMAP.md)

## Project Status

The final course-project release uses `cust_001` / `conv_001` for the primary live demonstration.

Some sample conversations and browser-oriented demonstration behavior remain prototype features. The primary live conversation, however, communicates with the FastAPI backend and supports persistent message processing, escalation handling, and resolution feedback.

The final backend provides:

- Persistent customer and AI messaging
- Request ID duplicate protection
- Persistent escalation handling
- Persistent resolution feedback
- PostgreSQL integration
- Health monitoring
- External AI-provider integration

When a conversation requires human review, the backend can persist an escalation record and the frontend displays the appropriate human-review state. The prototype agent review queue lists those tickets for claim/review. The application does not currently connect the customer directly to a live human representative.

Resolution feedback for the live support conversation is submitted through the backend and stored persistently.

The frontend communicates with the backend through the defined REST API and does not access the database or external AI provider directly.

The backend confidence value remains a demonstration score and should not be interpreted as a calibrated probability of answer correctness.

This repository represents the **final course-project release** of the Customer Service Platform.

It demonstrates integrated communication between the React customer interface, FastAPI backend, external AI provider, and PostgreSQL database, supported by automated testing, CI workflows, code review, coverage measurement, performance benchmarking, and documented project evidence.

The project is a functional software-engineering demonstration rather than a production customer-support service. Production use would require stronger authentication and authorization, production deployment infrastructure, monitoring, rate limiting, security hardening, and additional scalability and reliability validation.
