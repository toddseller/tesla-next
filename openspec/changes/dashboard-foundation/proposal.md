# Proposal

## Why

The spike (`openspec/changes/archive/2026-11-07-spike-nextjs-self-host/`) showed Next.js can replace the dashboard's nginx and Flask's HTTP side. The migration is split into a series of changes, each ending deployed and working on next.teslasolar.report, with the cutover of teslasolar.report last:

1. **dashboard-foundation** (this change)
2. live-distribution (+ an anton-tesla-api-ws companion change: `pg_notify` for live updates)
3. solar-date-range
4. impact-page
5. true-up-tracker (including the true-up cost in TypeScript)
6. top-ten-page
7. cutover (+ an anton companion change that retires Flask's HTTP, Socket.IO and nginx)

The migration is also a redesign. Pages may change what they show as well as how they look, so each page change starts with its own mockups. The exception is Distribution, whose house scene keeps its styling. The shell and the design system were chosen from mockups (https://claude.ai/artifact/7crQGRyQS9J8wSdKYJjD6d, direction A "Instrument"): a dark, dense look with monospaced figures and Tesla red as the accent, which suits the scene's dark sky.

The later page changes each need the same base: the new frame and navigation, the design system, a deploy that tests and audits before it ships, security headers, and a safe way to read the database. Building that once, first, keeps those changes about their pages.

## What Changes

- A new shell in Next.js, replacing the old sidebar: a top bar with the site's icon (kept from today: the Tesla "T" on an orange sun disc, in its own colors), its name, and the five pages as tabs, the current one marked in Tesla red (`#E82127`). The bar wraps on narrow screens, and a short footer closes the page.
- A design system for every page: dark surfaces, IBM Plex Sans for text and IBM Plex Mono for figures, both served by the site itself, red for marks and indicators, and one fixed color per energy flow (solar, home, Powerwall, grid).
- Each of the five page addresses shows a notice linking to the same page on teslasolar.report until its own change moves it.
- Security headers on every response: the per-request nonce CSP the spike proved, plus HSTS, frame, nosniff, referrer and permissions policies. Fonts are served by the site itself, so the CSP no longer allows Google Fonts.
- Database reads as `tsr_app` in sessions that are read-only and in UTC, with the password read from the mounted password file by the app itself (`pg` 9 drops its own support).
- `git push server main` deploys to onyx through a `post-receive` hook. The build audits the dashboard's runtime dependencies (failing on a high or critical advisory unless waived), runs the tests against a throwaway PostgreSQL, and only then replaces the container. A weekly re-audit sends a Pushover alert when it fails.
- A pre-commit hook runs the tests. README and CLAUDE.md describe the project.
- **BREAKING (spike only)**: the spike's `/live` debug page, its `/api/live` stream on `spike_live`, and its `/top` page are removed. Live updates come back in live-distribution, and Top Ten in top-ten-page.
- No change to anton-tesla-api-ws or teslasolar.report. The live site keeps nginx and its own specs until the cutover, so this change has no anton companion.

## Capabilities

### New Capabilities

- `dashboard-shell`: the frame and design system every page shares: navigation among the five pages, how it fits narrow screens, colors, type and energy colors, the footer, and the notice on a page not yet moved.
- `site-serving`: how the Next.js app is served on onyx: only through its Cloudflare tunnel, with security headers on every response, and a deploy that keeps the running version when a build fails.
- `dependency-audit`: keeping known vulnerabilities out of what the dashboard ships, at every build and weekly between deploys.
- `database-access`: how the app reaches the site's database: as `tsr_app`, read-only, in UTC, with the password outside the repository.

### Modified Capabilities

None. tesla-next has no specs yet. The anton-tesla-api-ws capabilities with the same names keep describing the live site until the cutover change removes or narrows them there.

## Impact

- **tesla-next**: new `app/` layout and pages, the shell's components, theme tokens in `app/globals.css` (shadcn/ui's variables set to the design system), `lib/db.ts`, `proxy.ts`, `next.config.ts`, the Dockerfile (audit, test PostgreSQL), `deploy/` (post-receive, weekly audit, Pushover), `.githooks/pre-commit`, README.md, CLAUDE.md. Spike pages and the SSE route are deleted.
- **Dependencies**: IBM Plex Sans and Mono through `next/font/google` (downloaded at build, served by the site); a small reader for the password file instead of `pg`'s deprecated built-in one.
- **onyx**: a bare repository `~/repos/tesla-next.git` with the `post-receive` hook. `~/tesla-next` becomes its checkout instead of an rsync target. A systemd user timer runs the weekly audit.
- **Git remotes**: `server` (onyx, deploys) next to `origin` (GitHub).
- **Cloudflare**: unchanged; `next.teslasolar.report` stays the test hostname until the cutover.
