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

## Frontend Quality Evidence

The frontend test suite currently contains 17 tests across the API client,
message composer, authentication-modal state, and prototype support helpers.
The coverage command enforces minimum thresholds for the modules included in
the report and creates an HTML report plus `coverage-summary.json`.

The current verified frontend coverage baseline is:

- 92.98% line coverage
- 93.1% statement coverage
- 87.39% branch coverage
- 100% function coverage

Coverage is intentionally reported for the frontend API client, message
composer, authentication-modal state, and support-classification helpers. It
should not be presented as a whole-application coverage percentage.

After `npm run build`, the bundle check records the production JavaScript and
CSS gzip sizes in `reports/frontend-quality.json`. The current JavaScript bundle
is approximately 80.34 kB gzip against a 100 kB budget, and the CSS bundle is
approximately 2.68 kB gzip against a 25 kB budget.

GitHub Actions runs linting, coverage tests, the production build, and the
bundle budget for every frontend pull request to `main`. It uploads both the
coverage/quality evidence and the production `dist` directory as downloadable
workflow artifacts.
