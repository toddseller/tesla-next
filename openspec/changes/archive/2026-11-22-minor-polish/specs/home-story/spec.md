## REMOVED Requirements

### Requirement: The status line
**Reason**: It repeated the top bar right above it at every width, the live time and any off-grid or storm watch text.
**Migration**: The top bar's live status and pill carry the same facts; Now's sentence says when the live status is stale.

## ADDED Requirements

### Requirement: Another year keeps the date
Choosing a year SHALL open its readout on the same month and day as the day shown (February 28 for a 29th), or the nearest day with figures; in the current year, up to today. Opening `/?year=<year>` SHALL open on today's month and day in that year.

#### Scenario: The same date in another year
- **WHEN** the readout shows November 22, 2026 and a visitor chooses 2024
- **THEN** the readout shows November 22, 2024

#### Scenario: A date before the figures begin
- **WHEN** the readout shows June 13, 2026 and a visitor chooses 2021
- **THEN** the readout shows October 22, 2021, the first day with figures

### Requirement: A Records tab in the address
Choosing a Records tab SHALL put it in the address as `record` (`solar`, `sent-day`, `sent-month` or `outage`) without adding a history entry, keeping the address's other parameters, and opening such an address SHALL show that tab in the first response.

#### Scenario: A shared tab
- **WHEN** a visitor on `/?year=2024` chooses Longest outage, then reloads
- **THEN** the address is `/?year=2024&record=outage` and Longest outage is shown

## MODIFIED Requirements

### Requirement: The year switcher
The year chapter SHALL offer every year from 2021 to the current one, the current year chosen by default. Choosing a year SHALL show its chart and shares without a page reload and put the year in the address as `year` without adding a history entry, keeping the address's other parameters. Opening `/?year=<year>` SHALL show that year. A `year` outside 2021 to the current year SHALL show the current year.

#### Scenario: Choosing 2023
- **WHEN** a visitor on `/` chooses 2023
- **THEN** the chart shows 2023, the address becomes `/?year=2023`, the page does not reload, and Back leaves the page

#### Scenario: A shared year
- **WHEN** a visitor opens `/?year=2022` on November 22, 2026
- **THEN** the year chapter shows 2022 in the first response, its readout on November 22, 2022

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
- **THEN** the Longest outage tab says the house has not been off the grid since October 2021

### Requirement: Pick a day
The page SHALL end with a date field limited to October 22, 2021 through today, a filled Go button that leads, and an outlined Random day button. The field SHALL start empty; submitting it (Go or Enter) SHALL open that day on the Solar page, and changing it alone SHALL NOT. A date outside the span SHALL be refused with a message naming the span, under the form, one line on a wide screen, the buttons unmoved. Random day SHALL open a day picked at random from that span.

#### Scenario: A random day
- **WHEN** a visitor presses Random day
- **THEN** a day between October 22, 2021 and today opens on `/solar` in its month

#### Scenario: A refused date on a wide screen
- **WHEN** a visitor at 1440 pixels submits a date before October 22, 2021
- **THEN** the message appears and the Go and Random day buttons stay where they were
