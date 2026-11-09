# CLAUDE.md

Facts that change how to work in this repo. What the app is, setup and env vars: `README.md`. What each part does: `openspec/specs/`.

## Traps

- `DATABASE_URL` on onyx is production, the database anton-tesla-api-ws's API writes. This app's sessions are read-only on purpose (`lib/db.ts`); never loosen that or add a write. The database accepts `tsr_app` only from onyx, so a local `yarn dev` can't reach it.
- `next dev` writes `AGENTS.md`; commit it as it is rather than deleting it, or it comes back as an uncommitted change.
- The CSP allows `'unsafe-eval'` only when `NODE_ENV` is `development` (`lib/csp.ts`). A page that works in `yarn dev` can still break under the production policy, so check new pages with `yarn build && yarn start` too.
- The pages are rendered per request (`dynamic = "force-dynamic"` in the layout) because the CSP nonce is per request. Don't make a page static.
- Never commit `.env` files, and never print the database password or Pushover keys, including in command output.
- The system's costs are private: they live only in the file `SYSTEM_COSTS_FILE` names on onyx. Never commit them, put them in a spec, test, design, PR or commit message, or print them; specs and tests use placeholder figures, and the payback route and page show years only.
- The Distribution page is a port of anton-tesla-api-ws's, its behavior specified by the specs copied from there (`live-flow-scene`, `scene-weather`, `scene-replay`, `day-intervals`). Change behavior through those specs.
- The Solar page's day views and range chart are ported from anton-tesla-api-ws too (specs `solar-range-chart`, `solar-day-view`). `lib/range.ts` keeps anton's float8 casts and per-period scans over the `real` columns, so totals round as the site has always shown them; changing either shifts some totals by 0.1 kWh.
- Next.js gives `instrumentation.ts`, pages and route handlers each their own copy of a module, so `lib/live.ts` keeps its state on `globalThis`. Keep it there, or the listener the server starts isn't the one pages read.
- Install and add packages under Node 24 (`nvm use`): `jsdom` refuses Node 25, and `yarn add` fails under it.

## Working rules

- Ask before publishing a release (a `v*` tag, in GitHub's web UI); the tag deploys it to teslasolar.report. Merging to `main` deploys nothing. See README.md, Deploy.
- Changes go through OpenSpec: `/opsx:explore`, `/opsx:propose`, `/opsx:apply`, then `/opsx:archive` with the delta specs synced into `openspec/specs/`.
- A new page or a page redesign starts with its own mockups (Distribution's house scene keeps its styling). The design system lives in `app/globals.css`; use its tokens (`text-solar`, `bg-card`, `text-muted-foreground`), not hex values.
- A change that touches a version pin or an env var updates `README.md` in the same change.

## Verifying

- Every test runs everywhere: locally, in the pre-commit hook and in the Docker build. A test that can't is fixed or removed, never skipped.
- Tests that need a database use the throwaway PostgreSQL from `test/postgres.ts` (`inject("pg")`), never production.
