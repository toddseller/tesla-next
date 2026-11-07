# Design

## Context

**What this copies.** Myflix's archived change `deploy-by-tag` (`~/Development/Myflix Projects/myflix/openspec/changes/archive/2026-11-06-deploy-by-tag/`) brought over MMDb's system and is running in production:
- `.github/workflows/deploy.yml`: triggered by a `v*` tag, in a `production` environment; it checks the tag is a tested commit on the default branch, then runs `cloudflared access ssh` and sends `deploy $TAG`;
- `bin/deploy`: a forced command that only fast-forwards to a tag, keeps `:previous`, rebuilds and health-checks;
- a test that drives the real script against throwaway repos;
- an `authorized_keys` line with `command=` and every `no-*` option.

Lessons learned there:
- a `v*` tag pushed with git is refused by the tag ruleset, so releases are published in GitHub's web UI;
- a deploy runs the `bin/deploy` the server had before it;
- commands over SSH need `< /dev/null`.

**tesla-next today:**
- **The repo:** public on GitHub, branch `main`, no tags, no workflows. It allows merge, squash and rebase merges.
- **Deploys:** `git push server main` to `~/repos/tesla-next.git`, whose `post-receive` hook does three things:
  - checks out into `~/tesla-next`, a work tree with no `.git`, holding the untracked `.env`;
  - runs `AUDIT_RUN=$(date +%s) docker compose up -d --build --remove-orphans`;
  - prunes images and build cache down to 5 GB, then prints free disk space.
- **The Dockerfile:** `build` starts `FROM test`, so `docker build .` runs the audit and `yarn vitest run` (against PostgreSQL 18 from apk) before `yarn build`. The `test` stage is `node:24.22.2-alpine3.24`, which has no bash or git.
- **Compose:** the project `tesla-next` with service `next`, so the image is `tesla-next-next`. `tesla-next-tunnel` joins the network `tesla-next_default`, which is named after the folder.
- **The weekly audit timer:** runs `~/tesla-next/deploy/weekly-audit` against the checked-out tree.
- **Reaching onyx's SSH:** `myflix-tunnel` reaches `ssh://192.168.40.63:22` from a bridge network the same way `tesla-next-tunnel` would, so the route works without host networking.

## Goals / Non-Goals

**Goals:**
- Myflix's guarantees for tesla-next, as listed in the spec.
- Keeping what the push deploy already does: a fresh audit on every deploy, and the cache trim.

**Non-Goals:**
- Moving anton-tesla-api-ws off its push deploy. Change 7 (cutover) retires most of its HTTP side.
- Building in CI and pulling from a registry.
- Zero-downtime swaps: recreating the container takes a few seconds.
- Sharing Myflix's or MMDb's hostname, token or key.

## Decisions

### `bin/deploy`: Myflix's script, with tesla-next's names and the push hook's extras
- **Kept from Myflix:** the request parsing and its refusals; the fetch without `+`; the fast-forward; tagging `:previous` only when the commit moves; the health check with its `DEPLOY_HEALTH_*` overrides; `main "$@"` last.
- **Renamed:**
  - `master` becomes `main`;
  - `IMAGE=tesla-next-next`;
  - the health URL becomes `https://next.teslasolar.report/`.
- **Added from `deploy/post-receive`:**
  - the build runs as `AUDIT_RUN=$(date +%s) docker compose up -d --build --remove-orphans`, so every deploy audits against today's advisories;
  - after a healthy deploy, `docker image prune -f`, `docker builder prune -f --keep-storage 5GB` and the free-disk line. The image prune removes only dangling images, so `:previous` survives.
- **Where it lives:** `bin/deploy`, as in Myflix and MMDb, rather than `deploy/`. Then all three apps' `authorized_keys` lines point at `~/<app>/bin/deploy`.
- **Alternative considered:** keep `deploy/post-receive` and have the workflow push to the bare repo over SSH. Rejected: the key would need git access, not one forced command, and the server would accept any commit pushed to it rather than only a tag on GitHub's `main`.

### Testing the script inside the suite that already runs everywhere
- **File:** `test/deploy.test.ts`, in Vitest's default node environment, so the pre-commit hook and the Docker build run it like every other test.
- **Approach:** Myflix's harness ported to TypeScript:
  - a throwaway bare `origin`, a seed clone that commits and tags, and a `server` clone holding `bin/deploy`;
  - stand-in `docker` and `curl` on `PATH` that log their arguments, with curl answering a status set by the test.
- **Cases:** taken from the spec's server-side requirements:
  - malformed or extra words;
  - a dirty checkout, and not on `main`;
  - a tag not on `main`, missing, behind or moved;
  - a fast-forward, and a redeploy;
  - `:previous` kept, and not on a redeploy;
  - the audit run passed to the build, and a failing build skipping the health check;
  - health 200 or failing;
  - the request taken from `SSH_ORIGINAL_COMMAND`.
- **Docker build:** the `test` stage installs `bash` and `git` with `postgresql18` (one `apk add`), because the project rule is that every test runs in the build too.
- **Alternative considered:** skip this test in Docker. Rejected: CLAUDE.md says a test that can't run everywhere is fixed, never skipped.

