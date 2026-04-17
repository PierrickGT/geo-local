# Agent Guidelines for geo-local

## Project Overview

Private knowledge graph runtime with Postgres storage. Uses `@geoprotocol/geo-sdk` and `@geoprotocol/grc-20` for GRC-20 edit encoding/decoding. Monorepo with pnpm workspaces.

## Architecture

```
packages/
├── ingest/      # HTTP server for GRC-20 edits (:3001)
├── indexer/     # Polls pending edits, decodes ops, materializes graph
├── api/         # Read-only query API (:3002)
├── explorer/    # React SPA for browsing/managing the graph (:3003)
└── shared/      # Config, DB pool, migrations, ID/value utilities
```

## Development Commands

```bash
pnpm install          # Install dependencies
pnpm build            # Build all packages
pnpm lint             # Check formatting + linting
pnpm lint:fix         # Auto-fix lint issues

# Start everything (Postgres + migrations + all services)
pnpm dev

# Start services individually (separate terminals)
pnpm dev:ingest
pnpm dev:indexer
pnpm dev:api
pnpm dev:explorer

# Database
docker compose up -d  # Start Postgres
pnpm db:migrate       # Run migrations
pnpm db:reset         # Drop data, restart Postgres, re-run migrations (with seeded system entities)
```

## Environment Setup

Copy `.env.example` to `.env`. Key variables:

| Variable | Default | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `postgres://postgres:password@localhost:5433/geo` | Postgres on port 5433 |
| `SPACE_ID` | _(empty)_ | Default space ID for edits |
| `INGEST_PORT` | `3001` | |
| `API_PORT` | `3002` | |
| `POLL_INTERVAL_MS` | `1000` | Indexer poll interval |
| `BATCH_SIZE` | `10` | Edits per indexer poll cycle |

## Code Conventions

- TypeScript strict mode
- Tabs for indentation (biome.json)
- Single quotes, no semicolons
- Entity IDs are `char(32)` hex strings (use `idToHex`/`idFromHex` from shared)
- Run `pnpm lint && pnpm build` before committing

## Testing

- Test files alongside source: `*.test.ts`, `*.test.tsx`
- Run tests: `pnpm --filter @geo-local/<package> run test`
- Explorer uses Vitest + Testing Library + jsdom

## Explorer Tech Stack

- **Build**: Vite 6
- **UI**: React 19 + React Router v7 + TanStack Query v5
- **Styling**: Tailwind CSS v4 + shadcn/ui (Radix primitives)
- **Graph**: ReactFlow + D3 force layout
- **Icons**: Lucide React

Explorer pages: entities list, entity detail, create entity, edit entity, edits list, search, force-directed graph.

## API Endpoints

### Ingest (`:3001`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Submit pre-encoded binary edit (`application/octet-stream`) |
| POST | `/build` | Submit JSON mutations array, server builds GRC-20 edit |

Mutation types: `createEntity`, `updateEntity`, `deleteEntity`, `createRelation`, `deleteRelation`.

Headers: `X-Space-ID` overrides default space.

### Query API (`:3002`)

| Method | Path | Params |
|--------|------|--------|
| GET | `/entities` | `?type=`, `?limit=`, `?offset=` |
| GET | `/entities/:id` | Returns entity + triples + outgoing/incoming relations |
| GET | `/entities/:id/relations` | `?dir=outgoing\|incoming`, `?limit=`, `?offset=` |
| GET | `/search` | `?q=` (required), `?limit=` |
| GET | `/edits` | `?status=`, `?limit=` |
| GET | `/edits/:id` | Single edit status |
| GET | `/types` | All distinct type entities |

Response format: snake_case DB columns are converted to camelCase in JSON.

## Database Schema

Migrations in `packages/shared/src/migrations/`. Five tables:

- **edits** — Canonical event log of GRC-20 encoded edits (status: pending → processing → applied/failed)
- **entities** — Materialized graph entities (`id char(32) PK`)
- **triples** — Property values on entities (`entity_id, property_id, language` PK; `value jsonb`)
- **relations** — Directed edges between entities (`id char(32) PK`, indexed on `from_id`, `to_id`, `relation_type`)
- **value_refs** — Referenceable value slots

The initial migration also seeds ~30 system entities from `@geoprotocol/geo-sdk` SystemIds (Type, Data type, Text, Integer, Property, Relation, etc.) with their name triples and type relations. These use reserved sequential IDs (`0000...0001` through `0000...0062`) to avoid collisions with GRC-20 hashes.

Well-known property IDs are documented in `packages/explorer/src/lib/constants.ts`.

## PR Workflow

1. Run `pnpm lint && pnpm build` locally
2. Use commit skill for conventional commits
3. Use push skill to create/update PR
4. Use land skill to merge when approved

<!-- opensrc:start -->

## Source Code Reference

Source code for dependencies is available in `opensrc/` for deeper understanding of implementation details.

See `opensrc/sources.json` for the list of available packages and their versions.

Use this source code when you need to understand how a package works internally, not just its types/interface.

### Fetching Additional Source Code

To fetch source code for a package or repository you need to understand, run:

```bash
npx opensrc <package>           # npm package (e.g., npx opensrc zod)
npx opensrc pypi:<package>      # Python package (e.g., npx opensrc pypi:requests)
npx opensrc crates:<package>    # Rust crate (e.g., npx opensrc crates:serde)
npx opensrc <owner>/<repo>      # GitHub repo (e.g., npx opensrc vercel/ai)
```

<!-- opensrc:end -->