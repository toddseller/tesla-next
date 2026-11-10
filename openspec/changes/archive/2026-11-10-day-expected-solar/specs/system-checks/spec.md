## ADDED Requirements

### Requirement: The failing peak line links to its day
When the solar peak check fails for a day it judged, its line SHALL end with that day's address on the site, `https://teslasolar.report/?day=YYYY-MM-DD`, after the comparison, so the alert opens the day's view.

#### Scenario: The fault's first bright day
- **WHEN** the check fails for April 13, 2026
- **THEN** its line reads `FAIL solar peak: April 13, 2026's peak was 52% of the usual bright-day peak (4.4 of 8.4 kW) https://teslasolar.report/?day=2026-04-13`

#### Scenario: A day with no solar stored
- **WHEN** the check fails because no solar was stored for yesterday
- **THEN** its line ends with yesterday's address too
