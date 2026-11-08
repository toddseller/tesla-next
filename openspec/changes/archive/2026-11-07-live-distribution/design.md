# Design

## Context

See proposal.md, Why. What anton-tesla-api-ws does today (at `c84caf0`):

- **Live status** is held in Flask's memory. `poll_live` reads Tesla every 10 seconds and emits `with_weather(status)` as the `live` Socket.IO event; new sockets get the latest at once. The weather part comes from the latest stored `weather_sample` row plus `sunshine.live`, which is the roof's recent output, kept in memory. Only `vehicle.name` and `vehicle.color` need the car list, and Flask fills both in.
- **Replay** fetches `/api/v2/intervals?date=` (`resources/intervals.py`, 218 lines). That read uses:
  - `services/gap_estimates.py` (`fill`, `place_sessions`);
  - `services/sunshine.py` (`reference`, `share`, `quarter_kw`, `slot`);
  - `services/weather.py` (`sky_from`, `rain_from`, `wind_across`, `winds_aloft`);
  - `services/vehicles.py` (`name`, `session_vin`).

  Car names live only in Flask's memory, refreshed from Tesla's vehicle list every 6 hours, so nothing in the database names a car.
- **The page's frontend** sits under `tesla-api-frontend/client/src`:
  - `pages/Distribution.jsx` and `components/ReplayBar.jsx`;
  - `components/scene/` (`LiveScene`, `CloudCanvas`, `cloudInputs`, `cloudLooks`, `cloudRenderer`, `images`, `layout`, `moonFace`, `scene.css`);
  - `utils/` (`liveScene`, `replay`, `weather`, `sun`, `nightSky`, `ranges`);
  - 16 WebP images and `stars.json`;
  - the live-status part of `contexts/ContextProvider.jsx`.

  Every module has Vitest tests (about 3,500 lines). There are no rendering dependencies beyond React: the clouds are a hand-written WebGL renderer.
- **tesla-next:** `lib/db.ts` builds a read-only UTC pool with the password read from the password file. Tests get a throwaway PostgreSQL 18 (`test/postgres.ts`). Pages render per request, under a nonce CSP whose `connect-src` is `'self'`.

## Goals / Non-Goals

**Goals:**
- The page behaves as anton's does, for every requirement copied into this change's specs.
- `/api/intervals` matches Flask's JSON for every date.

**Non-Goals:**
- Redesigning the scene, which keeps its styling.
- A scene wider than 1280 pixels, which needs sharper images.
- The Solar page's day view, which later reads the same `/api/intervals` in change 3.
- Moving live weather out of Flask.
- A connection cap on streams.

## Decisions

### Live path: `pg_notify` from Flask, one `LISTEN` client in Next.js, SSE to pages
- **Flask:** after `socket.emit("live", payload)`, `poll_live` calls `SELECT pg_notify('live_status', :payload)` on its own autocommit connection, wrapped so a failure only logs. The payload is the same JSON the socket sends, about 1 KB with weather, under Postgres's 8,000-byte limit. If a payload is ever larger, Flask logs it and skips the notification.
- **Next.js, `lib/live.ts`:**
  - one `pg.Client` built from the same target, password function and read-only/UTC options as `lib/db.ts` (exported from there, not repeated);
  - it runs `LISTEN live_status`, keeps the latest payload, and passes each one to a set of subscribers;
  - on `error` or `end` it reconnects every 5 seconds and keeps its subscribers.
  - It starts from `instrumentation.ts` `register()`, so the server is listening before the first visitor rather than on the first request.
- **`app/api/live/route.ts`** returns a `ReadableStream` with `text/event-stream`, `Cache-Control: no-cache, no-transform` and `X-Accel-Buffering: no`:
  - it writes `retry: 5000` and a comment line at once (Next.js holds the headers until the first bytes);
  - then the latest payload, if there is one, then each new one;
  - a `: ping` every 25 seconds;
  - it unsubscribes when the request aborts.
- **The page** opens an `EventSource('/api/live')`, and opens a new one 5 seconds after the browser gives up on it: a browser retries a dropped stream by itself, but not one answered with anything other than 200, such as Cloudflare's 429. (Added after release: a rate limit tripped by the parity check froze an open page until reloaded.) The server component passes `latest()` as the initial status, so the labels are filled in the served HTML.
- **Alternative: a per-stream `LISTEN` connection, as in the spike.** Rejected. It costs one database connection per viewer, and a page opening while the database is down would need the spike's 200-and-close dance. With one shared listener, streams never touch the database.
- **Alternative: Flask writes the status to a table.** Rejected. It adds a write every 10 seconds only to serve the first 10 seconds after a Next.js restart.

