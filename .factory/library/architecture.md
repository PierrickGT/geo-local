# Architecture

## System Overview

Monorepo with pnpm workspaces. This mission modifies only the `explorer` package — a React SPA for browsing a knowledge graph.

```
packages/
├── ingest/      # HTTP server for GRC-20 edits (:3001) — DO NOT MODIFY
├── indexer/     # Polls pending edits, materializes graph — DO NOT MODIFY
├── api/         # Read-only query API (:3002) — DO NOT MODIFY
├── explorer/    # React SPA for browsing (:3003) — MISSION SCOPE
└── shared/      # Config, DB pool, migrations — DO NOT MODIFY
```

## Explorer Package Structure

```
packages/explorer/src/
├── api/         # API client (fetch wrappers, mutations endpoint)
├── components/  # Reusable UI (EntityTable, StatusBadge, etc.)
├── hooks/       # React Query hooks (useEntities, useMutations)
├── pages/       # Route-level components (EntitiesPage, EntityPage)
├── lib/         # Utilities
└── app/         # Router, layout
```

## Key Patterns

### Mutation Flow
1. User action triggers mutation hook (`useDeleteEntity`, `useCreateEntity`, etc.)
2. Hook calls `submitMutations({ mutations })` → POST `/ingest/edits/build`
3. Response contains edit ID → `pollUntilSettled(editId)` polls GET `/ingest/edits/:id`
4. On `'applied'`: invalidates `entityKeys.all`, refetches entity list
5. On `'failed'`: surfaces error via `result.current.error`

### Batch Delete (New)
- `useDeleteEntities({ ids: string[] })` maps each id to `{ type: 'deleteEntity', params: { id } }`
- All mutations submitted in a single `submitMutations` call (all-or-nothing)
- Same poll + invalidate pattern as single-entity hooks

### EntityTable (Modified)
- Pure presentational component — receives `entities` array and renders table
- Currently: columns = ID, Properties, Status, Created, Updated
- Adding: optional checkbox column controlled via props (`selectedIds`, callbacks)
- Row click navigates to `/entities/:id` — checkboxes use `stopPropagation`

### Selection State (New)
- Managed in `EntitiesPage` via `useState<Set<string>>`
- Cleared on page change (offset change)
- Select-all only affects alive entities on current page
