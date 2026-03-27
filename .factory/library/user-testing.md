# User Testing

## Validation Surface

**Primary surface:** Browser UI at `http://localhost:3003/entities`

**Tools:**
- `agent-browser` for all page-level assertions (VAL-PAGE-*, VAL-CROSS-*)
- `vitest` for component/hook unit tests (VAL-HOOK-*, VAL-TABLE-*)

**Setup:**
- Dev server already running at `http://localhost:3003` (PID 1474)
- Backend services pre-running (ingest :3001, api :3002, postgres :5433)
- Do NOT start/stop any services

**Entry point:** Navigate to `http://localhost:3003/entities` — this is the default landing page (redirects from `/`)

**Seed data:** Use existing entities in the database. No special seeding needed.

## Validation Concurrency

**Surface: agent-browser (lightweight app)**
- Each instance: ~300 MB RAM
- Dev server: ~200 MB (shared, already running)
- Machine: 18 GB RAM, 11 CPUs, moderate memory pressure
- Usable headroom: ~12 GB * 0.7 = 8.4 GB
- Max concurrent validators: **3** (3 * 300 MB + 200 MB = 1.1 GB, well within budget)

## Isolation Notes

- All VAL-PAGE and VAL-CROSS assertions operate on the same running dev server
- Entity selection state is client-side only — no server-side state to reset between tests
- Page refresh clears all client-side state
- After each batch delete test, entities are actually deleted from the DB — plan test ordering accordingly (delete least important entities first, or create test entities)
- Batch delete e2e tests should run LAST since they mutate DB state (entities are permanently deleted)

## Known Frictions

- **`wait --load networkidle` timeout:** agent-browser's networkidle wait times out on /entities due to Agentation MCP overlay websocket connections. Use `wait 2000` as a fallback — page content loads fine.
- **Agentation overlay interference:** The Agentation MCP annotation panel injects extra checkboxes/buttons into the page DOM. Filter these out when verifying entity checkbox states (exclude elements inside `.agentation` containers).
- **Fast mutations:** Loading/error states in dialogs complete too fast (~1-2s) to capture via screenshot. Use code review to verify these paths.
- **Network request capture:** Enable network tracking BEFORE triggering mutations if you need to capture API calls. The POST to /ingest/edits/build fires immediately on dialog confirm.
