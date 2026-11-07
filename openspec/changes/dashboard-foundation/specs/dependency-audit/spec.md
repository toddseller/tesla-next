# Spec Delta

## Purpose

Keeps known vulnerabilities out of what the dashboard ships: every build checks the packages it sends to browsers and runs on the server against public advisories, and a weekly re-check catches advisories published between deploys.

## ADDED Requirements

### Requirement: Shipped dependencies are audited at build
The app's image build SHALL check its runtime dependencies (what runs on the server and in browsers, not its build and test tools) against the public advisory database. It SHALL fail on any unwaived advisory rated high or critical, list the others without failing, and fail when the audit cannot finish. Every dependency SHALL be pinned to an exact version, so the image ships exactly what was checked.

#### Scenario: A high advisory in a shipped package
- **WHEN** a runtime package has a high or critical advisory
- **THEN** the build fails, naming the package and the advisory, and the running site stays on its previous version

#### Scenario: A build tool advisory
- **WHEN** only a build or test tool has an advisory
- **THEN** the build lists it and continues to the tests

#### Scenario: The advisory database is unreachable
- **WHEN** the audit gets no complete answer
- **THEN** the build fails, saying the audit did not finish

### Requirement: Waivers are explicit
An advisory SHALL be waived only by naming its ID in the repository with the reason it doesn't apply, so a waiver is visible in review, and an advisory not named still fails the build.

#### Scenario: A waived advisory
- **WHEN** an advisory is waived by its ID with a reason
- **THEN** the build lists it as waived with that reason, passes it, and still fails on any other

### Requirement: Shipped dependencies are re-audited weekly
Once a week, the server SHALL run the same audit and tests a deploy's build runs, against the deployed commit, without changing the running site. When the build fails, it SHALL send a push notification naming the dashboard build, with the end of its output. A passing run SHALL send nothing. A run missed while the server was off SHALL run when it next starts.

#### Scenario: A new advisory between deploys
- **WHEN** a high advisory is published for a shipped package and nothing has been deployed since
- **THEN** within a week the owner receives a notification naming the advisory, and the site keeps running unchanged

#### Scenario: Nothing found
- **WHEN** the weekly run's audit and tests pass
- **THEN** no notification is sent and the running container is untouched
