# AI Incident Intelligence Platform — Project Progress & Technical Architecture

**Last updated:** June 2026  
**Companion doc:** [AGENT-HANDOFF.md](./AGENT-HANDOFF.md) (file-by-file reference for coding agents)

---

## Project Overview

Enterprise-grade AI-powered Incident Intelligence Platform:

- Ingest incidents from **Datadog webhooks** and **manual UI**
- Analyze with **11 specialized AI agents** (multi-model routing)
- Generate: severity, RCA, remediation, impact, services, summary, evidence, trust scores
- Stream live AI execution (tokens + agent lifecycle) to frontend
- Store audit timelines + vector similarity for historical context
- Human feedback loop (accept / edit / reject) with re-analysis

---

## Current Stack

| Layer | Technologies |
|-------|----------------|
| Frontend | Next.js 16, React 19, TailwindCSS, Zustand, React Query, Socket.io, Framer Motion, Recharts |
| Backend | NestJS 11, BullMQ, Redis, Prisma, PostgreSQL + pgvector, Socket.io |
| AI runtime | Ollama (local) |
| Models | `phi3:mini`, `mistral:7b`, `llama3:8b`, `nomic-embed-text` (embeddings) |

---

## High-Level Architecture

```
Datadog Webhook ──► POST /api/webhooks/datadog
Manual UI       ──► POST /api/incidents/analyze-and-store
                           │
                           ▼
                    NestJS API + BullMQ Queue
                           │
                           ▼
                 IncidentAnalysisWorker
                  (lockDuration: 10 min)
                           │
                           ▼
              IncidentAnalysisOrchestrator
         Phase 1 (parallel) → Phase 2 → Phase 3
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         PostgreSQL    WebSocket    Ollama
         + pgvector    events       models
                           │
                           ▼
                    Next.js Dashboard
```

---

## Repository Structure (Complete)

```
incident-intelligence-platform/
├── docs/
│   ├── README.md
│   ├── AGENT-HANDOFF.md          # File-by-file agent onboarding
│   └── PROJECT-PROGRESS.md       # THIS FILE
├── infrastructure/docker/
│   └── docker-compose.yml        # Postgres :5434, Redis :6380
├── apps/
│   ├── api/
│   │   ├── prisma/schema.prisma
│   │   ├── prisma/migrations/
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── config/
│   │       │   ├── env.validation.ts
│   │       │   ├── agent-models.config.ts   # Per-agent Ollama model map
│   │       │   └── queue.config.ts            # BullMQ lockDuration settings
│   │       ├── infrastructure/
│   │       │   ├── llm/llm.service.ts         # Ollama + timeouts + stream
│   │       │   ├── embeddings/
│   │       │   ├── websocket/incidents.gateway.ts
│   │       │   ├── prisma/, queue/, logger/
│   │       ├── modules/
│   │       │   ├── incidents/                   # Core domain
│   │       │   ├── integrations/datadog/        # Webhook ingest
│   │       │   └── health/
│   │       └── common/
│   └── web/
│       └── src/
│           ├── app/(dashboard)/incidents/
│           ├── components/incident/
│           ├── features/incidents/              # API + hooks + store
│           └── lib/axios.ts, socket.ts
```

---

## Configuration Files

### `apps/api/src/config/agent-models.config.ts`

Centralized per-agent model routing:

| Agent | Model | Rationale |
|-------|-------|-----------|
| severity, detectionSource, affectedServices, summary, evidenceExtraction | `phi3:mini` | Fast classification/extraction |
| impactAssessment, confidence | `mistral:7b` | Medium reasoning |
| rca, remediation, evidenceReview, situationJudge | `llama3:8b` | Heavy reasoning |

### `apps/api/src/config/queue.config.ts`

```ts
INCIDENT_ANALYSIS_WORKER_OPTIONS = {
  concurrency: 1,
  lockDuration: 10 * 60 * 1000,  // 10 minutes — FIXES lock renewal errors
  stalledInterval: 60_000,
  maxStalledCount: 0,
}
```

