# Incident Intelligence Platform

AI-powered incident investigation: multi-agent analysis, vector similarity, human feedback, and realtime pipeline visibility.

## Documentation

**Start here for full handoff to another developer or coding agent:**

→ **[docs/AGENT-HANDOFF.md](./docs/AGENT-HANDOFF.md)**

Includes: folder structure, every file's purpose, API reference, WebSocket events, gaps, and step-by-step fix instructions.

## Quick start

```bash
cd infrastructure/docker && docker compose up -d
cd apps/api && npx prisma migrate deploy
ollama pull llama3:8b
pnpm dev
```

| Service | URL |
|---------|-----|
| Web dashboard | http://localhost:3000/incidents |
| API | http://localhost:4000/api |

## Stack

- **API:** NestJS, Prisma, PostgreSQL + pgvector, BullMQ, Redis, Ollama
- **Web:** Next.js 16, React Query, Zustand, Socket.io, Recharts
