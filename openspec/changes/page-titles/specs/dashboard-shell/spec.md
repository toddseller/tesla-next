## ADDED Requirements

### Requirement: Each page's title
Each page's document title SHALL name the page, then the range it shows when it has one, then "Tesla Solar Report", joined by " · "; the home page's SHALL be "Tesla Solar Report". A whole month SHALL read like "November 2026", a calendar year "2026", a true-up year "'26 - '27", and a day or any other range in short dates, like "Nov 14, 2026" or "Oct 1 – 15, 2026". The title SHALL name the range the page shows, not the one asked for, and follow it when it changes.

#### Scenario: Solar's current month
- **WHEN** a viewer opens `/solar` on 2026-11-23
- **THEN** the title is "Solar · November 2026 · Tesla Solar Report"

#### Scenario: A day on Solar
- **WHEN** a viewer opens Solar's day view for November 14, 2026
- **THEN** the title is "Solar · Nov 14, 2026 · Tesla Solar Report"

#### Scenario: Impact before any solar
- **WHEN** a viewer opens `/impact` on 2026-11-23 while today's solar reads 0.0 kWh, so the page shows yesterday
- **THEN** the title is "Impact · Nov 22, 2026 · Tesla Solar Report"

#### Scenario: True-Up's current year
- **WHEN** a viewer opens `/true-up` in the '26 - '27 true-up year
- **THEN** the title is "True-Up · '26 - '27 · Tesla Solar Report"

#### Scenario: A calendar year
- **WHEN** Solar shows January 1 to December 31, 2025
- **THEN** the title is "Solar · 2025 · Tesla Solar Report"

#### Scenario: Pages without a range
- **WHEN** a viewer opens Distribution, Patterns, Top Ten or Admin
- **THEN** the titles are "Distribution · Tesla Solar Report", "Patterns · Tesla Solar Report", "Top Ten · Tesla Solar Report" and "Admin · Tesla Solar Report"

### Requirement: Each page's top heading
Each page SHALL have exactly one h1. Distribution's SHALL be "Distribution", and Solar's day view's SHALL name its day, like "Solar on Sat, Nov 14, 2026"; both visually hidden, so neither page looks different.

#### Scenario: Distribution
- **WHEN** a screen reader lists Distribution's headings
- **THEN** the first is the h1 "Distribution", and nothing on screen changes

#### Scenario: Solar's day view
- **WHEN** a viewer opens Solar's day view for November 14, 2026
- **THEN** the page has one h1, "Solar on Sat, Nov 14, 2026", and the day button still shows the date
