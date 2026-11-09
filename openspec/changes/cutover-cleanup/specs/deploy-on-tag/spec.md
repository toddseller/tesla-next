# Spec Delta

## MODIFIED Requirements

### Requirement: A deploy succeeds only when the site answers
After the container is recreated, the script SHALL check that https://teslasolar.report/ answers 200 within about 30 seconds, and the deploy SHALL be reported as failed in GitHub when it doesn't, or when any earlier step fails.

#### Scenario: Site up
- **WHEN** the site answers 200 after the rebuild
- **THEN** the workflow run succeeds and its log names the deployed tag and commit

#### Scenario: Site down
- **WHEN** the site doesn't answer 200 within the time limit
- **THEN** the script exits non-zero and the workflow run fails
