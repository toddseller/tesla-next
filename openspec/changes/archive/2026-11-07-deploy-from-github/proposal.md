# Proposal

## Why

A deploy today is a second `git push` to a bare repo on onyx, so the running site can be a commit GitHub has never seen, and nothing tests a pull request before it merges. MMDb and Myflix already deploy tested `main` commits from GitHub by tag; setting tesla-next up the same way now, before the six page changes go through it, means every one of them is reviewed, tested and released the same way.

## What Changes

- **A Tests workflow** runs on every pull request and push to `main`, in one job named `test`: it builds the Docker image (which runs the dependency audit and every test) and lints the workflows. A `main` ruleset requires it before a merge.
- **A Deploy workflow** runs when a `v*` release tag is published. It checks the tag is on `main` and its `test` check passed, then reaches onyx over SSH through Cloudflare Access with a key that can only run the deploy script. It is copied from Myflix's, with tesla-next's names.
- **A deploy script on onyx** (`bin/deploy`) only moves the server forward to a tag on `main`: it fast-forwards the checkout, keeps the running image as the rollback, rebuilds with a fresh audit, and fails unless next.teslasolar.report answers 200.
- **The repository is public**, like MMDb's and Myflix's, so onyx fetches it without credentials.
- **BREAKING (for the owner's workflow):** `git push server main` no longer deploys. The `server` remote, `deploy/post-receive` and onyx's bare repo `~/repos/tesla-next.git` are retired; `~/tesla-next` on onyx becomes a clone of GitHub.
- README's Deploy section and CLAUDE.md's working rule describe releasing by tag, rolling back, and the manual fallback.

## Capabilities

### New Capabilities
- `deploy-on-tag`: how a tagged release reaches production: what starts a deploy, which commits may be deployed, how the private server is reached, how it moves forward, how success is decided, and how a release is rolled back. Same name and shape as MMDb's and Myflix's.

### Modified Capabilities
- `site-serving`: the requirement "A failing deploy keeps the running site", which describes push-to-server deploys, is removed; its guarantee (a failing audit or test never replaces the running site) moves into `deploy-on-tag`.

## Impact

- **New files:** `.github/workflows/test.yml`, `.github/workflows/deploy.yml`, `bin/deploy`, and a test that drives `bin/deploy` against throwaway git repos.
- **Changed:** the Dockerfile's `test` stage gains the tools that test needs (bash, git), since every test also runs in the Docker build; `docker-compose.yml`'s and the Dockerfile's comments about `deploy/post-receive`; `README.md`; `CLAUDE.md`.
- **Removed:** `deploy/post-receive`; after the first release, the `server` remote and `~/repos/tesla-next.git`.
- **Outside the repo (owner steps, with a walkthrough):**
  - GitHub: the repo made public, a `production` environment, five secrets, a `main` ruleset requiring `test`, a `v*` tag ruleset, and merge commits only.
  - Cloudflare: a route `ssh-deploy.teslasolar.report` on `tesla-next-tunnel` and an Access application with its own service token.
  - onyx: a forced-command deploy key in `authorized_keys`.
- **Unchanged:** the weekly audit timer, which keeps building `~/tesla-next`; the app itself; anton-tesla-api-ws's own push deploy.
