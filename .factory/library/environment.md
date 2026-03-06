# Environment

Environment variables, external dependencies, and setup notes.

**What belongs here:** Required env vars, external API keys/services, dependency quirks, platform-specific notes.
**What does NOT belong here:** Service ports/commands (use `.factory/services.yaml`).

---

## Environment Variables

The project uses `.env` at the monorepo root with these variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgres://postgres:password@localhost:5433/geo` | Postgres connection string |
| `API_PORT` | `3002` | API server port |
| `INGEST_PORT` | `3001` | Ingest service port |

## External Services

- **Postgres 16** - Running via docker compose on port 5433 (not standard 5432 to avoid conflicts)

## Setup Notes

1. Start postgres: `docker compose up -d`
2. Run migrations: `pnpm db:migrate`
3. Seed data (optional): `pnpm tsx examples/build-entity.ts`
