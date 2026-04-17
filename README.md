# geo-local

Self-hosted knowledge graph runtime that replaces IPFS/blockchain with local Postgres storage. Stage, test, and iterate on GRC-20 edits before publishing to the public Geo network.

https://github.com/PierrickGT/geo-runtime-postgres/raw/main/media/features-showcase.mp4

## Architecture

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  ingest  │────▶│ Postgres │◀────│   api    │◀────│ explorer │
│ :3001    │     │  :5433   │     │  :3002   │     │  :3003   │
└──────────┘     └────┬─────┘     └──────────┘     └──────────┘
                      │
                 ┌────┴─────┐
                 │ indexer  │
                 │ (poll)   │
                 └──────────┘
```

- **ingest** — HTTP server accepting GRC-20 encoded edits (binary or JSON mutations)
- **indexer** — Polls pending edits, decodes ops, materializes entities/relations/triples
- **api** — Read-only query API for the materialized graph
- **explorer** — React SPA for browsing and managing the knowledge graph with entity CRUD, search, and graph visualization
- **shared** — Config, DB pool, migrations, ID/value utilities

## Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/)

## Quickstart

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env and set SPACE_ID (required)

# 3. Start everything (Postgres, migrations, all services)
pnpm dev
```

Services will be available at:
- **Explorer UI** — http://localhost:3003
- **Query API** — http://localhost:3002
- **Ingest** — http://localhost:3001

### Start services individually

```bash
pnpm dev:ingest
pnpm dev:indexer
pnpm dev:api
pnpm dev:explorer
```

### Reset the database

Wipes all data, restarts Postgres, and re-runs migrations (including seeded system entities):

```bash
pnpm db:reset
```

## Configuration

Copy `.env.example` to `.env` and adjust:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgres://postgres:password@localhost:5433/geo` | Postgres connection string |
| `INGEST_PORT` | `3001` | Ingest server port |
| `API_PORT` | `3002` | API server port |
| `SPACE_ID` | **required** | Default space ID for edits |
| `POLL_INTERVAL_MS` | `1000` | Indexer poll interval |
| `BATCH_SIZE` | `10` | Edits per poll cycle |
| `LOG_LEVEL` | `info` | Log level (debug, info, warn, error) |

## API Endpoints

### Ingest (`:3001`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/edits` | Submit pre-encoded binary edit (`application/octet-stream`) |
| POST | `/edits/build` | Submit JSON mutations, build edit server-side |

Supported mutation types: `createEntity`, `updateEntity`, `deleteEntity`, `createRelation`, `deleteRelation`.

### Query API (`:3002`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/entities` | List entities (`?type=`, `?limit=`, `?offset=`) |
| GET | `/api/entities/:id` | Entity detail with triples and relations |
| GET | `/api/entities/:id/relations` | Entity relations (`?type=`, `?direction=`) |
| GET | `/api/search` | Text search (`?q=`, `?limit=`) |
| GET | `/api/edits` | List edits (`?status=`, `?limit=`) |
| GET | `/api/edits/:id` | Single edit by ID (status, opCount, errorMsg) |

## Explorer

The explorer SPA (`:3003`) provides a full UI for managing knowledge graph entities:

- **Entity List** — Browse, filter by type, paginate, create new entities
- **Entity Detail** — View properties (triples), outgoing/incoming relations
- **Create Entity** — Form with name, description, types, and dynamic properties
- **Edit Entity** — Modify name, description, types, add/remove properties
- **Relations** — Add and remove relations between entities via dialogs
- **Delete Entity** — Soft-delete entities with confirmation dialog
- **Search** — Full-text search across entity properties
- **Graph** — Force-directed graph visualization with ReactFlow

Mutation flow: submit to ingest → poll edit status → navigate on success. All mutations are reflected in real-time via TanStack Query cache invalidation.

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
