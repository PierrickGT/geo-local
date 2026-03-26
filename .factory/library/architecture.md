# Architecture

Architectural decisions, patterns, and design notes for the Entity CRUD mission.

---

## Mutation Flow Architecture

```
User Action → React Component → useMutation hook
  → POST /ingest/edits/build (via Vite proxy to :3001)
  → Ingest creates pending edit in DB
  → Hook polls GET /api/edits/:id (via Vite proxy to :3002)
  → Indexer picks up pending edit, processes GRC-20 ops
  → Edit status → 'applied'
  → Hook detects applied, invalidates TanStack Query caches
  → UI refetches fresh data
```

## Key Design Decisions

- **Shared EntityForm**: Single component for create and edit modes, controlled by `mode` prop and `initialData`
- **Diff computation for edit**: Compare initial entity triples against form state. Changed values → `values` array, removed properties → `unset` array
- **Polling in hooks**: Custom polling logic with 60s timeout, cleanup on unmount, error handling for `failed` status
- **Mutation API client**: Separate from read API client (`api/mutations.ts` vs `api/client.ts`) since mutations go to a different server

## Ingest Server Mutation Types

| Type | Handler | Sync/Async | Notes |
|------|---------|------------|-------|
| createEntity | Graph.createEntity | Sync | Returns { id, ops } |
| updateEntity | Graph.updateEntity | Sync | Returns { id, ops } |
| createRelation | Graph.createRelation | Sync | Returns { id, ops } |
| deleteRelation | Graph.deleteRelation | Sync | Returns { id, ops } |
| deleteEntity | Graph.deleteEntity | **Async** | Queries external API, needs await |

## System Property IDs

Defined in `packages/explorer/src/lib/constants.ts`:
- `NAME_PROPERTY_ID` — entity name triple
- `DESCRIPTION_PROPERTY_ID` — entity description triple
- `TYPES_PROPERTY_ID` — entity type references

## Mutation Hook Usage Pattern

When using mutation hooks in dialogs or event handlers that need to handle errors inline, use `mutateAsync` + `try/catch` instead of `mutate` + `onSuccess`/`onError`. The mutation hooks expose both patterns via `mapMutationResult`:

- `mutate` — fire-and-forget, use `onSuccess`/`onError` callbacks for side effects
- `mutateAsync` — returns a Promise, use `try/catch` for inline error handling in dialogs

**Convention**: Use `mutateAsync` in Dialog/form submit handlers where you need to keep the dialog open on error and show the error message. Use `mutate` + callbacks for simple fire-and-forget actions (e.g., delete button).

**Note**: The `isLoading` property on `MutationHookReturn` is mapped from TanStack Query's `isPending`. This is documented in the hook file comments.

## Route Ordering Convention

React Router matches routes top-down. When adding nested routes under `/entities/:id` (e.g., `/entities/:id/edit`), place the more specific routes BEFORE the parameterized route to prevent the `:id` param from capturing literal path segments (e.g., `edit` being captured as an entity ID).

## Query Key Convention

- `['entities']` — all entities queries
- `['entities', 'list', params]` — entity list with filters
- `['entities', 'detail', id]` — single entity detail
- `['entities', 'relations', id, params]` — entity relations
- `['entities', 'types']` — available entity types
- `['edits']` — all edits queries
- `['edits', 'list', params]` — edits list with filters
