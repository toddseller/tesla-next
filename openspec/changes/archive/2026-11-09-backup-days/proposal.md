## Why

The Backup section gives long stretches off the grid in hours: All time reads "156.9 h off the grid" and its longest outage "52 h 16 m". Past a day, hours take arithmetic to picture (156.9 h is about six and a half days). The two summary cards also disagree in form: "Off the grid" is decimal hours while "Longest" is hours and minutes.

## What Changes

- A duration of a day or more reads in days and hours, rounded down: 156.9 h reads "6 d 12 h", 52 h 16 m reads "2 d 4 h". Minutes are dropped at that length, the owner's choice; the longer forms (`6 d 12 h 54 m`) would wrap in a phone's two-column cards.
- Under a day, durations read as now: hours and minutes, minutes and seconds, or seconds.
- The "Off the grid" card uses the same form as the other durations instead of decimal hours.
- This applies everywhere the section gives a length of time off the grid: the Off the grid and Longest cards, each storm day's line, and each event's row. The outage detail's "~14 h left" stays in hours, as it estimates the batteries' runtime.
- No mockups: the cards and rows keep their layout; only the text of a duration changes, and no new form is longer than one it replaces.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `backup-history`: the outage summary gives its total as time, not hours; durations of a day or more read in days and hours; the summary's and storm days' scenarios change to the new wording.

## Impact

- `components/impact/backup-section.tsx` (`duration()` and the Off the grid card) and `components/impact/backup-section.test.tsx`.
- No data, route, dependency or setting changes.
