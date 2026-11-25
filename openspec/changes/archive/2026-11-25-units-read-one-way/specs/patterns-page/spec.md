## MODIFIED Requirements

### Requirement: The latest month's figures
The Always-on load section SHALL show the always-on load of the latest month with one, labelled "<Month> so far" when it is the current month and "<Month> <year>" otherwise; the same month a year earlier, labelled "<Month> <year>"; and the difference between the two in watts, signed, followed by the difference in kWh a day, signed and rounded to a whole kWh. Without a figure a year earlier, only the first SHALL show.

#### Scenario: This November
- **WHEN** it is November 10, 2026, November 2026's always-on load is 864 W and November 2025's is 276 W
- **THEN** the section shows "November so far" 864 W, "November 2025" 276 W, and a difference of +588 W, +14 kWh a day

#### Scenario: Lower than a year earlier
- **WHEN** the latest month's always-on load is 300 W and a year earlier it was 720 W
- **THEN** the difference reads -420 W, -10 kWh a day

#### Scenario: The first night of a month
- **WHEN** it is 3 AM on December 1, so no December night counts yet
- **THEN** the figures are November's, labelled "November 2026"
