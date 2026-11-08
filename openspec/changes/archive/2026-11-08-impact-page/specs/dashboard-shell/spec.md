# Spec Delta

## MODIFIED Requirements

### Requirement: Pages not yet moved link to the live site
Until a page's own change brings it to this app, its address SHALL show the page's name and a link to the same page on teslasolar.report, inside the frame.

#### Scenario: A page not yet moved
- **WHEN** a viewer opens `/true-up` before the True-Up Tracker has moved
- **THEN** the page says True-Up Tracker is still at teslasolar.report and links to https://teslasolar.report/true-up, with the top bar and footer around it
