---
name: create-pr
description: Creates a pull request using the GitHub CLI.
---

Steps:

1. Push the current branch to origin if not already pushed. If there are uncommitted changes, use /commit first.
2. Use `gh pr create` to create the pull request. Keep in mind that the base branch is named `dev`, not `main`.
3. Return the PR URL.

Write a concise PR title and description summarizing the changes. The description should include a comprehensive, yet concise description of everything that changed in the PR.

Do not describe every change verbatim: the diff viewer exists for that. Describe why, not how. Do NOT add Claude co-authorship footer to commits.