### Updated totals: a second notification channel
anton's page reloads a replayed day when Flask emits `totals_updated`, as the scene-replay spec requires, and the Solar page (change 3) needs the same event.
- **anton** sends `pg_notify('totals_updated', '{"date": ...}')` beside each `totals_updated` socket emit, in a second small companion change (`notify-totals`), logged and never failing the store.
- **`lib/live.ts`** also `LISTEN`s on `totals_updated`. Subscribers receive each notification with its channel; only live status is kept as `latest()`.
- **`/api/live`** sends a live status as a plain `data:` event and totals as `event: totals`, so a page subscribes to each with `EventSource`'s own event names.
- **Alternative: refetch today every 5 minutes while it is replayed.** Rejected: it differs from anton's behavior, and change 3 would need the event anyway.

### Weather: live from Flask's payload, history computed in TypeScript
- The live page uses `payload.weather` as anton's page does, so the anton change is only a notification.
- The replay's weather comes from `/api/intervals`, which ports `sky_from`, `rain_from`, `wind_across`, `winds_aloft` and the sunshine reference to TypeScript.
- The cost: the sky rules exist in Python (live) and TypeScript (history) until change 7 decides whether Next.js computes live weather too. The parity check (below) guards against the two disagreeing now.
- **Alternative: compute live weather in Next.js now.** Rejected for this change. It would also port `sunshine.live`, whose memory of recent output lives with the poller.

### Car names: a table anton writes
- The anton change adds `vehicle (vin primary key, display_name, streamed boolean)`. `vehicles.refresh()` replaces its rows in one transaction after each successful vehicle-list read. `streamed` is `vin in streamable_vins()`, so `IGNORE_VEHICLES` stays an anton setting.
- `db.create_all()` creates the table at startup, owned by `tsr_app`, as anton's other tables are.
- tesla-next reads it to name cars (`"Vehicle"` when missing) and to infer a session's car among the streamed ones.
- **Alternative: a `VEHICLE_NAMES` setting in tesla-next.** Rejected. It would go stale whenever a car is renamed in the Tesla app.

### The intervals read: a line-by-line port with Python's arithmetic
- **Where it lives:** `lib/intervals/`, one module per Python module (`gapEstimates.ts`, `sunshine.ts`, `weather.ts`, `vehicles.ts`, `intervals.ts`), with `app/api/intervals/route.ts` validating `date` as `parse_day` does.
- **Queries:** plain SQL through the `db` pool, selecting the columns the models map.
- **Two Python behaviors the port has to reproduce exactly, or the parity check fails:**
  - **Rounding:** `round(x, n)` rounds halves to even, on the double's exact value. A `pyRound` helper does this, tested with exact ties such as `0.125` and `2.5`.
  - **Times:** `datetime.isoformat()` with the site's offset (`2026-11-07T00:00:00-08:00`). A helper formats instants in `America/Los_Angeles` through `Intl`, tested across both daylight saving changes.
- **One deliberate difference:** Python 3.14's `date.fromisoformat` also reads `20261016` and ISO week dates (`2026-W42-5`). The route accepts only `YYYY-MM-DD`, the only form the page sends, and answers 400 for the others.
- **Tests:**
  - anton's pytest cases for these modules, ported to Vitest;
  - route tests against the throwaway PostgreSQL, loaded with the production schema of the six tables. `test/schema.sql` comes from `pg_dump --schema-only` on onyx and is committed, with how to regenerate it.

### Parity check: every date, against the live API
- `scripts/compare-intervals.mjs` asks `https://teslasolar.report/api/v2/intervals` and `https://next.teslasolar.report/api/intervals` for every date from 2021-10-01 to today, four at a time, and deep-compares the parsed JSON.
- It also checks an out-of-window date on both, expecting matching 400s.
- It prints each mismatch's date and first differing path, and exits non-zero on any.
- It runs after the release to next.teslasolar.report, since both hosts are public. The result is recorded in this design.

### The page's port: file for file, tests first, logic unchanged
- **Where files go:**
  - each `.js`/`.jsx` becomes `.ts`/`.tsx` under `components/scene/` (components) and `lib/scene/` (pure utilities);
  - `Distribution.jsx` becomes `components/scene/distribution.tsx`, a client component;
  - `app/distribution/page.tsx` stays a server component that reads `latest()` and `searchParams.at`.
