# Customer Web Interface

React + TypeScript frontend for the Customer Service Platform. It preserves the
team's FastAPI integration and clearly separates live messages from browser-only
demo features.

## Run locally

Follow the root README to start PostgreSQL, seed `cust_001` / `conv_001`, configure
the AI provider, and start FastAPI. Then run from this directory:

```bash
npm ci
npm run dev
```

The Vite development server proxies `/api` to `http://localhost:8000`.
For a deployed build, configure `VITE_API_BASE_URL` at build time or provide a
same-origin `/api` reverse proxy; the development proxy is not part of `dist`.
When using a separate API host, the backend must also allow the actual frontend
origin. Its current CORS configuration only supports the local Vite origins.

## Customer guide

1. Sign in with customer ID `cust_001`. This selects a demo profile; it is not
   password-based authentication.
2. Choose **Open live AI chat**. Send a message containing 1–2,000 characters.
   The frontend calls `POST /api/v1/conversations/conv_001/messages`.
3. While waiting, sending is disabled and feedback is unavailable. Wait for the
   reply before sending the next message. You can move to Conversations and
   return while the reply is pending.
4. A successful reply is added to the visible history with the API response
   source. Failed requests keep the draft and show a **Retry send** button.
   The 20-second timeout covers both the request and response body. A timeout
   may occur after the server accepted the message; manual retries are not an
   exactly-once guarantee.
5. Unsent drafts are saved separately for each profile and conversation in the
   current tab, so navigating away or refreshing can restore them. They are
   cleared after a successful response, even if you leave and return while
   waiting. Failed drafts and retry errors survive in-app navigation. A late
   response does not clear a newer draft or another conversation's draft.
   When storage is unavailable, drafts remain in memory for this tab; the warning
   explains that reloading may lose changes or restore an older saved draft.
6. If the reply recommends human review, the UI explains that this demo does
   not connect an agent or confirm a ticket. The customer can continue chatting.
   The displayed confidence is a demo score, not a measured accuracy probability.
7. **Leave feedback** requires an explicit Yes or No outcome. Feedback is local
   only and does not close the live conversation. Storage failures display a
   warning rather than claiming the data was saved.
8. On **Conversations**, search previews, IDs, and sample queues, filter by status,
   sort by update time, or clear the filters. Sample conversations have read-only
   messages and labelled demonstration ticket details.

Signing in from a protected conversation returns to that conversation. The
sign-in dialog supports Escape, restores focus on close, and keeps keyboard
focus inside the dialog. Newly created profiles are local only and have no live
server conversation; the empty state offers an explicit demo sign-in instead of
a start button that will fail.

## Data boundaries

The backend currently exposes a message-send API, not account registration,
conversation listing, history retrieval, feedback, or ticket creation APIs.
The frontend stores visible history and sample data in localStorage. Clearing
browser storage does not delete backend messages; those messages are not
reloaded into this UI. Legacy locally generated ticket IDs are not shown as
confirmed handoffs for the live conversation. Existing stored data is preserved.

Do not enter real credentials, private support records, or sensitive personal
data. Browser profile selection is not a security boundary.

## Validation

```bash
npm run lint
npm run test:coverage
npm run build
npm run check:bundle-size
```

Local verification on October 1, 2026:

- 53 tests passed across seven files, including 24 App-level workflow tests.
- 92.41% lines, 91.42% statements, 83.91% branches, 97.29% functions.
- JavaScript gzip: 84,613 bytes (82.63 KiB), below the 100 KiB budget.
- CSS gzip: 3,195 bytes (3.12 KiB), below the 25 KiB budget.
- TypeScript build and lint passed.

The App tests render the real pages, router, and providers and mock only network
responses. They cover retries, request locking, drafts, deep-link sign-in,
feedback, profile creation, storage failures, filtering, and honest escalation
display. Draft regressions include navigation before/after success or failure,
newer revisions, customer/conversation isolation, and unavailable browser storage.

A separate real-browser regression verified four delayed-response cases:
returning before and after success, and before and after failure followed by a
manual retry. Each successful send added one customer message and cleared the
matching draft. These browser checks used controlled API responses, not a live
AI provider. They are not a full accessibility audit or a production deployment test.

Coverage is scoped by `vitest.config.ts` to the API client, composer, filters,
authentication state and dialog, support state, chat, feedback, conversation
list, and support helpers. It is not whole-application coverage. Minimum gates
remain 85% lines/statements, 80% functions, and 75% branches.

GitHub Actions runs lint, coverage, build, and bundle budgets on relevant pull
requests into `main`. It uploads `coverage`, `reports/frontend-quality.json`,
and `dist` as workflow artifacts. These are CI/build artifacts, not proof of
production deployment.
