# Incident Intelligence Platform — Agent Handoff Document

**Version:** 1.1 (June 2026)  
**Audience:** Engineers or AI coding agents picking up this codebase  
**Goal:** Understand architecture, file layout, current behavior, gaps, and exact steps to close them

> **See also:** [PROJECT-PROGRESS.md](./PROJECT-PROGRESS.md) for the latest multi-model orchestration, BullMQ fixes, WebSocket events (`job-status`, `timeline-event`, `agent.lifecycle`), and Datadog integration status.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Monorepo Layout](#2-monorepo-layout)
3. [Backend File Structure (Detailed)](#3-backend-file-structure-detailed)
4. [Frontend File Structure (Detailed)](#4-frontend-file-structure-detailed)
5. [Infrastructure](#5-infrastructure)
6. [Runtime Architecture](#6-runtime-architecture)
7. [Data Model (Prisma)](#7-data-model-prisma)
8. [API Reference](#8-api-reference)
9. [WebSocket Events](#9-websocket-events)
10. [AI Pipeline (Multi-Agent)](#10-ai-pipeline-multi-agent)
11. [Frontend Data Flow](#11-frontend-data-flow)
12. [Environment & Local Setup](#12-environment--local-setup)
13. [Current Capabilities (What Works Today)](#13-current-capabilities-what-works-today)
14. [Known Gaps & How to Fix Them](#14-known-gaps--how-to-fix-them)
15. [Recommended Implementation Roadmap](#15-recommended-implementation-roadmap)
16. [Conventions & Gotchas](#16-conventions--gotchas)
17. [Testing Checklist for Changes](#17-testing-checklist-for-changes)

---

## 1. Executive Summary

This is an **AI-powered incident investigation platform** built as a pnpm monorepo:

| App | Path | Port | Role |
|-----|------|------|------|
| API | `apps/api` | 4000 | NestJS REST + WebSocket + BullMQ worker + 11 LLM agents |
| Web | `apps/web` | 3000 | Next.js dashboard for incidents, analysis, feedback |

**Core flow:** User submits logs → job queued in Redis → worker embeds logs → vector similarity search → 11 agents analyze → results persisted in PostgreSQL → UI updates via Socket.io.

**Maturity:** Strong batch AI analysis + human feedback loop + file uploads. **Not production-ready** (no auth, no external alert ingest, partial streaming, local file storage).

---

## 2. Monorepo Layout

```
incident-intelligence-platform/
├── package.json              # Root scripts: dev, build, lint (turbo)
├── turbo.json                # Turborepo pipeline config
├── pnpm-workspace.yaml       # Workspace definition (if present)
├── docs/
│   ├── README.md             # Doc index
│   └── AGENT-HANDOFF.md      # THIS FILE
├── infrastructure/
│   └── docker/
│       └── docker-compose.yml  # Postgres (pgvector) + Redis
├── apps/
│   ├── api/                  # NestJS backend
│   └── web/                  # Next.js frontend
```

**Package manager:** pnpm  
**Run everything:** `pnpm dev` from root (requires turbo)

---

## 3. Backend File Structure (Detailed)

```
apps/api/
├── prisma/
│   ├── schema.prisma                    # Source of truth for DB models
│   └── migrations/                      # SQL migrations (run migrate deploy)
├── src/
│   ├── main.ts                          # Bootstrap: CORS, global prefix /api, validation pipe
│   ├── app.module.ts                    # Root module wiring
│   ├── config/
│   │   └── env.validation.ts            # Zod env schema: DATABASE_URL, REDIS_URL, optional API keys
│   ├── common/
│   │   ├── filters/http-exception.filter.ts
│   │   ├── interceptors/response.interceptor.ts   # Wraps ALL responses as { success, timestamp, data }
│   │   └── utils/                       # JSON parsing, severity normalization, RCA validation
│   ├── infrastructure/
│   │   ├── prisma/                      # PrismaService + module
│   │   ├── llm/
│   │   │   └── llm.service.ts           # Ollama client (sync + stream). Model: llama3:8b @ localhost:11434
│   │   ├── openai/
│   │   │   └── openai.service.ts        # EXISTS but NOT used by agents (optional future provider)
│   │   ├── embeddings/
│   │   │   └── embedding.service.ts     # Generates vectors stored in pgvector column
│   │   ├── queue/
│   │   │   └── queue.module.ts          # BullMQ + Redis connection
│   │   └── websocket/
│   │       ├── incidents.gateway.ts     # Socket.io: incident-progress, incident-completed, agent-token
│   │       └── websocket.module.ts
│   └── modules/
│       ├── health/                      # GET /api/health
│       └── incidents/                   # MAIN DOMAIN MODULE — see below
```

### 3.1 `modules/incidents/` — Core Domain

| File | Purpose |
|------|---------|
| `incidents.module.ts` | Registers controllers, agents, services, worker, BullMQ queue |
| `incidents.controller.ts` | REST endpoints (see API Reference) |
| `incidents.service.ts` | CRUD, analyzeAndStoreIncident pipeline steps, getIncidentById |
| `incidents.analytics.service.ts` | Hourly severity trends (uses aiSeverity when COMPLETED) |

#### DTOs (`dto/`)

| File | Used by |
|------|---------|
| `create-incident.dto.ts` | POST /incidents |
| `analyze-incident.dto.ts` | POST /incidents/analyze (sync, no persist) |
| `analyze-and-store-incident.dto.ts` | POST /incidents/analyze-and-store, worker job payload |
| `create-feedback.dto.ts` | POST /incidents/:id/feedback |

#### Agents (`agents/`) — Each calls `LLMService`

| Agent file | Responsibility |
|------------|----------------|
| `evidence-extraction.agent.ts` | Extract structured evidence quotes from logs |
| `severity.agent.ts` | Classify LOW/MEDIUM/HIGH/CRITICAL |
| `rca.agent.ts` | Root cause; receives historical similar incidents as context |
| `remediation.agent.ts` | Generate remediation step array |
| `summary.agent.ts` | Short summary; **supports streaming** via WebSocket when streamContext passed |
| `impact-assessment.agent.ts` | Impact narrative |
| `affected-services.agent.ts` | List affected services |
| `detection-source.agent.ts` | How incident was detected |
| `confidence.agent.ts` | Confidence score + rationale |
| `situation-judge.agent.ts` | Urgency, blast radius, escalation recommendation |
| `evidence-review.agent.ts` | Adversarial review: unsupported claims, hallucination risk |

#### Orchestration

| File | Purpose |
|------|---------|
| `orchestration/incident-analysis-orchestrator.ts` | Runs all agents; merges humanFeedbackContext into prompts; passes streamContext to SummaryAgent |

#### Services (`services/`)

| File | Purpose |
|------|---------|
| `incident-queue.service.ts` | enqueueIncidentAnalysis, reanalyzeIncident, getJobStatus |
| `similarity-search.service.ts` | pgvector cosine search; threshold 0.8 in incidents.service |
| `incident-input-normalizer.service.ts` | Normalizes/truncates raw log input |
| `incident-upload.service.ts` | File upload to `apps/api/uploads/`; parses text |
| `incident-feedback.service.ts` | Accept/Reject/Edit feedback; applies edits to incident; builds context for reanalysis |
| `file-parser.service.ts` | Parses .log/.txt/.json/.csv buffers to string |

#### Worker

| File | Purpose |
|------|---------|
| `workers/incident-analysis.worker.ts` | BullMQ processor for queue `incident-analysis`; sets status PROCESSING/COMPLETED/FAILED |

#### Timeline

| File | Purpose |
|------|---------|
| `timeline/incident-timeline.service.ts` | Persists pipeline stage events; getTimelineByJobId |

#### Types (`types/`)

Zod schemas and TypeScript types for agent outputs: `incident-analysis.type.ts`, `evidence.type.ts`, `evidence-review.type.ts`, `situation-judgment.type.ts`, etc.

#### Evaluation

| File | Purpose |
|------|---------|
| `evaluation/incident-evaluation.service.ts` | Utility scoring helpers (partially used; main eval stored in incidents.service) |

---

## 4. Frontend File Structure (Detailed)

```
apps/web/src/
├── app/
│   ├── layout.tsx                       # Root: QueryProvider, SocketProvider, Toaster
│   ├── page.tsx                         # Redirects / landing
│   ├── (dashboard)/
│   │   ├── layout.tsx                   # Sidebar + Topbar shell
│   │   ├── incidents/
│   │   │   ├── page.tsx                 # Main incidents dashboard
│   │   │   └── [id]/page.tsx            # Full investigation workspace
│   │   └── live/page.tsx                # PLACEHOLDER — not implemented
│   └── socket-test/page.tsx             # Dev socket debugging
├── components/
│   ├── dashboard/
│   │   ├── sidebar.tsx                  # Nav: Dashboard, Incidents, Live, Analytics, Settings
│   │   ├── topbar.tsx
│   │   ├── stats-card.tsx               # Metric cards on incidents page
│   │   ├── incident-trends-chart.tsx    # Recharts area chart (24h severity buckets)
│   │   ├── live-activity-feed.tsx       # Scrollable WebSocket activity (max-h 220px)
│   │   ├── command-pallet.tsx           # Cmd+K palette (partial)
│   │   └── incidents-chart.tsx          # Legacy/mock chart (may be unused)
│   ├── incident/
│   │   ├── incident-card.tsx            # List card with severity, confidence, live stage
│   │   ├── incident-details-drawer.tsx  # Slide-over detail; fetches useIncident + timeline
│   │   ├── incident-detail-content.tsx  # Shared detail sections (AI output, trust, uploads)
│   │   ├── incident-ingest-dialog.tsx   # "Analyze logs with AI" modal
│   │   ├── incident-upload-panel.tsx    # File attach + re-analyze button
│   │   ├── incident-feedback-section.tsx| Accept/Edit/Reject per AI field
│   │   ├── incident-ai-trust-panel.tsx  | Evaluation scores, evidence, situation judgment
│   │   ├── incident-timeline.tsx        | Renders real timeline events from API
│   │   └── severity-badge.tsx
│   └── ui/                              # shadcn/Radix primitives
├── features/incidents/                  # FEATURE MODULE — primary integration layer
│   ├── api/
│   │   └── incident-api.ts              # ALL REST calls to backend
│   ├── hooks/
│   │   ├── incident-query-keys.ts       # React Query key factory
│   │   ├── use-incidents.ts             # List query
│   │   ├── use-incident.ts              # Detail query by id
│   │   ├── use-incident-trends.ts       # Analytics chart data
│   │   ├── use-incident-timeline.ts     # Timeline by jobId (polls until done)
│   │   ├── use-job-status.ts            # Job polling (available, lightly used)
│   │   ├── use-incident-mutations.ts    # create, analyze-and-store, upload, feedback, reanalyze
│   │   ├── use-incident-socket.ts       # WebSocket listeners + cache invalidation
│   │   └── use-incident-job-id.ts       | Resolves jobId from store or timeline events
│   ├── store/
│   │   └── analysis-jobs.store.ts       # Zustand: job↔incident map, live stages, activity feed, streaming text
│   ├── types/
│   │   └── incident.type.ts             # Frontend types mirroring API
│   └── utils/
│       └── timeline-metadata.ts         # Extract aiEvaluation from timeline event metadata
├── lib/
│   ├── axios.ts                         # baseURL: http://localhost:4000/api
│   ├── socket.ts                        # io http://localhost:4000
│   ├── api-response.ts                  # unwrapApiData helper
│   └── query-client.ts
└── providers/
    ├── query-provider.tsx
    └── socket-provider.tsx
```

### 4.1 Key frontend integration rules

1. **Always use** `features/incidents/api/incident-api.ts` for HTTP — do not call axios directly from components.
2. **Always use** React Query hooks from `features/incidents/hooks/` in components.
3. **WebSocket event names** must match backend exactly: `incident-progress`, `incident-completed`, `agent-token`, `agent-complete` (NOT `job-progress`).
4. **Response shape:** API returns `{ success, timestamp, data }` — use `unwrapApiData`.
5. **Job ID vs Incident ID:** WebSocket uses `trackingId` (UUID) as jobId; map to incidentId via Zustand store or timeline events.

---

## 5. Infrastructure

```
infrastructure/docker/docker-compose.yml
```

| Service | Host port | Purpose |
|---------|-----------|---------|
| postgres (pgvector/pg16) | 5434 | Database with vector extension |
| redis | 6380 | BullMQ job queue |

**External dependencies (not in compose):**
- Ollama @ `http://localhost:11434` with model `llama3:8b`
- Node 20+ for apps

**Upload storage:** `apps/api/uploads/` (gitignored). Created at runtime by IncidentUploadService.

---

## 6. Runtime Architecture

```
┌─────────────┐     REST      ┌──────────────────────────────────────┐
│  Next.js    │──────────────▶│  NestJS API (/api)                   │
│  :3000      │               │  ├── IncidentsController             │
│             │◀──────────────│  ├── IncidentQueueService → BullMQ   │
│  Socket.io  │   WebSocket   │  └── IncidentAnalysisWorker          │
└─────────────┘──────────────▶│       └── IncidentsService           │
                              │           └── Orchestrator → Agents  │
                              │                   └── LLMService     │
                              │                   └── EmbeddingService│
                              └──────────┬─────────────┬─────────────┘
                                         │             │
                                    PostgreSQL       Redis
                                    (pgvector)      (BullMQ)
                                         │
                                    Ollama :11434
```

### Analysis job lifecycle

1. `POST /incidents/analyze-and-store` → creates Incident (PENDING) + BullMQ job
2. Worker: status → PROCESSING
3. `analyzeAndStoreIncident`:
   - Generate embedding
   - Similarity search (pgvector)
   - Orchestrator (11 agents)
   - Update incident (COMPLETED) + create IncidentEvaluation
   - Store embedding on incident row
4. WebSocket: `incident-completed`
5. Frontend invalidates React Query caches

### Re-analysis lifecycle

1. `POST /incidents/:id/reanalyze`
2. Merges: `incident.summary` + parsed uploads + human feedback context
3. New trackingId + new BullMQ job on existing incident

---

## 7. Data Model (Prisma)

**Schema file:** `apps/api/prisma/schema.prisma`

### Incident (core)

| Field | Type | Notes |
|-------|------|-------|
| id | cuid | Primary key |
| title, severity, status | enums/string | status: PENDING/PROCESSING/COMPLETED/FAILED |
| summary | string? | Raw/normalized logs |
| aiSummary, rootCause, impactAssessment, detectionSource | string? | AI outputs |
| aiSeverity | string? | AI reclassification |
| remediationSteps | Json? | string array |
| confidenceScore | Float? | 0-100 |
| affectedServices | String[] | |
| embedding | vector? | pgvector, set after analysis |
| source | string? | **Unused in UI** — intended for datadog/pagerduty/manual |

### Related models

| Model | Purpose | Gap |
|-------|---------|-----|
| Upload | File attachments + parsedText | Local disk only |
| IncidentFeedback | Human accept/reject/edit | No userId |
| IncidentTimelineEvent | Pipeline audit log per jobId | |
| IncidentEvaluation | faithfulness/hallucination/accuracy per run | |
| IncidentAnalysisJob | Maps trackingId ↔ bullmqJobId | |
| RootCauseHypothesis | Alternative RCA hypotheses | **NEVER POPULATED** — schema + UI exist, no writer |

---

## 8. API Reference

**Base URL:** `http://localhost:4000/api`  
**Global response wrapper:**

```json
{
  "success": true,
  "timestamp": "2026-06-02T...",
  "data": { ... }
}
```

### Incidents

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/incidents` | — | Incident[] |
| GET | `/incidents/:id` | — | IncidentDetail (+ evaluations, timelineEvents, hypotheses, uploads, feedback) |
| POST | `/incidents` | CreateIncidentDto | Incident |
| POST | `/incidents/analyze` | `{ logs }` | Orchestrated analysis (no DB persist) |
| POST | `/incidents/analyze-and-store` | `{ title, severity, logs }` | `{ jobId, incidentId }` |
| GET | `/incidents/job/:jobId` | — | JobStatusResponse |
| GET | `/incidents/timeline/:jobId` | — | IncidentTimelineEvent[] |
| GET | `/incidents/analytics/trends` | — | Hourly severity buckets |

### Uploads

| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/incidents/:id/uploads` | multipart `file` (max 10MB) | Upload |
| GET | `/incidents/:id/uploads` | — | Upload[] |
| DELETE | `/incidents/:id/uploads/:uploadId` | — | `{ deleted: true }` |

### Feedback

| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/incidents/:id/feedback` | CreateFeedbackDto | IncidentFeedback |
| GET | `/incidents/:id/feedback` | — | IncidentFeedback[] |

**CreateFeedbackDto fields:**
- `field`: rootCause | aiSummary | remediation | severity
- `action`: ACCEPT | REJECT | EDIT
- `originalValue`, `correctedValue`, `reason` (optional)

### Re-analysis

| Method | Path | Returns |
|--------|------|---------|
| POST | `/incidents/:id/reanalyze` | `{ jobId, incidentId }` |

---

## 9. WebSocket Events

**Server:** `http://localhost:4000` (Socket.io)  
**Gateway file:** `apps/api/src/infrastructure/websocket/incidents.gateway.ts`  
**Client:** `apps/web/src/lib/socket.ts` + `use-incident-socket.ts`

| Event | Direction | Payload |
|-------|-----------|---------|
| `incident-progress` | Server → Client | `{ jobId, incidentId, stage, data }` |
| `incident-completed` | Server → Client | `{ jobId, incidentId, result }` |
| `agent-token` | Server → Client | `{ incidentId, jobId, agent, token }` |
| `agent-complete` | Server → Client | `{ incidentId, jobId, agent, content }` |

**Pipeline stages emitted:** JOB_STARTED, EMBEDDING_GENERATED, SIMILAR_INCIDENTS_RETRIEVED, AI_ANALYSIS_COMPLETED, INCIDENT_PERSISTED, EMBEDDING_STORED, JOB_FAILED, etc.

---

## 10. AI Pipeline (Multi-Agent)

**Entry:** `IncidentAnalysisOrchestrator.analyze()` in  
`apps/api/src/modules/incidents/orchestration/incident-analysis-orchestrator.ts`

### Input parameters

```typescript
{
  logs: string;                        // Normalized log text
  historicalContext?: string;          // Similar incidents formatted text
  humanFeedbackContext?: string;       // From IncidentFeedbackService on reanalyze
  similarIncidentCount: number;
  similarityScores: number[];
  inputProfile?: IncidentInputProfile;
  streamContext?: { incidentId, jobId }; // Enables summary streaming
}
```

### Execution order

1. Evidence extraction (sequential)
2. Parallel: severity, RCA, remediation, **summary (streamed)**, impact, services, detection
3. Confidence scoring
4. Situation judgment
5. Evidence review (may adjust confidence)

### LLM configuration

**File:** `apps/api/src/infrastructure/llm/llm.service.ts`  
- Endpoint: `http://localhost:11434/api/generate`  
- Model: `llama3:8b`  
- Streaming: only used by SummaryAgent when streamContext provided

---

## 11. Frontend Data Flow

### Submit new incident

```
IncidentIngestDialog
  → useAnalyzeAndStoreIncident()
  → POST /incidents/analyze-and-store
  → registerJob(jobId, incidentId) in Zustand
  → useIncidentSocket listens for progress
  → on complete: invalidate ["incidents"] queries
```

### View incident detail

```
IncidentDetailsDrawer | /incidents/[id]
  → useIncident(id)
  → useIncidentJobId(incident) → jobId from store or timelineEvents[0].jobId
  → useIncidentTimeline(jobId)
  → IncidentDetailContent renders all sections
```

### Human feedback

```
IncidentFeedbackSection
  → useCreateIncidentFeedback(incidentId)
  → POST /incidents/:id/feedback
  → On EDIT: backend updates incident field + stores feedback row
```

### File upload + reanalyze

```
IncidentUploadPanel
  → useUploadIncidentFile → POST multipart
  → useReanalyzeIncident → POST /incidents/:id/reanalyze
```

---

## 12. Environment & Local Setup

### API (`apps/api/.env`)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/incident_intelligence
REDIS_URL=redis://localhost:6380
PORT=4000
# Optional (not wired to agents):
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

### Commands

```bash
# 1. Start infra
cd infrastructure/docker && docker compose up -d

# 2. Migrate DB
cd apps/api && npx prisma migrate deploy

# 3. Start Ollama + pull model
ollama pull llama3:8b

# 4. Start apps (from root)
pnpm dev
# OR separately:
cd apps/api && npm run start:dev
cd apps/web && npm run dev
```

### URLs

- Web: http://localhost:3000/incidents
- API: http://localhost:4000/api
- Health: http://localhost:4000/api/health

---

## 13. Current Capabilities (What Works Today)

| Feature | Status |
|---------|--------|
| Multi-agent incident analysis (11 agents) | ✅ Complete |
| Vector similarity / RAG for RCA context | ✅ Complete |
| Async job queue (BullMQ) | ✅ Complete |
| Real-time pipeline progress (WebSocket) | ✅ Complete |
| Persisted timeline + evaluation scores | ✅ Complete |
| Adversarial evidence review + trust UI | ✅ Complete |
| Incidents dashboard (list, filter, search) | ✅ Complete |
| Severity trends chart | ✅ Complete |
| Submit logs via UI | ✅ Complete |
| Incident detail drawer + full page | ✅ Complete |
| File upload (.log/.txt/.json/.csv) | ✅ Complete |
| Human feedback (accept/edit/reject) | ✅ Complete |
| Re-analysis with uploads + feedback | ✅ Complete |
| Streaming AI summary (summary agent only) | ✅ Partial |
| Live activity feed (scrollable) | ✅ Complete |

---

## 14. Known Gaps & How to Fix Them

Each gap includes: **problem**, **impact**, **files to change**, **implementation steps**.

---

### GAP-01: No authentication or authorization

**Problem:** All API and WebSocket endpoints are public.  
**Impact:** Not deployable to production.

**Fix:**
1. Add `apps/api/src/modules/auth/` with JWT or API key guard.
2. Apply `@UseGuards(AuthGuard)` on `IncidentsController`.
3. Add `userId` to `IncidentFeedback` model.
4. Web: login page + attach token in `lib/axios.ts` interceptor.

**Files:**
- `apps/api/prisma/schema.prisma` — add User model
- `apps/api/src/modules/incidents/incidents.controller.ts`
- `apps/web/src/lib/axios.ts`

---

### GAP-02: No external observability integrations (Datadog, PagerDuty)

**Problem:** Incidents only created via manual UI paste.  
**Impact:** Not a real "intelligence platform" for on-call.

**Fix:**
1. Create `apps/api/src/modules/integrations/`
2. Add webhook controllers:
   - `POST /api/webhooks/datadog`
   - `POST /api/webhooks/pagerduty`
3. Map payload → `AnalyzeAndStoreIncidentDto`
4. Add `externalId String? @unique` and use `source` field on Incident.
5. Call existing `incidentQueueService.enqueueIncidentAnalysis()`.

**Example mapper location:** `integrations/datadog/datadog.mapper.ts`

**Idempotency:** Check `externalId` before creating duplicate incidents.

---

### GAP-03: No conversational copilot

**Problem:** Users cannot chat with AI about an incident.  
**Impact:** No interactive investigation.

**Fix:**
1. Add Prisma model `IncidentChatMessage { id, incidentId, role, content, metadata }`
2. Create `apps/api/src/modules/incidents/chat/incident-chat.service.ts`
3. Build context from: incident fields, timeline, evaluations, similar incidents, feedback
4. Add `POST /incidents/:id/chat` with SSE or WebSocket streaming
5. Web: chat panel component on `incident-detail-content.tsx`
6. Use tool-calling pattern: `get_similar_incidents`, `get_timeline`, `search_logs`

**Do NOT** re-run full 11-agent orchestrator per message — use single LLM + tools.

---

### GAP-04: Streaming limited to summary agent only

**Problem:** RCA, remediation, etc. appear only after full batch completes.  
**Impact:** Poor UX during long analysis.

**Fix:**
1. Extend `LLMService.generateTextCompletionStream` usage to `rca.agent.ts`, `remediation.agent.ts`
2. Add gateway events: already have `agent-token` / `agent-complete`
3. Update orchestrator to pass `streamContext` to each streaming agent sequentially or in parallel
4. Web: extend `analysis-jobs.store.ts` streamingSummaries to support multiple agents
5. UI: show streaming sections in `incident-detail-content.tsx`

**Files:**
- `apps/api/src/modules/incidents/agents/rca.agent.ts`
- `apps/api/src/modules/incidents/orchestration/incident-analysis-orchestrator.ts`
- `apps/web/src/features/incidents/store/analysis-jobs.store.ts`

---

### GAP-05: RootCauseHypothesis never populated

**Problem:** DB table + UI panel exist but no code writes hypotheses.  
**Impact:** Empty "Root Cause Hypotheses" section always.

**Fix:**
1. Create `apps/api/src/modules/incidents/agents/hypothesis.agent.ts`
2. Prompt: generate 2-3 alternative hypotheses with confidence + evidence
3. In `incidents.service.ts` after orchestrator, `prisma.rootCauseHypothesis.createMany(...)`
4. Or extend RCA agent to return hypotheses array

**Files:**
- New agent + register in `incidents.module.ts`
- `apps/api/src/modules/incidents/incidents.service.ts` (persist step)

---

### GAP-06: Human feedback not stored as RAG memory

**Problem:** Edits only injected as prompt text on reanalyze — not embedded for future similarity.  
**Impact:** Platform doesn't learn from corrections.

**Fix:**
1. On feedback action EDIT with correctedValue, generate embedding of correction
2. Store in new table `VerifiedIncidentMemory { incidentId, field, content, embedding }`
3. In `similarity-search.service.ts`, also search verified memories
4. Inject top matches into RCA/remediation agent prompts

---

### GAP-07: Uploads stored on local filesystem

**Problem:** `apps/api/uploads/` — lost on redeploy without persistent volume.  
**Impact:** Not cloud-ready.

**Fix:**
1. Add S3-compatible storage adapter in `incident-upload.service.ts`
2. Use env `S3_BUCKET`, `S3_REGION`, `AWS_ACCESS_KEY_ID`
3. Store `storageKey` as S3 key; optional pre-signed URLs for download

---

### GAP-08: OpenAI service unused

**Problem:** `openai.service.ts` exists but all agents use Ollama via `llm.service.ts`.  
**Impact:** Cannot switch to GPT-4 for better quality without refactor.

**Fix:**
1. Create interface `LLMProvider { generateText, generateTextStream, generateJson }`
2. Implement `OllamaProvider` and `OpenAIProvider`
3. Inject provider via env `LLM_PROVIDER=ollama|openai`
4. Update all agents to depend on `LLMProvider` not `LLMService` directly

**Files:**
- `apps/api/src/infrastructure/llm/`
- All files in `agents/`

---

### GAP-09: Activity feed not persisted

**Problem:** Live activity stored in Zustand only — lost on refresh.  
**Impact:** No historical ops view.

**Fix:**
1. Option A: Persist timeline events already in DB — build feed from recent `IncidentTimelineEvent` query
2. Option B: Add `ActivityLog` table
3. Web: replace Zustand feed with React Query polling or socket + DB fetch

---

### GAP-10: Job/incident mapping fragile on page refresh

**Problem:** `incidentToJob` in Zustand cleared on reload.  
**Impact:** Live stage on cards may not show until timeline loads.

**Fix (partially done):** `use-incident-job-id.ts` reads from `timelineEvents[0].jobId`  
**Improve:** Store `latestJobId` on Incident model in DB when job enqueued.

**Schema addition:**
```prisma
model Incident {
  latestJobId String?
}
```

---

### GAP-11: Placeholder pages (Live, Analytics, Settings)

**Problem:** Sidebar links to stub pages.  
**Impact:** Incomplete product surface.

**Fix:**
- `/live` → Move `LiveActivityFeed` + active jobs table + socket stream
- `/analytics` → Aggregate stats from incidents + evaluation scores over time
- `/settings` → Webhook URLs, API keys, Ollama model config

**Files:**
- `apps/web/src/app/(dashboard)/live/page.tsx`
- Create `analytics/page.tsx`, `settings/page.tsx`

---

### GAP-12: No retry UI for FAILED incidents

**Problem:** Failed jobs set status FAILED but no one-click retry in list UI.  
**Fix:** Add "Retry analysis" button on card when `status === FAILED` → calls `reanalyzeIncident`

**Files:**
- `apps/web/src/components/incident/incident-card.tsx`
- `use-incident-mutations.ts` (already has reanalyze)

---

### GAP-13: No analysis diff / version history

**Problem:** Re-analysis overwrites AI fields — no before/after.  
**Fix:**
1. Add `IncidentAnalysisSnapshot` table storing JSON blob per run
2. On each analysis completion, save snapshot before overwrite
3. UI: version selector in detail view

---

### GAP-14: Sync analyze endpoint unused in UI

**Problem:** `POST /incidents/analyze` runs pipeline without saving — useful for preview.  
**Fix:** Add "Preview analysis" toggle in ingest dialog that shows results without persisting.

---

### GAP-15: CORS and WebSocket hardcoded to localhost:3000

**Problem:** `incidents.gateway.ts` cors origin fixed.  
**Fix:** Use env `WEB_ORIGIN` from config.

**File:** `apps/api/src/infrastructure/websocket/incidents.gateway.ts`

---

## 15. Recommended Implementation Roadmap

Priority order for another agent:

| Phase | Items | Effort |
|-------|-------|--------|
| **P0** | GAP-05 Hypotheses agent, GAP-12 Retry UI, GAP-10 latestJobId | 2-3 days |
| **P1** | GAP-02 Webhook ingest (Datadog first), GAP-15 env-based CORS | 1 week |
| **P2** | GAP-04 Full streaming, GAP-11 Live page | 1 week |
| **P3** | GAP-03 Copilot chat, GAP-06 Feedback RAG | 2 weeks |
| **P4** | GAP-01 Auth, GAP-07 S3 uploads, GAP-08 LLM abstraction | 2 weeks |
| **P5** | GAP-13 Version history, GAP-09 Persistent activity | 1 week |

---

## 16. Conventions & Gotchas

1. **API route order matters in NestJS:** Static routes (`analytics/trends`, `job/:jobId`) must be registered BEFORE `:id` — currently correct in `incidents.controller.ts`.

2. **Response interceptor:** Never expect raw data from API — always unwrap `{ data }`.

3. **Prisma remediationSteps:** Stored as JSON in DB, parsed to `string[]` in `incident-api.ts` `normalizeIncident`.

4. **Similarity threshold:** Hardcoded `0.8` in `incidents.service.ts` — make configurable via env if tuning needed.

5. **Ollama must be running** or all agents fail with 500.

6. **Migrations:** After schema changes, run `npx prisma migrate dev` (dev) or `migrate deploy` (prod).

7. **WebSocket event naming:** Frontend must use `incident-progress` not `job-progress`.

8. **File upload field name:** Must be `file` (matches `FileInterceptor('file')`).

9. **Turbo monorepo:** Use `pnpm` not npm for dependency consistency.

10. **RootCauseHypothesis UI:** `incident-ai-trust-panel.tsx` renders hypotheses array — will be empty until GAP-05 fixed.

---

## 17. Testing Checklist for Changes

Before marking work complete:

- [ ] `cd apps/api && npm run build` passes
- [ ] `cd apps/web && npm run build` passes
- [ ] Submit logs via ingest dialog → incident appears as PROCESSING → COMPLETED
- [ ] WebSocket activity feed updates during analysis
- [ ] Detail page shows AI summary, RCA, remediation, trust panel
- [ ] Upload file → reanalyze → new timeline events created
- [ ] Accept/Edit/Reject feedback → reflected on incident / next reanalysis
- [ ] Streaming summary visible during PROCESSING (if Ollama streaming works)
- [ ] Failed job sets status FAILED (test by stopping Ollama mid-run)

---

## Quick Reference: Where to Start for Common Tasks

| Task | Start here |
|------|------------|
| Add new API endpoint | `incidents.controller.ts` → service → `incident-api.ts` → hook |
| Add new AI agent | `agents/new.agent.ts` → register in `incidents.module.ts` → call from orchestrator |
| Change LLM prompt | Individual agent file in `agents/` |
| Add UI section to incident detail | `incident-detail-content.tsx` |
| Add realtime event | `incidents.gateway.ts` + `use-incident-socket.ts` |
| DB schema change | `schema.prisma` → migration → `incident.type.ts` (web) |
| External webhook | New module under `modules/integrations/` |

---

**End of handoff document.**  
For questions about Next.js conventions in this repo, see `apps/web/AGENTS.md`.
