## MODIFIED Requirements

### Requirement: The record
Each ranking SHALL lead with its #1: its figure in kWh, or for outages its length in days and hours as the Backup section reads a length of time, its date in full (the weekday and date for a day, the month and year for a month), how long it has been the record, and how far it is ahead of #2, in the same unit, or that it is tied with #2 when the two read the same. How long SHALL count from the day, or from the last day of the month, to today in the site's time zone, in years and months.

#### Scenario: The solar record on 2026-11-08
- **WHEN** the solar ranking is shown on 2026-11-08, led by 80.9 kWh on June 13, 2022 with 80.2 kWh second
- **THEN** it reads 80.9 kWh, Monday, June 13, 2022, the record for 4 years, 4 months, and 0.7 kWh ahead of #2

#### Scenario: The export month record
- **WHEN** the export months are shown on 2026-11-08, led by 510.1 kWh in May 2024 with 479.2 kWh second
- **THEN** it reads 510.1 kWh, May 2024, the record for 2 years, 5 months, and 30.9 kWh ahead of #2

#### Scenario: The outage record
- **WHEN** the outages are shown on 2026-11-09, led by 52.3 hours from February 4, 2024 with 35.4 hours second
- **THEN** it reads 2 d 4 h, Sunday, February 4, 2024, the record for 2 years, 9 months, and 16 h 54 m ahead of #2

#### Scenario: A tie for #1
- **WHEN** the best solar day is 80.94 kWh and the second 80.91 kWh, both reading 80.9
- **THEN** the record reads "Tied with #2" instead of a lead

### Requirement: Longest outages
The page SHALL rank the ten longest outages, backup events of the outage kind only (see backup-history), each with the date it began in the site's time zone and its exact length in days and hours as the Backup section reads a length of time, ranked by the length in hours to a tenth. It SHALL be the last ranking on the page, drawn in the Powerwall color, and the VPP switch SHALL NOT change it.

#### Scenario: The record on 2026-11-09
- **WHEN** the longest outage began February 4, 2024 and lasted 52.3 hours, and the next began December 14, 2024 and lasted 35.4 hours
- **THEN** the ranking leads with 2 d 4 h, Sunday, February 4, 2024, 16 h 54 m ahead of #2, and lists the second as 1 d 11 h

#### Scenario: Install week left out
- **WHEN** a commissioning event from October 12, 2021 lasted 52.4 hours
- **THEN** it is not ranked

#### Scenario: Switching VPP events
- **WHEN** the visitor chooses With VPP events
- **THEN** the outage ranking is unchanged

### Requirement: The timeline
Each ranking SHALL show its ten entries as dots on a timeline from October 2021 to the end of the current year, with the years marked, the current year shaded, and a figure axis spanning the ten entries' figures rather than starting at zero, its marks read as the entries' figures are (an outage's in days and hours). The #1 dot SHALL be ringed in Tesla red, and the #2 and #3 dots SHALL carry their rank. Solar days SHALL be drawn in the solar color, exports in the grid color and outages in the Powerwall color. The timeline SHALL be described in words for assistive technology.

#### Scenario: Solar days
- **WHEN** the solar ranking is shown
- **THEN** its axis spans about 78 to 81 kWh, and the 2022 dots cluster in late May and June

#### Scenario: Outages
- **WHEN** the outage ranking is shown
- **THEN** its axis is marked in days and hours, as "20 h" and "1 d 16 h", each on one line, and its dots are in the Powerwall color
