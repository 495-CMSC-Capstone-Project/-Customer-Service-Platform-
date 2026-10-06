# Sean Davis — Team Video Slides + Narration

**Fit with existing Team 1 script:** Insert these **two slides after Slide 5** (Human Escalation / Sebastianna) and before Slide 6 (Julian).  
That placement continues the escalation story into the agent-review enhancement.

**Narrator:** Sean Davis  
**Total time:** ~90–110 seconds (both slides)  
**Optional live demo add-on:** 30–45 seconds after Slide B (see below)

Tone match: conversational, not announcer-style; pause ~1 second before/after your clip.

---

## Slide A — Enhancing the Handoff: Agent Review Queue

**Suggested slide title:**  
Enhancing the Handoff: Prototype Agent Review Queue

**On-slide bullets (keep sparse):**
- Built on the team final release (not a rewrite)
- New APIs: list active escalations + claim ticket
- New UI: `/agent-review` queue for human follow-up
- Course-scale prototype — not a live call-center desk

**Optional small diagram labels:**  
Customer chat → AI escalation ticket → Agent review queue → Claim / open conversation

### Narration — Slide A (~55 seconds)

Hello — I’m Sean Davis. After the team completed the integrated AI support and escalation path, I focused on a clear next step that our documentation had already identified as a gap: a human-agent review surface.

On my fork of the final release, I added a prototype agent review queue. The backend can list active escalation tickets and allow a reviewer to claim an open ticket so its status moves from open to in progress. The frontend exposes that queue at the Agent review page, where you can refresh the list, open the related conversation, and claim a ticket for review.

This does not connect the customer to a live representative in real time. It does show stakeholders a concrete handoff path from AI-assisted chat into a human review queue—built on top of the team’s existing escalation persistence, not as a separate product.

**Handoff cue:** Continue to Slide B.

---

## Slide B — Confidence Transparency + Local Deployment Evidence

**Suggested slide title:**  
Confidence Transparency and Local Deployment Evidence

**On-slide bullets:**
- AI confidence meter on assistant messages (demo score, clearly labeled)
- Docker Compose: PostgreSQL + FastAPI + frontend
- Deployment guide for reproducible local CD-style demos
- Evidence on fork branch `feature/sean-davis-agent-review-deploy`

### Narration — Slide B (~45 seconds)

I also made two smaller but visible improvements. First, AI replies now show a confidence meter in the chat interface. We still treat that value as a demonstration score—not a calibrated probability that the answer is correct—but the visual cue helps customers and reviewers notice low-confidence responses more quickly.

Second, I packaged a local Docker Compose deployment for PostgreSQL, the FastAPI backend, and the built frontend, with a short deployment guide. That gives us reproducible, continuous-delivery style evidence for running the stack as containers—even though we are not claiming a hosted production cloud environment.

My commits and contribution notes are on my GitHub fork under the feature branch for agent review and deploy. The official team repository remains the baseline team artifact.

**Handoff cue:** Julian continues with technical implementation on Slide 6.

---

## Optional live demo insert (after Slide B, ~40 seconds)

**When to use:** If the team wants your work on camera, record this short screen segment.

**Demo steps:**
1. Sign in as `cust_001`, open `conv_001`
2. Send: “I want to speak to a human representative.”
3. Confirm escalation state in chat
4. Open **Agent review** in the nav
5. Show the ticket → click **Claim for review** → status becomes in progress
6. Point briefly at the confidence meter on an earlier AI message (if visible)

**Demo narration:**

Here is the enhancement in the running app. After the customer requests a human, an escalation ticket appears in the Agent review queue. I can open the conversation and claim the ticket for review. That is the handoff surface I added on top of the team’s escalation foundation.

---

## PowerPoint build notes (quick)

| Element | Recommendation |
| --- | --- |
| Theme | Match Team 1 deck colors/fonts |
| Slide count | **2 slides** (plus optional demo clip, not a third slide) |
| Footer | “Sean Davis · Individual enhancement on team final release” |
| Avoid | Crowding slides with API JSON; keep APIs to one line |

### Exact text blocks to paste into PowerPoint

**Slide A body:**
```
• Extends team final release (fork-based contribution)
• GET /api/v1/escalations · POST .../claim
• Frontend: /agent-review queue
• Prototype human review — not live agent chat
```

**Slide B body:**
```
• Confidence meter on AI messages (demo score)
• docker compose up --build
• Postgres + API + UI locally
• Docs: DEPLOYMENT.md · CONTRIBUTIONS_SEAN_DAVIS.md
```

---

## Suggested update to team “Current Narration Assignments” table

| Slides | Narrator | Section |
| --- | --- | --- |
| Slides A & B (new, after 5) | Sean Davis | Agent Review Enhancement & Deploy Evidence |

Ask the editor to place your audio after Sebastianna (Slides 4–5) and before Julian (Slides 6–7).
