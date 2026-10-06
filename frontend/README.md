# Customer Web Interface

React + TypeScript frontend for the Customer Service Platform.

The frontend provides the customer-facing interface for the final course-project release and communicates with the FastAPI backend through the defined REST API. It supports live AI-assisted messaging, persistent escalation state, persistent feedback submission, conversation management, draft recovery, retry handling, and final-release validation.

---

## Run Locally

Follow the root `README.md` to:

1. Start PostgreSQL.
2. Configure `DATABASE_URL`.
3. Seed the demo data.
4. Configure the external AI provider.
5. Start the FastAPI backend.

Then, from the `frontend` directory, run:

```bash
npm ci
npm run dev
```

The Vite development server is normally available at:

```text
http://localhost:5173
```

During local development, API requests can use the configured development routing to the FastAPI backend.

For a separately hosted frontend, configure:

```text
VITE_API_BASE_URL=<backend-base-url>
```

The backend must also allow the deployed frontend origin through:

```text
CORS_ALLOWED_ORIGINS=<frontend-origin>
```

The development proxy is not part of the production `dist` output.

---

## Demo Account

The primary final-project demonstration uses:

```text
Customer ID: cust_001
Conversation ID: conv_001
```

The current sign-in flow is a course-project prototype and is not password-based production authentication.

The customer identifier is stored in browser `localStorage`.

---

## Customer Guide

1. Sign in using customer ID `cust_001`.

2. Open the live support conversation associated with `conv_001`.

3. Enter a customer-support message containing between 1 and 2,000 characters.

4. Submit the message.

   The frontend sends:

   ```text
   POST /api/v1/conversations/conv_001/messages
   ```

5. While the request is processing:

   - additional message submission is disabled;
   - the active draft is tracked;
   - the conversation can remain usable for navigation;
   - the frontend waits for the FastAPI response.

6. A successful response is added to the visible history with information returned by the backend, including:

   - response text
   - source
   - confidence
   - escalation state

7. If the request fails:

   - the user's draft remains available when possible;
   - the message can be retried;
   - retry state remains associated with the conversation;
   - the local conversation timestamp is not incorrectly updated.

8. The frontend uses a **35-second request timeout**.

9. If the same pending customer message is retried, the frontend preserves its existing `requestId`.

10. If the backend has already completed that request, the previously stored AI response can be returned rather than creating another message pair.

11. If the customer message exists but the AI response is still incomplete, the backend can return:

   ```text
   409 Conflict
   ```

   The frontend can then tell the user that the request is still being processed.

12. If human review is required, the interface displays the appropriate escalation state.

13. The final integrated backend can persist an escalation ticket and update the conversation to `ESCALATED`.

14. The application does not currently connect the customer directly to a live human representative.

15. Final resolution feedback can be submitted through the backend feedback API.

16. The frontend displays a success state when feedback is recorded and handles duplicate feedback appropriately.

17. On the Conversations page, the user can:

   - search conversations
   - filter by status
   - sort conversations
   - view result counts
   - review sample conversation details

---

## Message Drafts and Recovery

Unsent drafts are preserved separately by conversation.

The frontend supports:

- retaining drafts after failed sends
- restoring drafts after navigation
- keeping drafts separated between conversations
- preventing an older delayed response from clearing a newer draft
- preserving retry state during in-app navigation
- preventing overlapping sends

A successful response clears only the draft revision associated with the completed request.

When browser storage is unavailable, the application can continue using in-memory state for the current session, but reloading may lose unsaved state.

---

## Request ID and Duplicate Protection

Each new pending customer message is assigned a `requestId`.

The same request ID is preserved when retrying the same pending message.

The backend uses the request ID to reduce duplicate processing.

If both the customer message and AI response already exist for the request, the existing AI response is returned.

If only the customer message exists and processing is incomplete, the backend returns:

```text
409 Conflict
```

This behavior reduces the chance of duplicate customer and AI messages during retries or uncertain request outcomes.

---

## AI Response Behavior

The backend returns AI-assisted responses that may include:

- response text
- response source
- confidence information
- escalation state

The displayed confidence is a demonstration value and should not be interpreted as a calibrated probability that the answer is correct.

If the external AI provider fails, the backend can return fallback content and indicate that escalation is required.

---

## Human Escalation

The application supports persistent escalation when human review is needed.

