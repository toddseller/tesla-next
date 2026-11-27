# Design

## Context

See proposal.md for why and the delta specs for the behavior. What shapes the approach:

- Live weather reaches the client as the live status's `weather` object; `use-site-data.ts` copies each field it knows into `weather*` fields, and `useLiveWeather` (`components/scene/live-weather.ts`) builds a `Sky` from them and walks every number over 5 minutes except the vane's three (`UNWALKED`). anton's `weather-in-live-status` adds `temperature` (°C) and `code` to that object.
- Replay weather comes from `/api/intervals` (`lib/intervals/intervals.ts`), which selects whole `weather_sample` rows and maps each to a `WeatherReading`; `weatherAt` (`lib/scene/weather.ts`) blends a field between readings, with gusts and direction special-cased so a missing value doesn't read as 0.
- Distribution builds one `Sky` per render, the replayed moment's or the live one, and passes it to `sceneState`; the band can take the same object, so it always agrees with the scene.
- Existing wording to reuse: `skyOf(code, when)` (`components/solar/sky.ts`) labels the Today tile, `windText` words the vane's readout, `sunTimes` and `skyAt` (`lib/scene/sun.ts`) give the day's sun, and the forecast card converts °C to whole degrees of the viewer's unit (`components/solar/forecast.tsx`, `useDegrees`).
- Mockups: the "Outside now mockups" canvas, boards Distribution B and Home phone 2.

## Goals / Non-Goals

**Goals:**
- One source per moment: the band and the scene read the same `Sky`; the sentence reads the live one.
- Reuse the site's existing words for sky and wind, so the band, the vane and the Today tile never disagree.

**Non-Goals:**
- A development override for temperature or code (the spec's override lists the sky fields only); states are checked against real data in an onyx branch container, replaying past days for the storm, night and fog cases.
- Changing the vane, its readout or the forecast card.

## Decisions

### Temperature and code join `Sky`, unwalked and unblended where it matters

`Sky` gains `temperature` and `code`. `use-site-data.ts` copies them from the live status like the other fields, and `useLiveWeather` passes them on; both join `UNWALKED`, since a code can't be walked and a temperature changes too little in 15 minutes to need it. In replay, `weatherAt` treats `code` as a step (the reading at or before the time, since a blended code is meaningless) and `temperature` like the gusts: blended between two readings that have one, else whichever has one. `lib/intervals/intervals.ts` adds `temperature` and `code` from the row (`r.temperature ?? null`, `r.weather_code`).

Alternative: a separate weather path for the band. It would duplicate the live and replay plumbing the scene already has, and could drift from what the scene draws.

### The condition word: `skyOf`, then the scene's own fog

The word is `skyOf(code, day ? "now" : "night").label` with " now" dropped, `day` from `skyAt` at the shown time, so the band says Partly cloudy where the Today tile says Partly cloudy now, and Clear at night. A fog code (45, 48) keeps Fog only when `cover` is 1 or `low` is at least 0.75, the two ways the scene draws fog (no airport report, or the airport sees it); otherwise the word comes from the cover, as code 0 below 0.25, 2 below 0.75 and 3 above, through the same `skyOf`. The icon comes with the label.

Alternative: the code alone, as the Today tile does. It would say Fog over a clear scene on the mornings the airport reports clear.

### The band is one small component beside the scene

`components/scene/outside.tsx` takes the `Sky`, the shown time and whether it is replay, and renders the card (Slate Card, Hairline border, 10px corners): heading, icon, temperature in Plex Mono, word, `windText(...)` (left out when it says "No wind reading"), then Sunrise and Sunset in Plex Mono. Distribution renders it between the scene's frame and Today so far. Times use the site's time zone formatter the replay bar uses.

### The sentence: one wording, the gusts wider than a phone

`lib/home/now-sentence.ts` gains `outsideParts(weather, now, units)` returning the whole degrees, the adjective (`skyOf`'s label lowercased, with Fog as foggy, Rain as rainy, Snow as snowy and Thunderstorms as stormy), the gusts in the viewer's unit when they reach 40 km/h, and the next sun event: sunrise before it, sunset until it, the next day's sunrise after. `now.tsx` renders "Outside it's {t} and {word}" + a `hidden md:inline` ", gusts to {g}" + "; sunset at {time}." in `text-muted-foreground`, one size below the live sentence, `whitespace-nowrap` below `md`. The 40 km/h line is Backup's high-wind cutoff (`HIGH_WIND` in `lib/backup-figures.ts`), reused rather than restated.

Alternative: a separate phone wording. One wording with the gusts hidden on phones is less to test and reads the same.

### Room on a phone

Below `md`, Now's gaps tighten by the sentence's height (about 28px: the word-to-sentence and sentence-to-scene gaps, and the space before Today), so the sentence leaves Today where it was. jsdom can't measure layout, so the check compares Today's first figure at 390 x 844 in the branch container and on production with the same live sentence.

## Risks / Trade-offs

- [anton's change not deployed yet] → Every new field is optional: without them the band shows the wind and sun times and the sentence is left out, as the specs' "without a reading" scenarios say.
- [The phone fold is tight] → Checked at parity, not against the fold: a four-line live sentence already pushes Today's first figure past 844 pixels on production (838 px on 2026-11-27), which is its own follow-up change. Measured 839 px on the branch against 838 on production.
- [The walked cover lags the code for up to 5 minutes] → The fog rule reads the walked cover, so the word follows the sky as drawn, which is the point.

## Migration Plan

Ships after anton's `weather-in-live-status`. No data or env changes. Check in an onyx branch container (live, replaying 2024-02-04 noon for the storm and a fog morning for the airport rule) before asking to push, then release as usual (ask first).

## Rollout

Released as v2026.11.27.0 on 2026-11-27, after anton's `weather-in-live-status` deployed. Its Deploy run passed, and the new container was up at 12:10 PM with no restarts and no errors in its log. At 12:12 PM, on teslasolar.report at 1440 x 900 and 390 x 844:
- `/distribution` live read Outside now, 64°F, Cloudy, Calm, Sunrise 7:03 AM, Sunset 4:54 PM; on a phone the band wrapped to two lines.
- `/distribution?at=2024-02-04T12:00` read Outside at 12:00 PM, 56°F, Cloudy, 26 mph, gusts 53 mph, from S, Sunrise 7:12 AM, Sunset 5:37 PM.
- `/` showed "Outside it's 64°F and cloudy; sunset at 4:54 PM." under the live sentence at both widths.
- No page had console errors or scrolled sideways.
