# Documentation

| Document | Description |
|----------|-------------|
| [AGENT-HANDOFF.md](./AGENT-HANDOFF.md) | **Primary handoff doc** — architecture, every folder/file, API, gaps, fix instructions |

## Quick start

```bash
cd infrastructure/docker && docker compose up -d
cd apps/api && npx prisma migrate deploy
ollama pull llama3:8b
pnpm dev
```

- Web: http://localhost:3000/incidents  
- API: http://localhost:4000/api  
