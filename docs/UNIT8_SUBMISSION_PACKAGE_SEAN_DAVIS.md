# Unit 8 Final Portfolio — Sean Davis Submission Package

Use this document when preparing LEO / classroom submission. Keep credit accurate: the team built the integrated baseline; your fork adds attributable enhancements on top of that baseline.

---

## 1. What to submit (assignment mapping)

| Part | Artifact | What you submit |
| --- | --- | --- |
| Part 1 | Team code repository | Official team GitHub link **and** your fork link (see wording below) |
| Part 2 | Technical stakeholder video (10–15 min) | Team video (MP4 or YouTube/Vimeo) |
| Part 3 | Professional position paper (~1,300 words) | Your PDF |
| All parts | Names + contributions | Team roster + your individual contribution statement |

---

## 2. Links to provide (copy/paste)

**Team repository (official team artifact / baseline):**  
https://github.com/495-CMSC-Capstone-Project/-Customer-Service-Platform-

**Individual fork (Sean Davis enhancements):**  
https://github.com/Seanbyte08/-Customer-Service-Platform-

**Feature branch with my commits:**  
https://github.com/Seanbyte08/-Customer-Service-Platform-/tree/feature/sean-davis-agent-review-deploy

**Compare view (my changes vs fork main / team baseline):**  
https://github.com/Seanbyte08/-Customer-Service-Platform-/compare/main...feature/sean-davis-agent-review-deploy

**My contribution summary in-repo:**  
https://github.com/Seanbyte08/-Customer-Service-Platform-/blob/feature/sean-davis-agent-review-deploy/docs/CONTRIBUTIONS_SEAN_DAVIS.md

**My commits:**  
https://github.com/Seanbyte08/-Customer-Service-Platform-/commits/feature/sean-davis-agent-review-deploy/

---

## 3. Recommended submission wording (respectable + accurate)

### Short blurb for the submission text box

> **Part 1 – Code repository**  
> The team’s final integrated Customer Service Platform is available in the official organization repository:  
> https://github.com/495-CMSC-Capstone-Project/-Customer-Service-Platform-  
>  
> My individual engineering contributions are delivered on my GitHub fork, built on top of that team final release (not a separate rewrite):  
> https://github.com/Seanbyte08/-Customer-Service-Platform-  
> Branch: `feature/sean-davis-agent-review-deploy`  
>  
> **My attributable work includes:** (1) a prototype human-agent review queue (backend list/claim escalation APIs and `/agent-review` UI), (2) an AI confidence meter in the chat interface, (3) Docker Compose local deployment packaging and deployment documentation for CD-style evidence, and (4) matching tests and documentation updates.  
>  
> Commit evidence (author Sean Davis): `9882519`, `5e09ce7`.

### One-sentence honesty rule (use this tone everywhere)

> The team delivered the integrated AI-supported customer service baseline; my fork extends that baseline with agent-review, UX, and local deployment enhancements that I can specifically attribute to my commits.

**Do not say:** “I built the whole platform” or “this is only my project.”  
**Do say:** “team baseline + my enhancements on fork.”

---

## 4. Individual contribution statement (for names + contributions)

**Name:** Sean Davis  
**GitHub:** Seanbyte08  

**Contribution summary:**  
On top of the team’s final course-project release, I implemented and documented the following enhancements in my personal fork:

1. **Human-agent review queue (full-stack)**  
   - Backend: `GET /api/v1/escalations`, `POST /api/v1/escalations/{ticketId}/claim`  
   - Services: `list_active_escalations`, `claim_escalation`  
   - Frontend: `/agent-review` page, navigation link, escalation API client  

2. **AI confidence meter UX**  
   - Visual confidence meter on AI message bubbles (explicitly labeled as a demo score)

3. **Local container deployment evidence**  
   - `docker-compose.yml`, backend/frontend Dockerfiles, nginx config  
   - `docs/DEPLOYMENT.md` with verification steps for local CD-style demos  

