---
name: commit-helper
description: Generate a git commit message that matches this repository's conventions by analyzing recent history and the staged diff. Use when the user asks to write a commit message, "commit", or draft a commit for staged changes in the Intelliceed PatientApp Mobile v2 repo.
---

# Commit Helper (RN PatientApp)

Draft a commit message that mirrors the project's established style. Read-only analysis — never run
`git commit`, `git add`, or `git push` yourself; output the message for the developer to use.

## Workflow

### Step 1 — Learn the repo's convention
Run and study recent history:

```bash
git log --oneline -20
git log -3 --format='%s%n%n%b'
```

Observed conventions in this repo (verify they still hold, don't assume):
- **Free-form subjects, NOT Conventional Commits** — no `feat:`/`fix:` prefixes.
- Subjects are short and often carry a ticket/branch tag, e.g. `enhancement/HS-3130-Add items style`,
  or a plain description like `code cleanup`.
- English only. Imperative or noun-phrase style, capitalized, no trailing period.
- Bodies are used only when a change needs explanation; keep them wrapped and focused on **why**.

### Step 2 — Analyze the staged changes
```bash
git diff --staged --stat
git diff --staged
```
Categorize (feature / fix / refactor / docs / test / config) and identify the affected area
(`src/screens/…`, `src/store/api/…`, navigation, etc.). If nothing is staged, say so and stop.

### Step 3 — Produce the message
- Match the repo's subject style (free-form, English, ~≤72 chars).
- Include the ticket tag if the branch/history uses one (e.g. `HS-XXXX`).
- Add a short body only when it adds real value (the reasoning, not a diff restatement).
- **Always append the required trailer** (blank line before it):

  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  ```

## Guardrails
- Never include secrets or `.env*` values in the message (PHI medical app — see CLAUDE.md §Security).
- Do not invent ticket numbers; only use one present in the branch name or history.
- Present the message; let the developer commit. Offer to refine if they want a different scope/tone.
