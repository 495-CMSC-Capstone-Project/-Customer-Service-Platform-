# Customer Service Platform

## Project Overview

The Customer Service Platform is an AI-enabled customer support application designed to help customers receive automated assistance and escalate issues to a human agent when necessary.

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
- ESLint

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

- Python 3
- Node.js and npm
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

## Frontend Setup

Move into the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

If PowerShell blocks `npm.ps1`, use:

```powershell
npm.cmd install
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

Run ESLint:

```bash
npm run lint
```

Run frontend unit tests:

```bash
npm test
```

Build the frontend:

```bash
npm run build
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

Successful API responses are checked before they are added to the conversation,
and requests time out after 20 seconds instead of leaving the interface in a
permanent loading state.

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

### Frontend Validation

From the `frontend` directory, run:

```bash
npm run lint
npm test
npm run build
```

## CI/CD

GitHub Actions is used to automatically validate project changes.

The current CI process includes:

- Backend automated tests
- Frontend ESLint checks
- Frontend API unit tests
- Frontend TypeScript/Vite build validation

Pull requests should have successful CI checks before they are merged into `main`.

Feature branches are reviewed through pull requests before their completed work is incorporated into the main branch.

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

This repository represents the **Alpha release** of the Customer Service Platform.

The Alpha demonstrates end-to-end integration between the React customer interface, FastAPI backend, external AI provider, and PostgreSQL database. Customer messages can be submitted through the frontend, processed through the backend and AI provider, returned to the user, and persisted in the database.

Additional functionality and refinement may be added during later development stages.
