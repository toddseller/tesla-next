# Design

## Context

See proposal.md, Why. These facts from anton-tesla-api-ws shape the spike:

- Flask pushes `live` (every 10 s) and `totals_updated` over Socket.IO from a single gunicorn worker. nginx caps sockets at 10 per visitor and 80 in total, because each socket holds one of the API's 100 threads.
- Socket.IO's `connect` handler checks `SOCKET_TOKEN`. The dashboard's bundle carries that token (`VITE_SOCKET_TOKEN`), so anyone who loads the page has it. It gates nothing a visitor can't reach.
- The database (PostgreSQL 18 at 192.168.40.5) accepts `tsr_app` only from onyx. The API gets its password from a libpq password file mounted at `/run/secrets/pgpass` (`PGPASS_FILE`).
- nginx sends a strict CSP (`script-src 'self' https://static.cloudflareinsights.com`) along with HSTS, frame, and referrer headers. Cloudflare adds its Web Analytics beacon to every page.
- The current dashboard image runs the dependency audit and Vitest before building, so a failure stops the deploy.

## Goals / Non-Goals

**Goals:**

- A clear pass or fail for each of the proposal's five checks, measured on onyx through a real Cloudflare Tunnel, not on the Mac.
- For each failure, the workaround found, or "none found".

**Non-Goals:**

- Porting any real page, endpoint, or query beyond the one Top Ten query used for checks 3 and 4.
- Changing Flask so it sends `NOTIFY`. The spike sends `NOTIFY` by hand.
- The deploy hook, dependency audit, backups, or any production cutover.

## Decisions

### Live updates: Postgres `LISTEN/NOTIFY` streamed as SSE from a route handler

Next.js route handlers can't upgrade to WebSockets, and the push only goes one way, so SSE fits. A single long-lived `pg` client in the Next.js server `LISTEN`s on the channel, and each open `GET /api/live` stream writes every notification as an SSE event.

- *Alternative: a custom Node server hosting Socket.IO.* Rejected because it gives up the standalone build and keeps a second protocol.
- *Alternative: Next.js polling Flask.* Rejected because it keeps Flask's HTTP side, which the move is meant to drop.
- The spike's channel is `spike_live`, so nothing the production app might later listen on hears it.

### Self-hosting: `output: "standalone"` on `node:24-alpine`, in its own compose project and tunnel

This follows the onyx convention: the app lives in `~/tesla-next` with its own compose file, next to `~/tesla-next-tunnel`. Joining the existing `tsr-tunnel` would couple the spike to the live site's network. The image is built on the Mac with `DOCKER_DEFAULT_PLATFORM=linux/amd64` first, as a rehearsal. The container sets `HOSTNAME=0.0.0.0`, and nothing is published on the host.

### Database: `pg` (node-postgres), read-only at the session level

The Next.js container mounts the same password file the API uses and sets `PGPASSFILE`. Both libpq and node-postgres read it, so the connection string carries no password. Every session starts with `default_transaction_read_only=on` (set in the connection options), so a stray write fails instead of changing production data.

- *Alternative: an ORM (Drizzle or Prisma).* Deferred. The spike needs one query, and the migration proposal can pick an ORM once it's porting 9 endpoints.

### UI components: shadcn/ui replaces MUI, Chart.js stays

The dashboard uses only a few MUI pieces: tables, a sidebar list, a button, a popover, tooltips, the date picker, and a theme provider. shadcn/ui covers all of them, with the date picker becoming `Calendar` (react-day-picker) inside a `Popover`. The components are copied into the repository and styled with Tailwind 4, which the dashboard already uses. That removes Emotion's runtime styling, and with it the cache provider the app router would need for server rendering.

- *Alternative: keep MUI through `@mui/material-nextjs`.* Rejected. It keeps five packages and a runtime styling layer for a handful of components.

Chart.js stays. The dashboard's charts depend on Chart.js-specific features: stacks split by sign, a projection band (`fill: "+1"`), mixed bar and line stacks, clickable bars, and doughnuts. Its tests check Chart.js dataset shapes directly.

- *Alternative: Recharts, which shadcn/ui's charts wrap.* Deferred to its own change. It would mean rewriting six chart files and their tests, and it doesn't help server rendering: `ResponsiveContainer` measures in the browser, the same way Chart.js draws its canvas there.

### Rendering page: Top Ten

Top Ten has no live data, and its data comes from three queries, so a single page can exercise checks 3 and 4. It reads the top ten solar days (the same query as `data_model.get_solar_top_ten`), renders them in a shadcn/ui `Table` on the server, and shows a Chart.js bar chart in a client component.

### CSP: a per-request nonce set in middleware (`proxy.ts` from Next.js 16)

Next.js adds inline scripts for hydration, which `script-src 'self'` blocks. The middleware generates a nonce and sends `script-src 'self' 'nonce-<n>' 'strict-dynamic' https://static.cloudflareinsights.com`; Next.js puts the nonce on its own scripts. That makes every page dynamic, which costs nothing here because the pages show live data anyway. `style-src` keeps `'unsafe-inline'`, as nginx's does today, because Radix positions popovers with inline `style` attributes and Chart.js sets them on its canvas. The other nginx headers move to `headers()` in `next.config`.

- *Alternative: `'unsafe-inline'`.* Rejected because it weakens the CSP that nginx sends today.

### Tests

The spike follows the test-first rule, but only for code with logic: turning a notification into an SSE frame, and building the CSP header from a nonce. Both get Vitest tests. Checks 1 to 5 are integration checks, measured with `curl -N`, the browser console, and timing, and recorded in Findings.

## Risks / Trade-offs

