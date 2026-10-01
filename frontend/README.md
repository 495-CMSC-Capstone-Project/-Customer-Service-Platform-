# Customer Web Interface

React + TypeScript frontend for the Customer Service Platform.

```bash
npm ci
npm run dev
```

The Vite development server proxies `/api` requests to the FastAPI backend at
`http://localhost:8000`.

Run the frontend quality checks with:

```bash
npm run lint
npm test
npm run test:coverage
npm run build
npm run check:bundle-size
```

The API client validates successful response data and stops requests that take
longer than 20 seconds, so the chat does not remain stuck in a sending state.

The conversations dashboard gives customers a status overview and lets them
search message previews, ticket IDs, and assigned queues. Results can be
filtered by conversation status, sorted by update time, and cleared without
leaving the page. The layout includes responsive mobile states and keyboard
focus treatment for interactive controls.

## Frontend Quality Evidence

The frontend test suite currently contains 25 tests across the API client,
message composer, authentication-modal state, conversation dashboard controls,
conversation filtering, and prototype support helpers.
The coverage command enforces minimum thresholds for the modules included in
the report and creates an HTML report plus `coverage-summary.json`.

The current verified frontend coverage baseline is:

- 94.16% line coverage
- 94.24% statement coverage
- 88.05% branch coverage
- 100% function coverage

Coverage is intentionally reported for selected frontend modules, including the
API client, message composer, authentication-modal state, conversation filters,
dashboard controls, and support-classification helpers. It should not be
presented as a whole-application coverage percentage.

After `npm run build`, the bundle check records the production JavaScript and
CSS gzip sizes in `reports/frontend-quality.json`. The current JavaScript bundle
is approximately 81.59 kB gzip against a 100 kB budget, and the CSS bundle is
approximately 3.90 kB gzip against a 25 kB budget.

GitHub Actions runs linting, coverage tests, the production build, and the
bundle budget for every frontend pull request to `main`. It uploads both the
coverage/quality evidence and the production `dist` directory as downloadable
workflow artifacts.
