# Project Instructions for Claude — Intelliceed PatientApp Mobile v2

## Role

Act as a Senior React Native Architect for a healthcare patient mobile app
(`healthene` in `package.json`, internal name "Intelliceed PatientApp Mobile v2").
Code targets iOS and Android, Hermes enabled.

## Project Stack (actual versions)

- React Native `0.84.1`, React `19.2.3`, TypeScript `5.8.3`
- State: Redux Toolkit `2.11.2`, React Redux `9.2.0`, RTK Query
- Navigation: `@react-navigation/native@7` (native-stack, drawer, bottom-tabs, stack)
- HTTP: `axios@1.16.0` + RTK Query `baseApi.ts`
- Forms / validation: Formik `2.4.9`, Yup `1.7.1`
- Notifications: `@notifee/react-native`, `@react-native-firebase/messaging`
- Crash / telemetry: `@sentry/react-native`
- Secure storage: `@react-native-async-storage/async-storage`, `react-native-keychain`, `react-native-biometrics`
- Health data: `react-native-health` (HealthKit), `react-native-health-connect`
- Media / IO: `react-native-vision-camera`, `react-native-video`, `react-native-image-crop-picker`, `react-native-blob-util`, `react-native-nitro-sound`, `@react-native-documents/picker`, `@react-native-documents/viewer`
- BLE: `react-native-ble-plx` (smart scale and similar devices)
- UI: `@gorhom/bottom-sheet`, `react-native-reanimated@4`, `react-native-gesture-handler`, vector icons, `react-native-calendars`, `react-native-mask-text`, `react-native-swipe-list-view`, `react-native-toast-message`, `react-native-htmlview`
- Config: `react-native-config` with `.env`, `.env.local`, `.env.development`, `.env.production`

## Project Structure (`src/`)

- `components/` — shared UI primitives. Reuse before adding new ones.
- `constants/` — palette, dimensions, route names, copy.
- `hooks/` — reusable hooks. No direct API calls in screens.
- `navigation/` — navigators (`RootNavigator`, `PublicStack`, `PrivateStack`, `PrivateDrawer`, `*Stack.tsx`) and `linking.ts` for deep links.
- `providers/` — top-level providers (Redux, theme, etc.).
- `public-screens/` and `screens/` — `SignIn`, `SignUp`, `ForgotPassword`, `AccountSettingsScreens`, `TermsAndConditions`, `privateScreens/*` (Messenger, HealthProfile, MealPreferences, DayOverview, Library, Shopping, Question, Gambling, MainScreen, etc.).
- `services/` — `api`, `deepLink`, `notifications`, `health`, `messages`, `navigation`, `image-picker`, `keyboard`, `filter`, plus `sessionService.ts`, `biometricService.ts`.
- `store/`
    - `index.ts`, `types.ts`, `utils/`
    - `api/*Api.ts` — RTK Query slices: `authApi`, `baseApi`, `interceptors`, `planApi`, `messengerApi`, `healthProfileApi`, `mealPreferencesApi`, `settingsApi`, `shoppingApi`, `dayOverviewApi`, `questionApi`, `categoryTreeApi`, `cuisineDistributionApi`, `videoApi`, `s3ServiceApi`, `publicApi`.
    - `slices/*Slice.ts` — local Redux slices (`appSlice`, `signInSlice`, `forgotPasswordSlice`, `healthProfileSlice`, `messengerSlice`, `shoppingSlice`, `dayOverviewSlice`, `exerciseSlice`, `foodPreferrencesSlice`).
- `styles/` — global style helpers.
- `types/` — shared TS types.
- `utils/` — pure utilities (formatters, parsers, guards).
- Roots: `App.tsx`, `index.js`, `babel.config.js`, `metro.config.js`.

## Coding Rules

- Functional components + hooks only. No class components in new code.
- Strict typing for props, hook results, navigation params, RTK Query endpoints, service request/response shapes. Avoid `any`; if unavoidable, isolate and document why.
- Keep business logic out of UI. Put it in hooks, services, RTK Query endpoints, or RTK slices.
- All HTTP goes through `src/store/api/*` (RTK Query) or `src/services/api/*`. Do not call `axios` / `fetch` directly from components.
- Reuse existing shared components from `src/components/` before creating new UI primitives.
- Constants and copy belong in `src/constants/`. Do not hardcode repeated strings.
- Do not break public contracts: route names, navigation params, Redux state shape, RTK Query tags, API payloads.
- Do not introduce new libraries without justifying why an existing one is insufficient.
- No large architectural changes without an approved plan first.
- Code and inline comments — English. Commit messages — English. Объяснения разработчику — Русский или Український, по запросу.

