# AI Stack Audit — Intelliceed PatientApp Mobile v2

Audit of the repository's AI tooling (`.claude/`, `.cursor/`, `CLAUDE.md`, Prettier configs) for
conformance to the **actual** project and usefulness, plus selective integration of
[`intelliceed/ai-meta`](https://github.com/intelliceed/ai-meta) components — adapted to this project.

- **Branch:** `enhancement/ai-meta-integration`
- **Principle:** ai-meta is the priority template source; **where it conflicts with this project, the project wins**
  (real `package.json` / `src/` / `CLAUDE.md` / `.cursor/rules`).
- **Install safety:** ai-meta's `curl … | bash` installer was **not** run (violates repo security policy;
  `hooks/setup.sh` also overwrites `.claude/settings.json` wholesale). Components were reviewed from a local
  read-only clone and integrated manually.

---

## Key findings

1. **Version drift in docs (fixed).** `CLAUDE.md` and `.cursor/rules/00` claimed `react-native@0.81.4`,
   `react@19.1.0`, `@reduxjs/toolkit@2.8.2`, `formik@2.4.6`, `yup@1.6.1`, `axios@1.9.0`. Real `package.json`:
   **RN `0.84.1`, React `19.2.3`, RTK `^2.11.2`, Formik `^2.4.9`, Yup `^1.7.1`, axios `^1.16.0`,
   `@sentry/react-native ^8.11.1`, jest `29.7.0`**. Docs updated to match reality.
2. **ai-meta hook scripts were non-functional under Claude Code (fixed on adopt).** The upstream
   `scan-secrets.sh`/`check-command.sh` read `.new_string`/`.content`/`.command` from the **top level** of the
   hook stdin JSON. Claude Code nests tool params under **`tool_input`** (`tool_input.command`,
   `tool_input.content`, `tool_input.new_string`). As shipped they always read empty → `exit 0` → silent no-op.
   Adopted copies fix the `jq` paths and use `${CLAUDE_PROJECT_DIR}`.
3. **settings.json schema.** Our `.claude/settings.json` uses the **current** `permissions.allow/deny` schema.
   ai-meta's root `settings.json` uses the **legacy** `permissionMode`/`allowedTools` schema — **not adopted**.
   We keep our `permissions` and only **merge in** a `hooks` block.
4. **`check-dependency-updates` duplicated in `.claude/skills/` and `.cursor/skills/` is intentional**, not
   redundant: Claude Code reads `.claude/skills/`, Cursor reads `.cursor/skills/`. Kept both (verified identical).
5. **Irrelevant docs removed.** `.cursor/docs/it-service-desk-project-plan.md` is unrelated to a patient app → removed.
6. **`demo-marp` skill and `documents/ai-meta.md` not adopted** — a Marp slide-deck generator / the ai-meta pitch
   deck; irrelevant to this app.

---

## Per-artifact verdicts

| Artifact | Verdict | Notes |
|---|---|---|
| `CLAUDE.md` (root) | **adapt** | Source of truth for agents. Versions corrected to real `package.json`; kept project specifics. |
| `.cursor/rules/00-core-project-context.mdc` | **adapt** | `react-native@0.81` → `0.84`; wording synced with CLAUDE.md. |
| `.cursor/rules/01…50` | **keep** | Security, TS/RN, Redux/RTK, services, screens, staircase, testing — all accurate and useful. |
| `.cursor/hooks/{warn-shell,check-prompt-secrets}.sh`, `hooks.json` | **keep** | Cursor-side, **warn-only** (`{"continue": true}`); advisory, do not block. |
| `.cursor/worktrees.json` | **keep** | `npm install` + `pod install` on worktree setup — correct. |
| `.cursor/docs/architecture-diagram.md` | **keep** | App architecture (mermaid); relevant. |
| `.cursor/docs/it-service-desk-project-plan.md` | **remove** | Not related to this patient app. |
| `.cursor/docs/multi-language-infrastructure-plan.md` | **keep** | i18n planning — relevant. |
| `.cursor/docs/string-centralization-plan.md` | **keep** | Matches CLAUDE.md "copy in constants" rule. |
| `.cursor/docs/testing-checklist.md` | **keep** | Pre-merge checklist — relevant. |
| `.claude/settings.json` | **adapt** | Keep `permissions`; **merge** `hooks` (PreToolUse). |
| `.claude/settings.local.json` | **keep (local)** | `WebFetch(registry.npmjs.org)`; not committed. |
| `.claude/skills/check-dependency-updates` + `.cursor/skills/…` | **keep both** | Cross-tool; intentional duplication. |
| `.prettierrc.json`, `.prettierignore` | **keep** | Consistent with `eslint.config.mjs` (4-space, printWidth 120, single quotes, LF). |
| `.gitignore` | **adapt** | `CLAUDE.md`/`.claude/` un-ignored to commit the AI stack; `settings.local.json` + `*.log` stay local. |

---

## Components integrated from ai-meta (adapted)

| Component | Path | Adaptation |
|---|---|---|
| Skill `commit-helper` | `.claude/skills/commit-helper/SKILL.md` | Free-form commit style of this repo (not conventional-commits); English; required `Co-Authored-By` trailer; branch-prefix conventions. |
| Skill `test-generator` | `.claude/skills/test-generator/SKILL.md` | Rewritten for **Jest + TS + React Native** and `__tests__/` patterns (Python/pytest examples removed); notes the pre-existing jest ESM-transform limitation. |
| Agent `security-auditor` | `.claude/agents/security-auditor.md` | RN/TS + PHI focus: Keychain/biometrics, SSL pinning, Sentry PII-scrub, `.env*` via react-native-config, RTK Query; reads root `CLAUDE.md`; OWASP Mobile / CWE. |
| Agent `code-reviewer` | `.claude/agents/code-reviewer.md` | RN/TS/RTK Query/navigation/staircase; reads root `CLAUDE.md` + `.cursor/rules`. Overlaps the built-in `/code-review` skill (complementary sub-agent form). |
| Agent `diagram-generator` | `.claude/agents/diagram-generator.md` | RN architecture (navigators, RTK Query slices, services, providers) instead of AWS/Lambda; mermaid. |
| Hooks `scan-secrets`, `check-command` | `.claude/hooks/*.sh` | Fixed `tool_input` jq paths; secret patterns extended for this stack; wired via merged `hooks` block. Require `jq` (present); degrade to no-op without it. |

**Not adopted:** `demo-marp` skill, `documents/ai-meta.md` (Marp deck), `check-quality.sh` (empty stub, not in any
bundle), draw.io MCP (upstream "coming soon"), ai-meta root `settings.json` (legacy schema), `setup.sh`/`output.sh`
(installer — would overwrite our curated `settings.json`).
