# Spec Delta

## MODIFIED Requirements

### Requirement: Cycle chart
The page SHALL chart each started cycle's imports as a bar above zero in the grid color and its exports below in a lighter tint of the grid color, each rounded only at its outer end, square at zero, with a running net line in the page's text color that starts again at each true-up year's first cycle, drawn apart from the year before it with no segment joining them. Only the running net's last point SHALL carry a mark, a Tesla red dot. Months label the cycles, and a legend names every series shown. Its heading SHALL name the range, the true-up year's name or "All time" or the range's dates, then "by billing cycle".

#### Scenario: Current year in November
- **WHEN** the current year is shown on 2026-11-08
- **THEN** the chart has bars for two cycles, October and November, and slots for all twelve

#### Scenario: All time
- **WHEN** All time is shown
- **THEN** the running net returns to that cycle's own net at the first cycle of each true-up year

#### Scenario: The line breaks at each true-up start
- **WHEN** the chart shows the August and September 2026 cycles of '25 - '26 and the October and November 2026 cycles of '26 - '27
- **THEN** the running net is drawn as two lines, one through August and September and one through October and November, and nothing joins September to October

#### Scenario: All time's heading
- **WHEN** All time is shown
- **THEN** the chart is headed "All time by billing cycle"

#### Scenario: Exports in the grid's color
- **WHEN** '25 - '26 is shown
- **THEN** its exports are drawn in the grid color, lighter than its imports, and no bar or legend swatch is in the solar color

#### Scenario: Red marks only where the range stands
- **WHEN** the chart shows the August and September 2026 cycles of '25 - '26 and the October and November 2026 cycles of '26 - '27
- **THEN** both running net lines are in the text color, and the only red on the chart is one dot at November 2026