## Code Style

Follow `.prettierrc.json` and `eslint.config.mjs`:

- 4-space indentation, `printWidth: 120`, single quotes for TS/JS, double quotes in JSX, trailing commas everywhere, `arrowParens: avoid`, LF line endings.
- Semicolons required, `eqeqeq` smart, prefer template literals, `prefer-const`, `max-len: 200` (with sensible ignores), `max-params: 4`, `max-depth: 5`.
- "Staircase" formatting for long imports, object literals, arrays, function params, JSX props (see `.cursor/rules/11-code-style-staircase.mdc`).
- Existing module conventions take precedence over personal preferences.

## State Management (Redux Toolkit + RTK Query)

- New network endpoints — RTK Query in `src/store/api/*Api.ts` with `providesTags` / `invalidatesTags` for cache consistency.
- Local UI/feature state — `createSlice` in `src/store/slices/*Slice.ts`. Reducers must be pure and deterministic; side effects belong in RTK Query, services, or thunks.
- Use selectors / `createSelector` for derived data; do not duplicate computed values in state.
- Handle async with explicit request / success / failure states and surface user-safe errors.

## Screens & Navigation

- New screens go into the appropriate stack inside `src/navigation/*Stack.tsx`. Follow existing organization and naming.
- Screen containers orchestrate; heavy logic lives in hooks / services.
- Every screen handles loading, empty, and recoverable error states.
- Pass only required, typed params through navigation. Keep payloads small.
- Deep links: `src/navigation/linking.ts` + `src/services/deepLink/`.

## Services & API

- Keep HTTP/client logic in `src/services/api/*` and `src/store/api/*`. No direct network calls in components.
- Typed request/response contracts. Normalize API errors into predictable, UI-safe objects.
- Centralize URL/header construction. Do not repeat endpoint fragments.
- Bounded retries; never silently swallow errors.

## Security & Privacy (medical app)

- This is a patient app handling PII and PHI. Never log personal or health-related user data, even in dev.
- Treat `.env*` (`.env`, `.env.local`, `.env.development`, `.env.production`) as secrets. Do not print, copy, or paste their values into code, docs, logs, commits, or chat.
- In examples and docs use placeholders only: `API_BASE_URL`, `SENTRY_DSN`, `FIREBASE_*`, `APP_BUNDLE_ID`.
- Sentry / crash payloads must be PII-free; scrub sensitive fields before send.
- Tokens go through Keychain / secure storage; biometric flows go through `biometricService.ts` and `react-native-biometrics`.
- Do not disable SSL pinning, response validation, or session expiration handling.
- Validate external input before using it in reducers, services, or RTK Query transforms.

## Before Editing

1. State the plan briefly (what changes, why).
2. List the affected files.
3. Call out risks (API contract, store shape, navigation, native deps, permissions, security).
4. Wait for approval before large refactors or any native (iOS/Android) changes.

## After Editing — verification

- `npm run lint` — required after substantive changes in `src/`.
- `npm run lint:fix` — for auto-fixable issues.
- `npm run format:check` / `npm run format` — Prettier.
- `npx tsc --noEmit` — TypeScript check (no dedicated `typecheck` script in `package.json`).
- `npm test` — Jest, or targeted `npx jest <pattern>` for changed logic.
- iOS native deps changed → `cd ios && bundle exec pod install` (see `Gemfile`).
- Android native deps changed → `cd android && ./gradlew clean` plus the appropriate build script.
- Avoid changing native iOS/Android files unless the task explicitly requires native work.

## Build / Run shortcuts (see `package.json` and `README.md`)

- Metro: `npm start`
- iOS: `npm run ios-local` | `npm run ios-development` | `npm run ios-production`
- Android (install on device/emulator): `npm run android-local` | `npm run android-development` | `npm run android-production`
- APK / AAB: `npm run android-<env>:apk` | `npm run android-<env>:aab`

## Reference

Project conventions are also formalized in `.cursor/rules/*.mdc`:

- `00-core-project-context.mdc` — repo context, npm-first execution.
- `01-security-and-secrets.mdc` — secrets and PII guardrails.
- `10-typescript-and-react-native.mdc` — TS + RN standards.
- `11-code-style-staircase.mdc` — staircase formatting.
- `20-state-redux-and-rtk-query.mdc` — state management.
- `30-screens-and-navigation.mdc` — screens and navigation.
- `40-services-and-api.mdc` — services and API layer.
- `50-testing-and-validation.mdc` — testing expectations.

This `CLAUDE.md` is aligned with those rules; if anything diverges, `.cursor/rules/*.mdc` is the source of truth.
