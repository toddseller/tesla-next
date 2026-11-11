# Design

## Context

- `forecast()` in `lib/forecast.ts` reads the latest `weather_sample` row's `weather_code` and `sampled_at`. `forecastCard` uses that code for today while the reading is under 3 hours old, with `sky` "now" or "night" by `skyAt`. `components/solar/sky.ts` turns a code and `sky` into a label and icon.
- The scene's sky comes from `skyFrom(code, cloud_cover, low, mid, high, airport_low, airport_mid)` in `lib/intervals/weather.ts`, ported from anton:
  - **Without the airport's report:** cover is the model's, weighting low cloud 1, mid 0.6 and high 0.25. Codes from 45 (fog) up make it 100%.
  - **With the airport's report:** its low cloud replaces the model's, mid is the greater of both, and only codes from 51 (drizzle) up make it overcast, so the airport decides fog.
- Readings on 2026-11-11 (read-only, production): 08:30 to 10:00 had codes 1 with 21 to 27% model low cloud while the airport reported none, so the card read "Partly cloudy now" over a clear sky.

## Goals / Non-Goals

**Goals:**
- The card's sky now and the Distribution scene never disagree about the same reading.

**Non-Goals:**
- The days ahead, today's forecast sky, the 3-hour rule, and the scene itself.

## Decisions

**Turn the observed sky into a code, and leave the labels alone.** A new `observedCode(reading)` in `lib/forecast.ts` runs the reading through `skyFrom` and returns:
- the code itself for rain, snow and thunderstorms (51 and up);
- 45 for fog when the cover is 100%;
- otherwise 0 under 25% cover, 2 under 75%, and 3 from 75%.

`forecastCard` uses it in place of the raw code while the reading is fresh. `skyOf` in `components/solar/sky.ts` already labels 0, 2, 3 and 45 with "now", and with moon icons at night, so no component changes. Alternative: pass the cover to the component and label it there; that splits one rule across the server and the client and changes the card's data shape.

**Fog from the cover, not the code alone.** A fog code counts only when `skyFrom` makes the cover 100%. Without the airport's report that's every fog code, as today, since codes from 45 are overcast. With the airport's report, it means the airport sees an obscured or overcast low sky; its "VV" (vertical visibility, fog) counts as 100% low cloud in anton. A model's fog under the airport's clear sky reads by its cover, Sunny now.

**Steps of 25% and 75%.** The airport reports in eighths, which anton stores as few 19%, scattered 44%, broken 75% and overcast 100%. So few clouds read Sunny, scattered Partly cloudy, and broken or overcast Cloudy, each report landing clear of a step. Without the airport, the model's cover is continuous. Its code 1 band, where this morning's 21 to 27% sat, then splits at 25%, the step nearest the middle of WMO's "mainly clear".

**The reading's cloud columns come with it.** The latest-reading query also selects `cloud_cover`, `cloud_cover_low`, `cloud_cover_mid`, `cloud_cover_high`, `airport_low` and `airport_mid`, as `dayIntervals` already does for the scene. `Reading` gains them.

## Risks / Trade-offs

- [`/api/forecast`'s `today.code` is now the observed sky's code, not the model's.] → Its only reader is the card; the route's spec says it answers the card's figures.
- [Model-only cover is weighted, so 30% high cirrus counts as 7.5% and reads Sunny.] → As the scene draws it: thin high cloud barely dims the sun.
- [Snow and thunderstorms never happen at the site, and the scene draws them as rain.] → The card still names them by their code, as today.

## Migration Plan

Merging to `main` deploys nothing. After the merge, a `v*` release (with the user's go-ahead) deploys it. Check the card against the Distribution page on the live site.

## Results

- **Branch container (task 3.2), 2026-11-11, about 10:30 AM PST:** onyx, reading production read-only, through an SSH tunnel.
  - **This morning's readings through the new rule.** Each reading was taken from `weather_sample` through the app's own read-only connection and put through `observedCode`, labelled as `skyOf` labels it:

    | Time | Model low cloud | Airport low cloud | Before | After |
    |---|---|---|---|---|
    | 08:30 | 22% | 0% | Partly cloudy now | Sunny now |
    | 08:45 | 25% | 0% | Partly cloudy now | Sunny now |
    | 09:00 | 27% | 0% | Partly cloudy now | Sunny now |
    | 09:15 | 4% | 0% | Sunny now | Sunny now |
    | 09:30 | 6% | no report | Sunny now | Sunny now |
    | 09:45 | 24% | 0% | Partly cloudy now | Sunny now |
    | 10:00 | 21% | 0% | Partly cloudy now | Sunny now |
    | 10:15 | 18% | 0% | Sunny now | Sunny now |

  - **The card against the scene at the same moment:** the live status the Distribution scene draws (10:28:44) had 0% cover, and the branch's `/api/forecast` gave today code 0, with the tile reading "Sunny now".
  - **Screenshots:** the tile, at 2x, reads "Sunny now" with the sun icon. Headless Chromium draws the Distribution scene's sky as dusk at 10:30 on teslasolar.report as well as on the branch, so the scene was compared by its live-status cover rather than its picture.
  - There was no console error.
