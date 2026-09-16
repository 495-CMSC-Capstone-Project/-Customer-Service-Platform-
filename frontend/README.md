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
npm run build
```

The API client validates successful response data and stops requests that take
longer than 20 seconds, so the chat does not remain stuck in a sending state.
