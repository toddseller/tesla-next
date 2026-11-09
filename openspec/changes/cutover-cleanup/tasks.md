# Tasks

## 1. Top ten default (test-first)

- [x] 1.1 `app/api/top-ten/route.test.ts`: no parameter leaves VPP days out, `?vpp=with` includes them, `?vpp=without` equals no parameter; run it and see the default case fail for the right reason
- [x] 1.2 `app/api/top-ten/route.ts` reads `vpp === "with"`, its parity comment gone; the route test passes
- [x] 1.3 `components/top-ten/top-ten-page.tsx` reloads from `/api/top-ten` or `/api/top-ten?vpp=with`; its test (updated first, seen failing) and the whole suite pass

## 2. Health check (test-first)

- [x] 2.1 `test/deploy.test.ts` expects the default health URL to be https://teslasolar.report/; see it fail, then change `bin/deploy`; the suite passes

## 3. Comparison and parity removed

- [x] 3.1 Delete `scripts/compare-*.mjs` and `scripts/compare-*.test.mjs`; `grep -rn "compare-" --exclude-dir=node_modules --exclude-dir=openspec .` finds nothing, and the suite passes
- [x] 3.2 Sweep comments in `app/`, `lib/`, `components/` and `test/`: the six routes' "answers as Flask's ... until cutover" lines go; "Flask notifies"/"Flask's polls" and the live sunshine and weather notes say "anton's scheduler"; reasons given only as "as Flask's" say what the code does; ported-from lines stay. `git diff` of this task touches comment lines only, and the suite and `yarn build` pass
- [x] 3.3 README: delete the compare instructions and the "until 7b" notes, describe `/api/top-ten`'s default and `?vpp=with`, say Flask-sent notifications come from anton's scheduler, and update the deploy section and its Mermaid diagram (health check on teslasolar.report, next.teslasolar.report a redirect); check the diagram renders; no em dashes
- [x] 3.4 CLAUDE.md: replace the two "keep answering exactly as Flask's" traps with what still holds (the Distribution and Solar ports are specified by their copied specs; change behavior through them), and say the tag deploys to teslasolar.report

## 4. Before the PR

- [x] 4.1 `openspec validate cutover-cleanup --strict` passes
- [x] 4.2 `ponytail:ponytail-review` on the uncommitted diff, findings reported for the user to choose; chosen fixes test-first

## 5. Rollout (after the merge; release asked first)

- [ ] 5.1 The user publishes the release; the Deploy run passes its health check (on next.teslasolar.report this once, see design.md); record the tag and time in design.md's Rollout
- [ ] 5.2 On teslasolar.report: `/top` shows Without VPP events with the same export days as `/api/top-ten`, and With VPP events matches `/api/top-ten?vpp=with`; record it
- [ ] 5.3 After the user adds the Cloudflare redirect: https://next.teslasolar.report/distribution?at=2026-11-07T12:30 answers 301 to the same path and query on teslasolar.report, and the page opens paused at that time; record it

## Workflow follow-up

- Branch `cutover-cleanup` from `live-top-bar-rollout` (it carries "Record the live-top-bar rollout" and "Record the cutover soak"); commit the code, then `Archive cutover-cleanup` with spec sync, editing the `live-status-stream` and `database-access` Purposes in the main specs; then the PR, with no Claude attribution.
- Group 5's results go on the next change's branch.
- Later, its own change: Top Ten's With VPP view across the April 27, 2026 meter fix.
