---
name: check-dependency-updates
description: Audit project npm dependencies for available updates and produce a brief summary describing how each upgrade may affect application code, native iOS/Android build, and tests for the Intelliceed PatientApp Mobile v2 React Native repo. Use when the user asks to check for outdated packages, dependency updates, npm outdated, upgrade plan, security audit, or wants to understand impact of bumping a library before upgrading.
---

# Check Dependency Updates (RN PatientApp)

Run a structured audit of `package.json` dependencies, classify each candidate update by risk, cross-reference actual code usage, and emit a concise, actionable summary. Never modify `package.json` or `package-lock.json` automatically — this skill is read-only analysis.

## Quick Start

Execute these commands from the repo root and capture their output:

```bash
npm outdated --json --long || true
npm audit --json || true
node -p "Object.keys(require('./package.json').dependencies).length + ' deps, ' + Object.keys(require('./package.json').devDependencies).length + ' devDeps'"
```

Notes:
- `npm outdated` exits with code `1` when updates exist; the trailing `|| true` keeps the agent flow.
- If `npm outdated --json` returns empty `{}`, everything is on the latest installed version — say so explicitly.
- Do **not** run `npm install`, `npm update`, `ncu -u`, or anything that changes lockfiles.

## Workflow

Track progress with this checklist:

```
Audit progress:
- [ ] Step 1: Collect outdated + audit data
- [ ] Step 2: Classify each package by jump (major/minor/patch) and risk tier
- [ ] Step 3: Map code usage for high-impact packages
- [ ] Step 4: Note native rebuild requirements
- [ ] Step 5: Render summary using the template below
```

### Step 1 — Collect data

- Run the `Quick Start` commands.
- Read `package.json` to know which deps are direct vs transitive (only direct deps from `dependencies` / `devDependencies` are actionable here).

### Step 2 — Classify by version jump and risk tier

For every direct dep that appears in `npm outdated` output, compute:

- **Jump**: compare `current` vs `latest`. SemVer rules:
    - different major → **major** (breaking API risk)
    - same major, different minor → **minor** (new features, low–medium risk)
    - same major+minor, different patch → **patch** (low risk, usually fixes only)
- **Tier** (project-specific, see lists below):
    - `core-rn` — touches RN runtime / React / Hermes / new architecture. Highest risk.
    - `native` — ships native code, requires `pod install` and/or Android rebuild.
    - `state-data` — state management and HTTP layer.
    - `forms-validation` — Formik / Yup.
    - `pure-js` — JS-only utility, usually safe.

### Step 3 — Map code usage for high-impact packages

For every dep in `core-rn`, `native`, or marked **major**, find import sites to estimate blast radius:

```bash
rg -n --hidden -g '!node_modules' "from ['\"]<package-name>" src
```

Record:
- file count
- 1–2 representative usage sites (path + symbol)

For `pure-js` minor/patch updates, skip the grep step — it adds noise.

### Step 4 — Native rebuild requirements

If any updated package is in the `native` list (or has a peer that is, e.g. `react-native-reanimated`), note that the user must:

- iOS: `cd ios && bundle exec pod install`
- Android: `cd android && ./gradlew clean` plus a clean rebuild
- Reset Metro cache: `npm start -- --reset-cache`

Flag this clearly in the summary; do **not** run these commands as part of the audit.

### Step 5 — Render the summary

Use the template in the next section. Keep total length under ~150 lines for readability.

## Output Template

```markdown
# Dependency Update Audit — <YYYY-MM-DD>

## Overview
- Total direct deps: <X> (<deps> + <devDeps>)
- Outdated: <N> (<majors> major / <minors> minor / <patches> patch)
- Security advisories: <low/moderate/high/critical counts from npm audit, or "none">

## High-impact updates (review carefully)
For each `core-rn` / `native` / `major` entry:

### `<package>`  `<current>` → `<latest>`  (<jump>, tier: <tier>)
- Why it matters: <one line>
- Native rebuild required: <yes/no>
- Code usage: <file count> files (e.g. `src/<path>:<line>`, ...)
- Known breaking points: <one-line note based on changelog/release-notes if checked, otherwise "verify CHANGELOG before upgrade">
- Suggested test focus: <screens/services/areas to retest>

## Low-risk updates (likely safe)
Bullet list of `pure-js` patch/minor bumps:
- `<package>` `<current>` → `<latest>` (<patch|minor>)

## Security
- <package>@<range>: <severity> — <short advisory title>  (or: "no advisories")

## Suggested upgrade order
1. Patch + low-risk minor first (group commit), run lint/test/build.
2. State / data layer (`@reduxjs/toolkit`, `react-redux`, `axios`) one-by-one.
3. Native modules one-by-one with `pod install` and full rebuild between bumps.
4. Core RN (`react-native`, `react`, `react-native-reanimated`, `react-native-screens`, `react-native-gesture-handler`) last and only with a dedicated branch + smoke test.

## Verification commands after any bump
- `npm install`
- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
- iOS: `cd ios && bundle exec pod install` then run on device/simulator
- Android: `cd android && ./gradlew clean` then `npm run android-local`
```

