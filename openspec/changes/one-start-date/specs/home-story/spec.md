## MODIFIED Requirements

### Requirement: What the page is
The page SHALL open, above the Now chapter, with its one heading: a line saying it shows one home's Tesla solar panels, with their size in kW, and its three Powerwalls, live and recorded since October 10, 2021, the first day of data.

#### Scenario: A first-time visitor
- **WHEN** a visitor opens `/`
- **THEN** the first thing under the top bar is the heading "One home's 12.24 kW of Tesla solar and three Powerwalls, live and recorded since October 10, 2021", the page's only h1

### Requirement: The year's solar by day and hour
The year chapter SHALL draw one row per day of the chosen year and one column per hour of the site day, each cell shaded from dark through amber to white by the solar kWh made in that hour. Days before October 10, 2021, after today, or without solar figures SHALL be left blank.

#### Scenario: A clear June day and a cloudy one
- **WHEN** June 13 made 9 kWh at noon and June 14 made 1 kWh at noon
- **THEN** June 13's noon cell is near white and June 14's is dark amber

#### Scenario: The current year
- **WHEN** a visitor opens `/` on November 21, 2026
- **THEN** rows from November 22 to December 31 are blank

### Requirement: Another year keeps the date
Choosing a year SHALL open its readout on the same month and day as the day shown (February 28 for a 29th), or the nearest day with figures; in the current year, up to today. Opening `/?year=<year>` SHALL open on today's month and day in that year.

#### Scenario: The same date in another year
- **WHEN** the readout shows November 22, 2026 and a visitor chooses 2024
- **THEN** the readout shows November 22, 2024

#### Scenario: A date before the figures begin
- **WHEN** the readout shows June 13, 2026 and a visitor chooses 2021
- **THEN** the readout shows the first day with figures, in October 2021

### Requirement: The records
The Records chapter SHALL offer four tabs, Best solar day, Most sent to PG&E in a day, Most sent to PG&E in a month, and Longest outage, Best solar day chosen by default, as tabs for assistive technology, all four shown in full without sideways scrolling at any width. Each tab SHALL list the top five of that Top Ten ranking as Top Ten shows it by default (an outage's length in days and hours), each linked to its day or month on the Solar page, and the chapter SHALL link to Top Ten.

#### Scenario: The best solar days
- **WHEN** a visitor opens `/` and June 13, 2022 is Top Ten's best solar day at 80.9 kWh
- **THEN** the chapter's first row gives 80.9 kWh on June 13, 2022, linked to `/solar?start=2022-06-01&end=2022-06-30&day=2022-06-13`

#### Scenario: The longest outage
- **WHEN** the longest outage lasted 52.3 hours from February 4, 2024
- **THEN** the Longest outage tab reads "2 d 4 h on February 4, 2024" and its first row gives 2 d 4 h

#### Scenario: Never off the grid
- **WHEN** Top Ten has no outages
- **THEN** the Longest outage tab says "The house hasn't been off the grid since it was approved to run on October 22, 2021."

### Requirement: Since 2021's figures
Beside its chart, the Since 2021 chapter SHALL give the solar since October 10, 2021, say whether solar has generated as much as the house used and by what share, as Impact gives it for that range, and give the current true-up year's net so far as True-Up's net tile gives it: the figure once, then in words what it is, imported or sent, more than the other, since the year began, without repeating the figure.

#### Scenario: As much as the house used
- **WHEN** Impact gives 75,611 kWh of solar and 100% of the house's use for October 10, 2021 to today
- **THEN** the chapter says solar has generated as much as the house used (100%) and gives 75,611 kWh

#### Scenario: The true-up so far
- **WHEN** the true-up year that began October 1, 2026 has imported 611.4 kWh more than it sent
- **THEN** the chapter gives 611.4 kWh, then "more imported than sent this true-up year, since October 1"

### Requirement: Pick a day
The page SHALL end with a date field limited to October 10, 2021 through today, a filled Go button that leads, and an outlined Random day button. The field SHALL start empty; submitting it (Go or Enter) SHALL open that day on the Solar page, and changing it alone SHALL NOT. A date outside the span SHALL be refused with a message naming the span, under the form, one line on a wide screen, the buttons unmoved. Random day SHALL open a day picked at random from that span.

#### Scenario: A random day
- **WHEN** a visitor presses Random day
- **THEN** a day between October 10, 2021 and today opens on `/solar` in its month

#### Scenario: A refused date on a wide screen
- **WHEN** a visitor at 1440 pixels submits a date before October 10, 2021
- **THEN** the message appears and the Go and Random day buttons stay where they were

### Requirement: How each record was beaten
Under its steps, each Records tab SHALL say how many days (or months) since the record was set have come within 2% of it, or that none has. Each Records tab SHALL chart its record since October 10, 2021 as steps, the highest figure up to each date, its y-axis marked at 0, the record and the lowest figure if below 0 (to a tenth, or in days and hours for outages), and its x-axis at each January 1. The current record SHALL be marked with its date and how long ago it was set ("set 4 years ago").

#### Scenario: A record that stands
- **WHEN** June 13, 2022 at 80.9 kWh is the best solar day and nothing has beaten it
- **THEN** the steps rise until June 13, 2022 and stay flat since, marked "set 4 years ago", and the tab says "Three days since have come within 2% of it" when June 20, 2023, June 17, 2024 and June 21, 2025 made at least 79.3 kWh

#### Scenario: A record set today
- **WHEN** today has made more solar than any day before
- **THEN** the last step rises today and is marked "set today"

#### Scenario: An axis in hours
- **WHEN** the longest outage lasted 52.3888 hours
- **THEN** the y-axis of the outage tab reads 0 and 2 d 4 h

#### Scenario: A series that starts below 0
- **WHEN** October 2021 imported 136.3 kWh more than it sent and April 2024's 479.2 kWh is the record
- **THEN** the month tab's y-axis reads -136.3, 0 and 479.2
