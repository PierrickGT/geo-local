---
name: land
description:
  Land a PR by monitoring conflicts, resolving them, waiting for checks, and
  merging when green. Use when asked to land, merge, or shepherd a PR to completion.
---

# Land

## Goals

- Ensure PR is conflict-free with main.
- Keep CI green and fix failures.
- Merge the PR once checks pass.
- Do not yield until PR is merged.

## Preconditions

- `gh` CLI is authenticated.
- You are on the PR branch with clean working tree.

## Steps

1. Get PR context:
   ```bash
   branch=$(git branch --show-current)
   pr_number=$(gh pr view --json number -q .number)
   pr_title=$(gh pr view --json title -q .title)
   ```

2. If uncommitted changes exist, commit and push first.

3. Check mergeability:
   ```bash
   mergeable=$(gh pr view --json mergeable -q .mergeable)
   if [ "$mergeable" = "CONFLICTING" ]; then
     # Run pull skill to resolve, then push skill
   fi
   ```

4. Watch CI checks:
   ```bash
   gh pr checks --watch
   ```

5. If checks fail:
   - Pull logs: `gh run view <run-id> --log`
   - Fix locally, commit with `commit` skill, push with `push` skill
   - Re-run checks

6. When green and review addressed, merge:
   ```bash
   gh pr merge --squash --subject "$pr_title"
   ```

## Review Handling

- Human review comments are blocking before merge
- Fetch inline comments:
  ```bash
  gh api repos/{owner}/{repo}/pulls/<pr>/comments
  ```
- Reply to comments with fixes before merging

## Failure Handling

- Identify flaky failures vs real failures
- If CI auto-fix commits don't trigger new run: merge main, add commit, force-push
- Wait and re-check if mergeability is `UNKNOWN`
- Do not merge while outstanding review comments exist
