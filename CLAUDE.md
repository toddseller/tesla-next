# CLAUDE.md

Facts that change how to work in this repo. What the app is, setup and env vars: `README.md`. What each part does: `openspec/specs/`.

## Traps

- `DATABASE_URL` on onyx is production, the database anton-tesla-api-ws's API writes. This app's sessions are read-only on purpose (`lib/db.ts`); never loosen that or add a write. The database accepts `tsr_app` only from onyx, so a local `yarn dev` can't reach it.
- `next dev` writes `AGENTS.md`; commit it as it is rather than deleting it, or it comes back as an uncommitted change.
- The CSP allows `'unsafe-eval'` only when `NODE_ENV` is `development` (`lib/csp.ts`). A page that works in `yarn dev` can still break under the production policy, so check new pages with `yarn build && yarn start` too.
- The pages are rendered per request (`dynamic = "force-dynamic"` in the layout) because the CSP nonce is per request. Don't make a page static.
- Never commit `.env` files, and never print the database password or Pushover keys, including in command output.

## Working rules

- Ask before deploying (`git push server main`); the push rebuilds and replaces the running app on next.teslasolar.report.
- Changes go through OpenSpec: `/opsx:explore`, `/opsx:propose`, `/opsx:apply`, then `/opsx:archive` with the delta specs synced into `openspec/specs/`.
- The migration from anton-tesla-api-ws is a series of changes, one per page, each starting with its own mockups (except Distribution, whose house scene keeps its styling). The design system lives in `app/globals.css`; use its tokens (`text-solar`, `bg-card`, `text-muted-foreground`), not hex values.
- A change that touches a version pin or an env var updates `README.md` in the same change.

## Verifying

- Every test runs everywhere: locally, in the pre-commit hook and in the Docker build. A test that can't is fixed or removed, never skipped.
- Tests that need a database use the throwaway PostgreSQL from `test/postgres.ts` (`inject("pg")`), never production.
