# Individual Contributions — Sean Davis

## Submission framing

- **Team repository (base / official team artifact):**  
  `https://github.com/495-CMSC-Capstone-Project/-Customer-Service-Platform-`
- **Individual fork (enhancements by Sean Davis):**  
  `https://github.com/Seanbyte08/-Customer-Service-Platform-`

The team final release is the shared baseline. This fork adds attributable enhancements on top of that baseline for Unit 8 individual contribution evidence.

## Enhancements delivered in this fork

1. **Human agent review queue**
   - Backend: `GET /api/v1/escalations` lists active escalation tickets
   - Backend: `POST /api/v1/escalations/{ticketId}/claim` moves `OPEN` tickets to `IN_PROGRESS`
   - Frontend: `/agent-review` page to refresh the queue, open conversations, and claim tickets
   - Addresses the documented gap of “no live human-agent dashboard” with a course-scale prototype

2. **AI confidence meter UX**
   - Visual confidence meter on AI chat bubbles (demo score, clearly labeled)

3. **Local container deployment (CD-style evidence)**
   - `docker-compose.yml` for PostgreSQL + FastAPI + frontend
   - Dockerfiles for backend and frontend
   - `docs/DEPLOYMENT.md` with verification steps and evidence checklist

4. **Tests and documentation**
   - Backend unit/API tests for queue listing and claim behavior
   - Frontend API tests for escalation queue client calls
   - README / API / contribution documentation updates

## How to demonstrate in the portfolio

1. Link the official team repository for Part 1 team artifact.
2. Link this fork and list the commits/PR on the feature branch `feature/sean-davis-agent-review-deploy`.
3. In the video, show: escalate a conversation → Agent review queue → claim ticket → Docker Compose health check.
4. In the position paper, cite these specific files and metrics from the team baseline plus your enhancement work.
