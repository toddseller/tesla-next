## MODIFIED Requirements

### Requirement: The year's shares
Under its chart, the year chapter SHALL say how much of the house's energy in the chosen year, January 1 to December 31 or to today, came from solar, from the Powerwalls and from the grid, as Impact gives them for that range, saying that the house's energy here includes the car's charging, and SHALL link to Impact for that calendar year, January 1 to December 31, so Impact opens on its preset for the year rather than a custom range.

#### Scenario: 2026 so far
- **WHEN** on November 21, 2026 Impact gives 39% from solar, 30% from the Powerwalls and 31% from the grid for the year so far
- **THEN** the chapter gives the three shares under "Where the house's energy came from in 2026, car included" and links to `/impact?start=2026-01-01&end=2026-12-31`, where This year is marked as selected

#### Scenario: A past year
- **WHEN** a visitor picks 2024 in the year chapter
- **THEN** the chapter links to `/impact?start=2024-01-01&end=2024-12-31`
