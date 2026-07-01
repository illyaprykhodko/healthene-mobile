# Testing Checklist

## Pre-merge checks
- `npm run lint` passes for changed code
- Relevant Jest tests pass (`npm test` or targeted suites)
- Happy path and key failure path validated manually

## Mobile-specific checks
- Android build/run sanity check for changed flow
- iOS build/run sanity check for changed flow
- Permissions and offline behavior checked when relevant

## Release confidence
- No sensitive data in logs/screenshots
- Crash-prone edge cases covered
- Notes added for QA if behavior changed
