---
name: linear
description:
  Interact with Linear issues via Linear MCP. Use for querying issues,
  updating states, creating comments, and attaching PRs.
---

# Linear (via MCP)

Use this skill when working with Linear issues through the connected Linear MCP server.

## Common Operations

### Query an issue by identifier

Use the Linear MCP search or fetch tools to find issues by identifier (e.g., "GEO-123").

### Update issue state

1. First get the team's available states
2. Find the target state ID
3. Update the issue with the new state

### Create or edit comments

Use Linear MCP to:
- Create comments on issues for progress updates
- Edit existing comments to keep workpad current

### Attach a GitHub PR

When a PR is created, attach it to the Linear issue so the relationship is tracked.

## Workflow Integration

### Starting work on an issue

1. Fetch issue details
2. Move to "In Progress" state
3. Create a workpad comment with plan

### Completing work

1. Update workpad with final status
2. Move to "Human Review" or appropriate state
3. Attach PR if created

### Handling rework

1. Read all feedback from issue and PR
2. Move to "Rework" state
3. Create fresh branch from main
4. Start implementation flow again

## Workpad Template

Keep a single comment updated throughout:

```markdown
## Workpad

### Plan
- [ ] 1. Task
  - [ ] 1.1 Subtask

### Acceptance Criteria
- [ ] Criterion

### Validation
- [ ] `pnpm lint`
- [ ] `pnpm build`

### Notes
- Progress updates here

### Confusions
- Only include if something was unclear
```

## Notes

- Use exactly one workpad comment per issue
- Keep it updated as work progresses
- Don't create separate summary comments
