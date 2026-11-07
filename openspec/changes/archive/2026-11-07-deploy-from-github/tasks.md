# Tasks

Code tasks are test-first: write the test, run it and see it fail for the right reason, then write the smallest code that passes and run the whole suite (`yarn vitest run`). Tasks marked **(owner)** are done by you, with a walkthrough; I check each where I can.

## 1. The deploy script

- [x] 1.1 Add the `bin/deploy` harness in `test/deploy.test.ts`: throwaway origin, seed and server repos, stand-in `docker` and `curl` on `PATH`; verify the refusal cases fail against the missing script
- [x] 1.2 Write `bin/deploy` (Myflix's with `main`, `tesla-next-next`, the next.teslasolar.report health check, `AUDIT_RUN` and `--remove-orphans` on the build, and the post-receive prune and disk line after a healthy deploy); verify every case under the spec's "only moves forward", "keeps the previous release", "failing build" and "succeeds only when the site answers" requirements passes
- [x] 1.3 Add `bash` and `git` to the Dockerfile's `test` stage `apk add`; verify `DOCKER_DEFAULT_PLATFORM=linux/amd64 docker build .` runs the new test and passes

## 2. The workflows

- [x] 2.1 Add `.github/workflows/test.yml` with one job `test`: checkout, `docker build .`, actionlint `1.7.7`; verify actionlint passes locally
- [x] 2.2 Add `.github/workflows/deploy.yml` (Myflix's, with `origin/main` and tesla-next's comment); verify actionlint passes, and run the gate's shell step locally against this repo for a good tag, a tag off `main` and a bad name

## 3. Retire the push deploy in the repo, and docs

- [x] 3.1 Delete `deploy/post-receive`; update the Dockerfile and `docker-compose.yml` comments that name it
- [x] 3.2 Rewrite README's Deploy section: releasing by tag (with a Mermaid flow, checked to render), how a deploy runs, rolling back to `tesla-next-next:previous`, the manual fallback, and the one remote; drop the `server` row and hook install steps
- [x] 3.3 Update CLAUDE.md's working rule: ask before publishing a release, not before `git push server main`

## 4. GitHub settings (after the pull request's first `test` run, before merging)

- [ ] 4.1 **(owner)** Add the `main` ruleset requiring the `test` check, and turn off squash merging (merge commits only)
- [ ] 4.2 **(owner)** Add the tag ruleset on `refs/tags/v*` (restrict creation, block update and deletion, owner bypass), and create the `production` environment limited to `v*` tags; I check the environment through the API

## 5. Server cutover (after merging)

- [ ] 5.1 With your go-ahead, move `~/tesla-next` to `~/tesla-next-before-deploy-from-github`, clone the repo over HTTPS into `~/tesla-next`, copy `.env` (mode 600), tag the running image as `tesla-next-next:previous`, run `docker compose up -d --build`, and check next.teslasolar.report serves `main` and the tunnel still reaches it

## 6. Access and secrets

- [ ] 6.1 **(owner)** Cloudflare: add the route `ssh-deploy.teslasolar.report` to `ssh://192.168.40.63:22` on `tesla-next-tunnel`, and a self-hosted Access application for it with a Service Auth policy and a new service token `tesla-next-deploy`; I check the hostname answers only through Access
- [ ] 6.2 **(owner)** Generate the deploy key on your Mac and add its forced-command line to onyx's `authorized_keys`; I check over the LAN that the key runs only `bin/deploy` and refuses a shell
- [ ] 6.3 Build the `DEPLOY_KNOWN_HOSTS` value from `ssh-keyscan` for `ssh-deploy.teslasolar.report`
- [ ] 6.4 **(owner)** Add the five secrets to the `production` environment

## 7. First release and clean-up

- [ ] 7.1 **(owner)** Publish a release tagged `v2026.11.<day>` on `main` in GitHub's web UI; together we watch the Deploy run, then I check next.teslasolar.report serves that commit and `tesla-next-next:previous` exists
- [ ] 7.2 With your go-ahead, remove `~/repos/tesla-next.git`, the old folder on onyx, and the `server` remote on your Mac; update the project memory's deploy line

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff and fix the findings you choose, test-first.
- On branch `deploy-from-github`: commit the code, then archive this change with spec sync as a second commit, `Archive deploy-from-github`, then open the pull request, the first that `test.yml` checks. Groups 4 to 7 happen around and after the merge; their outcome is recorded in the archived change in a follow-up commit if needed.
