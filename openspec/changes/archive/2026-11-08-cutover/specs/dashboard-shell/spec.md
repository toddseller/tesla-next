# Spec Delta

## ADDED Requirements

### Requirement: The True-Up Tracker's old address
`/numbers`, the True-Up Tracker's address on teslasolar.report before it was renamed, SHALL redirect permanently to `/true-up`, so old bookmarks open the True-Up Tracker.

#### Scenario: An old bookmark
- **WHEN** a viewer opens `/numbers`
- **THEN** the response is a permanent redirect to `/true-up`, and the True-Up Tracker opens with "True-Up" marked as the current page