4. **Quality & documentation**  
   - Backend and frontend tests for the new queue behavior  
   - Updates to README, API docs, security/roadmap notes, and `docs/CONTRIBUTIONS_SEAN_DAVIS.md`

**Primary files:**  
`backend/app/api.py`, `backend/app/escalation_service.py`, `frontend/src/pages/AgentReviewPage.tsx`, `frontend/src/api/escalations.ts`, `frontend/src/components/chat/MessageBubble.tsx`, `docker-compose.yml`, `docs/DEPLOYMENT.md`

---

## 5. Suggested folder / PDF layout for your personal packet

If you upload a zip or supporting PDF alongside LEO fields, use this structure:

```text
SeanDavis_CMSC495_Unit8/
├── 01_Links_and_Contribution_Statement.pdf   (sections 2–4 above)
├── 02_Position_Paper.pdf                     (Part 3)
├── 03_Evidence_Screenshots/
│   ├── fork_commits.png
│   ├── compare_diff.png
│   ├── agent_review_page.png
│   ├── docker_compose_running.png   (optional)
│   └── ci_workflow_approved.png     (optional)
└── 04_Video_Link.txt                 (or team hosts video)
```

---

## 6. Position paper layout (~1,300 words)

Target: Section 1 ≈ 400 · Section 2 ≈ 450 · Section 3 ≈ 450.

### Title suggestion
**Professional Position Paper: Delivery, Evaluation, and Growth After an AI-Enabled Customer Service Capstone**

### Section 1 — System Delivery and Integration (~400 words)

**Points to cover:**
- Real-world problem: customers need fast first-line support; human review when AI is insufficient
- Team iterative delivery: React/TS frontend + FastAPI + PostgreSQL + external AI + CI
- Your role: enhancement layer on a completed integration, not a greenfield rewrite
- Specific examples: agent queue closes “no human-agent dashboard” gap; confidence meter improves AI transparency; Docker Compose improves deployability evidence

**Draft paragraph you can adapt:**

> Our team delivered an integrated Customer Service Platform that addresses a practical computational challenge: providing timely first-line support while recognizing when automated answers are not enough. The baseline system connects a React and TypeScript customer interface to a FastAPI backend, persists conversations in PostgreSQL, and uses an external AI provider for response generation, with escalation and feedback pathways when human review is needed. Development followed an iterative, branch-and-pull-request workflow with automated GitHub Actions checks, which helped the team stabilize messaging, request-ID retry behavior, and coverage gates before the final release.  
>  
> My individual contribution deliberately built on that integrated baseline rather than replacing it. On my fork, I added a prototype human-agent review queue—backend endpoints to list and claim active escalations, plus a frontend `/agent-review` experience—so stakeholders can see the handoff path from AI conversation to human review. I also added a visible AI confidence meter in chat and Docker Compose packaging with deployment documentation to strengthen local continuous-delivery style evidence. These changes are attributable in commits `9882519` and `5e09ce7` and are documented in `docs/CONTRIBUTIONS_SEAN_DAVIS.md`. Together, the team system and my enhancements demonstrate both end-to-end integration and continued iterative improvement after the core release.

*(Expand with 1–2 more paragraphs: mention demo IDs `cust_001`/`conv_001`, and that escalation does not equal a live call-center handoff.)*

### Section 2 — Methodology and Performance Evaluation (~450 words)

**Points to cover:**
- Methodology: feature branches, PRs, CI, coverage thresholds, modular architecture
- Compare to industry ideas: IEEE/SEI themes — verification, configuration management, risk acknowledgment, incremental delivery
- Quantitative evidence from **team** baseline (cite README/evidence): ~66 backend tests / ~90.9% coverage; frontend ~61 tests / ~90% statements; benchmark ~6 ms median handler baseline
- Critically evaluate limitations: prototype auth, no hosted production CD, agent queue is prototype, confidence is demo score
- Your work as response to documented gaps (roadmap: agent dashboard / deployment)

**Draft paragraph you can adapt:**

