# String Centralization Plan

## Objective
Reduce duplicated literals and keep UI copy maintainable.

## Guidelines
- Keep user-facing copy in dedicated constants/i18n files.
- Reuse shared labels and placeholders across related screens.
- Keep validation/error strings consistent for similar failures.

## Migration steps
- Inventory repeated strings in high-traffic screens
- Replace local literals with centralized keys/constants
- Verify no regressions in formatting and localization