- **Order:** each module's tests are ported first and run failing (module missing), then the module.
- **What changes:** types and imports only; no behavior changes.
- **ContextProvider:** only its live-status handling comes over. The date-range fetching belongs to later pages.
- **Images** are served from `public/scene/` and named by URL (`/scene/house-open.webp`). Next.js turns a static image import into an object, while Vitest gives a URL string, so imports would need handling for one or the other; URLs are the same in both. They lose content-hashed names: Next.js serves `public/` with revalidation, so a changed image still reaches browsers. `stars.json` is data and lives in `lib/scene/`.
- **Tests are ported with their values unchanged.** Three exact comparisons of percentage styles became numeric ones to 4 decimals: jsdom 31 (here) reads percentages back to 4 decimals, where anton's jsdom 30 kept them whole. The component sets the same values.
- **`scene.css`** moves unchanged and is imported by the scene, so the scene keeps its own look inside tesla-next's frame.
- **Weather override for development:** on unless `process.env.NODE_ENV` is `production`, read at each call, so Next.js compiles it out of production builds while `next dev` and the tests (`NODE_ENV=test`) keep it. anton's tests turned it off with `vi.stubEnv("DEV", false)`; here they stub `NODE_ENV` to `production`.
- **The page's data** comes from one hook, `useSiteData`, with the fields anton's context gave the page: live status from the server-rendered status and then `EventSource('/api/live')`, and the replayed day from `/api/intervals`, reloaded on a `totals` event for that day. The page's test mocks the hook as anton's mocked the context.
- **The address** comes from the page's search parameters, and is rewritten with `history.replaceState`, which Next.js keeps in step with its router; its own `router.replace` would render the page on the server again for every scrub.
- **The replay bar's date picker** is shadcn's `Calendar` in a `Popover`, replacing MUI's `DatePicker`, with `lucide-react` icons in place of `react-icons`. This adds `react-day-picker`, `date-fns`, `radix-ui`, `lucide-react`, `class-variance-authority` and shadcn's `cn`, pinned exactly. Its tests drive the real picker (open, pick a day, Escape) where anton's mocked MUI's and read its props.

### The scene may be wider than the frame
- **Why:** anton's rule is kept: the scene grows to 1280 pixels, and the window height limits it first on most desktops. That's more room than anton had, since there's no sidebar.
- **Why 1280 is the ceiling:** the house images are 2400 pixels wide, which gives 2 image pixels per CSS pixel at 1280, the `live-flow-scene` sharpness minimum. A wider scene needs re-exported images, which is a separate change.
- **How:**
  - the top bar, footer and other pages keep the 1200 pixel frame;
  - on this page, the scene's wrapper breaks out of the frame, centered, to `min(1280px plus the scene's side padding, the window less the 16 pixel gutters)`;
  - the layout itself doesn't change.

## Risks / Trade-offs

- [The sky rules exist twice, in Python for live and in TypeScript for history, and could drift.] → The parity check covers history against Python now. Change 7 decides where live weather is computed.
- [A port changes behavior subtly: rounding, time zones, the order of iteration over sets.] → anton's tests are ported with their exact values, and the parity check compares every date.
- [The live payload grows past 8,000 bytes.] → It's measured in the anton change's test. Flask logs and skips instead of failing the poll, and the page shows its stale warning.
- [After a deploy, the first 10 seconds have no status.] → The labels show dashes until the next poll, as anton's page does after a Flask restart.
- [WebGL in jsdom.] → The renderer's tests already stub the context, and the port keeps those stubs.
- [The test schema drifts from production as anton adds columns.] → `test/schema.sql` names its source and how to regenerate it. The parity check catches any read that no longer matches.
- [No cap on SSE streams.] → Each stream costs Node an open socket and a timer, and the site has a handful of viewers. A `shortcut:` comment in the route names the limit.

## Migration Plan

1. **anton companion change** (`notify-live-status` in anton-tesla-api-ws): proposed, applied, reviewed, merged, then deployed with `git push server main` after you approve. It adds the notification and the `vehicle` table. teslasolar.report behaves exactly as before.
2. **This change's pull request:** the `test` check passes, you merge, then publish a release.
3. **On next.teslasolar.report:**
   - live updates arrive within a second;
   - the parity script passes;
   - a side-by-side visual comparison with teslasolar.report at 375, 844, 1280 and 1920 pixels by day, at night, in replay and with a car.
4. **Rollback:** re-release the previous tag, or roll back to `tesla-next-next:previous`. The anton change is harmless on its own and can stay.
