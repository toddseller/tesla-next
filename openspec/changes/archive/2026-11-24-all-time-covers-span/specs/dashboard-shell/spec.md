# Spec Delta

## ADDED Requirements

### Requirement: A range over all the data is All time
Nothing comes before the site's first day of service, 2021-10-10, so a range that starts on or before it and ends on or after the All time preset's own end SHALL mark All time, on the buttons and in the phone menu, and SHALL NOT mark the dates button. A range starting after the first day of service, or ending before All time's end, SHALL stay a custom range.

#### Scenario: True-Up from the first day of service
- **WHEN** a viewer opens `/true-up?start=2021-10-10&end=2027-09-30` on 2026-11-24, whose All time runs 2021-10-01 to 2027-09-30
- **THEN** All time is marked and the dates button is not

#### Scenario: Solar past both ends
- **WHEN** a viewer opens `/solar?start=2021-10-01&end=2026-11-30` on 2026-11-24 (addresses start no earlier than 2021-10-01)
- **THEN** All time is marked and the dates button is not

#### Scenario: Missing the last days
- **WHEN** a viewer opens `/solar?start=2021-10-10&end=2026-11-23` on 2026-11-24
- **THEN** no preset is marked and the dates button is

## MODIFIED Requirements

### Requirement: True-Up's All time title
True-Up's All time runs between true-up year boundaries, so its document title SHALL name it "All time" rather than those boundary dates.

#### Scenario: True-Up's All time
- **WHEN** a viewer opens True-Up's All time
- **THEN** the title is "True-Up · All time · Tesla Solar Report", not "True-Up · Oct 1, 2021 – Sep 30, 2027 · Tesla Solar Report"

#### Scenario: Typed from the first day of service
- **WHEN** a viewer opens `/true-up?start=2021-10-10&end=2027-09-30` on 2026-11-24
- **THEN** the title is "True-Up · All time · Tesla Solar Report" and the chart's heading reads "All time by billing cycle"
