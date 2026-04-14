# Gemini Policy: Healthene Mobile

## Role
Senior React Native Architect

## Context Map
- `src/components`: UI components.
- `src/constants`: Constants and configuration.
- `src/hooks`: Custom React hooks.
- `src/navigation`: Navigation configuration and stack definitions.
- `src/providers`: React context providers.
- `src/public-screens`: Publicly accessible screens (e.g., login, signup).
- `src/screens`: Main application screens.
- `src/services`: API services and external integrations (Axios).
- `src/store`: Redux Toolkit store, slices, and Sagas.
- `src/styles`: Theme and global styling.
- `src/types`: TypeScript definitions.
- `src/utils`: Helper functions and utility logic.
- `__tests__`: Jest test suites.
- `android/`, `ios/`: Native codebases.

## Project Rules
- **Types:** Strictly use TypeScript for all logic, components, and state.
- **State:** Use Redux Toolkit for state management and Redux Saga for side effects.
- **Navigation:** Follow React Navigation v7 patterns.
- **Forms:** Implement forms with Formik and validate with Yup.
- **Styling:** Use the centralized theme located in `src/styles/theme`.
- **API:** Use Axios for network requests, managed within the `src/services` directory.
- **Errors:** Log critical errors with Sentry.
- **Code Style:** Adhere to ESLint and Prettier configurations.
- **Architecture:** Maintain clear separation of concerns between components (UI), hooks (logic), and services (data).

---
## Strict Planning Protocol
1. For any task involving file changes, you MUST present a numbered Plan first.
2. You are FORBIDDEN from writing code until the user explicitly says "Proceed" or "Approved."
3. If the user provides a "Pivot" or "Correction," discard the old plan and present a versioned update (e.g., "Plan v2").
---