### Environment variables

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/incident_intelligence
REDIS_URL=redis://localhost:6380
LLM_TIMEOUT_MS=300000          # 5 min per Ollama call (AbortSignal.timeout)
WEB_ORIGIN=http://localhost:3000
```

---

## LLM Infrastructure

**File:** `apps/api/src/infrastructure/llm/llm.service.ts`

| Method | Purpose |
|--------|---------|
| `generateTextCompletion(prompt, model?, timeoutMs?)` | Standard text |
| `generateTextCompletionStream(prompt, onToken, model?, timeoutMs?)` | Streaming tokens |
| `generateJsonCompletion(prompt, schema, model?, timeoutMs?)` | Zod-validated JSON + auto-repair |

All requests use `AbortSignal.timeout(LLM_TIMEOUT_MS)` to prevent infinite hangs.

---

## Orchestration (3-Phase Design)

**File:** `apps/api/src/modules/incidents/orchestration/incident-analysis-orchestrator.ts`

### Phase 1 — Lightweight parallel

- SeverityAgent
- SummaryAgent (streams tokens when `streamContext` provided)
- AffectedServicesAgent
- DetectionSourceAgent

### Phase 2 — Medium parallel

- EvidenceExtractionAgent
- ImpactAssessmentAgent

### Phase 3 — Heavy sequential

- RCAAgent (uses similar incidents context)
- RemediationAgent

### Post-phases (sequential)

- ConfidenceAgent
- SituationJudgeAgent
- EvidenceReviewAgent (adversarial; adjusts confidence)

Every agent wrapped in `runAgent()` which emits **agent.lifecycle** events: `STARTED` | `COMPLETED` | `FAILED` with `durationMs`.

---

## AI Agents Directory

`apps/api/src/modules/incidents/agents/`

| File | Function | Model key |
|------|----------|-----------|
| `severity.agent.ts` | `classifySeverity()` | severity |
| `summary.agent.ts` | `generateSummary()` + stream | summary |
| `rca.agent.ts` | `analyzeRootCause()` | rca |
| `remediation.agent.ts` | `generateRemediationSteps()` | remediation |
| `impact-assessment.agent.ts` | `assessImpact()` | impactAssessment |
| `affected-services.agent.ts` | `identifyAffectedServices()` | affectedServices |
| `detection-source.agent.ts` | `identifyDetectionSource()` | detectionSource |
| `evidence-extraction.agent.ts` | `extractEvidence()` | evidenceExtraction |
| `confidence.agent.ts` | `scoreConfidence()` | confidence |
| `situation-judge.agent.ts` | `judgeSituation()` | situationJudge |
| `evidence-review.agent.ts` | `reviewAnalysis()` | evidenceReview |

---

## WebSocket System

**File:** `apps/api/src/infrastructure/websocket/incidents.gateway.ts`

### Client → Server

| Message | Purpose |
|---------|---------|
| `join-incident` | Join room `incident:{id}` |
| `leave-incident` | Leave room |

### Server → Client (global + room broadcast)

| Event | Payload highlights |
|-------|-------------------|
| `incident-progress` | `{ jobId, incidentId, stage, data }` |
| `job-status` | `{ jobId, incidentId, status: QUEUED\|RUNNING\|COMPLETED\|FAILED }` |
| `timeline-event` | `{ jobId, incidentId, event: { id, stage, createdAt } }` |
| `incident-completed` | `{ jobId, incidentId, result }` |
| `agent-token` | `{ incidentId, jobId, agent, token }` |
| `agent-complete` | `{ incidentId, jobId, agent, content }` |
| `agent.lifecycle` | `{ incidentId, agent, status, durationMs, timestamp }` |

### Frontend socket integration

| File | Role |
|------|------|
| `apps/web/src/lib/socket.ts` | Socket.io singleton |
| `apps/web/src/providers/socket-provider.tsx` | Connection provider |
| `apps/web/src/features/incidents/hooks/use-incident-socket.ts` | Global listeners + cache invalidation |
| `apps/web/src/features/incidents/store/analysis-jobs.store.ts` | Live stages, job status, agent lifecycle, streaming text |

---

## Job Status System (Canonical)

**DB table:** `incident_analysis_jobs.status`

| Status | Meaning |
|--------|---------|
| `QUEUED` | Job enqueued |
| `RUNNING` | Worker processing |
| `COMPLETED` | Success |
| `FAILED` | Error |

**Incident.status** (separate): `PENDING` | `PROCESSING` | `COMPLETED` | `FAILED`

Emitted via `job-status` WebSocket on every transition.  
`GET /api/incidents/job/:jobId` returns `status` from DB (canonical) + `bullmqState` from Redis.

---

## Queue Worker

**File:** `apps/api/src/modules/incidents/workers/incident-analysis.worker.ts`

- Uses `@Processor('incident-analysis', INCIDENT_ANALYSIS_WORKER_OPTIONS)`
- Updates `incident_analysis_jobs.status` to RUNNING → COMPLETED/FAILED
- Emits `job-status` events
- Timeline stages logged via `TimelineService` (also emits `timeline-event`)

### BullMQ lock issue — RESOLVED

**Previous error:** `could not renew lock for job` / `Missing lock for job`  
**Cause:** Local LLM runs longer than default 30s lock  
**Fix applied:** `lockDuration: 600_000` ms in `queue.config.ts`

---

## Datadog Integration

**Files:**

- `apps/api/src/modules/integrations/datadog/datadog.controller.ts`
- `apps/api/src/modules/integrations/datadog/datadog.mapper.ts`
- `apps/api/src/modules/integrations/datadog/datadog.module.ts`

**Endpoint:** `POST /api/webhooks/datadog`

Maps alert payload → `enqueueIncidentAnalysis()` (same pipeline as UI).

---

## Frontend Incident System

| Component | Purpose |
|-----------|---------|
| `incident-ingest-dialog.tsx` | Submit logs for analysis |
| `incident-card.tsx` | Dashboard card + Retry on FAILED |
| `incident-details-drawer.tsx` | Slide-over investigation |
| `incident-detail-content.tsx` | Full AI output sections |
| `incident-agent-lifecycle.tsx` | Live agent STARTED/COMPLETED/FAILED |
| `incident-upload-panel.tsx` | File attach + re-analyze |
| `incident-feedback-section.tsx` | Accept / Edit / Reject |
| `incident-ai-trust-panel.tsx` | Evidence + hallucination scores |
| `incident-timeline.tsx` | Pipeline timeline |
| `live-activity-feed.tsx` | Scrollable activity (fixed height) |

### Timeline polling — REMOVED

**File:** `apps/web/src/features/incidents/hooks/use-incident-timeline.ts`

- Initial fetch via React Query
- Updates via `timeline-event` WebSocket (no 3s polling)

---

## API Endpoints Summary

| Method | Path |
|--------|------|
| GET | `/api/incidents` |
| GET | `/api/incidents/:id` |
| POST | `/api/incidents/analyze-and-store` |
| POST | `/api/incidents/:id/reanalyze` |
| POST | `/api/incidents/:id/feedback` |
| POST | `/api/incidents/:id/uploads` |
| GET | `/api/incidents/timeline/:jobId` |
| GET | `/api/incidents/job/:jobId` |
| POST | `/api/webhooks/datadog` |

---

## What Is Fully Working

- Datadog webhook ingestion
- Multi-model agent routing (`agent-models.config.ts`)
- 3-phase orchestration with lifecycle events
- BullMQ long-running job locks (10 min)
- LLM timeouts (AbortSignal)
- Canonical job status (QUEUED/RUNNING/COMPLETED/FAILED)
- WebSocket rooms (`join-incident`)
- Timeline push via `timeline-event` (no polling)
- Summary token streaming
- Agent lifecycle UI panel
- Vector similarity search
- Human feedback + file uploads + re-analysis
- Adversarial evidence review + trust panel

---

## Remaining Work (Prioritized)

### HIGH

| # | Item | How to implement |
|---|------|------------------|
| 1 | **Per-agent metrics persistence** | New table `AgentRunMetric { incidentId, jobId, agent, model, durationMs, tokenCount }`; write in `runAgent()` |
| 2 | **Stream RCA + remediation** | Extend streaming to heavy agents like SummaryAgent |
| 3 | **RootCauseHypothesis population** | New `HypothesisAgent` + persist to `root_cause_hypotheses` |
| 4 | **Webhook signature validation** | HMAC guard on Datadog controller |
| 5 | **Idempotency** | `externalId` on Incident for Datadog alert ID |

### MEDIUM

| # | Item | How to implement |
|---|------|------------------|
| 6 | **Per-agent retry** | Retry single failed agent instead of whole BullMQ job |
| 7 | **Feedback → RAG memory** | Embed human corrections; search in `similarity-search.service.ts` |
| 8 | **S3 uploads** | Replace local disk in `incident-upload.service.ts` |
| 9 | **LLM provider abstraction** | Interface + Ollama/OpenAI providers |
| 10 | **Live / Analytics pages** | Wire real data (currently stubs) |

### LOW

| # | Item |
|---|------|
| 11 | Copilot chat (`IncidentChatMessage` + tools) |
| 12 | Analysis version diff UI |
| 13 | PagerDuty webhook |
| 14 | Auth / RBAC |

---

## Performance Notes

**Bottleneck:** Local CPU Ollama inference (especially `llama3:8b` on Intel Mac).

**Mitigations already applied:**

- Fast models for lightweight agents
- Parallel phases 1 & 2
- Sequential only for heavy RCA/remediation

**Future options:** Quantized models, GPU host, cloud inference fallback, agent result caching.

---

## Commands

```bash
# Infrastructure
cd infrastructure/docker && docker compose up -d

