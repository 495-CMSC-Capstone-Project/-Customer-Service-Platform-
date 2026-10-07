# Evidence

Captured on October 5, 2026. Local tests and the live chat used checkout `379e00b`. The GitHub screenshots show the public Actions and pull request pages for this repository.

The text files next to the images are the raw local results: `backend-pytest.txt`, `frontend-coverage.txt`, and `benchmark.json`.

## Screenshots

| File | What it shows |
| --- | --- |
| `ci-backend-tests.png` | Backend Database Tests workflow. The latest run on `main` completed successfully after the pull request 19 merge ([run 37262159343](https://github.com/495-CMSC-Capstone-Project/-Customer-Service-Platform-/actions/runs/37262159343)). |
| `ci-frontend-tests.png` | Frontend CI workflow. The latest run on `main` completed successfully after the pull request 17 merge ([run 37219786068](https://github.com/495-CMSC-Capstone-Project/-Customer-Service-Platform-/actions/runs/37219786068)). Frontend CI runs when frontend files change, so later backend-only commits do not add a new frontend run. |
| `backend-test-coverage.png` | Local pytest coverage for `backend/app`: 66 tests passed, 90.93% total coverage, above the 80% gate. The run included the PostgreSQL integration test. |
| `frontend-test-coverage.png` | Local Vitest coverage: 61 tests passed. Statements 90.28%, branches 82.6%, functions 97.41%, lines 91.08%, all above the configured thresholds. |
| `performance-benchmark.png` | Output of `python scripts/benchmark_api.py` on this Mac with Python 3.13.5: 50 of 50 measured requests succeeded, median 5.97 ms, 95th percentile 6.71 ms, 110 stored messages including warm-ups. This is an in-process handler baseline with a fixed reply. It excludes the browser, network, PostgreSQL, and a live model. |
| `pr-code-review.png` | Merged [pull request 16](https://github.com/495-CMSC-Capstone-Project/-Customer-Service-Platform-/pull/16). sebastiannak requested changes on the feedback integration, including the case where older browser-only feedback could block a backend save. The author updated the branch, and the review was later approved. |
| `contribution-evidence.png` | Commits on `main` by TyreszB, including the customer interface, reconnecting chat to the FastAPI flow, and merges of pull requests 14, 15, and 20. |
| `ai-flow.png` | Live demo `conv_001` signed in as `cust_001`. The customer asked how to update an email address, and the assistant reply is shown with source AI and the demo confidence score. The conversation stayed Active. |
| `escalation-flow.png` | The same conversation after “I want to speak to a human representative.” The backend returned the escalation reply, and the page shows Human review recommended. |
| `feedback-flow.png` | Resolution feedback for `conv_001` after submit: recorded successfully, feedback id `fb_138646cfa15c408286009cfbdecf5dd7`, successful, category Account Access, status Escalated. The row is stored in PostgreSQL. |

## Deployment Evidence

The final course-project release was deployed on Render using a React static frontend, FastAPI web service, and PostgreSQL database.

- `deployment-backend-live.png` — Render backend successfully deployed and live.
- `deployment-health-check.png` — Public health endpoint reporting HEALTHY, API AVAILABLE, database AVAILABLE, and AI provider CONFIGURED.
- `deployment-render-resources.png` — Render resources showing PostgreSQL available and the frontend deployed.
- `deployment-frontend-live.png` — React frontend successfully deployed.
- `deployment-ai-response.png` — Public deployed application receiving a live AI response.
- `deployment-escalation.png` — Public deployed application demonstrating human-review escalation.
- `deployment-feedback-escalation.png` — Persistent feedback recorded successfully for the deployed application.

Frontend:
https://customer-service-frontend-we6r.onrender.com

Backend:
https://customer-service-platform-upus.onrender.com

This is a course-project hosted deployment and is not intended to represent a fully hardened enterprise production environment.