> Evaluated against professional practice, the team’s approach aligns with iterative delivery and continuous integration more than with a single late “big bang” integration. Automated backend and frontend pipelines, coverage gates, and documented API contracts reflect verification and validation habits emphasized in software engineering standards communities (for example, disciplined testing and configuration control discussed across IEEE software engineering practice). Quantitatively, the final-release evidence package reports approximately 66 backend tests with about 90.93% backend coverage and an 80% CI coverage gate, alongside frontend results of 61 passing tests with statement coverage near 90% and enforced thresholds. A controlled in-process API benchmark recorded a median response near 5.97 ms under mocked AI conditions—useful as a handler baseline, but not a claim of production-scale latency.  
>  
> At the same time, an honest evaluation must mark gaps. Authentication remains a prototype localStorage customer ID, the repository historically lacked a hosted production deployment pipeline, and AI confidence is a demonstration score rather than calibrated correctness. My enhancements respond to two of those documented limitations at course scale: a prototype agent review queue and reproducible local container deployment. They improve maintainability and demonstrability, but they do not replace production identity management, rate limiting, or cloud hosting. That distinction matters: industry readiness requires naming residual risk, not only celebrating green CI checks.

*(Add a short paragraph comparing branch/PR workflow to professional code review culture.)*

### Section 3 — Professional Development Roadmap (~450 words)

**Points to cover (pick 3 concrete skills + cite trends):**
- Stronger auth / OAuth or managed identity
- Observability (OpenTelemetry, structured logging)
- Cloud deployment + real CD
- AI evaluation / guardrails
- Cite Stack Overflow Developer Survey, GitHub Octoverse, or IEEE CS reports (look up current year stats when you finalize)

**Draft paragraph you can adapt:**

> Working on this capstone clarified that integration skill is only the starting point for professional software engineering. Industry surveys such as the Stack Overflow Developer Survey and GitHub’s State of the Octoverse consistently highlight cloud platforms, AI-assisted development, and DevOps automation as durable skill areas. Over the next 12–18 months, I plan to deepen three capabilities tied directly to gaps I observed in our project. First, production-grade authentication and authorization, so customer and agent roles are not demonstration identifiers. Second, cloud deployment with monitored continuous delivery—moving beyond local Docker Compose evidence to hosted environments with rollback discipline. Third, AI quality evaluation and safety practices, including better handling of low-confidence or adversarial inputs. I will pursue these through small proof-of-concept projects, certification-aligned learning where appropriate, and continued use of automated testing as a non-negotiable habit. The goal is technological adaptability: treating each release as a baseline for measured improvement rather than a finished story.

---

## 7. Video talking points (your 60–90 seconds)

If the team video divides speakers, use this for your segment:

1. **Problem handoff:** AI helps first; humans still needed  
2. **Show:** escalate in `conv_001` → open **Agent review** → claim ticket  
3. **Show:** confidence meter on an AI reply  
4. **Mention:** Docker Compose local deploy for reproducible demo/CD evidence  
5. **Credit:** built on team final release; my fork documents the delta  

---

## 8. Checklist before you hit submit

- [ ] Team repo link included  
- [ ] Your fork + feature branch link included  
- [ ] Contribution statement names your 3–4 enhancements (not “README only”)  
- [ ] Position paper cites team metrics **and** your commit/files  
- [ ] Paper language keeps team vs individual credit clean  
- [ ] Screenshots of commits/compare/agent-review saved  
- [ ] CI workflows on your fork approved/run (optional but strong)  
- [ ] Video includes or acknowledges AI demo + your agent-review add-on  
- [ ] PDF is ~1,300 words, three sections, proofread  

---

## 9. Team member credit (keep in your packet)

Include the full team roster from the project README (Makida Abebe, Julian Chavez, Tyresz Brash, Sebastianna Chan, Kierra Cunningham, Sean Chase) **plus Sean Davis** with the contribution text in Section 4. This satisfies “team member names and individual contributions.”
