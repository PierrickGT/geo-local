---
name: pull
description:
  Pull latest origin/main into the current local branch and resolve merge
  conflicts. Use when syncing a feature branch with origin or performing
  merge-based updates.
---

# Pull

## Workflow

1. Verify git status is clean or commit/stash changes first:
   ```bash
   git status
   ```

2. Enable rerere for conflict resolution memory:
   ```bash
   git config rerere.enabled true
   git config rerere.autoupdate true
   ```

3. Fetch latest refs:
   ```bash
   git fetch origin
   ```

4. Sync the remote feature branch first (catches remote auto-commits):
   ```bash
   git pull --ff-only origin $(git branch --show-current)
   ```

5. Merge origin/main with enhanced conflict context:
   ```bash
   git -c merge.conflictstyle=zdiff3 merge origin/main
   ```

6. If conflicts appear, resolve them (see guidance below), then:
   ```bash
   git add <files>
   git commit  # or git merge --continue
   ```

7. Verify with project checks:
   ```bash
   pnpm lint && pnpm build
   ```

## Conflict Resolution Guidance

**Inspect before editing:**
- `git status` - list conflicted files
- `git diff --merge` - see conflict hunks
- `git diff :1:path :2:path` - compare base vs ours
- `git diff :1:path :3:path` - compare base vs theirs

**With zdiff3 style:**
- `<<<<<<<` ours, `|||||||` base, `=======` split, `>>>>>>>` theirs
- Focus on the differing core, not matching context lines

**Resolution approach:**
1. State what each side is trying to achieve
2. Identify the shared goal or if one side supersedes
3. Decide final behavior first, then edit code to match
4. Prefer preserving invariants and API contracts

**Best practices:**
- Resolve one file at a time, rerun tests after each batch
- Use `ours/theirs` only when certain one side should win entirely
- For generated files: resolve source conflicts first, then regenerate
- After resolving: `git diff --check` to ensure no markers remain

## When to Ask

Only ask when:
- Resolution depends on product intent not inferable from code
- Conflict crosses user-visible API/contract
- Two equivalent designs with no clear signal
- Data loss or irreversible side effects possible

Otherwise: make best-effort decision, document rationale, proceed.
