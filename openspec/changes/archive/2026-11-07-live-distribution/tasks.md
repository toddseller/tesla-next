# Tasks

Code tasks are test-first: write or port the test, run it and see it fail for the right reason, then write the smallest code that passes and run the whole suite (`yarn vitest run`), plus `yarn tsc --noEmit` once a task touches types. Ported modules keep anton's logic and test values unchanged. Tasks marked **(owner)** are done by you; I check each where I can.

## 1. anton companion change (in anton-tesla-api-ws)

- [x] 1.1 Propose `notify-live-status` in anton-tesla-api-ws: `pg_notify('live_status', payload)` after each successful `poll_live`, failures logged and never stopping the socket broadcast; a `vehicle` table (`vin`, `display_name`, `streamed`) replaced on each successful vehicle-list refresh; spec deltas for `live-site-status` and `vehicle-charging`
- [x] 1.2 Apply it test-first in anton (pytest): the notification carries the socket payload; it's skipped with a log line over 8,000 bytes; a database failure leaves the socket event; the table holds the current list with `streamed` matching `streamable_vins()`; measure a real payload's size with weather and a car
- [x] 1.3 Review (ponytail-review), commit, archive, PR; after you approve, merge and deploy with anton's `git push server main`; check on onyx that notifications arrive every 10 seconds (`LISTEN live_status` in psql) and that `vehicle` lists the cars
- [ ] 1.4 **(owner, in anton)** Propose, apply, review, merge and deploy `notify-totals`: `pg_notify('totals_updated', '{"date": ...}')` beside each `totals_updated` socket emit, logged on failure; spec delta for `energy-intervals` or wherever that event is specified; I check on onyx that a notification arrives within a minute of a :xx:30 refresh

## 2. Live status stream

- [x] 2.1 Export the connection target, password function and session options from `lib/db.ts` for reuse; existing `lib/db.test.ts` stays green
- [x] 2.2 `lib/live.ts` test-first against the throwaway PostgreSQL: a notification reaches a subscriber and becomes `latest()`; the session refuses a write; after the server terminates the listener's backend, it reconnects and the next notification still arrives; unsubscribing stops delivery
- [x] 2.3 `app/api/live/route.ts` test-first: status 200 with `text/event-stream`, `no-cache, no-transform` and `X-Accel-Buffering: no`; `retry: 5000` and a comment written at once; the latest payload sent first when there is one; each notification as an event; a ping every 25 s (fake timers); unsubscribe on abort; a `shortcut:` comment on the uncapped streams
- [x] 2.4 Start the listener from `instrumentation.ts`; verify with `yarn build && yarn start` locally against the throwaway database that `/api/live` streams a hand-sent `pg_notify` (the CSP check, which needs the page, is part of 4.6)
- [x] 2.5 Listen on `totals_updated` too, test-first: subscribers get each notification with its channel, `latest()` keeps only live status; `/api/live` sends totals as `event: totals`

## 3. The intervals read

- [x] 3.1 Generate `test/schema.sql` on onyx (`pg_dump --schema-only` of `energy_interval`, `battery_sample`, `vehicle_interval`, `charge_session`, `weather_sample`, `vehicle`), commit it with its source and how to regenerate it in a header comment, and load it in `test/postgres.ts`
- [x] 3.2 `pyRound` and the local `isoformat` helper test-first: exact ties (`0.125`, `2.5`, `-0.5`), and instants on both daylight saving changes
- [x] 3.3 Port `gap_estimates` (`fill`, `place_sessions`) with anton's pytest cases
- [x] 3.4 Port `weather` (`sky_from`, `rain_from`, `wind_across`, `winds_aloft`) and `sunshine` (`slot`, `reference`, `share`, `quarter_kw`) with anton's pytest cases; `reference` against the throwaway database
- [x] 3.5 Port `vehicles.name` and `session_vin` reading the `vehicle` table, with anton's cases
- [x] 3.6 Port `intervals.py` as `lib/intervals/intervals.ts` and `app/api/intervals/route.ts`, with anton's endpoint tests ported against the throwaway database: flows and totals, battery samples without energy, measured, gap and session charging, car names, weather margin, out-of-window 400s
- [x] 3.7 Write `scripts/compare-intervals.mjs` (every date, four at a time, deep compare, first differing path, non-zero exit on any mismatch), with a test of its comparison on two small fixtures

## 4. The page

- [x] 4.1 Move the 16 images and `stars.json` to `public/scene/` (images) and `lib/scene/` (`stars.json`)
- [x] 4.2 Port the pure utilities to `lib/scene/` with their tests: `sun`, `nightSky`, `weather`, `replay`, `liveScene`, `ranges` (the parts replay uses)
- [x] 4.3 Port the scene modules to `components/scene/` with their tests: `layout`, `images` (URLs under `/scene`), `moonFace`, `cloudInputs`, `cloudLooks`, `cloudRenderer`, `CloudCanvas`, `LiveScene`, and `scene.css` unchanged
- [x] 4.4 Port `ReplayBar` and `Distribution` with their tests; the live status comes from `EventSource('/api/live')` and an initial status prop instead of the socket context; the replay reads `/api/intervals`; `?at=` handling unchanged; the weather override only in development
- [x] 4.5 `app/distribution/page.tsx` renders the scene with `latest()` and `at`, replacing the placeholder; a test that the served HTML has the labels' values when a status is known and dashes when not
- [x] 4.6 Check under `yarn build && yarn start`: no CSP violation with the clouds, replay and stream running; sizes at 375 x 812, 844 x 390, 1512 x 870, 1920 x 940 and 2560 x 1300 match the `live-flow-scene` delta (up to 1280, wider than the frame, height-limited), with the top bar and footer still at 1200

## 5. Docs

- [x] 5.1 README: the live stream (`/api/live`, the `live_status` channel, the `vehicle` table it relies on), `/api/intervals`, `test/schema.sql` and the parity script; CLAUDE.md: the scene is a port, so behavior changes go through the copied specs

## 6. Release and checks (after merging)

- [x] 6.1 **(owner)** Publish a release; I watch the Deploy run
- [ ] 6.2 On next.teslasolar.report: updates arrive within a second of Flask's notification (timed against `modified`), the page reconnects after a redeploy, and `node scripts/compare-intervals.mjs` reports no mismatch for every date; record the results in the design
- [x] 6.3 Side-by-side with teslasolar.report at 375, 844, 1280 and 1920 pixels: by day, at night, in replay (a shared `?at=` link), with a car, and with rain through the development override locally; record any difference and fix it, or note why it's intended

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff and fix the findings you choose, test-first.
- On branch `live-distribution`: commit the code, then archive this change with spec sync as a second commit, `Archive live-distribution`, then open the pull request. Group 6 happens after the merge; its outcome is recorded in a follow-up pull request.
