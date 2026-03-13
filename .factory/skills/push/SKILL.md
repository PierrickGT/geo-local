---
name: push
description:
  Push current branch changes to origin and create or update the corresponding
  pull request; use when asked to push, publish updates, or create pull request.
---

# Push

## Prerequisites

- `gh` CLI is installed and available in `PATH`.
- `gh auth status` succeeds for GitHub operations.

## Goals

- Push current branch changes to `origin` safely.
- Create a PR if none exists, otherwise update the existing PR.
- Keep branch history clean when remote has moved.

## Related Skills

- `pull`: use when push is rejected due to non-fast-forward or stale branch.

## Steps

1. Identify current branch and confirm remote state:
   ```bash
   branch=$(git branch --show-current)
   git fetch origin
   ```

2. Run local validation before pushing:
   ```bash
   pnpm lint && pnpm build
   ```

3. Push branch to `origin` with upstream tracking:
   ```bash
   git push -u origin HEAD
   ```

4. If push is rejected:
   - For non-fast-forward or sync problems: run the `pull` skill
   - For auth/permissions errors: surface the exact error
   - Only use `--force-with-lease` when history was rewritten locally

5. Ensure a PR exists:
   ```bash
   pr_state=$(gh pr view --json state -q .state 2>/dev/null || true)
   if [ "$pr_state" = "MERGED" ] || [ "$pr_state" = "CLOSED" ]; then
     echo "Branch tied to closed PR; create new branch"
     exit 1
   fi
   ```

6. Create or update PR with a clear title:
   ```bash
   if [ -z "$pr_state" ]; then
     gh pr create --title "$pr_title"
   else
     gh pr edit --title "$pr_title"
   fi
   ```

7. Return the PR URL:
   ```bash
   gh pr view --json url -q .url
   ```

## Notes

- Do not use `--force`; only `--force-with-lease` as last resort.
- Distinguish sync problems from auth/permission problems.
- Use `pull` skill for non-fast-forward issues.
