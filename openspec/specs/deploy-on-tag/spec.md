# deploy-on-tag Specification

## Purpose

Defines how a tagged tesla-next release reaches production without a manual push to the server: what starts a deploy, which commits may be deployed, how the private server is reached, how it moves forward, how success is decided, and how a release is rolled back.

## Requirements

### Requirement: Pull requests are tested before they merge
Every pull request to `main` and every push to `main` SHALL run one check named `test`, which audits the shipped dependencies, runs every test, builds the Docker image and lints the workflows. A pull request SHALL NOT merge into `main` unless that check passed.

#### Scenario: A failing test
- **WHEN** a pull request's commit has a failing test
- **THEN** its `test` check fails and the pull request can't be merged

#### Scenario: An image that doesn't build
- **WHEN** a pull request breaks the Docker build
- **THEN** its `test` check fails, so it can't be merged and its commit can't be deployed

### Requirement: A version tag starts a deploy
Creating a tag named `v` followed by digits and dots (for example `v2026.11.08` or `v2026.11.08.2`) SHALL start a production deploy of that tag's commit. Other tags, branch pushes and pull requests SHALL NOT start one. Only one deploy SHALL run at a time; a deploy started while another runs SHALL wait for it.

#### Scenario: Version tag
- **WHEN** the owner publishes a release tagged `v2026.11.08` on a commit on `main`
- **THEN** a deploy of that commit starts

#### Scenario: Other refs
- **WHEN** a branch is pushed, a pull request is opened or merged, or a tag such as `test-1` is created
- **THEN** no deploy starts

### Requirement: Only tested commits on main are deployed
A deploy SHALL stop before contacting the server unless the tag's commit is reachable from `main` and that commit's `test` check finished successfully. While the check is running or hasn't been created yet, the deploy SHALL wait for it, for about 15 minutes at most.

#### Scenario: Commit not on main
- **WHEN** a version tag points at a commit only on a feature branch
- **THEN** the deploy fails saying the commit is not on `main`, and the server is not contacted

#### Scenario: Tests failed or missing
- **WHEN** a version tag points at a `main` commit whose `test` check failed or never ran
- **THEN** the deploy fails naming the check's state, and the server is not contacted

#### Scenario: Tag created while tests run
- **WHEN** a version tag is created right after a merge, while that commit's `test` check is still running
- **THEN** the deploy waits, and continues once the check passes

### Requirement: The server is reached only through an authenticated tunnel with a single-purpose key
The deploy SHALL reach the server over SSH through Cloudflare Access, at a hostname and with a service token no other app uses, SHALL verify the server's host key against a stored value, and SHALL use a key the server allows to run only tesla-next's deploy script, with no shell, terminal or forwarding. The deploy secrets SHALL be available only to runs started by a version tag.

#### Scenario: Key used for anything else
- **WHEN** someone holding the deploy key asks the server for a shell or any command other than a deploy
- **THEN** only the deploy script runs, and it refuses anything that isn't a valid deploy request

#### Scenario: Unknown host key
- **WHEN** the host key presented through the tunnel doesn't match the stored one
- **THEN** the connection is refused and nothing is deployed

#### Scenario: A branch run
- **WHEN** a workflow runs for a branch or pull request
- **THEN** it can't read the deploy secrets

### Requirement: The server only moves forward to a tag on main
On the server, the deploy script SHALL accept only a tag name in the version format, fetch it from GitHub, and deploy only when its commit is on `origin/main` and is the checked-out `main` or a fast-forward of it. A tag equal to the current commit SHALL be redeployed with the checkout left as it is. Otherwise the script SHALL exit non-zero without changing the checkout or the running site.

#### Scenario: Malformed request
- **WHEN** the script is asked to deploy `v1; rm -rf ~` or anything not matching the version format
- **THEN** it exits non-zero without running git or docker

#### Scenario: Tag behind the server
- **WHEN** the tag points at a commit older than the server's current `main`
- **THEN** the script exits non-zero, saying the tag is behind, and leaves the site running unchanged

#### Scenario: A moved tag
- **WHEN** a tag the server already fetched now points somewhere else
- **THEN** the script refuses it

#### Scenario: Redeploying the current tag
- **WHEN** a deploy runs again for the tag the server is already on, for example after a failed health check
- **THEN** the script changes no files, rebuilds the site and checks it

#### Scenario: Local changes on the server
- **WHEN** the server's checkout has uncommitted changes to tracked files
- **THEN** the script exits non-zero before changing anything

### Requirement: A failing build keeps the running site
Every deploy SHALL rebuild the image, rerunning the dependency audit against that day's advisories and every test, before it replaces the running app. When the audit, a test or the build fails, the deploy SHALL fail with that output in its log, and the site SHALL keep running the previous version.

#### Scenario: A new advisory since the last release
- **WHEN** a high advisory was published for a shipped package since the image was last built
- **THEN** the deploy fails naming it, and the site keeps serving the previous release

#### Scenario: A failing build
- **WHEN** the image fails to build on the server
- **THEN** the deploy fails, and the running container is not replaced

### Requirement: Every deploy keeps the previous release
When the server moves to a new commit, the script SHALL keep the image that was running as the rollback image before rebuilding, replacing the one kept by the deploy before, so the last release can be restored without a build. A redeploy of the tag the server is already on SHALL leave the rollback image as it is.

#### Scenario: A deploy
- **WHEN** a new tag is deployed
- **THEN** the running image is kept as the rollback image, then the site is rebuilt and recreated

#### Scenario: Retrying a failed deploy
- **WHEN** a deploy of `v2` fails its health check and the same tag is deployed again
- **THEN** the rollback image still holds the release before `v2`

#### Scenario: Rolling back
- **WHEN** a release has to be undone
- **THEN** the owner can restore the rollback image with the steps in the README, without building anything

### Requirement: A deploy succeeds only when the site answers
After the container is recreated, the script SHALL check that https://teslasolar.report/ answers 200 within about 30 seconds, and the deploy SHALL be reported as failed in GitHub when it doesn't, or when any earlier step fails.

#### Scenario: Site up
- **WHEN** the site answers 200 after the rebuild
- **THEN** the workflow run succeeds and its log names the deployed tag and commit

#### Scenario: Site down
- **WHEN** the site doesn't answer 200 within the time limit
- **THEN** the script exits non-zero and the workflow run fails

### Requirement: Version tags are protected
Version tags SHALL be creatable only by the repository owner and SHALL NOT be movable or deletable, so a deploy can't be re-pointed at a different commit under the same name.

#### Scenario: Moving a tag
- **WHEN** anyone tries to move or delete an existing `v*` tag
- **THEN** GitHub rejects it
