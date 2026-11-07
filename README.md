# Tesla Solar Report (Next.js)

The Next.js dashboard for https://teslasolar.report, being moved here from anton-tesla-api-ws one page at a time. Until the cutover it runs at https://next.teslasolar.report, and a page not moved yet links to its counterpart on the live site. The API in anton-tesla-api-ws keeps writing the database; this app only reads it.

What each part does, exactly, is in [`openspec/specs/`](openspec/specs/); the redesign's mockups are at https://claude.ai/artifact/7crQGRyQS9J8wSdKYJjD6d.

## Stack

| Layer | Tech | Pinned in |
|---|---|---|
| App | Node 24, Next.js 16 (app router, standalone output), React 19, TypeScript 6 | `.nvmrc`, `package.json`, `Dockerfile` |
| UI | Tailwind 4, shadcn/ui, IBM Plex Sans and Mono through `next/font` | `package.json` |
| Database | PostgreSQL 18 at 192.168.40.5 through `pg`, read-only (a throwaway PostgreSQL 18 in tests) | `package.json` |
| Tests | Vitest, Testing Library, jsdom | `package.json` |
| Serving | onyx in Docker, behind its own Cloudflare tunnel | `docker-compose.yml`, `deploy/` |

## Setup

```sh
nvm install && yarn install
brew install postgresql@18          # the tests start their own server from it
git config core.hooksPath .githooks # run the tests on each commit that stages code
yarn dev                            # http://localhost:3000
```

The pre-commit hook runs Vitest when anything but OpenSpec artifacts or Markdown is staged; a failing test blocks the commit. Skip it with `git commit --no-verify`; the deploy's build still runs every test.

## Environment

Settings live in `.env` at the repository root, never committed; `.env.example` lists them.

| Variable | | What it does |
|---|---|---|
| `DATABASE_URL` | required | the site's database, as the API's login `tsr_app`: `postgresql://tsr_app@192.168.40.5:5432/tsr`. Leave the password out when `PGPASS_FILE` is set. |
| `PGPASS_FILE` | optional | host path of a libpq password file (mode 600) holding the database's password. Compose mounts it read-only and the app reads the password from it. Without it, put the password in `DATABASE_URL`. |
| `PUSHOVER_USER` | optional | Pushover user key; with `PUSHOVER_TOKEN`, the weekly audit alerts when it fails |
| `PUSHOVER_TOKEN` | optional | Pushover application API token; without both, nothing is sent |

Every session the app opens is read-only and in UTC, so nothing here can change the data the API writes. The database accepts `tsr_app` only from onyx, so a local `next dev` can't read production; pages that need the database work on onyx.

## Deploy

```sh
git push server main
```

The app runs on onyx (`onyx@192.168.40.63`) in `~/tesla-next`, with no published port. Its own Cloudflare tunnel container, `~/tesla-next-tunnel`, joins the compose network and Cloudflare routes `next.teslasolar.report` to `http://next:3000`.

Two remotes:

| Remote | Where | For |
|---|---|---|
| `origin` | `git@github.com:toddseller/tesla-next.git` | the code and its history |
| `server` | `onyx@192.168.40.63:repos/tesla-next.git` | deploys |

A push of `main` to `server` runs the bare repository's `post-receive` hook (source: `deploy/post-receive`). It checks the commit out into `~/tesla-next` and rebuilds the image with a new `AUDIT_RUN`, so the dependency audit reruns against today's advisories. Then it replaces the container and trims Docker's image and build cache. The build audits and tests before it builds, so a failing audit or test stops the deploy, and the site keeps the previous version. Other branches are never deployed.

Roll back with `git revert <commit>` and a push; never force-push.

Install or update the hook after changing it:

```sh
scp deploy/post-receive onyx@192.168.40.63:repos/tesla-next.git/hooks/post-receive
ssh onyx@192.168.40.63 chmod +x repos/tesla-next.git/hooks/post-receive
```

## Dependency audit

Every image build audits what the app ships before it runs the tests, and a known advisory stops it (and the deploy):

- `scripts/audit.mjs` fails on a high or critical advisory in a runtime package (`dependencies` in `package.json`), and lists the rest. Advisories in build and test tools (`devDependencies`) are listed and never fail the build. An audit that can't finish, such as when the registry is unreachable, fails the build.
- To waive an advisory that doesn't apply, add its GitHub advisory ID to `WAIVED` in `scripts/audit.mjs` with the reason.
- Every dependency is pinned to an exact version, so the image ships what was checked.

### Weekly audit

Advisories published between deploys are caught by `deploy/weekly-audit`. A systemd user timer runs it on onyx every Monday at 06:30 Pacific time, half an hour after anton-tesla-api-ws's, and a run missed while onyx was off happens at its next boot. It builds the image's `test` stage (audit and tests) from the deployed commit without touching the running container. When that fails, it sends a Pushover alert through `deploy/pushover` with the end of the build's output; a passing run sends nothing. Its last output is in `~/tesla-next-weekly-audit.log`.

Install the units once, and again after changing them:

```sh
ssh onyx@192.168.40.63 mkdir -p .config/systemd/user
scp deploy/tesla-next-weekly-audit.service deploy/tesla-next-weekly-audit.timer onyx@192.168.40.63:.config/systemd/user/
ssh onyx@192.168.40.63 'systemctl --user daemon-reload && systemctl --user enable --now tesla-next-weekly-audit.timer'
```

Check it with `ssh onyx@192.168.40.63 systemctl --user list-timers tesla-next-weekly-audit.timer`, and run it at once with `systemctl --user start tesla-next-weekly-audit` there.

To check without building:

```sh
yarn audit --groups dependencies --json | node scripts/audit.mjs
```

## Tests

```sh
yarn vitest run
```

Every test runs everywhere: locally, in the pre-commit hook and in the Docker build. Tests that need a database get their own: a throwaway PostgreSQL 18 started for the run, on a Unix socket in a temporary directory, removed when the run ends. They never touch production.

It needs PostgreSQL 18's binaries. On the Mac, `brew install postgresql@18` (the tests find Homebrew's copy; `pg_config` on the PATH may belong to an older version). Anywhere else, put them on the PATH or point `PG_BIN` at their folder:

```sh
PG_BIN=/usr/lib/postgresql/18/bin yarn vitest run
```
