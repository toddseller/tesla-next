# Proposal

## Why

Two releases in a row (v2026.11.10.2 and v2026.11.10.3) were marked failed in GitHub although they deployed. Each time Cloudflare closed the runner's SSH session mid-deploy, 28 and 12 seconds in. Onyx never saw the drop: its leg of the connection stayed open, so `bin/deploy` ran on, built, replaced the container and passed its own health check. The runner, with no connection, reported failure and never saw the outcome. A good release shown as failed hides a real failure among false ones, and re-running a release rebuilds and replaces the container just to turn the run green.

## What Changes

- `bin/deploy` keeps each deploy's log and, when it ends, its outcome on the server.
- The deploy key accepts one more request, `status <tag>`: whether that tag's last deploy is running, succeeded or failed, with its log. It reads only; nothing is fetched, built or changed.
- When the workflow loses its connection during a deploy, it asks for the status every 10 seconds, for up to 10 minutes, then prints the deploy's log and passes or fails with the deploy's own result. A deploy that stays connected looks the same as today.
- README's Deploy section says what a dropped connection now does.

Out of scope: running the deploy detached from its session (it already survives a drop, since the key has no terminal), the idle SSH sessions a drop leaves on onyx (sshd's keepalive, shared server config), and MMDb's and Myflix's copies of the script.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `deploy-on-tag`: the deploy key also answers a deploy's status, the server keeps each deploy's outcome, and a lost connection no longer decides whether a deploy failed.

## Impact

- `bin/deploy` (log, outcome, `status`), `.github/workflows/deploy.yml` (the deploy step's recovery), `README.md`, and the deploy tests in `test/`.
- The workflow's change runs from the first release after this one. `bin/deploy`'s change runs from the second: a deploy runs the script the server had before it (README).
- No new secret, dependency or env var.
