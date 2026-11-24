# Proposal

## Why

The scorecard round on v2026.11.23.13 (2026-11-23) noted that True-Up's All time names its range "Oct 1, 2021 – Sep 30, 2027", in its tab title and its cycle chart's heading, beside a lead that counts from October 10, 2021. True-Up's All time runs between true-up year boundaries, the first year's start and the current year's end, a day still to come, so the dates name neither the data nor the days shown.

## What Changes

- **True-Up's All time is named "All time"**, the preset's own name: the tab title "True-Up · All time · Tesla Solar Report" and the chart heading "All time by billing cycle". Solar's and Impact's All time keep their dates, which already match their leads.
- Wording only, so no mockups.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard-shell`: adds "True-Up's All time title", naming it "All time".
- `true-up-tracker`: "Cycle chart" is headed by the range's name, "All time" for All time.

## Impact

- `app/true-up/page.tsx` (`generateMetadata`) and `components/true-up/true-up-page.tsx` (the chart heading), with their tests.
