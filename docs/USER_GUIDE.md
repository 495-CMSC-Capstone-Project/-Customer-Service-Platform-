# Customer Service Platform User Guide

This guide explains how to use the Customer Service Platform in its final course-project release.

The application provides an AI-assisted customer-support experience with conversation messaging, persistent feedback collection, escalation handling, conversation management, retry behavior, and backend health monitoring.

---

## 1. Starting the Application

The application uses:

- React and TypeScript for the frontend
- FastAPI for the backend
- PostgreSQL for persistent backend data
- an external AI provider for AI-generated support responses

During local development, the frontend and backend run separately.

The frontend is typically available at:

```text
http://localhost:5173
```

The backend is typically available at:

```text
http://localhost:8000
```

The backend API uses the following prefix:

```text
/api/v1
```

Before using the live application, PostgreSQL, the backend, the frontend, and the required AI-provider environment variables must be configured.

---

## 2. Signing In

The frontend includes a prototype sign-in workflow used to access the customer-support interface.

For the primary final-project demonstration, the application uses:

```text
Customer ID: cust_001
Conversation ID: conv_001
```

After signing in, the application redirects the user to the requested protected page.

The current authentication flow is intended for the course-project demonstration and is not a production identity-management implementation.

The prototype customer identifier is stored in browser `localStorage`.

---

## 3. Opening the Chat Interface

After signing in, the user can access the customer-support chat interface.

The chat experience can display:

- the current conversation
- customer messages
- AI-generated responses
- message status information
- escalation state
- feedback controls
- retry information
- draft message content

The frontend communicates with the FastAPI backend through the defined REST API.

It does not directly access PostgreSQL or the external AI provider.

---

## 4. Sending a Message

To send a message:

1. Open the desired conversation.
2. Enter a support question or request in the message field.
3. Select the send action.
4. Wait for the backend to process the request.
5. Review the AI-generated response.

Customer messages must contain between 1 and 2,000 characters.

Whitespace-only messages are rejected.

The frontend disables message submission while a request is already being processed to reduce accidental duplicate sends.

---

## 5. Request ID and Duplicate Protection

Each customer-message request includes a `requestId`.

The frontend generates a request ID for a new pending customer message and preserves that same ID when retrying the same message.

The backend uses the `requestId` to reduce duplicate processing.

If the backend has already stored both the customer message and its AI response for the same request ID, it returns the previously stored AI response rather than creating another message pair.

If the customer message has already been stored but the corresponding AI response is not yet available, the backend returns:

```text
409 Conflict
```

The frontend can then inform the user that the request is still being processed.

---

## 6. Message Recovery and Retry Behavior

The final-release frontend includes recovery behavior intended to prevent users from losing typed messages when a request fails.

If a message send fails:

- the unsent draft remains available
- the draft can be retried
- the local conversation timestamp is not incorrectly updated
- the draft can survive in-app navigation and return to the conversation
- retry-related error state can remain associated with the conversation

The frontend also prevents an older delayed response from overwriting a newer draft entered by the user.

The frontend uses a 35-second request timeout.

These behaviors are covered by automated frontend tests.

---

## 7. AI Responses

The AI assistant returns a response for each successfully processed customer message.

A response can include:

- AI-generated response text
- a response source
- confidence information
- whether human review is required

The confidence value is a demonstration score and should not be interpreted as a calibrated probability that the AI response is correct.

If the external AI provider fails, the backend can return fallback content with:

```text
confidence: 0.0
escalated: true
```

The conversation can then be marked for human review.

---

## 8. Human Escalation

The system supports persistent escalation when an issue requires human review.

Examples include:

- the customer explicitly requesting human assistance
- low AI confidence
- an AI-provider failure
- another complex support issue

Supported escalation reasons include:

- `LOW_CONFIDENCE`
- `COMPLEX_ISSUE`
- `CUSTOMER_REQUEST`
- `AI_FAILURE`

When escalation is created, the backend:

1. verifies the conversation and customer relationship;
2. checks whether an active escalation already exists;
3. creates a persistent support ticket when needed;
4. sets the ticket status to `OPEN`;
5. assigns the default `General Support` queue;
6. updates the conversation status to `ESCALATED`.

The application does not currently connect the customer directly to a live human representative.

The frontend therefore displays the appropriate human-review state without claiming that a real support agent has already joined the conversation.

---

## 9. Providing Feedback

The application supports persistent final feedback for the live support conversation.

Feedback includes:

- resolution type
- whether the interaction was successful
- a feedback category

Supported resolution types include:

- `AI_RESOLVED`
- `HUMAN_RESOLVED`

Only one final feedback record is stored for each conversation.

If final feedback has already been recorded, another submission returns:

```text
409 Conflict
```

The frontend displays success after a completed feedback submission and handles duplicate-feedback responses appropriately.

---

## 10. Conversation Navigation

The frontend allows users to move between conversations while keeping relevant conversation state separated.

The final-release frontend supports:

- retaining drafts during navigation
- restoring pending drafts when returning to a conversation
- keeping drafts associated with the correct conversation
- avoiding accidental draft loss
- preventing one conversation's state from leaking into another

These behaviors are covered by automated frontend tests.

