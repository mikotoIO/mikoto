---
name: rebase
description: Rebases the current branch onto the latest dev branch.
---

Steps:

1. Fetch the latest changes from origin.
2. Rebase the current branch onto `origin/dev`.
3. If there are conflicts, resolve conflicts automatically, trying to preserve features from both branches.

## Conflict resolution

**If no conflicts:** Report success — how many commits were replayed, new HEAD.

**If conflicts occur**, handle each one:

1. Run `git diff --name-only --diff-filter=U` to list conflicted files.
2. For each conflicted file, read the file and examine the conflict markers.
3. Attempt trivial resolution: if one side is clearly a superset (the other side made no changes in that region), resolve automatically.
4. For genuine conflicts, show the user both sides with surrounding context using AskUserQuestion. Offer:
   - **Keep ours** — accept the current branch's version
   - **Keep theirs** — accept the upstream version
   - **Abort rebase** — run `git rebase --abort` and stop
5. After resolving all files in the current step: `git add <files>` and `git rebase --continue`.
6. Repeat until the rebase completes or the user aborts.

Always use `dev` as the base branch, not `main` or `master`.
