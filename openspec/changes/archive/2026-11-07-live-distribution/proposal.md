# Proposal

## Why

Distribution is the live heart of the dashboard: the house scene with its energy flows, the weather sky and the replay of past days. It still runs on anton-tesla-api-ws's React app, fed by Flask's Socket.IO and `/api/v2/intervals`. It is the second page in the migration series and the first with live data, so it also proves the live path that replaces Socket.IO: Flask calls `pg_notify`, and Next.js streams it to the browser (measured at 15 to 32 ms in the spike).

## What Changes

- **`/distribution` moves to tesla-next**, replacing its "not moved yet" placeholder. The scene keeps its styling, as decided for the series; there are no mockups. The page's code (about 3,000 lines and 3,500 lines of tests) is ported from JavaScript to TypeScript with its logic unchanged, and its 16 images and star catalog move with it.
- **Live status arrives over a server-sent event stream** (`/api/live`) instead of Socket.IO. One `LISTEN` connection in the Next.js server receives each notification from Flask and forwards it to every open page. A page opening gets the latest status at once, rendered on the server.
- **Replay reads its day from tesla-next** (`/api/intervals?date=`): a TypeScript port of Flask's `/api/v2/intervals`, including energy flows, battery history with estimated gaps, measured, gap-filled and session-estimated car charging, the car's name, and the weather history with roof sunshine. It must return the same JSON as Flask's for every day.
- **Companion change in anton-tesla-api-ws** (its own OpenSpec change, branch and deploy), with no change to what Flask serves:
  - after each successful live poll, Flask also sends the `live` payload with `pg_notify`;
  - Flask stores the account's car names in a new table, so the intervals read can name the car without calling Tesla.
- The Socket.IO path and anton's Distribution page keep running for teslasolar.report until change 7 (cutover).

## Capabilities

### New Capabilities
- `live-status-stream`: how the Next.js server receives live status from Flask and streams it to pages: latency, the current status on opening, before the first update, losing the database, and reconnecting.
- `live-flow-scene`: the house scene and its live flows, labels, car, day and night and sunlight. Taken from anton's spec of the same name, with its size scenarios rewritten for a page without a sidebar; the scene still grows to 1280 pixels, past the 1200 pixel frame.
- `scene-weather`: the sky, clouds, rain, stars, moon and their readings. Taken from anton's spec of the same name.
- `scene-replay`: replaying a past day on the scene, scrubbing, playback and shareable links. Taken from anton's spec of the same name.
- `day-intervals`: the day's 5 minute history the replay reads. Taken from the read-side requirements of anton's `energy-intervals`, `vehicle-charging`, `battery-history` and `scene-weather` specs.

### Modified Capabilities
None: `dashboard-shell`'s placeholder requirement already ends when a page's own change brings it.

## Impact

- **New code:** `app/distribution/`, `components/scene/`, the scene utilities and their tests, `lib/live.ts` with `app/api/live/route.ts`, and `lib/intervals/` with `app/api/intervals/route.ts`.
- **Assets:** 16 WebP images (about 0.9 MB) and `stars.json`.
- **Database (read-only, unchanged):** reads `energy_interval`, `battery_sample`, `vehicle_interval`, `charge_session`, `weather_sample` and the new car names table, and `LISTEN`s on one channel.
- **anton-tesla-api-ws:** `pg_notify` in `poll_live`, a car names table written by `refresh_vehicles`, and their tests and specs, deployed with its push deploy.
- **Unchanged:** teslasolar.report, Socket.IO, Flask's `/api/v2/*`, the other placeholder pages.
