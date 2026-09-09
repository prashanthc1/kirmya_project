# Standalone mobile client — not part of this release

This directory is a **prototype that cannot be built and does not authenticate
anyone.** It is excluded from the release and from every completion claim. It is
step 10H of the [completion plan](../docs/PROJECT_COMPLETION_PLAN_2026-09-06.md),
which has never been started.

Recorded here so that nobody reads a screen file as a shipped client.

## Why it cannot be built

| | |
|---|---|
| No native projects | There is no `android/` and no `ios/` directory, so `react-native run-android` and `run-ios` have nothing to build. |
| No lockfile | `mobile/package-lock.json` does not exist, so no install is reproducible. |
| No bundler configuration | No `metro.config.js`, `babel.config.js` or `tsconfig.json`. |
| An import that resolves nowhere | `src/api/client.ts` imports `Platform` from `react_native_shim` — a package that is not a dependency, not in this repository, and not on any registry. It is also unused. |
| A test script with no test runner | `package.json` declares `"test": "jest"` and depends on no jest. |

## Why it must not be shipped as-is

- `App.tsx` initialises `isAuthenticated` to `true`, so the app opens signed in
  before anyone has entered a credential.
- `AuthScreen.handleAuth` calls `onLoginSuccess()` and nothing else. No request
  is made, no password is checked and no session is created.
- `src/api/client.ts` sends `Authorization: Bearer 9a8b7c6d-…`, a constant that
  is not a token, alongside a hardcoded device ID and tenant ID.
- Its base URL is `http://localhost:8080`, which is nothing on a handset.

This is the same defect class the web client's feature clients carried before
batch 2 (finding F07); it was never traced into this directory because nothing
here is reachable from a build.

## What exists and does work

The API half of mobile support is implemented, in the platform, and covered:

- `POST /api/v1/mobile/devices` registers a handset against
  `(user_id, device_id)`, and registering the same handset under a second
  account deactivates it for the first.
- `POST /api/v1/mobile/push/send` pushes to the authenticated caller; a body
  naming somebody else is refused with 403.

Both are exercised against the running API by
`backend/test/ci/TestMobileDeviceAndPushBoundaries`.

Mobile **web** — the responsive site in a phone viewport — is a different thing
and is covered: the `mobile-chromium` (Pixel 7) and `a11y-mobile` Playwright
projects run the full browser suite at that width on every commit.

## What finishing 10H needs

Real devices or emulators, a reproducible React Native project, secure session
storage (Keychain / Keystore, not `AsyncStorage`), the shared authenticated
client instead of a constant bearer, deep links, upload, offline recovery, and
push registration and delivery proven on a handset. None of it can be verified
from CI alone.
