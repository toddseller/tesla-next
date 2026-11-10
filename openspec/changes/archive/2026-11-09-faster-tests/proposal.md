## Why

The suite (1,370 tests in 97 files) takes about 16.5s, and it runs on every commit through the pre-commit hook and again in every Docker build. Two files hold the run up: `test/deploy.test.ts` (14.9s) and `lib/live.test.ts` (12.0s). Behind them, the run is bound by CPU: the 29 jsdom files use about two thirds of it, mostly building a new jsdom for each file.

## What Changes

- In `lib/live.test.ts`, the two tests that kill the listener's connection advance a fake clock past the listener's 5 second retry delay instead of waiting it out, as the watchdog test in the same file already does.
- Split `test/deploy.test.ts` into four files: one per existing `describe` group, with "a deploy" halved, and the shared stand-ins (throwaway repositories, recorded `docker` and `curl`) moved into a helper module, so Vitest runs them at once.
- Run test files in Vitest's `vmThreads` pool, which reuses workers and gives each file a fresh VM context, instead of a new worker per file.
- No test is dropped or weakened: every scenario is still checked, against the real script and the real PostgreSQL, and every file still gets its own module copies.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Only tests and the test runner's settings change; the app, `bin/deploy` and the listener behave as before (`skip_specs`).

## Impact

- `test/deploy.test.ts` becomes four test files plus a helper module beside `test/true-up.ts`; `lib/live.test.ts` changes in two tests; `vitest.config.ts` gains the pool setting, which the pre-commit hook and the Docker build pick up as they are.
- No app code, dependencies, env vars, version pins or docs change.
- Faster pre-commit hook and Docker build test stage; the expected total is about 6 to 7s, an estimate to be measured in the change.
