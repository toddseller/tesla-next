# Tasks

## 1. Clear out the spike

- [x] 1.1 Delete the spike's `/live` page, `/api/live` route and its test, `lib/sse.ts` and its test, `app/top/`, and `components/ui/table.tsx`, and remove `chart.js`, `react-chartjs-2` and `components.json`'s unused entries if nothing else needs them; verify `grep -rn "sse\|chart.js\|ui/table" app components lib` finds nothing and `yarn build` passes

## 2. Throwaway PostgreSQL for tests

- [x] 2.1 Add a Vitest `globalSetup` that runs `initdb` (password auth, `postgres` superuser plus a `tsr_app` login and a `tsr` database) and `pg_ctl` on a Unix socket in a temp directory with the server's default time zone set to America/Los_Angeles, writes a temp password file, hands the connection details to tests through `provide`, and stops and removes everything afterwards. It finds the binaries through `PG_BIN`, Homebrew's `postgresql@18`, or PATH (not `pg_config`, which on this Mac belongs to PostgreSQL 14). Write a smoke test first that fails without it (`SELECT current_setting('server_version_num')` is 18xxxx); verify it passes and no temp directory is left behind
- [x] 2.2 Document in README.md how tests get their database (`brew install postgresql@18`, `PG_BIN`); verify the documented command runs the suite on a clean checkout

## 3. Database access (database-access spec)

- [x] 3.1 Write failing tests that the pool refuses `CREATE TABLE`, `INSERT`, `UPDATE` and `DELETE` as writes in a read-only transaction and still answers a `SELECT`; then make `lib/db.ts` pass them; verify the tests pass
- [x] 3.2 Write a failing test that `SHOW timezone` through the pool returns UTC on the Los Angeles default server, then add `-c timezone=UTC` to the pool's options; verify it passes
- [x] 3.3 Write failing tests for the password: from `PGPASSFILE` when `DATABASE_URL` has none, from `DATABASE_URL` when there is no file, and a missing password logging an error that names the database without the URL or password. Then add `pgpass` (exact pin) and the pool's async `password` function; verify all three pass
- [x] 3.4 Update `.env.example` and README.md's environment table (`DATABASE_URL`, `PGPASS_FILE`); verify `docker compose config` still validates with `.env.example` copied to `.env`

## 4. Design system and shell (dashboard-shell spec)

- [x] 4.1 Replace shadcn's generated light and dark variables in `app/globals.css` with the one dark set (background, card, border, foreground, muted-foreground, primary `#E82127`) and the energy tokens (`solar`, `home`, `powerwall`, `grid`, `grid-fill`), and load IBM Plex Sans and Mono through `next/font/google` in the layout; verify `yarn build` passes and the built CSS has the tokens and no `fonts.googleapis.com` URL
- [x] 4.2 Add `@testing-library/react` and `jsdom` (exact pins). Write a failing test that the top bar renders the icon, the name linking to `/`, and the five links in order inside a `<nav aria-label="Pages">`, with only the current path's link carrying `aria-current="page"` (for `/` and for `/true-up`). Then build the top bar as a client component with `next/link` and `usePathname`; verify the test passes
- [x] 4.3 Write a failing test that the footer reads "© 2027 teslasolar.report" with the clock set to 2027, then build it; verify it passes
- [x] 4.4 Write a failing test that `NotMovedYet` for Impact names the page and links to `https://teslasolar.report/impact`, then build it and the five routes (`/`, `/impact`, `/distribution`, `/true-up`, `/top`) in the layout with the top bar, a `<main>` capped at 1200 px, and the footer; verify the test passes and `yarn build` lists the five routes
- [x] 4.5 Copy the current site's icon (`favicon.ico` to `app/`, `apple-touch-icon.png` as `app/apple-icon.png`, the 192 and 512 px PNGs to `public/` for the top bar and the manifest) and add `app/manifest.ts` with its names and icons, the favicon's real sizes (48, 32, 16) and the new background color; verify the built page's `<head>` links the icon, the Apple touch icon and the manifest, and each URL returns 200
- [x] 4.6 Check in a browser against `next start`: at 390 px wide, no page scrolls sideways and every top bar link is at least 44 px tall; at 1512 px, the bar fits on one line and content is at most 1200 px wide; text is Plex Sans with no request to Google's font hosts; and the muted gray, light text and red pass the contrast rules in the spec (record the measured ratios in design.md)

