# Spec Delta

## MODIFIED Requirements

### Requirement: The server is reached only through an authenticated tunnel with a single-purpose key
The deploy SHALL reach the server over SSH through Cloudflare Access, at a hostname and with a service token no other app uses, SHALL verify the server's host key against a stored value, and SHALL use a key the server allows to run only tesla-next's deploy script, with no shell, terminal or forwarding. The deploy secrets SHALL be available only to runs started by a version tag.

#### Scenario: Key used for anything else
- **WHEN** someone holding the deploy key asks the server for a shell or any command other than a deploy or a deploy's status
- **THEN** only the deploy script runs, and it refuses anything that isn't a valid deploy or status request

#### Scenario: Unknown host key
- **WHEN** the host key presented through the tunnel doesn't match the stored one
- **THEN** the connection is refused and nothing is deployed

#### Scenario: A branch run
- **WHEN** a workflow runs for a branch or pull request
- **THEN** it can't read the deploy secrets

## ADDED Requirements

### Requirement: The server keeps each deploy's outcome
For each tag it deploys, the deploy script SHALL keep the deploy's log and, once it ends, whether it succeeded or failed with its exit status, replacing what it kept for that tag before. A `status <tag>` request SHALL answer, without fetching, building or changing anything, `running` while that tag's deploy hasn't ended, `succeeded` or `failed <status>` once it has, or `unknown` when it has never been deployed, followed by the deploy's log.

#### Scenario: A deploy that ended
- **WHEN** v2026.11.10.3's deploy has passed its health check and the server is asked `status v2026.11.10.3`
- **THEN** it answers `succeeded` and the deploy's log, ending with the line naming the deployed tag

#### Scenario: A deploy still building
- **WHEN** the server is asked the status of a tag whose deploy is still building
- **THEN** it answers `running` and the log so far

#### Scenario: A tag never deployed
- **WHEN** the server is asked `status v1999.1.1`
- **THEN** it answers `unknown`, and nothing on the server changes

#### Scenario: A malformed status request
- **WHEN** the server is asked `status latest` or `status` with no tag
- **THEN** it refuses the request

### Requirement: A lost connection doesn't decide a deploy
When the workflow's connection to the server ends without the deploy script's exit status, the workflow SHALL ask the server for that tag's status every 10 seconds, for up to 10 minutes, retrying a request that fails to connect. It SHALL then print the deploy's log and succeed when the deploy succeeded, and fail when the deploy failed or was still not finished at the limit.

#### Scenario: Cloudflare drops the session mid-build
- **WHEN** the connection is closed 12 seconds into a deploy that goes on to pass its health check
- **THEN** the workflow run succeeds, and its log says the connection was lost and shows the deploy's log

#### Scenario: The deploy fails after the drop
- **WHEN** the connection is lost and the deploy then fails its health check
- **THEN** the workflow run fails and shows the deploy's log

#### Scenario: The deploy never finishes
- **WHEN** the status is still `running` after 10 minutes
- **THEN** the workflow run fails, saying the deploy didn't finish in time
