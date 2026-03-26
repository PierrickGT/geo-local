# Orchestrator Validation Helper

Reference content for the orchestrator workflow state machine and acceptance criteria.

## State Machine

```
Backlog ──(human)──> Todo ──(auto)──> In Progress ──(auto)──> Human Review ──(human)──> Merging ──(auto)──> Done
                         │                   │                    │
                         │                   │                    │
                         └───────────────────┴────────────────────┴──> Rework ──(loops back to In Progress)
```

## State Transitions

| From | To | Trigger | Validation |
|------|-----|---------|------------|
| Todo | In Progress | Work start | Workpad created |
| In Progress | Human Review | PR ready | All checks green, feedback addressed |
| Human Review | Merging | Human approval | - |
| Human Review | Rework | Changes requested | - |
| Merging | Done | PR merged | - |
| Rework | In Progress | Fresh start | New branch, fresh workpad |

## Completion Bar for Human Review

Before moving to `Human Review`, verify:

- [ ] Workpad checklist fully complete
- [ ] Acceptance criteria all checked
- [ ] Ticket-provided validation items complete
- [ ] Tests/lint passing
- [ ] PR feedback sweep complete (no actionable comments)
- [ ] PR checks green
- [ ] Branch pushed
- [ ] PR attached to issue
- [ ] `symphony` label on PR

## Blocked-Access Criteria

Only move to `Human Review` with blocker brief when:

- Non-GitHub required tool is missing
- Required non-GitHub auth/permissions unavailable
- All fallback strategies attempted and documented

## Workpad Requirements

- Single persistent comment per issue
- Header: `## Droid Workpad`
- Sections: Plan, Acceptance Criteria, Validation, Notes, Confusions
- Updated after each milestone
- Environment stamp at top: `<hostname>:<abs-path>@<short-sha>

## Rework Reset Checklist

When entering Rework:

1. Close existing PR
2. Delete existing workpad comment
3. Create fresh branch from `origin/main`
4. Create new workpad comment
5. Build fresh plan
6. Execute from scratch