## Project-Specific Risk Tiers

Use these lists to assign a tier in Step 2.

### `core-rn` (highest risk)
- `react`
- `react-native`
- `@react-native/*` (any subpackage)
- `react-native-reanimated`
- `react-native-gesture-handler`
- `react-native-screens`
- `react-native-safe-area-context`
- `react-native-worklets`
- `react-native-nitro-modules`
- `hermes-engine` (transitive but watch RN release notes)

### `native` (require `pod install` + Android rebuild)
- `@notifee/react-native`
- `@react-native-async-storage/async-storage`
- `@react-native-community/slider`
- `@react-native-documents/picker`
- `@react-native-documents/viewer`
- `@react-native-firebase/app`
- `@react-native-firebase/messaging`
- `@react-native-vector-icons/*`
- `@sentry/react-native`
- `@gorhom/bottom-sheet` (peer-deps on Reanimated + Gesture Handler)
- `react-native-asset`
- `react-native-ble-plx`
- `react-native-blob-util`
- `react-native-biometrics`
- `react-native-config`
- `react-native-date-picker`
- `react-native-device-info`
- `react-native-google-fit`
- `react-native-health`
- `react-native-image-crop-picker`
- `react-native-keychain`
- `react-native-nitro-sound`
- `react-native-permissions`
- `react-native-svg`
- `react-native-video`
- `react-native-vision-camera`
- `react-native-webview`
- `react-native-youtube-iframe`

### `state-data`
- `@reduxjs/toolkit`
- `react-redux`
- `axios`
- `qs`
- `lodash`
- `moment`

### `forms-validation`
- `formik`
- `yup`

### `pure-js` (safe by default for patch/minor)
- Type packages (`@types/*`)
- `@babel/*`, `@react-native/babel-preset`, `@react-native/metro-config`, `@react-native/typescript-config`
- `eslint`, `eslint-plugin-*`, `@typescript-eslint/*`, `@eslint/js`, `globals`
- `prettier`
- `jest`, `react-test-renderer`, `@types/jest`
- `babel-plugin-module-resolver`
- `reactotron-react-native`, `reactotron-redux`
- `react-native-htmlview`, `react-native-mask-text`, `react-native-indicators`, `react-native-swipe-list-view`, `react-native-toast-message`, `react-native-keyboard-aware-scroll-view`, `react-native-calendars`, `@react-native-material/core` (mostly JS, but check changelog for native parts)

If a package is missing from the lists above, default to:
- has `react-native-*` prefix or ships `*.podspec` → `native`
- otherwise → `pure-js`

## Code Impact Heuristics

Per package the agent should answer:

1. **Where is it used?** `rg -n --hidden -g '!node_modules' "from ['\"]<pkg>"`
2. **How wide?** Count files. >10 files = wide blast radius, flag explicitly.
3. **Surface area?** Note specific exported symbols/components in use (e.g. `useReanimatedStyle`, `BottomSheetModal`, `createApi`).
4. **Is it in a public contract?** Anything in `src/store/api/*`, `src/store/slices/*`, `src/navigation/*`, public component props — call out backward-compat risk.

For RTK Query / Redux Toolkit bumps, additionally check `src/store/api/baseApi.ts` and `src/store/index.ts` — these are the integration points.

For navigation bumps (`@react-navigation/*`), check `src/navigation/RootNavigator.tsx`, `linking.ts`, and every `*Stack.tsx`.

For Reanimated / Gesture Handler bumps, search worklet usages and confirm the `babel.config.js` plugin order is still correct.

## Anti-Patterns (do not do)

- Do **not** modify `package.json`, `package-lock.json`, `Podfile.lock`, or run `npm install` / `npm update` / `pod install` during the audit. The skill is **read-only**.
- Do **not** print full `npm outdated --json` blobs into the summary. Aggregate and reference.
- Do **not** copy `.env*` values, tokens, or anything from `ios/Healthene/Healthene.entitlements` into the report.
- Do **not** speculate on changelog content you have not actually read; if the network is unavailable, write `"verify CHANGELOG before upgrade"` and move on.
- Do **not** suggest mass-bumping everything in a single commit.

## Triggers

Apply this skill when the user mentions any of:
- "outdated dependencies", "check deps", "npm outdated", "upgrade plan"
- "обнови зависимости", "проверь зависимости", "что устарело", "план апдейта"
- "security audit", "npm audit", "уязвимости"
- a specific RN/RTK/Navigation/Firebase package upgrade question and asks about impact
