---
name: backend-worker
description: Implements backend API and ingest server changes for the Knowledge Graph runtime
---

# Backend Worker

NOTE: Startup and cleanup are handled by `mission-worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Use for backend implementation features in `packages/api` or `packages/ingest`:
- New API endpoints
- Ingest server mutation handlers
- Type changes in shared packages

## Required Skills

None for this mission.

## Work Procedure

### 1. Understand the Feature

Read the feature description and identify:
- What packages are affected (api, ingest, shared)
- What endpoints need to be added or modified
- What the request/response types look like
- How to verify the change (curl, test)

### 2. Investigate Existing Patterns

Before writing code:
- Read the existing routes.ts in the target package to understand patterns
- Read existing types and handlers
- Check how similar endpoints are structured
- Note Express middleware, error handling, and response formatting conventions

### 3. Write Tests First (RED)

Write failing tests that describe expected behavior:
- API endpoint tests: use supertest or direct HTTP assertions
- For ingest: test mutation handler behavior
- Run tests to confirm they fail

### 4. Implement (GREEN)

Implement the feature:
- Follow existing code patterns (TypeScript strict, tabs, single quotes, no semicolons)
- Keep changes minimal and focused
- For new endpoints: add proper error handling (404, 400, 500)
- For route ordering: be careful with Express parameter routes vs collection routes

### 5. Verify with curl

Test the endpoint directly:
```bash
# Start the service if needed
pnpm dev:api  # or pnpm dev:ingest

# Test with curl
curl -s http://localhost:3002/api/edits/<id>
```

Document the curl commands and responses in your handoff.

### 6. Run Quality Gates

```bash
pnpm --filter @geo-runtime/<package> run build
pnpm lint
```

### 7. Commit and Handoff

Commit with descriptive conventional commit message, then provide thorough handoff.

## Example Handoff

```json
{
  "salientSummary": "Added GET /edits/:id endpoint to API server returning single edit with all fields. Returns 404 for non-existent IDs. Route ordered after GET /edits to prevent shadowing.",
  "whatWasImplemented": "Added GET /edits/:id route in packages/api/src/routes.ts. Query selects from edits table by id, formats with formatRow. Returns 200 with edit JSON or 404 with error message. Route registered after GET /edits collection route.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      { "command": "pnpm --filter @geo-runtime/api run build", "exitCode": 0, "observation": "No build errors" },
      { "command": "curl -s http://localhost:3002/api/edits/<known-id>", "exitCode": 0, "observation": "200 with edit JSON including id, status, name, opCount, createdAt" },
      { "command": "curl -s http://localhost:3002/api/edits/00000000000000000000000000000000", "exitCode": 0, "observation": "404 with { error: 'Edit not found' }" },
      { "command": "curl -s http://localhost:3002/api/edits?limit=1", "exitCode": 0, "observation": "200 with edits list (no regression)" }
    ],
    "interactiveChecks": []
  },
  "tests": {
    "added": [
      { "file": "packages/api/src/routes.test.ts", "cases": [
        { "name": "GET /edits/:id returns edit for existing ID", "verifies": "200 response with correct fields" },
        { "name": "GET /edits/:id returns 404 for non-existent ID", "verifies": "404 with error message" }
      ]}
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- Feature requires changes to the indexer package internals (off-limits)
- Feature requires new database migrations (not allowed)
- Requirements are ambiguous about endpoint behavior
- Existing bugs in the API/ingest server block progress
