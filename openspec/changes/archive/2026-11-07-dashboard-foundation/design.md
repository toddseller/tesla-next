# Design

## Context

See proposal.md for motivation. What this design builds on:

- The spike left a working base in this repo: Next.js 16.4.5 with a standalone build, Tailwind 4, shadcn/ui (`Table` only), Chart.js, `lib/csp.ts` and `proxy.ts` (nonce CSP), `next.config.ts` (other headers), `lib/db.ts` (read-only pool), a Dockerfile that runs Vitest before building, and `docker-compose.yml` on onyx behind `tesla-next-tunnel`. The findings are in `openspec/changes/archive/2026-11-07-spike-nextjs-self-host/design.md`.
- anton-tesla-api-ws already solved several of these problems, and this change copies its working patterns rather than inventing new ones. `deploy/post-receive` handles push-to-deploy with `AUDIT_RUN` and cache pruning. `client/scripts/audit.mjs` (with its test) fails on high or critical runtime advisories, supports waivers, and treats an unfinished audit as a failure. `deploy/weekly-audit`, its timer and `deploy/pushover` handle the weekly check. `.githooks/pre-commit` runs the tests.
- The chosen look is direction A of the mockups (https://claude.ai/artifact/7crQGRyQS9J8wSdKYJjD6d) with Tesla red `#E82127`. The site's icon is the current site's `android-chrome-*.png`, `apple-touch-icon.png` and `favicon.ico`. The current site's `index.html` points its Apple touch icon at a missing `/logo192.png`, so that icon is broken today.
- Alpine 3.24 packages PostgreSQL 18 (`postgresql18`), so the test stage can run a throwaway database the way anton's tests do.

## Goals / Non-Goals

**Goals:**

- Every later page change only adds its page: the shell, tokens, database access, deploy and audit are in place.
- `git push server main` is the only way the app reaches onyx, and it can't ship a failing build.

**Non-Goals:**

- Live status in the top bar (battery level and charging) arrives with live-distribution, which brings the SSE stream it needs.
- No page content and no Top Ten. The spike's `/top` is replaced by the "not moved yet" notice.
- No change to anton-tesla-api-ws, teslasolar.report, or the Cloudflare tunnel and its route.
- No light theme. The Distribution scene is dark, and one theme keeps every page consistent with it.

## Decisions

### Shell: one server layout and a small client top bar

`app/layout.tsx` renders the top bar, a `<main>` capped at 1200 px, and the footer. The top bar is a client component only because it needs `usePathname()` to mark the current link with `aria-current="page"`. Links are `next/link`, so moving between pages doesn't reload. The bar is a wrapping flex row, which keeps a phone free of sideways scrolling without a menu button or drawer. Today's collapsible sidebar and its 900 px breakpoint go away.

Each of the five routes renders one shared `NotMovedYet` component (page name and its teslasolar.report path) until its own change replaces it.

- *Alternative: a hamburger menu on phones.* Rejected for now. Five short labels wrap into two lines at 390 px, and a menu would hide them behind a tap.

### Design tokens: Tailwind 4 `@theme` plus shadcn's variables, one dark set

`app/globals.css` defines the palette once. shadcn's variables (`--background`, `--card`, `--border`, `--foreground`, `--muted-foreground`, `--primary` = Tesla red) map to the design system, so shadcn components come out on-brand without per-component styling. Energy colors are named tokens (`--color-solar`, `--color-home`, `--color-powerwall`, `--color-grid`, `--color-grid-fill`), so pages say `text-solar`, not hex values. shadcn's generated light `:root` block and `.dark` variant are replaced by the single dark set.

Measured contrast (WCAG ratios): light text on the background 15.41:1, muted gray on the background 7.40:1 and on panels 6.84:1, white on the current tab 16.55:1, and Tesla red on the background 4.21:1. The red is below 4.5:1, which is why the spec keeps it to marks, indicators and large text.

### Fonts: `next/font/google`, served by the site

IBM Plex Sans (400, 500, 600) and IBM Plex Mono (400, 500) load through `next/font/google`, which downloads them at build time and serves them from `/_next/static`. That removes `fonts.googleapis.com` and `fonts.gstatic.com` from the CSP, with no font files committed. Figures use a `font-mono` utility bound to Plex Mono.

- *Alternative: commit the `.woff2` files.* Rejected: it adds binaries and manual updates for what `next/font` does at build time.

### Icon: the current site's files, through Next's metadata conventions

`app/favicon.ico`, `app/apple-icon.png` (`apple-touch-icon.png`), and the 192 and 512 px PNGs in `public/` come from anton's `public/`. `app/manifest.ts` keeps the current manifest's names and icons, with `background_color` and `theme_color` set to the new background. The current manifest claims the favicon holds 64, 32, 24 and 16 px; it actually holds 48, 32 and 16, and the new manifest says so. Next writes the `<link>` tags, which fixes today's broken Apple touch icon. The top bar shows the 192 px PNG at 24 px, never recolored.

### CSP: the spike's policy minus Google Fonts, plus development mode

`lib/csp.ts` keeps the nonce, `'strict-dynamic'` and the Cloudflare beacon origin, and changes `font-src` to `'self'` and `style-src` to `'self' 'unsafe-inline'`. In `next dev` only, it adds `'unsafe-eval'`, which React's development build needs. The layout keeps `dynamic = "force-dynamic"` so every page gets a nonce.

### Database: `pg` pool with session options and an explicit password reader

`lib/db.ts` keeps one `Pool`, with `options: "-c default_transaction_read_only=on -c timezone=UTC"`. When `DATABASE_URL` has no password, the pool's `password` is an async function that reads `PGPASSFILE` through the `pgpass` package. `pg` 8 uses that same package internally and `pg` 9 drops it, so it is pinned as a direct dependency. A connection error is logged with the database name only, never the URL.

- *Alternative: our own password-file parser.* Rejected: `pgpass` already handles wildcards, escapes and the file-mode check, and is already installed.

### Tests run against a throwaway PostgreSQL, everywhere

A Vitest `globalSetup` runs `initdb` and `pg_ctl` in a temporary directory, on a Unix socket, with the server's default time zone set to America/Los_Angeles, so the UTC test proves something. It hands the URL to tests through `provide`/`inject` and removes the directory afterwards. It finds the binaries through `PG_BIN`, else Homebrew's `postgresql@18`, else PATH. It doesn't use `pg_config`, which on the Mac belongs to an older PostgreSQL 14, and the smoke test fails if a run ever gets a version other than 18. In the Docker test stage, `apk add postgresql18` installs them and the tests run as the `node` user, because `initdb` refuses to run as root. The spike's database tests that only checked configuration are replaced by tests that run real queries.

### Dockerfile: audit and tests gate the build

The stages are `deps` (`yarn install --frozen-lockfile`), then `test` (with `ARG AUDIT_RUN`, it lists build-tool advisories without failing, pipes `yarn audit --groups dependencies --json` into `scripts/audit.mjs`, and runs `vitest run` as `node`), then `build` (`next build`, starting from `test` so a failure stops it), then the runtime image (standalone output only, as `node`). The weekly audit builds the `test` target. `scripts/audit.mjs` and its test are copied from anton unchanged except the comment.

### Deploy: a bare repository with anton's `post-receive`

`~/repos/tesla-next.git` on onyx gets `deploy/post-receive`, which is anton's with `APP` and `REPO` changed: it checks out `main` into `~/tesla-next` and runs `AUDIT_RUN=$(date +%s) docker compose up -d --build --remove-orphans`, then prunes images and keeps 5 GB of build cache. The existing `~/tesla-next`, which the spike filled by rsync, becomes the work tree. Its `.env` is untracked, so it stays. The local repository gains a `server` remote; `origin` stays GitHub.

### Weekly audit: tesla-next's own timer, Monday 06:30 Pacific

`deploy/weekly-audit` builds only the `test` target and alerts through `deploy/pushover`, which reads `PUSHOVER_USER` and `PUSHOVER_TOKEN` from `~/tesla-next/.env`. The two scripts are adapted from anton's. `tesla-next-weekly-audit.service` and `.timer` (`Persistent=true`) run half an hour after anton's, so the two builds don't compete.

- *Alternative: add tesla-next to anton's weekly script.* Rejected: it would tie this repo's audit to anton's deploy path. Anton's script also goes away for the dashboard at the cutover.

### Pre-commit hook and project docs

`.githooks/pre-commit` runs `yarn vitest run` when a staged file is outside `openspec/` and isn't Markdown, and stops with a clear message when `node_modules` or the PostgreSQL binaries are missing. README.md covers the stack, setup (Node from `.nvmrc`, `brew install postgresql@18`, `git config core.hooksPath .githooks`), environment variables, tests, deploy, the weekly audit and the test hostname. CLAUDE.md holds the traps: the database is production and read-only, ask before `git push server`, `next dev` needs the relaxed CSP, and `AGENTS.md` is written by `next dev`.

## Risks / Trade-offs

- [`next/font/google` needs Google reachable at build time] → onyx's builds already need the npm registry and the advisory database. A font fetch failure fails the build, so the site keeps its previous version.
- [Tesla red reaches only about 4.2:1 on the background] → the spec limits it to marks, indicators and text of 24 px or more. Small text stays in the light and muted grays.
- [The test stage gets bigger with PostgreSQL] → only `test` installs it; the runtime image is built from `build` and ships the standalone output alone.
- [Two weekly audits on onyx] → they're staggered by 30 minutes. Each one prunes the same shared cache to 5 GB, as deploys do.
- [The first deploy goes over the spike's rsynced folder] → `checkout -f` overwrites every tracked file, and the folder holds nothing else except `.env`. Before the first push, `ls ~/tesla-next` confirms that.

## End-to-end result

On 2026-11-07, after the first `git push server main`, all five pages on https://next.teslasolar.report were checked in Brave with Shields down for the site:
- each page loaded with its own tab marked as current;
- fonts came only from `/_next/static/media`, with no request to Google, and the favicon and manifest loaded;
- the console reported no CSP violations;
- Cloudflare's beacon loaded (200), ran, and reported to `/cdn-cgi/rum` (204).

With Shields up, Brave blocks the beacon (503) on teslasolar.report too, so that isn't a policy failure. A throwaway branch pushed to the server printed "only main is deployed" and left the container unchanged, port 3000 on onyx answers neither the network nor onyx itself, and the weekly audit passed by hand in 28 s without touching the running container.

## Migration Plan

1. Create `~/repos/tesla-next.git` (`git init --bare`), install `deploy/post-receive` as its hook, add the `server` remote, and push `main`. The hook builds and replaces the spike container. `next.teslasolar.report` then shows the new shell.
2. Add `PUSHOVER_USER` and `PUSHOVER_TOKEN` to `~/tesla-next/.env` (the user copies them from anton's `.env` on onyx), install the weekly-audit units, and run them once by hand.
3. Rollback: `git revert` the bad commit and push, never a force-push. Whenever a build fails, the site stays on its last good build anyway.
