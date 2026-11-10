# Tasks

## 1. The server keeps each deploy's outcome

- [x] 1.1 Test first (`test/deploy-status.test.ts`, with `test/deploy.ts`): a deploy leaves `<tag>.log` with its output and `<tag>.result` 0 under `$HOME/.local/state/tesla-next-deploy/`; a failed build or health check leaves its non-zero status; a re-run of the tag starts its log afresh; a refused request leaves no files. See them fail, then add the log, the `EXIT` trap and the ignored `SIGPIPE` to `bin/deploy`
- [x] 1.2 Test first: `status <tag>` answers `running` with the log so far (a log without a result), `succeeded` or `failed <status>` with the log, and `unknown` for a tag never deployed, exits 0, and calls neither git's fetch nor docker; `status`, `status latest` and `status v1 extra` are refused with the usage line naming both requests (in `test/deploy-refusals.test.ts`). See them fail, then add the verb

## 2. The runner's side

- [x] 2.1 Test first (`test/deploy-release.test.ts`, a fake `ssh` on the PATH that records requests and answers from a queue, `DEPLOY_STATUS_INTERVAL=0`): a connected deploy passes its exit status on and asks no status; after an exit 255 it warns, polls `status <tag>`, skips a poll that exits 255, and on `succeeded` prints the log and exits 0, on `failed 1` prints it and exits 1; still `running`, or an answer it can't read, after `DEPLOY_STATUS_TRIES` polls fails with the not-finished error. See them fail, then write `deploy/release`
- [x] 2.2 Change the workflow's deploy step to run `deploy/release "$TAG"` with the same SSH options, and check the workflow lint passes the way the `test` job runs it (`docker run --rm -v "$PWD:/repo:ro" -w /repo rhysd/actionlint:1.7.7 -no-color`)

## 3. Docs

- [x] 3.1 README's Deploy section: the flowchart and bullets say what a dropped connection does, that the key also answers `status <tag>`, and where the server keeps each deploy's log and outcome; check the Mermaid diagram still renders

## 4. Verify

- [x] 4.1 The whole suite passes, `tsc` is clean, and `openspec validate deploy-status --strict` passes
- [x] 4.2 `ponytail:ponytail-review` on the uncommitted diff before the first commit, with its findings reported for the owner to choose

## 5. Rollout

- [x] 5.1 With the owner's go-ahead, release; the run passes (its `bin/deploy` is still the old one)
- [x] 5.2 With the owner's go-ahead, the next release runs the new `bin/deploy`: check on onyx that its `<tag>.result` is 0 and that `status <tag>` answers `succeeded` with the log; record both in design.md under Rollout

## Workflow follow-up

- Commit the code, then archive the change with its specs synced as a second commit, `Archive deploy-status`, before opening the PR, which also carries the solar-forecast rollout record (601273b).