Supported reasons include:

- `LOW_CONFIDENCE`
- `COMPLEX_ISSUE`
- `CUSTOMER_REQUEST`
- `AI_FAILURE`

The backend can:

- create a persistent escalation ticket
- reuse an existing active escalation where appropriate
- assign the `General Support` queue
- set a new ticket to `OPEN`
- update the conversation to `ESCALATED`

The frontend reflects the resulting human-review state.

The course-project implementation does not include a live human-agent dashboard or direct customer-to-agent connection.

---

## Feedback

The final frontend integrates with the persistent backend feedback API.

Feedback includes:

- resolution type
- successful or unsuccessful outcome
- feedback category

Supported resolution types include:

- `AI_RESOLVED`
- `HUMAN_RESOLVED`

Only one final feedback record is stored per conversation.

If feedback has already been submitted, the backend can return:

```text
409 Conflict
```

The frontend handles success, duplicate-feedback, and failure states without falsely claiming that feedback was saved when it was not.

---

## Conversation Management

The Conversations page includes:

- search
- status filtering
- sorting
- result counts
- sample conversation details

Draft and retry state remain associated with the correct conversation as the user navigates between pages.

Some sample conversation content remains demonstration data and should not be interpreted as live backend state unless it is part of the primary live conversation flow.

---

## Data Boundaries

The final frontend communicates with the FastAPI backend through REST APIs.

The backend supports:

```text
POST /api/v1/conversations/{conversationId}/messages
POST /api/v1/escalations
POST /api/v1/conversations/{conversationId}/feedback
GET  /api/v1/health
```

The frontend does not directly access PostgreSQL or the external AI provider.

The prototype sign-in/profile behavior uses browser storage and is not a production security boundary.

The application should not be used with real credentials, private customer-support records, or sensitive personal data.

---

## Error Handling

The frontend includes user-facing handling for common API conditions such as:

- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `409 Conflict`
- `429 Too Many Requests`
- `503 Service Unavailable`

The current backend does not implement production authentication or rate limiting, but the frontend includes handling for those infrastructure-level response conditions.

Unexpected failures use a general fallback message.

Failed sends preserve the user's draft when possible.

---

## Validation

Run:

```bash
npm run lint
npm run test:coverage
npm run build
npm run check:bundle-size
```

Final recorded frontend evidence includes:

- **61 tests passing**
- **7 test files**
- **90.28% statement coverage**
- **82.60% branch coverage**
- **97.41% function coverage**
- **91.08% line coverage**
- lint validation
- production build validation
- bundle-size validation

The configured minimum coverage thresholds are:

- Statements: 85%
- Lines: 85%
- Functions: 80%
- Branches: 75%

Coverage is scoped by `vitest.config.ts` to frontend areas including:

- API client behavior
- authentication state and dialog
- support state
- chat behavior
- feedback
- conversation filtering
- conversation pages
- support helpers

These figures represent the configured frontend coverage scope and should not be interpreted as whole-system coverage.

---

## CI

GitHub Actions validates frontend changes on relevant pull requests and branches.

The frontend workflow includes:

- repository checkout
- Node.js setup
- dependency installation
- Oxlint
- automated tests
- coverage threshold enforcement
- TypeScript/Vite production build
- production bundle-size validation
- frontend quality-evidence artifact upload
- production-build artifact upload

These artifacts provide CI and build evidence.

They are not proof of a hosted production deployment.

---

## Deployment Status

The frontend is not currently deployed to a hosted production environment.

The project is prepared for separate frontend and backend hosting through:

```text
VITE_API_BASE_URL
CORS_ALLOWED_ORIGINS
```

A hosted deployment would require:

- a frontend hosting environment
- a hosted FastAPI backend
- a hosted PostgreSQL database
- production environment variables
- secure secrets management
- production CORS configuration
- deployment verification

If the project is deployed later, this section should be updated with the actual hosted environment and deployment evidence.

---

## Additional Documentation

See:

- `../README.md` for complete project setup
- `../docs/API.md` for API behavior
- `../docs/ARCHITECTURE.md` for system architecture
- `../docs/USER_GUIDE.md` for the complete user guide
- `../docs/SECURITY_RISKS_AND_ROADMAP.md` for risks and future improvements
- `../docs/evidence/README.md` for final project evidence
