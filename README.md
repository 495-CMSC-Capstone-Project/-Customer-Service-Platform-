# Customer Service Platform

## Project Overview

The Customer Service Platform gives customers an AI-assisted first response to
support questions and indicates when an issue may need a person. The current
demo displays that recommendation; it does not connect to a human agent.

The Alpha release integrates a React and TypeScript customer interface with a FastAPI backend. The backend manages conversations and messages, communicates with an external AI provider, and uses PostgreSQL for application data.

The system is designed around a modular architecture so that the frontend, backend services, database, and AI provider can be developed and tested independently while communicating through defined interfaces.

## Alpha Features

The current Alpha implementation includes:

- Customer support message entry through a React web interface
- Frontend-to-backend communication through a REST API
- Message validation
- Conversation ownership validation
- AI response generation through an external AI provider
- AI confidence information
- Escalation indication for requests requiring human assistance
- Conversation search, status filters, sorting, and clearly labelled sample ticket details
- Draft recovery, retry controls, and local feedback that does not close a live conversation
- Customer and AI message persistence
- PostgreSQL database integration
- Error handling for invalid requests and unavailable services
- Automated backend tests
- Automated frontend API tests, linting, and build validation
- GitHub Actions CI workflows

## Technology Stack

### Frontend

- React 19
- TypeScript
- Vite
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
- GitHub Actions
- Frontend API tests, lint, and build checks
- Backend automated tests

## Repository Structure

```text
Customer-Service-Platform/
├── .github/
│   └── workflows/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── ai_provider.py
│   │   ├── ai_service.py
│   │   ├── api.py
│   │   ├── conversation_service.py
│   │   ├── database.py
│   │   ├── models.py
│   │   └── seed.py
│   │
│   ├── tests/
│   ├── __init__.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   │
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── .gitignore
└── README.md
```

## Prerequisites

Before running the application locally, install:

- Python 3.12, as used by backend CI
- Node.js 22 and npm, as used by frontend CI
- PostgreSQL
- Git

A compatible external AI provider is also required for live AI responses.

## Backend Setup

From the repository root, create a Python virtual environment:

```powershell
py -m venv .venv
```

On Windows PowerShell, you can activate it with:

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks script activation, you can use the virtual environment's Python executable directly instead.

Install the backend dependencies:

```powershell
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

The backend currently uses the following Python packages:

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

The Alpha uses a demo conversation for integration testing.

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

For Alpha integration testing, Groq was used successfully with:

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

The Alpha customer-message endpoint is:

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

### API Contract

FastAPI serves interactive API documentation at `http://localhost:8000/docs`
and the generated schema at `http://localhost:8000/openapi.json`.

| Field | Type | Rule |
| --- | --- | --- |
| `conversationId` in the path | string | Required; must identify a stored conversation. |
| `customerId` in the request | string | Required and nonempty; must match that conversation's customer. This is a demo identifier, not authenticated identity. |
| `message` in the request | string | 1–2,000 characters; the AI service rejects whitespace-only messages. |
| `conversationId` in the response | string | Must match the requested conversation. |
| `messageId` in the response | string | ID of the saved assistant message. |
| `response` | string | Assistant text, including a fallback if the provider is unavailable. |
| `source` | string | Currently `AI` from this endpoint; the frontend also accepts `HUMAN`. |
| `confidence` | number | 0–1; a preset demo score, not measured answer accuracy. |
| `escalated` | boolean | Indicates recommended human review; does not confirm a ticket or assignment. |

The endpoint returns `400` for request validation, `403` for a mismatched
customer ID, and `404` for a missing conversation. Provider failures currently
return `200` with fallback text, confidence `0.0`, and `escalated: true`.
The frontend also handles `401`, `429`, and `503` if infrastructure returns them;
the current backend does not implement authentication or rate limiting.

Customer and assistant messages are committed separately. A failure after the
first write may leave a customer message stored without its reply. Neither the
input remaining in the browser nor a timeout proves that the server saved
nothing. The API has no idempotency key or history-reconciliation endpoint yet.

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

The frontend sends customer messages to the FastAPI backend at:

```text
http://localhost:8000
```

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

Run frontend tests with enforced coverage thresholds and generate the HTML and
JSON coverage reports:

```bash
npm run test:coverage
```

Build the frontend:

```bash
npm run build
```

After building, verify that the production JavaScript and CSS bundles remain
within the documented gzip-size budgets:

```bash
npm run check:bundle-size
```

Preview the production build:

```bash
npm run preview
```

## Running the Full Alpha Application

To run the Alpha application end to end:

1. Start PostgreSQL.
2. Configure `DATABASE_URL`.
3. Run the database seed script.
4. Configure `AI_API_URL`, `AI_API_KEY`, and `AI_MODEL`.
5. Start the FastAPI backend.
6. Start the React frontend.
7. Open the frontend in a browser at `http://localhost:5173`.
8. Submit a customer support message.
9. Confirm that the AI response is returned and displayed.
10. Confirm that customer and AI messages are persisted in PostgreSQL.

The frontend currently uses the demo values:

```text
Conversation ID: conv_001
Customer ID: cust_001
```

## Error Handling

The frontend provides user-facing handling for several API conditions, including:

- `400` - Invalid request
- `403` - Customer does not have access to the conversation
- `404` - Conversation not found
- `429` - Too many requests
- `503` - Service temporarily unavailable

Unexpected service errors are also handled through a general fallback message.

