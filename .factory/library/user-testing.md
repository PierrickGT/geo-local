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

---

## Flow Validator Guidance: Browser UI

### Isolation Rules

- **No auth required** - All pages are publicly accessible
- **Read-only operations** - All tests are read-only, no data modification
- **Session isolation** - Use unique `agent-browser` session IDs (e.g., `138b5a658cdd__f1`, `138b5a658cdd__f2`)
- **Shared data** - All validators share the same 157 seeded entities - this is fine for read-only tests

### Boundaries

- Do NOT create, modify, or delete any data
- Do NOT use browser localStorage to persist state between tests
- Each flow validator gets its own browser session - close when done

### Constraints for Parallel Testing

- Each validator should use a unique session ID suffix
- Clicking navigation links updates browser history - each session has isolated history
- URL state (filters, search query) is per-session, not global

### Test Data Reference

- 157 entities available in the system
- Entities have TYPE relations for filtering
- Some entities have triples (properties) and relations (outgoing/incoming)
- Entity IDs are 32-char hex strings
