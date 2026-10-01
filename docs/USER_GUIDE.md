# Customer Service Platform User Guide

This guide explains how to use the Customer Service Platform frontend during the final-release development stage.

The application provides an AI-assisted customer support experience with conversation messaging, feedback collection, escalation recommendations, and conversation management.

> **Final Release Note:** Some features are still being integrated across the frontend and backend. This guide distinguishes between functionality that is already available in the interface and functionality that is pending final backend integration.

---

## 1. Starting the Application

The application uses:

- React for the frontend
- FastAPI for the backend
- PostgreSQL for persistent backend data
- an external AI provider for AI-generated support responses

During local development, the frontend and backend run separately.

The frontend is typically available at:

`http://localhost:5173`

The backend API uses the `/api/v1` path prefix.

---

## 2. Signing In

The frontend includes a sign-in workflow used to access the customer support interface.

After signing in, the application redirects the user to the requested protected page.

The current authentication flow is part of the application prototype and is not intended to represent a production identity-management system.

---

## 3. Opening the Chat Interface

After signing in, the user can access the customer support chat interface.

The chat page displays:

- the current conversation
- customer messages
- AI responses
- message status information
- escalation recommendations when applicable
- feedback controls

The interface is designed to keep the current conversation visible while the user interacts with the AI assistant.

---

## 4. Sending a Message

To send a message:

1. Enter a support question or request in the message field.
2. Select the send action.
3. Wait for the AI response.
4. Review the AI-generated reply.

The frontend prevents overlapping sends while a request is already being processed.

The backend accepts customer messages between 1 and 2000 characters.

---

## 5. Message Recovery and Retry Behavior

The final-release frontend includes message recovery behavior intended to prevent users from losing typed messages when a request fails.

If a message send fails:

- the unsent draft remains available
- the conversation history is not incorrectly updated
- the user can retry the request
- the draft can survive navigation and return to the conversation

A successful response clears only the draft revision that was actually submitted.

The frontend also prevents an older delayed response from overwriting a newer draft entered by the user.

> **Integration Note:** Frontend and backend timeout/retry coordination is still being finalized as part of the remaining final-release integration work.

---

## 6. AI Responses

The AI assistant returns a response for each successfully processed customer message.

The interface may display information such as:

- AI-generated response text
- confidence information
- whether human review is recommended

The frontend labels demo or browser-only information clearly so that users are not led to believe that unsupported production functionality has occurred.

---

## 7. Human Escalation

The system supports escalation when an issue should be reviewed by human support.

Examples include:

- the customer explicitly requesting human assistance
- low AI confidence
- an AI provider failure

The final-release backend can create a persistent support ticket and update the conversation status to `ESCALATED`.

The ticket can include:

- a ticket identifier
- escalation reason
- issue summary
- ticket status
- assigned support queue

> **Current Integration Status:** The backend escalation functionality is implemented in PR #14 and is pending merge and final frontend integration.

Until that integration is complete, the frontend may display that human review is recommended without claiming that a real support agent has already received the request.

---

## 8. Providing Feedback

The interface includes feedback functionality for recording whether the support interaction successfully resolved the issue.

Feedback may include:

- resolution type
- whether the interaction was successful
- a feedback category

Examples of resolution types include:

- `AI_RESOLVED`
- `HUMAN_RESOLVED`

The final-release backend supports persistent feedback storage.

> **Current Integration Status:** Persistent backend feedback is implemented in PR #14 and is pending merge and final frontend integration.

Until the integration is complete, some feedback behavior may remain browser-based or demo-only.

---

## 9. Conversation Navigation

The frontend allows users to move between conversations while preserving relevant conversation state.

The final-release frontend includes improvements for:

- retaining drafts during navigation
- restoring pending drafts when returning to a conversation
- avoiding accidental draft loss
- preventing draft state from leaking into another conversation

These behaviors are covered by automated frontend tests.

---

## 10. Conversation Search and Filtering

The final-release frontend includes conversation-management controls that help users locate conversations more easily.

Available behavior includes:

- searching conversations
- filtering conversations
- sorting conversation results
- displaying result counts and conversation totals

These controls are intended to make the conversation list easier to manage as the number of conversations grows.

---

## 11. Feedback and Escalation Status

The user interface distinguishes between:

- actions that are completed by the backend
- recommendations generated by the AI
- browser-only or demo behavior

For example, the interface uses wording such as:

`Human review recommended`

when escalation is recommended but a confirmed support-agent connection has not yet occurred.

This avoids representing a recommendation as a completed support action.

---

## 12. Error Handling

The application provides user-facing error handling for common API failures.

Possible backend responses include:

- `400 Bad Request` for invalid request data
- `403 Forbidden` when the customer does not own the conversation
- `404 Not Found` when a conversation does not exist
- `409 Conflict` for duplicate escalation or feedback operations
- `429 Too Many Requests` when a service rate limit is reached
- `503 Service Unavailable` when a required service is unavailable

When a send operation fails, the frontend preserves the user's draft when possible so the message can be retried.

---

## 13. Backend Health Monitoring

The final-release backend includes a health endpoint:

`GET /api/v1/health`

The health check reports:

- API availability
- application database availability
- AI provider configuration status
- overall backend health

Possible overall health states include:

- `HEALTHY`
- `DEGRADED`
- `UNAVAILABLE`

> **Current Integration Status:** The health endpoint is implemented in PR #14 and is pending merge into `main`.

---

## 14. Current Quality Evidence

The application includes automated frontend and backend quality checks.

Current frontend CI results include:

- 53 frontend tests passing
- 7 of 7 frontend test files passing
- 92.41% line coverage
- 91.42% statement coverage
- 83.91% branch coverage
- 97.29% function coverage
- lint checks passing
- production build passing
- frontend bundle-size checks passing

Current backend PR #14 CI results include:

- 58 backend tests passing
- 90.37% total backend code coverage
- 80% minimum backend coverage threshold enforced in CI
- PostgreSQL integration testing
- generated coverage artifact

These metrics provide evidence that the final-release application is being tested across both frontend and backend components.

---

## 15. Known Final-Release Limitations

The following items are still being completed before the project is considered fully integrated:

- connect frontend feedback to the persistent backend feedback API
- connect frontend escalation behavior to persistent backend escalation tickets
- coordinate frontend and backend timeout/retry behavior
- configure production API routing
- configure the production CORS allowlist
- complete deployment
- complete performance benchmarking
- finalize production documentation

These limitations are documented so that the current application is not represented as more complete than it actually is.

---

## 16. Recommended Demo Workflow

For the final project demonstration, the following workflow can be used once final integration is complete:

1. Sign in to the application.
2. Open a conversation.
3. Send a normal customer support message.
4. Display the AI-generated response.
5. Demonstrate message recovery or retry behavior.
6. Demonstrate a conversation that requires human escalation.
7. Show the escalation status or ticket information.
8. Submit conversation feedback.
9. Demonstrate conversation search or filtering.
10. Show the automated test and quality metrics used to validate the application.

---

## 17. Additional Documentation

Additional project documentation is available in:

- `docs/API.md` for backend API details
- `README.md` for project setup and repository information
- final architecture documentation for system structure and component interactions

The README and architecture documentation will be finalized after the remaining final-release pull requests and integration work are completed.
