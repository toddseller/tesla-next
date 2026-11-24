## MODIFIED Requirements

### Requirement: Cycle chart
The page SHALL chart each started cycle's imports as a bar above zero in the grid color and its exports below in the solar color, each rounded only at its outer end, square at zero, with a running net line in Tesla red that starts again at each true-up year's first cycle. Months label the cycles, and a legend names every series shown. Its heading SHALL name the range, the true-up year's name or "All time" or the range's dates, then "by billing cycle".

#### Scenario: Current year in November
- **WHEN** the current year is shown on 2026-11-08
- **THEN** the chart has bars for two cycles, October and November, and slots for all twelve

#### Scenario: All time
- **WHEN** All time is shown
- **THEN** the running net returns to that cycle's own net at the first cycle of each true-up year

#### Scenario: All time's heading
- **WHEN** All time is shown
- **THEN** the chart is headed "All time by billing cycle"
