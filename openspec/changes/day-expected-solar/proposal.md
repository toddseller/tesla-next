# Proposal

## Why

The daily solar peak check now alerts the morning after a bright day whose peak fell well short, but nothing on the site shows whether such a day was a fault or weather: the forecast is compared with what the panels made only for today, in the forecast card. The hourly forecast is now stored for every day since 2021-10-10, so a day's own chart can show what its sunlight should have given, and the alert can open that chart.

## What Changes

- The day view's Solar view draws an expected line over the flows: each hour's expected kWh, from the hour's forecast sunlight times its hour of the day's scale over the 30 days before that day (the forecast card's "Today by hour" calculation, for any day), as a smooth curve in the foreground color, with a small key.
- Total Generated gains the day's expected total beside it, "of 64 kWh expected (40%)", the percentage in red under 60%. Today shows the day's expected total without a percentage, since the day isn't over.
- Pointing at the Solar view adds an Expected row, the pointed hour's expected power in kW, under the flows.
- `/api/intervals` returns the day's expected hours with its records.
- The daily check's failing solar peak line ends with the day's address on teslasolar.report, so the alert opens that day's view.
- The day view's navigation and layout stay as they are. Days without enough history for the scale (the first week of service) or without forecast hours show no line and no figure.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `solar-forecast`: an hour's expected kWh is scaled by the 30 days before its own day, so any day has expected hours, not only today.
- `day-intervals`: the day intervals response includes the day's expected hours.
- `solar-day-view`: the Solar view's expected line and key, the expected total beside Total Generated, and the Expected row in the chart details.
- `system-checks`: the failing solar peak line carries the day's address.

## Impact

- `lib/forecast.ts` (the hourly scale and a day's expected hours, shared by the card and the day), `lib/intervals/intervals.ts` (`dayIntervals` adds them), `components/solar/day-view.tsx` (the line, key, headline figure and details row), `lib/checks.ts` (the link), their tests.
- One more query batch per day view load, the card's hourly queries for that day (about 15 ms on production).
- The Distribution page also reads `/api/intervals`; it ignores the new field.