## 5. Security headers (site-serving spec)

- [x] 5.1 Update `lib/csp.test.ts` first, failing: `font-src 'self'`, no Google Fonts hosts, `'unsafe-eval'` only when `NODE_ENV` is `development`. Then update `lib/csp.ts`; verify the tests pass
- [x] 5.2 Verify with `curl -I` against `next start` that `/` carries every header the spec lists and no `X-Powered-By`, and that two requests get different nonces matching their pages' script tags

## 6. Dependency audit at build (dependency-audit spec)

- [x] 6.1 Copy anton's `scripts/audit.mjs` test first and watch it fail, then copy `scripts/audit.mjs` (blocking high and critical, `WAIVED` with reasons, failing when the audit has no summary); verify its tests pass
- [x] 6.2 Rework the Dockerfile into `deps`, `test` (`ARG AUDIT_RUN`, `apk add postgresql18`, build-tool audit listed only, runtime audit through `scripts/audit.mjs`, `vitest run` as `node`), `build` and runtime stages; verify `DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build .` passes, and that a deliberately failing test (not committed) stops it
- [x] 6.3 Document the audit, waivers and how to check without deploying in README.md; verify the documented check command runs

## 7. Deploy (site-serving spec)

- [x] 7.1 Add `deploy/post-receive` (anton's, with tesla-next's `APP` and `REPO`); verify `sh -n deploy/post-receive` passes
- [x] 7.2 Ask the user first, then on onyx confirm `~/tesla-next` holds only tracked files plus `.env`, create `~/repos/tesla-next.git` with the hook, add the `server` remote locally, and push `main`; verify the push output ends "Deploy finished." and https://next.teslasolar.report shows the new shell
- [x] 7.3 Verify the two other deploy scenarios without breaking the site: pushing a throwaway branch prints "only main is deployed" and changes nothing (then delete the branch on the server), and `ssh onyx` `curl -s -m 3 http://192.168.40.63:3000` gets no answer
- [x] 7.4 Document deploy, rollback (`git revert` and push) and the remotes in README.md; verify the documented commands match the hook

## 8. Weekly re-audit (dependency-audit spec)

- [x] 8.1 Add `deploy/weekly-audit` (builds the `test` target with a new `AUDIT_RUN`, alerts on failure, prunes like a deploy), `deploy/pushover` (keys from `~/tesla-next/.env`), and `deploy/tesla-next-weekly-audit.service` and `.timer` (Monday 06:30 America/Los_Angeles, `Persistent=true`); verify `sh -n` on both scripts and `systemd-analyze verify` on onyx
- [x] 8.2 Ask the user to add `PUSHOVER_USER` and `PUSHOVER_TOKEN` to `~/tesla-next/.env` on onyx and to approve one test notification; send it with `deploy/pushover`; verify the user receives it
- [x] 8.3 Install and enable the timer on onyx (ask first) and start one run by hand; verify it passes, sends nothing, leaves the running container untouched (same container ID before and after), and `systemctl --user list-timers` shows the next Monday
- [x] 8.4 Document the weekly audit in README.md; verify the install commands there are the ones just run

## 9. Pre-commit hook and project docs

- [x] 9.1 Add `.githooks/pre-commit` that runs `yarn vitest run` when a staged file is outside `openspec/` and isn't Markdown, and stops with a message naming the fix when `node_modules` or the PostgreSQL binaries are missing; verify a staged code change runs the tests and a staged `.md` alone doesn't
- [x] 9.2 Write CLAUDE.md (production database is read-only here, ask before `git push server`, `next dev` and the CSP, `AGENTS.md` comes from `next dev`) and finish README.md (stack with versions, setup, `git config core.hooksPath .githooks`, test hostname); verify every command in README.md runs as written

## 10. End-to-end on onyx

- [x] 10.1 On https://next.teslasolar.report, with Brave Shields down for the site, open each of the five pages: no CSP violations, the beacon reports to `/cdn-cgi/rum`, fonts come only from the site, the icon shows in the tab, and the current page is marked; verify by browser console and network log, recording the result in this change's design.md

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff before the first commit and wait for the user to choose fixes.
- Commit the work, then archive the change (syncing the four new specs into `openspec/specs/`) as a second commit, `Archive dashboard-foundation`, then push `origin main`.