- [Next.js compression or Cloudflare buffers `text/event-stream`, so events arrive in batches or only when the stream closes] → Send `Cache-Control: no-cache, no-transform` and `X-Accel-Buffering: no`. If events are still batched, try turning compression off for that route (`Content-Encoding: none`) or for the whole app (Cloudflare compresses anyway). Record which one worked.
- [Cloudflare closes idle streams after about 100 s] → Send a comment line (`: ping`) every 25 s, and confirm the browser's `EventSource` reconnects on its own after a forced disconnect.
- [The spike touches the production database] → Session-level read-only mode, plus `NOTIFY` only on `spike_live`. Never run anything that imports the Flask app.
- [The Cloudflare beacon only loads when Web Analytics is on for the hostname] → Turn it on for the test hostname, or record check 5's beacon part as untested.
- [A test hostname makes production data public] → The same data is already public on teslasolar.report. Remove the hostname once the spike ends.

## Migration Plan

None. The spike runs next to the live site, and nothing is switched over. Afterwards, `docker compose down` on onyx, then delete the tunnel and hostname in Cloudflare, unless the migration proposal decides to keep them.

## Findings

<!-- Filled in during the spike: one row per check, with result, measurement, and the workaround if one was needed. -->

| # | Check | Result | Evidence / workaround |
|---|---|---|---|
| 1 | SSE through the tunnel under 1 s | Pass | 10 `pg_notify` calls from onyx reached a browser on the test hostname in 15 to 32 ms (database clock to browser clock), with no workaround. Next.js doesn't compress `text/event-stream`, even when the request accepts gzip. The stream survived 3 min 8 s idle on 25 s pings, and after `docker compose up --build` replaced the container, the browser reconnected by itself and got the next event in 43 ms. Next.js holds a streamed response's headers until its first body bytes (seen locally too, without Cloudflare), so `onopen` waits for the first event or ping. That's harmless with `live` every 10 s; writing a comment line when the stream opens would send them at once. `pg` warns that password-file support goes away in pg 9; the migration will need to read the password file itself and pass `password` as a function. |
| 2 | Standalone image on onyx | Pass | The amd64 image (326 MB, about half of it the `node:24.22.2-alpine3.24` base) builds on the Mac and on onyx with the tests run first. It runs as `node` with no published port, and `tesla-next-tunnel` reaches it at `http://next:3000`. The test hostname returns 200 over HTTPS through Cloudflare (SJC). Inside the container, `localhost` resolves to IPv6 and gets refused, because the server listens on IPv4 `0.0.0.0` only; the service name works. |
| 3 | shadcn/ui + Chart.js server render and hydration | Pass | `/top`'s server HTML has all 10 rows and links one static stylesheet, with nothing styled at runtime. The Chart.js bar chart draws after hydration. Under `next dev`, the only hydration warning came from the Dark Reader browser extension's attributes on `<html>`, not from the app. |
| 4 | Read-only production query | Pass | The pool sets `default_transaction_read_only=on` (a Vitest test checks the option). Against a local restore of the Nov 7 dump, a write through it fails with "cannot execute CREATE TABLE in a read-only transaction". On onyx, `/top` reads production as `tsr_app` through the mounted password file, and its 10 rows match teslasolar.report's `/api/v2/top_ten` row for row. Rows that tie (78.6 kWh on May 20, 2022 and Jun 16, 2024) have no tie-breaker in either query, so the migration should add one (`date`) to both. |
| 5 | Nonce CSP plus Cloudflare beacon | Pass | The proxy sets a per-request nonce. Every Next.js script tag carries it, and both pages load through the tunnel with no CSP violations. `next.config` `headers()` sends every other header nginx does (HSTS, frame, nosniff, referrer, permissions), and `X-Powered-By` is off. Web Analytics' automatic setup already covers the whole zone, so the test hostname gets the beacon. Cloudflare adds the page's nonce to it, so `'strict-dynamic'` doesn't block it, and the browser requests it with no violation. Cloudflare injects the beacon only for browser-like requests, so plain `curl` never shows it. With Brave Shields up, the beacon's request returned 503 on both the test hostname and teslasolar.report, because Brave's tracker lists block it. With Shields down for the test hostname, the beacon loaded (200), ran (`__cfBeacon` defined) and reported to `/cdn-cgi/rum` (204), with no CSP violations. `next dev` would need `'unsafe-eval'` in development, which the spike left out. |

### Recommendation: go, with changes

All five checks pass on onyx through the real tunnel. Next.js can replace nginx and Flask's HTTP side. Flask stays as a worker that calls `pg_notify` where it now calls `socket.emit`. The migration proposal should carry these changes:

- **Tests get their own PostgreSQL**, as anton-tesla-api-ws's do, in the Docker build stage too. The spike's database tests only check configuration because the build has no database.
- **The password comes from a function** that reads `PGPASSFILE`, because `pg` 9 drops its built-in password-file support.
- **The SSE route writes a comment line when a stream opens**, so `onopen` fires at once. When the database is unreachable, it answers 200 with `retry: 5000` and closes, as the spike's route does. `EventSource` stops retrying after any non-200 response, so a 500 would leave pages frozen until reloaded.
- **`NOTIFY` payloads are capped at 8000 bytes.** Check the `live` status with weather fits; otherwise notify a key and have the route read the row.
- **Top-ten queries get a tie-breaker** (`date`) in both the API and Next.js until the API's read endpoints are gone.
- **The CSP drops nothing nginx has, except `wss://teslasolar.report`**, which same-origin SSE no longer needs. Development mode needs `'unsafe-eval'`.
- **Socket.IO's connection caps (10 per visitor, 80 in total) have no counterpart.** An SSE stream costs Node an open socket, not one of gunicorn's 100 threads, so a cap is optional; decide whether to add one.
