---
name: test-generator
description: Generate Jest + TypeScript tests for a file by learning this React Native project's existing test patterns. Use when the user asks to write/generate tests, add unit tests, or cover a module with tests in the Intelliceed PatientApp Mobile v2 repo.
---

# Test Generator (RN PatientApp — Jest + TS)

Generate tests that match the project's real conventions. This is a **React Native + TypeScript** repo using
**Jest** (`jest@29`, preset in `jest.config.js`); tests live in `__tests__/`. Learn from existing tests before
writing — do not assume a stack.

## Workflow

### Step 1 — Learn existing patterns
Read a few representative tests:

```bash
ls __tests__ && ls __tests__/measurement 2>/dev/null
```
Study 3–5 files (e.g. `__tests__/measurement/validators.test.ts`, `__tests__/AnytimeListItem.test.tsx`,
`__tests__/serving.test.ts`). Identify:
- File naming (`*.test.ts` / `*.test.tsx`) and location.
- Import style and path aliases (project uses aliases like `components/…`, `store/…`, `constants/…`).
- How RN / native modules and Redux/RTK Query are mocked.
- Rendering approach for components (React Native Testing Library, if used) vs pure-logic tests.
- Assertion and `describe`/`it` structure.

### Step 2 — Analyze the target
Read the file under test; note exported functions/components, props/params, dependencies to mock
(services, RTK Query hooks, navigation, native modules), error paths and edge cases.

### Step 3 — Generate the test
- Mirror the discovered naming, imports (aliases), and mocking approach.
- Cover happy path, error/failure states, and edge cases (empty/undefined/boundary).
- For pure utils/reducers/selectors prefer direct unit tests (no renderer).
- For components/hooks, follow the existing rendering/mocking pattern already in `__tests__/`.
- Strict typing; no `any` in test code unless the surrounding tests do it.

### Step 4 — Verify
Run only the new test:
```bash
npx jest <path-or-pattern>
```
Confirm imports resolve and it passes.

## Caveats
- **Known limitation:** some suites (e.g. `App.test.tsx`) currently fail on a Jest ESM-transform issue with
  `react-redux`/Sentry (`Cannot use import statement outside a module`) — a `transformIgnorePatterns` config gap,
  unrelated to new tests. Prefer testing pure logic/reducers/selectors/helpers, which run cleanly; flag the
  config issue rather than working around it silently.
- Never put secrets, tokens, or real PII/PHI in fixtures — use obviously-fake placeholders (CLAUDE.md §Security).
- Keep tests deterministic; mock time, network, and native/permission APIs.
