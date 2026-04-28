# geo-local

Self-hosted knowledge graph runtime that replaces IPFS/blockchain with local Postgres storage. Stage, test, and iterate on GRC-20 edits before publishing to the public Geo network.

[https://github.com/PierrickGT/geo-runtime-postgres/raw/main/media/features-showcase.mp4](https://github.com/user-attachments/assets/ffc04f45-07cc-417d-87ea-972f62622b20)

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
- **explorer** — React SPA with Graphite design system for browsing and managing the knowledge graph
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

The explorer SPA (`:3003`) uses the **Graphite** design system — Inter + IBM Plex Mono fonts, electric-blue accent (`#2f5cff`), near-black ink on off-white palette. Built with Tailwind CSS v4, shadcn/ui (CVA), React 19, and ReactFlow.

### Pages

- **Shell** — Fixed sidebar with SVG nav icons, brand block, entity/edits counts; top bar with breadcrumb, sync indicator, and ⌘K search hint
- **Entity List** — Filter bar with type chips, 6-column grid table (checkboxes, color dots, type pills, copy buttons), pagination with mono digits
- **Entity Detail** — Header card with avatar, type pill, and status; two-column layout with tabbed content (Properties / Relations / JSON / History); right rail with graph neighborhood
- **Search** — Big search bar panel, scope chips, empty state with suggestions; auto-detects name vs ID mode, highlighted matches
- **Graph** — Overlay header with node/edge counts, layout chips, legend panel, zoom controls; node selection with accent styling; inspector panel (Open / Expand / Pin / Neighbors / Degree)
- **Edits Queue** — Status tabs (Pending / History / Conflicts); color-coded EditCards (CREATE=green, UPDATE=blue, RELATION=purple) with before/after diff panels showing decoded ops
- **Create/Edit Forms** — FormSection layout, dynamic property rows, sticky action bar

### Backend support

The query API now exposes `decodedOps` on edit responses, providing structured operation data from the indexer for the diff panels in the Edits Queue.

### Mutation flow

Submit to ingest → poll edit status → navigate on success. All mutations are reflected in real-time via TanStack Query cache invalidation.

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
