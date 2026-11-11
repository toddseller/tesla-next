# Spec Delta

## MODIFIED Requirements

### Requirement: Custom range picker
The page SHALL offer the same date-range picker as the Solar page, showing the current range, from which a visitor picks a start and an end day. It SHALL offer no day before 2021-10-10, the site's first day of service, and none after today in the site's time zone.

#### Scenario: Picking a range
- **WHEN** a visitor picks October 10 and October 20, 2026
- **THEN** the address becomes `/impact?start=2026-10-10&end=2026-10-20` and the page shows that range

## ADDED Requirements

### Requirement: Range controls beside the heading
In a window at least 1024 pixels wide, the page's heading and its range controls (the readings switch when it shows, the presets and the dates button) SHALL share one row for every preset, so choosing a preset that brings the readings switch doesn't move the cards below.

#### Scenario: All time
- **WHEN** a viewer on Today, in a 1024 pixel wide window, chooses All time on 2026-11-11
- **THEN** the readings switch appears in the same row as the heading, presets and dates button, and the first card stays where it was
