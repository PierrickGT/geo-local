---
name: commit
description:
  Create a well-formed git commit from current changes using session history for
  rationale and summary; use when asked to commit, prepare a commit message, or
  finalize staged work.
---
# Commit

## Goals

- Produce a commit that reflects the actual code changes and the session context.
- Follow conventional commits (type prefix, short subject, wrapped body).
- Include both summary and rationale in the body.

## Inputs

- Session context for intent and rationale.
- `git status`, `git diff`, and `git diff --staged` for actual changes.
- Repo-specific commit conventions if documented (check CLAUDE.md).

## Steps

1. Read session history to identify scope, intent, and rationale.
2. Inspect the working tree and staged changes:
   ```bash
   git status
   git diff
   git diff --staged
   ```
3. Stage intended changes, including new files (`git add -A`) after confirming scope.
4. Sanity-check newly added files; if anything looks random or likely ignored
   (build artifacts, logs, temp files), flag it before committing.
5. If staging is incomplete or includes unrelated files, fix the index or ask
   for confirmation.
6. Choose a conventional type and optional scope:
   - `feat(scope): ...` - new feature
   - `fix(scope): ...` - bug fix
   - `refactor(scope): ...` - code refactoring
   - `docs(scope): ...` - documentation
   - `test(scope): ...` - tests
   - `chore(scope): ...` - maintenance
7. Write a subject line: imperative mood, <= 72 characters, no trailing period.
8. Write a body that includes:
   - Summary of key changes (what changed)
   - Rationale and trade-offs (why it changed)
   - Tests or validation run (or explicit note if not run)
9. Wrap body lines at 72 characters.
10. Create the commit message with a here-doc or temp file:
    ```bash
    git commit -F <file>
    ```
    Avoid `-m` with `\n` escapes.

## Output

A single commit whose message reflects the session work.

## Template

```
<type>(<scope>): <summary>

Summary:
- <key changes>

Rationale:
- <why>

Tests:
- <command or "not run">
```
