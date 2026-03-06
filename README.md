# geo-runtime-postgres

Private, self-hosted knowledge graph runtime that replaces IPFS/blockchain with local Postgres storage. Stage, test, and iterate on GRC-20 edits before publishing to the public Geo network.

## Architecture

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  ingest  │────▶│ Postgres │◀────│   api    │
│ :3001    │     │  :5433   │     │  :3002   │
└──────────┘     └────┬─────┘     └──────────┘
                      │
                 ┌────┴─────┐
                 │ indexer  │
                 │ (poll)   │
                 └──────────┘
```

- **ingest** — HTTP server accepting GRC-20 encoded edits (binary or JSON mutations)
- **indexer** — Polls pending edits, decodes ops, materializes entities/relations/triples
- **api** — Read-only query API for the materialized graph
- **shared** — Config, DB pool, migrations, ID/value utilities

## Quickstart

```bash
# Start Postgres
docker compose up -d

# Install dependencies
pnpm install

# Run migrations
pnpm db:migrate

# Start services (in separate terminals)
pnpm dev:ingest
pnpm dev:indexer
pnpm dev:api
```

## Configuration

Copy `.env.example` to `.env` and adjust:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgres://postgres:password@localhost:5433/geo` | Postgres connection string |
| `INGEST_PORT` | `3001` | Ingest server port |
| `API_PORT` | `3002` | API server port |
| `SPACE_ID` | | Default space ID for edits |
| `POLL_INTERVAL_MS` | `1000` | Indexer poll interval |
| `BATCH_SIZE` | `10` | Edits per poll cycle |
| `LOG_LEVEL` | `info` | Log level (debug, info, warn, error) |

## API Endpoints

### Ingest (`:3001`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/edits` | Submit pre-encoded binary edit (`application/octet-stream`) |
| POST | `/edits/build` | Submit JSON mutations, build edit server-side |

### Query API (`:3002`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/entities` | List entities (`?type=`, `?limit=`, `?offset=`) |
| GET | `/api/entities/:id` | Entity detail with triples and relations |
| GET | `/api/entities/:id/relations` | Entity relations (`?type=`, `?direction=`) |
| GET | `/api/search` | Text search (`?q=`, `?limit=`) |
| GET | `/api/edits` | List edits (`?status=`, `?limit=`) |

## Examples

```bash
# Create an entity via binary edit
npx tsx examples/create-entity.ts

# Create via JSON mutations
npx tsx examples/build-entity.ts

# Query an entity
npx tsx examples/query-entity.ts <entity-id>
```

## Development

```bash
pnpm build          # Build all packages
pnpm lint           # Check formatting + linting
pnpm lint:fix       # Auto-fix
```