---

## 11. Conversation Search, Filtering, and Sorting

The frontend includes conversation-management controls to help users locate conversations.

Available behavior includes:

- searching conversations
- filtering by status
- sorting conversation results
- displaying result counts
- displaying sample conversation details

These controls make the conversation list easier to manage as the number of conversations grows.

---

## 12. Escalation and Feedback Status

The interface distinguishes between:

- backend-confirmed actions
- AI recommendations
- prototype or demonstration behavior

When the backend confirms escalation, the conversation can display the appropriate escalated or human-review state.

The application still does not directly connect the customer with a live human representative.

This distinction prevents the interface from presenting a recommendation as a completed human-support interaction.

---

## 13. Error Handling

The application provides user-facing handling for common API conditions.

Possible responses include:

- `400 Bad Request` for invalid request data
- `401 Unauthorized` when infrastructure requires authorization
- `403 Forbidden` when the customer does not own the conversation
- `404 Not Found` when a conversation does not exist
- `409 Conflict` for an in-progress duplicate message request, duplicate escalation, or duplicate feedback
- `429 Too Many Requests` when infrastructure applies rate limiting
- `503 Service Unavailable` when a required service is unavailable

The current backend does not implement production authentication or rate limiting, but the frontend includes handling for those infrastructure-level response conditions.

When a send operation fails, the frontend preserves the user's draft when possible so the message can be retried.

Unexpected failures are shown through a general fallback message.

---

## 14. Backend Health Monitoring

The backend includes the following health endpoint:

```text
GET /api/v1/health
```

The health check reports:

- API availability
- application database availability
- AI-provider configuration status
- overall backend health

Possible overall health states include:

- `HEALTHY`
- `DEGRADED`
- `UNAVAILABLE`

The AI-provider health value indicates whether the required AI environment variables are configured.

The health endpoint does not send a live request to the external AI provider.

---

## 15. Current Quality Evidence

The final application includes automated frontend and backend quality checks.

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

The configured frontend coverage thresholds are:

- Statements: 85%
- Lines: 85%
- Functions: 80%
- Branches: 75%

The final recorded backend evidence includes:

- **66 backend tests passing**
- **90.93% total backend code coverage**
- **80% minimum backend coverage threshold enforced by CI**
- PostgreSQL integration testing
- Python syntax validation
- coverage reporting through GitHub Actions

Final CI, testing, coverage, benchmark, code-review, contribution, AI-flow, escalation, and feedback evidence is available in:

```text
docs/evidence/
```

---

## 16. Performance Measurement

The project includes a controlled local API benchmark.

The final recorded benchmark on October 5, 2026 produced:

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

It does not measure:

- browser rendering
- network latency
- PostgreSQL latency
- live external AI-provider latency
- concurrent production traffic

The results are therefore a local handler baseline rather than a production performance measurement.

---

## 17. Deployment Status

The application is not currently deployed to a hosted production environment.

The project currently demonstrates:

- local frontend and backend operation
- PostgreSQL integration
- external AI-provider integration
- automated CI
- frontend and backend testing
- code coverage
- production frontend build validation
- performance benchmarking

The architecture supports future separate frontend and backend hosting through configurable environment variables such as:

```text
VITE_API_BASE_URL
CORS_ALLOWED_ORIGINS
DATABASE_URL
AI_API_URL
AI_API_KEY
AI_MODEL
```

A hosted production deployment would still require deployment verification, secure secrets management, production authentication and authorization, monitoring, rate limiting, and additional scalability and reliability validation.

If the application is deployed later, this section should be updated with the live environment and deployment evidence.

---

## 18. Current Limitations

The final course-project release is a functional software-engineering demonstration rather than a production customer-support service.

Current limitations include:

- prototype authentication
- no hosted production deployment
- no live human-agent dashboard
- no direct live-agent connection
- no production authentication or authorization
- no production rate limiting
- no production monitoring or observability
- no fully integrated production knowledge-base service
- no large-scale concurrency validation

These limitations should be considered when demonstrating or describing the system.

---

## 19. Recommended Demo Workflow

For the final project demonstration:

1. Start PostgreSQL.
2. Start the FastAPI backend.
3. Start the React frontend.
4. Sign in using the demo customer identifier.
5. Open the primary live conversation.
6. Send a normal customer-support message.
7. Show the AI-generated response.
8. Demonstrate draft recovery or retry behavior if desired.
9. Show a conversation that requires human review.
10. Show the escalation state or persisted ticket evidence.
11. Submit final conversation feedback.
12. Demonstrate conversation search, filtering, or sorting.
13. Show the backend health endpoint if relevant.
14. Show automated test, coverage, CI, and performance evidence.

The primary demonstration uses:

```text
Customer ID: cust_001
Conversation ID: conv_001
```

---

## 20. Additional Documentation

Additional project documentation is available in:

- `docs/API.md` for backend API details
- `docs/ARCHITECTURE.md` for system structure and component interactions
- `docs/SECURITY_RISKS_AND_ROADMAP.md` for security limitations and future improvements
- `docs/evidence/README.md` for final testing, CI, benchmark, review, and application-flow evidence
- `README.md` for setup, development instructions, and repository information