Successful API responses are checked for required fields and the expected
conversation ID before being added to the visible history. The 20-second timeout
covers both the request and reading its response body. Failed sends keep the
draft available for manual retry and do not update the local conversation timestamp.
Drafts and retry errors survive in-app navigation. Successful responses clear only
the matching submitted draft revision, including when the chat page was unmounted.
Timeouts cannot prove whether the backend saved a message; the API does not
currently provide idempotency keys, so retries are not an exactly-once guarantee.

The interface disables message submission while a request is being processed to help prevent duplicate submissions.

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
- API validation
- Conversation ownership
- Message-length boundaries
- Successful and failed API responses

Some database unit tests use an in-memory SQLite database so that automated tests do not require a running PostgreSQL instance.

To include the PostgreSQL integration test, point `TEST_DATABASE_URL` at a
separate test database. That test creates tables and writes temporary rows,
then removes its own rows. Backend CI uses its own
PostgreSQL service and passed all 34 tests for application commit `dee9bff`.

### Frontend Validation

From the `frontend` directory, run:

```bash
npm run lint
npm run test:coverage
npm run build
npm run check:bundle-size
```

The frontend suite contains 53 tests across seven files, including 24 App-level
workflow tests using real React pages and providers with mocked network responses.
The coverage scope includes the API client, composer, authentication state and
dialog, support state, chat, feedback, conversation list, and support helpers.
The verified local baseline on October 1, 2026 is 92.41% lines, 91.42% statements,
83.91% branches, and 97.29% functions. These are scoped coverage figures, not
whole-application coverage or a live-provider end-to-end test.
The bundle check records 84,613 bytes (82.63 KiB) of JavaScript gzip size against
a 100 KiB budget and 3,195 bytes (3.12 KiB) of CSS against a 25 KiB budget.

See [the frontend guide](frontend/README.md) for customer workflows, recovery
behavior, and the boundary between live API functionality and local demo data.

### Local API Measurement

From the repository root, using the backend environment:

```powershell
.\.venv\Scripts\python.exe scripts\benchmark_api.py
```

This script exercises the FastAPI handler and real message persistence in an
isolated in-memory SQLite database. It replaces the external AI response with
a fixed test answer. It never connects to your configured application database.
After five warm-up requests, it measures 50 sequential requests at concurrency
one and checks that both messages from every request were stored.

On October 1, 2026, Windows with Python 3.12.14 produced 50/50 successful measured
requests, a 4.55 ms median, and a 5.71 ms 95th percentile. Including warm-ups,
110 message rows were stored. Repeat runs will vary with the machine and load.
These figures exclude browser rendering, HTTP network transport, PostgreSQL,
and live AI provider latency. They are a local handler baseline, not a capacity
claim or a measure of end-user waiting time.

## CI/CD

GitHub Actions is used to automatically validate project changes.

The current CI process includes:

- Backend automated tests
- Frontend Oxlint checks
- Frontend API unit tests
- Frontend component and support-helper tests
- Enforced frontend coverage thresholds
- Frontend TypeScript/Vite build validation
- Frontend production bundle size budgets
- Downloadable coverage, quality-metric, and production-build artifacts

Pull requests should have successful CI checks before they are merged into `main`.

Feature branches are reviewed through pull requests before their completed work is incorporated into the main branch.

For the evaluated application commit `dee9bff`, the successful workflow records
are [Frontend CI](https://github.com/495-CMSC-Capstone-Project/-Customer-Service-Platform-/actions/runs/36818819775)
and [Backend Database Tests](https://github.com/495-CMSC-Capstone-Project/-Customer-Service-Platform-/actions/runs/36818819768).
The frontend run includes coverage and build artifacts. Those files document a
successful build; they do not establish that the application is deployed.

### Deployment Requirements

For a separate frontend host, agree on the actual origin and configure an
explicit backend CORS allowlist. The current allowlist supports only the local
Vite origins. A same-origin `/api` reverse proxy is another option. Setting
`VITE_API_BASE_URL` alone does not make cross-origin requests work.

The frontend's request timeout is 20 seconds; the AI provider timeout is 30
seconds. The team still needs to coordinate these budgets and the behavior of
ambiguous retries. These items are tracked in
[issue 12](https://github.com/495-CMSC-Capstone-Project/-Customer-Service-Platform-/issues/12)
and [issue 13](https://github.com/495-CMSC-Capstone-Project/-Customer-Service-Platform-/issues/13).

This checkout has no deployment workflow or `/health` endpoint. Deployment
verification needs a real running environment, evidence of a successful support
request, and a documented rollback. Add deployment screenshots from that
environment when the team prepares its final portfolio.

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

## Security Notes

- Prototype Authentication: The Alpha release uses a prototype customer sign-in mechanism that stores the customer ID in browser `localStorage`. This is intended for demonstration purposes only and is not a production authentication implementation.
- API keys and database credentials should not be committed to source control.
- Sensitive configuration should be supplied through environment variables.
- Backend requests are validated before processing.
- Conversation access is checked against the requesting customer.
- The frontend communicates with the backend through the defined API rather than accessing the database or external AI provider directly.

## Project Status

The live demo uses `cust_001` / `conv_001`. New profiles, the visible conversation
list, browser history, and feedback are local demo features, not backend account
or history APIs. Sample conversations cannot send messages. An `escalated` API
result recommends human review but does not confirm a ticket or connect an agent.
The frontend does not invent a live ticket ID or queue assignment. The backend's
confidence field is a demo score, not a calibrated probability of correctness.

This repository represents the **Alpha release** of the Customer Service Platform.

The Alpha demonstrates end-to-end integration between the React customer interface, FastAPI backend, external AI provider, and PostgreSQL database. Customer messages can be submitted through the frontend, processed through the backend and AI provider, returned to the user, and persisted in the database.

Additional functionality and refinement may be added during later development stages.