### `test.yml`: one job that builds the image
- **Trigger:** pull requests to `main` and pushes to `main`. A new push to the same ref cancels the run in progress.
- **The `test` job:**
  - checkout, then `docker build .`, which runs the audit, every test and the production build on GitHub's amd64 runner;
  - then actionlint `rhysd/actionlint:1.7.7`, since `deploy.yml` only runs on a tag and would otherwise only fail at release time.
- **Why one job:** Myflix's reason. The ruleset and the deploy's gate both look only at the check named `test`.
- **Alternative considered:** running Node and vitest directly with a `postgres:18` service, as MMDb does. Rejected: the Docker build already does all of it with the exact versions production runs, so a second setup would only drift from it.

### `deploy.yml`: Myflix's workflow word for word
- **The same:** triggers, `production` environment, concurrency, the gate, cloudflared `2026.10.3` and the SSH options. Only `origin/master` becomes `origin/main`, and the comment names `ssh-deploy.teslasolar.report`.
- **The same five secret names:** `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, `DEPLOY_SSH_TARGET` (`onyx@ssh-deploy.teslasolar.report`), `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET`, with values of their own.

### Cloudflare, the key and GitHub (owner steps, with a walkthrough)
1. **Cloudflare route:** on `tesla-next-tunnel`, a published application route `ssh-deploy.teslasolar.report` to `ssh://192.168.40.63:22`.
2. **Access application:** a self-hosted application for that hostname, with a Service Auth policy allowing one new service token, `tesla-next-deploy`.
3. **The deploy key:**
   - you generate it on your Mac (`ssh-keygen -t ed25519 -N '' -C tesla-next-deploy -f ~/.ssh/tesla-next-deploy`);
   - its public key goes into onyx's `authorized_keys` as `command="/home/onyx/tesla-next/bin/deploy",no-pty,no-port-forwarding,no-agent-forwarding,no-X11-forwarding,no-user-rc <key>`;
   - the private key only goes into GitHub.
4. **Known hosts:** I build `DEPLOY_KNOWN_HOSTS` from `ssh-keyscan` on the LAN, with the host renamed to `ssh-deploy.teslasolar.report`. It holds public keys only.
5. **GitHub:**
   - a `production` environment limited to `v*` tags, holding the five secrets;
   - a `main` ruleset requiring the `test` check;
   - a tag ruleset on `refs/tags/v*` that restricts creation and blocks update and deletion, with the owner as the only bypass;
   - squash merging turned off (merge commits only), so a change's code and archive commits land as they were made.

The fine-grained token I use can't read rulesets or change repository settings, so I check what I can (the environment, the workflow runs), and you confirm the rest in the web UI.

### Server cutover
- **When:** after the code merges and before the first release, so the server has `bin/deploy` when the first tag arrives.
- **Steps:**
  1. Move `~/tesla-next` to `~/tesla-next-before-deploy-from-github`.
  2. Clone `https://github.com/toddseller/tesla-next.git` into `~/tesla-next`. The same folder name keeps compose's project name, the image name and the network the tunnel joins.
  3. Copy `.env` across and keep it at mode 600.
  4. Tag the running image as `tesla-next-next:previous`.
  5. Run `docker compose up -d --build` and check next.teslasolar.report.
- **Weekly audit:** it keeps working, because its unit files call `~/tesla-next/deploy/weekly-audit`, which the clone has.
- **Rollback:** move the old folder back and bring it up.
- **Clean-up, after the first release passes and with your go-ahead:**
  - remove `~/repos/tesla-next.git`;
  - remove the `server` remote from your Mac;
  - remove the old folder.

## Risks / Trade-offs

- [A deploy runs the `bin/deploy` the server had before it.] → The cutover clones the merged `main`, so the first release already runs this change's script. A release that changes `bin/deploy` and depends on the change is deployed twice, as in Myflix.
- [The audit reruns on every deploy, so a new advisory can block a release that passed its `test` check.] → This is intended (it's what the push deploy does today). The log names the advisory, and the fix or waiver goes through a pull request.
- [The build runs on the live server, so the server's CPU and disk are shared with the other apps.] → It's no different from today. The cache trim keeps the 5 GB bound.
- [A public repo's workflow could leak secrets.] → Secrets live only in `production`, which only `v*` tags can use, and only the owner can create those.
- [`tesla-next-next:previous` holds only the release before the last one.] → Older releases can be redeployed after a revert on `main` and a new tag.

## Migration Plan

1. Merge the change once its tests pass locally and its `test` check passes on the pull request. This first pull request is also the first run of `test.yml`.
2. GitHub settings: the `main` ruleset, merge commits only, the tag ruleset and the `production` environment.
3. Cutover on onyx (above), once you say yes.
4. Cloudflare route, Access application and token, the key, known hosts, and the five secrets.
5. First release: you publish `v2026.11.<day>` in GitHub's web UI. We watch the run, then I check next.teslasolar.report serves that commit and `:previous` exists.
6. Clean-up of the bare repo, the remote and the old folder.
7. If anything fails: rerun or redeploy the same tag, or roll back with `:previous`. Before the cutover, the old push deploy still works; after it, the README's manual fallback replaces it (the push hook would write over the clone).
