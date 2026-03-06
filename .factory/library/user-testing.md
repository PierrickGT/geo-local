# User Testing

Testing surface: tools, URLs, setup steps, known quirks.

---

## Testing Tools

- **agent-browser** - Primary tool for browser-based testing
- **curl** - API endpoint verification

## Application URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Explorer | http://localhost:3003 | Main testing surface |
| API | http://localhost:3002/api | Direct API access |

## Setup Steps

1. Start postgres: `docker compose up -d`
2. Start API: `pnpm dev:api`
3. Start explorer: `pnpm dev:explorer`
4. Open http://localhost:3003

## Test Accounts/Fixtures

- No authentication required
- Use seeded data from `examples/build-entity.ts`
- Run `pnpm tsx examples/build-entity.ts` to create test data

## Key Testing Flows

1. **Entity List:** Load → paginate → filter by type → click entity
2. **Entity Detail:** View triples → switch relation tabs → click linked entity
3. **Search:** Type query → view results → click result
4. **Edits:** View list → filter by status
5. **Graph:** Load → click node → double-click to expand → drag/pin

## Known Quirks

- Type filter options come from TYPE relations - may be empty if no typed entities exist
- Graph loads 50 entities by default - performance may vary with dataset size
- API is read-only for this mission (no POST/PUT/DELETE)
