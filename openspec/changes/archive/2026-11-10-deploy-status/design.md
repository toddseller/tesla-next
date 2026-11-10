# Design

## Context

See proposal.md for why. What shapes the approach:

- The workflow's deploy step runs `ssh … "$DEPLOY_SSH_TARGET" "deploy $TAG"` through `cloudflared access ssh`. The server's `authorized_keys` forces `~/tesla-next/bin/deploy` for that key with `no-pty`, so the client's command arrives as `SSH_ORIGINAL_COMMAND`.
- Both failed runs (2026-11-10, 15:35:40 and 17:02:40 UTC): the runner logged "Connection … closed by remote host" while the tunnel container's log and onyx's sshd log showed nothing, and onyx still held the session's TCP connection to the tunnel container afterwards. Without a terminal, sshd sent `bin/deploy` no hangup, and the deploy finished: image built, container replaced, health check passed.
- `test/deploy.ts` runs `bin/deploy` against throwaway repositories with `docker` and `curl` replaced by recorders, `HOME` set to the test's own folder. `test/weekly-audit.test.ts` tests `deploy/weekly-audit` the same way.
- A deploy runs the `bin/deploy` the server had before it (README), and the workflow runs the repository's `deploy.yml` at the tag.
- The workflow's `production` concurrency group already keeps deploys one at a time.

## Goals / Non-Goals

**Goals:**
- A run reports what the deploy did, whether or not its connection survived.

**Non-Goals:**
- Detaching `bin/deploy` from its session. It already outlives a dropped connection; if it ever didn't, the status stays `running` and the run fails at the time limit, which is the right report.
- Finding why Cloudflare drops the sessions. It's outside the server and the code.
- Cleaning up the idle sessions a drop leaves (sshd's `ClientAliveInterval`, shared with MMDb and Myflix).

## Decisions

### Where the server keeps a deploy's outcome

`$HOME/.local/state/tesla-next-deploy/<tag>.log` and `<tag>.result`, outside the checkout, so a deploy's own files can never make the checkout dirty, and under the test's `HOME` in tests. A deploy removes its tag's old `.result` and truncates its `.log` before doing anything else, so a re-run of a tag starts as `running`.

Alternative: a fixed `last.log` and `last.result`. Per tag is as simple and means a slow status poll can never read the outcome of a newer deploy as this one's.

### Writing the log and the outcome

`main` sends all its output through `tee -a` to the log as well as to the session, and an `EXIT` trap writes the exit status to `<tag>.result` once the deploy ends, whatever path it ends by (`refuse`, a failed build, the health check). The trap is set only after the request has been validated, so a malformed request leaves no files.

`bin/deploy` ignores `SIGPIPE`. If the session's pipe is ever closed rather than left open, as today, `tee` gets a write error instead of being killed, keeps writing to the log, and the deploy goes on.

### The `status <tag>` request

The same `main` reads the verb: `deploy` as now, `status` with a valid tag prints one line, then the log, and exits 0:

```
running            <tag>.log exists, no <tag>.result
succeeded          <tag>.result is 0
failed <status>    <tag>.result is anything else
unknown            no <tag>.log
```

It touches neither git nor Docker, so it is safe to call while a deploy runs. Anything else still gets the usage refusal, which names both requests.

### The runner's side: `deploy/release`

The deploy step's `ssh` moves into `deploy/release <tag>`, which the workflow runs with the same SSH options in an `ssh_opts` array. It runs `deploy <tag>` and passes on its exit status. Only when `ssh` exits 255 (ssh's own failure: the connection was lost or never made) does it print `::warning::lost the connection to the server; waiting for the deploy to finish`, then poll `status <tag>` every `DEPLOY_STATUS_INTERVAL` seconds (default 10), at most `DEPLOY_STATUS_TRIES` times (default 60), skipping a poll that itself exits 255. On `succeeded` it prints the log and exits 0; on `failed <n>` it prints the log and exits `n`; still `running` or `unknown` at the end, it fails with `::error::the deploy of <tag> didn't finish in time`, naming how long it waited.

`unknown` after a drop means the deploy never started, as when the connection failed before `bin/deploy` ran; the polls keep asking for the full time, since a slow start is possible, then fail.

`bin/deploy` never exits 255 itself, so 255 always means the connection. Testing `deploy/release` with a fake `ssh` that records its requests and answers from a queue covers each path without a server.

### Rollout across two releases

The first release with this change deploys with the old `bin/deploy`, which has no `status`. Its workflow already runs the new `deploy/release`, so if that release's connection drops, the polls get the old script's usage refusal (exit 2), not 255. `deploy/release` treats an answer it can't read as `unknown` and keeps polling until the limit, then fails, the same report as today. From the second release on, both halves are new.

## Risks / Trade-offs

- [The log grows with each tag] → One file per release, a few hundred kilobytes; about 300 a year. Pruning can come later if it ever matters.
- [A drop before `bin/deploy` starts looks like a deploy that never ran] → It fails after 10 minutes, reported as not finished, and re-running it deploys normally.
- [Polling uses one short SSH session every 10 seconds] → At most 60 sessions in a dropped run, through the same tunnel and key.

## Migration Plan

Release as usual. The next release then runs the new `bin/deploy`; check on onyx that `~/.local/state/tesla-next-deploy/<tag>.result` holds 0 and that the forced key answers `status <tag>` (from the Mac, through the tunnel with the deploy key, or by running `SSH_ORIGINAL_COMMAND="status <tag>" bin/deploy` on onyx). Record it in this design. Rollback is the previous release.

## Rollout

Released as v2026.11.10.4 on 2026-11-10. Its run passed, connected throughout (no warning), with the server's previous `bin/deploy`: "Deploying v2026.11.10.4: e8a62be -> 564c578" and teslasolar.report answering 200. Afterwards onyx's checkout held the new `bin/deploy`, whose `status v2026.11.10.4` answered `unknown` (exit 0), since the old script ran that deploy and kept nothing. The next release is the first to keep its log and outcome.

v2026.11.10.5 (forecast-sky), 2026-11-10, was the first release the new `bin/deploy` ran. Its run stayed connected and passed. On onyx, `~/.local/state/tesla-next-deploy/v2026.11.10.5.result` held 0, and `SSH_ORIGINAL_COMMAND="status v2026.11.10.5" bin/deploy` answered `succeeded` (exit 0) followed by the 370-line log, from "Deploying v2026.11.10.5: 564c578 -> fb1a1ec" to the disk check.
