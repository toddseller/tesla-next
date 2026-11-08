# Spec Delta

## MODIFIED Requirements

### Requirement: Pages not yet moved link to the live site
Until a page's own change brings it to this app, its address SHALL show the page's name and a link to the same page on teslasolar.report, inside the frame.

#### Scenario: A page not yet moved
- **WHEN** a viewer opens `/top` before the Top Ten page has moved
- **THEN** the page says Top Ten is still at teslasolar.report and links to https://teslasolar.report/top, with the top bar and footer around it