# DB
cd apps/api && npx prisma migrate deploy

# Ollama
ollama serve
ollama pull llama3:8b
ollama pull phi3:mini
ollama pull mistral:7b
ollama pull nomic-embed-text

# Apps
pnpm dev
```

---

## For Coding Agents — Start Here

1. Read [AGENT-HANDOFF.md](./AGENT-HANDOFF.md) for every file path and API detail
2. Read this doc for architecture decisions and current status
3. Run `pnpm dev` and test at http://localhost:3000/incidents
4. Pick tasks from **Remaining Work** table above
5. After changes: `npm run build` in both `apps/api` and `apps/web`

**Critical conventions:**

- API responses always wrapped in `{ success, timestamp, data }`
- WebSocket events use exact names listed above
- Never re-run full orchestrator for chat — use lightweight copilot agent
- BullMQ worker MUST keep `lockDuration` ≥ 600000 for local LLMs

---

## Architectural Decisions

1. **Multi-model, not one model** — latency + RAM optimization  
2. **Parallel where safe** — phases 1 & 2  
3. **Zod on all structured JSON** — production safety  
4. **WebSocket-first UI** — job status, timeline, lifecycle, streaming  
5. **Canonical job status in DB** — not inferred from stages alone  
6. **Human feedback in re-analysis prompts** — learning path before RAG memory  

---

**Platform maturity:** Advanced prototype transitioning to enterprise-grade multi-agent incident intelligence. Core pipeline stable after BullMQ lock + WebSocket timeline fixes.
