# Agent Guidelines for geo-runtime-doltgres

## Project Overview

Private knowledge graph runtime with Postgres storage. Monorepo with pnpm workspaces.

## Architecture

```
packages/
├── ingest/      # HTTP server for GRC-20 edits (:3001)
├── indexer/     # Polls pending edits, materializes graph
├── api/         # Read-only query API (:3002)
├── explorer/    # React SPA for browsing (:3003)
└── shared/      # Config, DB pool, migrations, utilities
```

## Development Commands

```bash
pnpm install          # Install dependencies
pnpm build            # Build all packages
pnpm lint             # Check formatting + linting
pnpm lint:fix         # Auto-fix lint issues

# Start services (separate terminals)
pnpm dev:ingest
pnpm dev:indexer
pnpm dev:api
pnpm dev:explorer

# Database
docker compose up -d  # Start Postgres
pnpm db:migrate       # Run migrations
```

## Code Conventions

- TypeScript strict mode
- Tabs for indentation (biome.json)
- Single quotes, no semicolons
- Run `pnpm lint && pnpm build` before committing

## Testing

- Test files alongside source: `*.test.ts`, `*.test.tsx`
- Run tests: `pnpm --filter @geo-runtime/<package> run test`

## Database Schema

- Migrations in `packages/shared/src/migrations/`
- Entities stored with triples and relations
- See README.md for API endpoints

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