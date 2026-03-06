---
name: frontend-worker
description: Implements React/Vite frontend features for the Knowledge Graph Explorer
---

# Frontend Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Use this worker for features that involve:
- Creating React components and pages
- Implementing API client functions and hooks
- Configuring Vite, TypeScript, or Tailwind
- Building UI components (tables, forms, visualizations)

## Work Procedure

### 1. Understand the Feature

Read the feature description carefully. Identify:
- What files need to be created or modified
- What dependencies are needed
- What API endpoints are involved (if any)

### 2. Write Tests First (Red)

Before implementing:
- Create a test file alongside the component/function
- Write failing tests that describe expected behavior
- Run tests to confirm they fail: `pnpm --filter @geo-runtime/explorer run test`

### 3. Implement (Green)

Implement the feature to make tests pass:
- Follow existing code patterns in the codebase
- Use TypeScript strictly
- Follow biome.json style (tabs, single quotes, no semicolons)

### 4. Manual Verification

Start the dev server and verify in browser:
```bash
pnpm dev:api &
pnpm dev:explorer
```

Then use agent-browser to verify:
- Component renders without errors
- User interactions work as expected
- API calls succeed (check network tab)
- Error states display correctly

### 5. Run Quality Gates

Before marking complete:
```bash
pnpm --filter @geo-runtime/explorer run typecheck
pnpm --filter @geo-runtime/explorer run lint
pnpm --filter @geo-runtime/explorer run test
```

All must pass.

### 6. Commit and Handoff

Commit changes with descriptive message, then provide thorough handoff.

## Example Handoff

```json
{
  "salientSummary": "Implemented entities-page with type filter and pagination. Tests cover filtering, pagination, and error states. Verified manually with agent-browser.",
  "whatWasImplemented": "Created src/pages/entities-page.tsx with entity list, type filter dropdown, and pagination controls. Type filter fetches types from /api/entities with type filter on TYPE relations. URL syncs ?type=, ?limit=, ?offset=. Added tests for loading, empty, and error states.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      { "command": "pnpm --filter @geo-runtime/explorer run typecheck", "exitCode": 0, "observation": "No type errors" },
      { "command": "pnpm --filter @geo-runtime/explorer run lint", "exitCode": 0, "observation": "No lint errors" },
      { "command": "pnpm --filter @geo-runtime/explorer run test", "exitCode": 0, "observation": "8 tests passed" }
    ],
    "interactiveChecks": [
      { "action": "Navigated to /entities", "observed": "List of 20 entities rendered with pagination controls" },
      { "action": "Clicked Next page", "observed": "URL changed to offset=20, new entities loaded" },
      { "action": "Selected type filter", "observed": "URL updated with ?type=, list filtered" },
      { "action": "Clicked entity row", "observed": "Navigated to /entities/:id detail page" }
    ]
  },
  "tests": {
    "added": [
      { "file": "src/pages/entities-page.test.tsx", "cases": [
        { "name": "renders entity list", "verifies": "basic rendering" },
        { "name": "shows loading state", "verifies": "loading indicator" },
        { "name": "handles empty results", "verifies": "empty state" },
        { "name": "paginates correctly", "verifies": "pagination controls" },
        { "name": "filters by type", "verifies": "type filter" },
        { "name": "syncs URL params", "verifies": "URL state" },
        { "name": "handles API error", "verifies": "error state" },
        { "name": "navigates on row click", "verifies": "entity navigation" }
      ]}
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- Feature depends on an API endpoint that doesn't exist
- Cannot complete feature without violating mission boundaries
- Requirements are ambiguous and need clarification
- Blocking bugs in existing code prevent progress
