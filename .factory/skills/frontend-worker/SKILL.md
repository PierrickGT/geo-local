---
name: frontend-worker
description: Implements React/frontend features for the explorer package — hooks, components, pages, and tests.
---

# Frontend Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Features that modify the `packages/explorer/` package — React hooks, UI components, page-level components, and their tests.

## Required Skills

None.

## Work Procedure

### 1. Read Context
- Read `mission.md` and `AGENTS.md` from the mission directory
- Read `.factory/library/architecture.md` for system understanding
- Read the feature description from `features.json` carefully

### 2. Investigate Existing Code
Before writing any code, read the files you'll be modifying and the files that contain patterns you need to follow:
- Read existing hook implementations in `packages/explorer/src/hooks/use-mutations.ts`
- Read existing test files to match their patterns exactly
- Read existing component patterns (e.g., `DeleteEntityDialog` in `entity-page.tsx`)
- Read `EntityTable` props and rendering in `entity-table.tsx`

### 3. Write Tests First (Red)
Write failing tests BEFORE implementation. Each test file should:
- Follow existing test patterns in the codebase (see `use-mutations.test.tsx`, `entity-table.test.tsx`, `entities-page.test.tsx`)
- Use the same mock strategy (`vi.mock('~/api/mutations')`)
- Use the same wrapper patterns (`QueryClientProvider`, `MemoryRouter`)
- Cover the behaviors listed in the feature's `expectedBehavior`
- Use `data-testid` attributes for selectors where appropriate

### 4. Implement (Green)
Write the minimal implementation to make tests pass:
- Follow existing code conventions (tabs, single quotes, no semicolons)
- Follow existing patterns (hook structure, dialog pattern, prop interfaces)
- Keep changes minimal and focused

### 5. Run Tests
```bash
pnpm --filter @geo-runtime/explorer run test
```
All tests (existing + new) must pass. If existing tests break, investigate why before modifying them.

### 6. Run Lint and Typecheck
```bash
pnpm lint && pnpm --filter @geo-runtime/explorer exec tsc --noEmit
```
Fix any issues before proceeding.

### 7. Verify
- Confirm all tests pass
- Confirm no lint/type errors
- Review your implementation against the feature's `expectedBehavior` checklist
- Ensure backward compatibility (EntityTable works without new props)

## Example Handoff

```json
{
  "salientSummary": "Implemented useDeleteEntities hook that maps entity IDs to deleteEntity mutations and submits them as a single batch. Added checkbox column to EntityTable with select-all/indeterminate support. Wired selection state and BatchDeleteDialog in EntitiesPage. All 333 existing tests pass plus 22 new tests.",
  "whatWasImplemented": "useDeleteEntities hook in use-mutations.ts (maps ids to mutations, single submitMutations call, pollUntilSettled, cache invalidation, abort support). Optional checkbox column on EntityTable (selectedIds, onToggleSelection, onToggleSelectAll props, indeterminate state, stopPropagation). BatchDeleteDialog and selection state management in entities-page.tsx (Delete N button, confirmation dialog, page change clearing).",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      { "command": "pnpm --filter @geo-runtime/explorer run test", "exitCode": 0, "observation": "All 355 tests passed (333 existing + 22 new)" },
      { "command": "pnpm lint", "exitCode": 0, "observation": "No lint errors" },
      { "command": "pnpm --filter @geo-runtime/explorer exec tsc --noEmit", "exitCode": 0, "observation": "No type errors" }
    ],
    "interactiveChecks": [
      { "action": "Navigated to /entities", "observed": "Entity list loads with checkboxes on alive entities, no checkbox on deleted entities" },
      { "action": "Selected 2 entities via checkboxes", "observed": "Delete (2) button appears in CardHeader" },
      { "action": "Clicked Delete (2), confirmed in dialog", "observed": "Dialog closes, selection clears, entities deleted from list" }
    ],
    "tests": [
      { "file": "packages/explorer/src/hooks/use-mutations.test.tsx", "cases": [
        { "name": "useDeleteEntities maps ids to deleteEntity mutations", "verifies": "VAL-HOOK-001" },
        { "name": "useDeleteEntities polls until settled", "verifies": "VAL-HOOK-002" },
        { "name": "useDeleteEntities invalidates entityKeys.all on success", "verifies": "VAL-HOOK-003" },
        { "name": "useDeleteEntities surfaces error when edit fails", "verifies": "VAL-HOOK-004" },
        { "name": "useDeleteEntities surfaces network error", "verifies": "VAL-HOOK-005" },
        { "name": "useDeleteEntities shows isLoading during mutation", "verifies": "VAL-HOOK-006" },
        { "name": "useDeleteEntities aborts on unmount", "verifies": "VAL-HOOK-007" },
        { "name": "useDeleteEntities aborts previous mutation", "verifies": "VAL-HOOK-008" }
      ]},
      { "file": "packages/explorer/src/components/entity-table.test.tsx", "cases": [
        { "name": "no checkbox column without selection props", "verifies": "VAL-TABLE-001" },
        { "name": "checkboxes render with selection props", "verifies": "VAL-TABLE-002" },
        { "name": "deleted rows show spacer", "verifies": "VAL-TABLE-003" },
        { "name": "header checkbox toggles select-all", "verifies": "VAL-TABLE-004" },
        { "name": "header checkbox indeterminate state", "verifies": "VAL-TABLE-005" },
        { "name": "checkbox click does not navigate", "verifies": "VAL-TABLE-006" },
        { "name": "row click outside checkbox navigates", "verifies": "VAL-TABLE-007" },
        { "name": "checkboxes keyboard accessible", "verifies": "VAL-TABLE-008" }
      ]},
      { "file": "packages/explorer/src/pages/entities-page.test.tsx", "cases": [
        { "name": "Delete (N) button appears on selection", "verifies": "VAL-PAGE-001" },
        { "name": "batch delete dialog opens with count", "verifies": "VAL-PAGE-002" },
        { "name": "dialog cancel resets state", "verifies": "VAL-PAGE-003" },
        { "name": "success clears selection and closes dialog", "verifies": "VAL-PAGE-004" },
        { "name": "error keeps dialog open", "verifies": "VAL-PAGE-005" },
        { "name": "delete button disabled with spinner", "verifies": "VAL-PAGE-006" },
        { "name": "selection clears on page change", "verifies": "VAL-PAGE-007" },
        { "name": "select-all only selects alive entities", "verifies": "VAL-PAGE-008" }
      ]}
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- Existing tests break and the fix is unclear
- The feature description is ambiguous or contradictory
- You encounter a bug in existing code that blocks your work
