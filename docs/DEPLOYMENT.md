# Local Container Deployment Guide

This guide documents a reproducible local deployment of the Customer Service Platform using Docker Compose. It provides continuous-delivery style evidence for running the integrated system (frontend, backend, and PostgreSQL) from container images.

This is a **course-scale local deployment**, not a hosted production environment.

## What It Starts

| Service | Container role | Local URL |
| --- | --- | --- |
| `db` | PostgreSQL 16 | `localhost:5432` |
| `backend` | FastAPI + seed data | `http://localhost:8000` |
| `frontend` | Built React app (nginx) | `http://localhost:8080` |

## Prerequisites

- Docker Desktop (or compatible Docker Engine + Compose plugin)
- Optional AI provider environment variables for live AI responses:
  - `AI_API_URL`
  - `AI_API_KEY`
  - `AI_MODEL`

## Start the Stack

From the repository root:

```bash
docker compose up --build
```

On first start, the backend container runs the seed script and creates the demo conversation:

- Conversation ID: `conv_001`
- Customer ID: `cust_001`

## Verify Deployment

1. Open the frontend: `http://localhost:8080`
2. Confirm API docs: `http://localhost:8000/docs`
3. Confirm health: `http://localhost:8000/api/v1/health`
4. Sign in with `cust_001`, open `conv_001`, and send a support message
5. Open **Agent review** at `http://localhost:8080/agent-review` after an escalation

## Stop the Stack

```bash
docker compose down
```

To remove the database volume as well:

```bash
docker compose down -v
```

## Deployment Evidence Notes

Recommended evidence screenshots for the portfolio:

1. Successful `docker compose up --build` output
2. Browser view of the frontend on port `8080`
3. `/api/v1/health` response showing healthy services
4. Agent review queue after an escalation
5. Optional: `docker compose ps` showing running services

Store screenshots under `docs/evidence/` when capturing final portfolio artifacts.
