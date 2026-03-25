---
name: frontend-worker
description: Implements React/Vite frontend features for the Knowledge Graph Explorer
---

# Frontend Worker

NOTE: Startup and cleanup are handled by `mission-worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Use for frontend implementation features in the `packages/explorer` React/Vite app:
- Component creation and migration
- UI refactoring
- State management updates
- Styling and theming changes

## Required Skills

- **agent-browser** - Use for interactive browser verification. Invoke after implementation to verify component behavior in the running app. Critical for mutation flows (create, edit, delete, relations) that need end-to-end browser testing with the ingest server running.

## Work Procedure

### 1. Understand the Feature

Read the feature description and identify:
- What files need to be created or modified
- What components are affected
- What the expected behavior looks like
- Whether the feature requires backend services (ingest/indexer) for E2E testing

### 2. Write Tests First (RED)

Before implementing:
- Write failing tests that describe expected behavior
- For form components: test rendering, validation, submission, error states
- For hooks: test mutation submission, polling behavior, cleanup, error handling
- For pages: test navigation, data loading, user interactions
- Run tests to confirm they fail: `pnpm --filter @geo-runtime/explorer run test`

### 3. Implement (GREEN)

Implement the feature to make tests pass:
- Follow existing code patterns (TypeScript strict, tabs, single quotes, no semicolons)
- Use shadcn/ui components from `~/components/ui/`
- Follow Nova theme conventions
- Use `cn()` utility for conditional classes
- For mutations: use the mutation hooks from `~/hooks/use-mutations.ts`
- For polling: the hooks handle polling — just wire up the UI state (isLoading, error)
- For forms: use the shared EntityForm component for create/edit pages

### 4. Manual Verification with agent-browser

For features that modify UI or add new pages:
1. Ensure required services are running (check services.yaml)
2. Start the explorer dev server: `pnpm dev:explorer`
3. For mutation features, also start: `pnpm dev:ingest` and `pnpm dev:indexer`
4. Use agent-browser to:
   - Navigate to relevant pages
   - Verify component renders without console errors
   - Test user interactions (clicks, typing, navigation)
   - For mutation flows: submit form, verify spinner/polling, verify navigation
   - Verify API calls succeed (check network tab)

Each flow tested = one `interactiveChecks` entry with full sequence and outcome.

### 5. Run Quality Gates

Before marking complete:
```bash
pnpm --filter @geo-runtime/explorer run typecheck
pnpm --filter @geo-runtime/explorer run lint
pnpm --filter @geo-runtime/explorer run test
```

All must pass.

### 6. Commit and Handoff

Commit with descriptive conventional commit message, then provide thorough handoff.

## Example Handoff

```json
{
  "salientSummary": "Migrated StatusBadge to shadcn Badge with variant system. All 4 status states (pending/processing/applied/failed) display correct variant styling. Tests updated and passing.",
  "whatWasImplemented": "Refactored src/components/status-badge.tsx to use shadcn Badge component. Added variant mapping: pending=warning, processing=info, applied=success, failed=destructive. Updated tests in status-badge.test.tsx to verify variant props are used correctly. All existing usages in edits-page.tsx continue to work.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      { "command": "pnpm --filter @geo-runtime/explorer run typecheck", "exitCode": 0, "observation": "No type errors" },
      { "command": "pnpm --filter @geo-runtime/explorer run lint", "exitCode": 1, "observation": "No lint errors" },
      { "command": "pnpm --filter @geo-runtime/explorer run test -- src/components/status-badge.test.tsx", "exitCode": 1, "observation": "4 tests passed" }
    ],
    "interactiveChecks": [
      { "action": "Started dev:explorer on port 3003, navigated to /edits page", "observed": "StatusBadge components render with correct colors: pending=amber, processing=blue, applied=green, failed=red" },
      { "action": "Verified badge styling with browser dev tools", "observed": "Badge uses shadcn variant classes, not custom Tailwind" }
    ]
  },
  "tests": {
    "added": [
      { "file": "src/components/status-badge.test.tsx", "cases": [
        { "name": "renders pending with warning variant", "verifies": "pending status uses warning variant" },
        { "name": "renders processing with info variant", "verifies": "processing status uses info variant" },
        { "name": "renders applied with success variant", "verifies": "applied status uses success variant" },
        { "name": "renders failed with destructive variant", "verifies": "failed status uses destructive variant" }
      ]}
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- Feature depends on an API endpoint or data model that doesn't exist
- Requirements are ambiguous or contradictory
- Cannot proceed without violating mission boundaries
- Blocking bugs in existing code prevent progress
