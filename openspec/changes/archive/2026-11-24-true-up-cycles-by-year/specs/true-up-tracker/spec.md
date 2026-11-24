## MODIFIED Requirements

### Requirement: Cycle chart
The page SHALL chart each started cycle's imports as a bar above zero in the grid color and its exports below in the solar color, each rounded only at its outer end, square at zero, with a running net line in Tesla red that starts again at each true-up year's first cycle, drawn apart from the year before it with no segment joining them. Months label the cycles, and a legend names every series shown. Its heading SHALL name the range, the true-up year's name or "All time" or the range's dates, then "by billing cycle".

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

### Requirement: Cycle list
Under the chart the page SHALL list each started cycle with its dates, imported, exported, net and NEM charges, fitting a phone without sideways scrolling. A calculated charge SHALL be marked "est."; a credit SHALL read like "$118.81 credit", never in red; a cycle with PG&E's charge SHALL show under it its estimate, when there is one, and PG&E's net kWh. The open cycle SHALL show the last day it covers. When the cycles listed span more than one true-up year, each year's cycles SHALL follow a subhead with the year's name. From 640 pixels wide, every row SHALL set its dates, imported, exported, net and charges in the same columns, whether or not it has charges.

#### Scenario: Open cycle
- **WHEN** the current cycle started November 3 and the data runs through November 8
- **THEN** its row reads "Nov 3 to Nov 8 (so far)", with its charges so far marked "est."

#### Scenario: Estimate under PG&E's charge
- **WHEN** a cycle has PG&E's $113.41 on 364 kWh net and an estimate of $113.72
- **THEN** it shows $113.41, and under it "est. $113.72 · PG&E net 364 kWh"

#### Scenario: Cycles across true-up years
- **WHEN** All time is shown, or a custom range whose cycles start in both '25 - '26 and '26 - '27
- **THEN** the '25 - '26 cycles follow a subhead "'25 - '26" and the '26 - '27 cycles one reading "'26 - '27"

#### Scenario: One true-up year
- **WHEN** '25 - '26 is shown
- **THEN** the list has no subheads

#### Scenario: Columns stay put
- **WHEN** the list is 640 pixels wide or more and shows a cycle without charges above one with charges
- **THEN** both rows' imported, exported and net figures start at the same horizontal positions
