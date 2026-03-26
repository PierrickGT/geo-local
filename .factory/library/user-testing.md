# User Testing

Testing surface: tools, URLs, setup steps, known quirks.

---

## Validation Surface

**Surface:** Browser-based React SPA (Vite dev server)

**Tool:** `agent-browser` for interactive validation

**Required Services:**
- Postgres on port 5433 (Docker)
- API server on port 3002
- Ingest server on port 3001 (for mutation flows)
- Indexer (for mutation processing)
- Explorer dev server on port 3003

---

## Validation Concurrency

**Max concurrent validators: 3**

**Rationale:**
- Explorer is a lightweight React SPA
- Each agent-browser instance uses ~300-400MB RAM
- Dev server adds ~200MB
- Ingest + indexer add ~300MB
- Machine has 18GB total, ~6GB baseline usage, moderate swap pressure
- Available headroom: ~4-6GB → 70% = ~3-4GB usable
- 3 concurrent validators = ~1.2GB + services = ~2GB (within budget)

---

## Testing Tools

- **agent-browser** - Primary tool for browser-based testing
- **curl** - API endpoint verification

## Application URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Explorer | http://localhost:3003 | Main testing surface |
| API | http://localhost:3002/api | Read-only API access |
| Ingest | http://localhost:3003/ingest | Mutation API (proxied via Vite) |

## Setup Steps

1. Start postgres: `docker compose up -d`
2. Start API: `pnpm dev:api`
3. Start ingest (for mutations): `pnpm dev:ingest`
4. Start indexer (for mutation processing): `pnpm dev:indexer`
5. Start explorer: `pnpm dev:explorer`
6. Open http://localhost:3003

## Test Accounts/Fixtures

- No authentication required
- Use seeded data from `examples/build-entity.ts`
- Run `pnpm tsx examples/build-entity.ts` to create test data

## Key Testing Flows

### Read Flows
1. **Entity List:** Load → paginate → filter by type → click entity
2. **Entity Detail:** View triples → view relations → click linked entity
3. **Search:** Type query → view results → click result
4. **Edits:** View list → filter by status

### Mutation Flows (require ingest + indexer)
1. **Create Entity:** Click "Create Entity" → fill form → submit → verify spinner → verify navigation → verify in list
2. **Edit Entity:** Open entity → click Edit → modify fields → submit → verify updates
3. **Add Relation:** Open entity → click "Add Relation" → fill dialog → submit → verify in panel
4. **Remove Relation:** Click remove icon → confirm → verify removed from panel
5. **Delete Entity:** Open entity → click Delete → confirm → verify navigation → verify status

## Known Quirks

- Type filter options come from TYPE relations - may be empty if no typed entities exist
- Some entity pages show 404 console errors for stale relation references (pre-existing)
- Relation panel may show 404 console errors for relation type IDs being fetched as entity IDs (the panel tries to resolve the relation property ID as an entity name). This is cosmetic and doesn't affect functionality.
- Mutation flows require both ingest server AND indexer running — edits stay in `pending` without indexer
- Polling has a 60s timeout — if indexer is slow, tests may timeout
- Entity list ordered by `created_at DESC` — new entities appear on first page

## Flow Validator Guidance: Browser UI

### Isolation Rules

- **No auth required** - All pages are publicly accessible
- **Mutation isolation** - Each mutation flow creates unique entities with unique names (use timestamps or UUIDs in entity names) to avoid collisions between parallel validators
- **Session isolation** - Use unique `agent-browser` session IDs
- **Shared data** - Validators share the same dataset — mutation tests must use unique entity names

### Boundaries

- Do NOT modify existing seeded entities — only create new ones for testing
- Do NOT use browser localStorage to persist state between tests
- Each flow validator gets its own browser session - close when done
- After mutation tests, do NOT attempt to clean up created entities

### Constraints for Parallel Testing

- Each validator should use a unique session ID suffix
- Entity names must be unique per validator (e.g., prefix with session ID)
- Clicking navigation links updates browser history - each session has isolated history
- URL state (filters, search query) is per-session, not global

### Test Data Reference

- 160+ entities available in the system
- Entity IDs are 32-char hex strings
- System property IDs: NAME_PROPERTY_ID, DESCRIPTION_PROPERTY_ID, TYPES_PROPERTY_ID (in lib/constants.ts)
