## Context

Measured on a Mac with 4 performance and 6 efficiency cores (`yarn vitest run --reporter=json`): 97 files add up to 46s of work and finish in 16.5s. Vitest runs files in parallel but a file's tests one after another, so a file can hold the run up on its own.

```
deploy.test.ts   [==============================]  14.9s  22 tests, about 700ms each
live.test.ts     [========================]        12.0s  two tests about 5.2s each
distribution     [========]                         4.1s
everything else  about 1s or less per file
```

- `deploy.test.ts`: each test builds a bare origin, a seed clone and a server clone, then runs the real `bin/deploy`. Timed alone, that setup is about 0.13s; the rest is the release commits and the script's own git and stand-in calls.
- `live.test.ts`: "reconnects after its connection is killed..." and "after a reconnect the open stretch is read again..." terminate the listener's backend, then wait in real time for `RETRY_MS` (5000 in `lib/live.ts`) before the listener reconnects.

Fixing those two files alone brought the run to 12 to 13s, not the 5 to 7s first expected: behind them the run is bound by CPU. Profiled with the long files fixed:

| | Files | Tests | Wall | User CPU |
|---|---|---|---|---|
| jsdom files | 29 | 422 | 6.9s | 34.6s |
| node files | 68 | 942 | 9.1s | 16.5s |

- Building jsdom is 60 to 75% of most jsdom files' own time, paid once per file because each file gets a new worker.
- Worker count is not the limit: 6 and 9 workers both take about 11.7s, 12 is slower. The fixed start, including the throwaway PostgreSQL, is about 1.5s.
- Under the default pool, the 10 test "a deploy" file took 5.85s alone and about 11.4s in the full run, slowed by the CPU the rest uses.

## Goals / Non-Goals

**Goals:**
- Cut the suite's total time without losing a scenario or the isolation each file has today.

**Non-Goals:**
- Speeding up a single file's own tests, `distribution.test.tsx` included.
- Changing `RETRY_MS`, `SILENCE_MS` or `bin/deploy`.
- Replacing jsdom with another DOM.

## Decisions

### Fake the retry clock in the two reconnect tests

A shared `killListener` fakes `setTimeout`/`clearTimeout` with `shouldAdvanceTime` (as the watchdog test does) before terminating the backend, so the retry `listen` schedules lands on the fake clock. It then advances the fake clock a second at a time until a new listener appears, and restores real timers in a `finally`. The kill, the reconnect and the delivery after it stay real. It waits 3s for the reconnect, far above the under 1s a good one takes, so a broken reconnect fails with "the reconnect never happened" before Vitest's 5s test timeout.

Advancing in small steps rather than one jump keeps the total well under `SILENCE_MS` (60s), so the watchdog does not fire and cause a second reconnect the test did not ask for.

Alternative: make `RETRY_MS` configurable for tests. That adds an option to app code only tests use; faking the clock needs none.

### Split deploy.test.ts into four files

- `test/deploy-refusals.test.ts`: the pre-commit hook test and "a request it does not accept" (6).
- `test/deploy-guards.test.ts`: "a server or tag it should not move to" (6).
- `test/deploy.test.ts`: the first five of "a deploy", what it fast-forwards, builds and keeps.
- `test/deploy-outcomes.test.ts`: the last five of "a deploy", over SSH and how a failed build, the site check and the prune end it.

Both halves of "a deploy" keep the `describe` name, so every test's full name is unchanged. Shared code (`isolated`, `git`, `commit`, `release`, the stand-ins, the hooks that make and remove `root`, `deploy`, the log readers and the `KEEP`/`BUILD`/`TRIM` call lists) moves to `test/deploy.ts`, the way `test/true-up.ts` holds the true-up seeding. Importing it registers its hooks, and `root` stays per file, as Vitest gives each file its own module copy.

Alternatives:
- `describe.concurrent` inside one file: the tests share the module-level `root`, so each would need its own; a bigger rewrite for the same gain.
- Build the repositories once and copy them per test: setup is about 0.13s of 0.7s per test, so it saves under 20%. Skipped.

### Run files in the vmThreads pool

`pool: "vmThreads"` in `vitest.config.ts`. Workers are reused and each file runs in a new VM context with its own modules and environment, so jsdom's code loads once per worker instead of once per file. Measured: user CPU about 52s to about 31s, all 1,370 tests passing; the slowest file is then "a deploy" at 8.4s, which the split above halves.

Alternatives (all measured):
- `vmForks`: about the same saving; threads are the lighter of the two.
- `isolate: false`: about 39s of CPU, keeps module state across files; with threads it failed 2 tests.
- Fewer or more workers: no gain, as above.

## Risks / Trade-offs

- [The fake clock is installed after the listener's real watchdog timer was set; faked `clearTimeout` must still clear it] → the watchdog test already runs this sequence and passes; the file ran 5 times in a row without a failure.
- [A fake clock could hide a broken reconnect] → with the retry in `lib/live.ts` disabled, both tests fail with "the reconnect never happened"; `lib/live.ts` was restored.
- [VM contexts: Vitest warns that VM pools can grow memory over long runs and that `instanceof` against Node's own classes can fail across contexts] → every test passes today; the Docker build (Alpine, linux/amd64) is the check on the other platform, and if memory grows, `vmMemoryLimit` recycles a worker.
- [A worker thread runs its files one after another and `process.env` is shared between them, so a stubbed env var a file never restores reaches the next file; globals don't] → the three files that left `DATABASE_URL` stubbed (`car-charging.db`, `checks.db`, `intervals/charging.db`) now call `vi.unstubAllEnvs()` in `afterAll`, as the other `ownDatabase` files do; a probe file run after each showed the leak before the fix and none after.
- [Four deploy files spawn four sets of git and bash processes at once] → the Docker build is the check that it still passes there.

## Migration Plan

Test-only; ships with the next release like any change. Rollback is reverting the commit; removing the pool line alone brings back the default pool.

## Results

Same Mac, `yarn vitest run` as the pre-commit hook runs it, all 1,370 tests passing each time:

| Step | Wall | User CPU |
|---|---|---|
| Baseline | 16.5s | about 50s |
| Reconnect tests on a fake clock, deploy tests in four files | 10.7s | 51s |
| `vmThreads` pool | 7.8s in each of 3 runs | about 31s |

The slowest files are now the deploy ones at about 5s each in the full run.
