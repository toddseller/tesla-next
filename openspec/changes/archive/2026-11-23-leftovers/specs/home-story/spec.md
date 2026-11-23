## MODIFIED Requirements

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
- **THEN** the Longest outage tab says "The house hasn't been off the grid since October 22, 2021."
