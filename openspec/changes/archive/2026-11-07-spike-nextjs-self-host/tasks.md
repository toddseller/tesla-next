# Tasks

## 1. Scaffold

- [x] 1.1 Replace the placeholder `index.js` and `package.json` with a Next.js app router project (TypeScript, exact version pins, Node 24 in `.nvmrc`), with `output: "standalone"` and Vitest; verify `next build` produces `.next/standalone/server.js` and `vitest run` passes with no tests
- [x] 1.2 Add Tailwind 4 and initialize shadcn/ui (`components.json`, `Table` component only), plus `chart.js` and `react-chartjs-2` pinned to the dashboard's versions; verify `next build` still succeeds
- [x] 1.3 Add `.gitignore` entries for `.next/`, `node_modules/` and `.env*`, and an `.env.example` listing `DATABASE_URL` and `PGPASSFILE`; verify `git status` shows no build output or env files

## 2. Live updates over SSE (check 1, local)

- [x] 2.1 Write a failing Vitest test for formatting a notification payload as an SSE frame (`event: live`, `data: <json>`, blank line), then implement it; verify the test passes
- [x] 2.2 Add `GET /api/live`: one shared `pg` client `LISTEN`s on `spike_live` and each open stream receives every notification, plus a `: ping` every 25 s, sent with `Cache-Control: no-cache, no-transform` and `X-Accel-Buffering: no`; verify against a throwaway Homebrew PostgreSQL 18 that `curl -N localhost:3000/api/live` prints an event within 1 s of `NOTIFY spike_live, '{"n":1}'`
- [x] 2.3 Add a client page that opens an `EventSource` and shows each event's arrival time; verify that in the browser, events appear and the stream reconnects after the server restarts

## 3. Self-hosting on onyx (check 2, then check 1 through the tunnel)

- [x] 3.1 Write a multi-stage Dockerfile (`node:24-alpine`, exact tag) that runs `vitest run` before `next build` and ships only the standalone output; verify `DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build .` succeeds on the Mac and the container answers on port 3000
- [x] 3.2 Write `docker-compose.yml` with no published port, `HOSTNAME=0.0.0.0`, the env file, and the password file mounted at `/run/secrets/pgpass` with `PGPASSFILE` set, like the API's; verify `docker compose config` is valid
- [x] 3.3 User step: create the `tesla-next` tunnel and the test hostname (for example `next.teslasolar.report`) routed to `http://next:3000` in Cloudflare, and turn on Web Analytics for it (already on: teslasolar.report's automatic setup covers the whole zone); verify the tunnel token is stored on onyx outside the repository
- [x] 3.4 Deploy to `~/tesla-next` and start `~/tesla-next-tunnel` on its network (ask the user first); verify the test hostname serves the page over HTTPS. Record check 2 in design.md Findings
- [x] 3.5 With the browser page open on the test hostname, send `NOTIFY spike_live` as `tsr_app` from a `postgres:18.6-alpine` container on onyx, 10 times; verify each event's arrival time is under 1 s, that the stream survives at least 3 minutes idle, and that it reconnects after `docker compose restart`. Apply the design's buffering workarounds if needed. Record check 1 in Findings

## 4. Server-rendered page from production data (checks 3 and 4)

- [x] 4.1 Add a `pg` pool for server components whose sessions run with `default_transaction_read_only=on`; verify with a Vitest test that the pool's connection options set it (the Docker build has no PostgreSQL, so a live-database test waits for the migration's test setup), and once by hand against the throwaway local PostgreSQL that a write through the pool fails with a read-only error
- [x] 4.2 Add the Top Ten page: a server component runs the top-ten-solar-days query and renders a shadcn/ui `Table`, plus a client Chart.js bar chart of the same rows; verify locally (against a local restore of a backup dump) that the page HTML has the table rows and the styles before JavaScript runs, and the console shows no hydration warnings
- [x] 4.3 Deploy to onyx; verify the test hostname's Top Ten matches teslasolar.report's Top Ten row for row. Record checks 3 and 4 in Findings

## 5. CSP (check 5)

- [x] 5.1 Write a failing Vitest test for building the CSP header from a nonce (with `'nonce-<n>'`, `'strict-dynamic'`, the Cloudflare beacon origin, and the rest of nginx's directives), then implement it; verify the test passes
- [x] 5.2 Add middleware that sets the nonce and CSP on each request, and move nginx's other security headers into `next.config` `headers()`; verify with `curl -I` that every header nginx sends today is present
- [x] 5.3 Deploy to onyx; verify that on the test hostname both pages load with no CSP violations in the console and the Cloudflare beacon request succeeds. Record check 5 in Findings

## 6. Conclusion

- [x] 6.1 Complete design.md Findings with each check's result, measurements, and workarounds, and a recommendation for the migration proposal (go, go with changes, or stop); verify every row is filled
- [x] 6.2 Ask the user whether to keep or remove the onyx containers, tunnel and hostname, and do what they choose (kept for the migration); verify with `docker ps` on onyx and the Cloudflare dashboard

## Workflow follow-up

- Run the `ponytail:ponytail-review` skill on the uncommitted diff before the first commit, and wait for the user to choose which findings to fix.
- Commit the spike code, then archive the change as a second commit, `Archive spike-nextjs-self-host`, on the same branch and in the same PR.
