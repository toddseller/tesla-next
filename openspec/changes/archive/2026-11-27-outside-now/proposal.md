# Proposal

## Why

The site draws the weather in the house scene (clouds, rain, the vane) but never says it in words or numbers: the temperature reaches only the Solar forecast's Today tile, and the wind only the vane's tap readout. A visitor watching the house can't tell how warm it is or when the sun goes down, and anton now stores temperatures back to 2021 and is adding the temperature and weather code to the live status (anton's `weather-in-live-status`), so both live and replayed moments have them.

## What Changes

- **An Outside band under Distribution's scene:** one line on a card attached under the scene, above Today so far: the condition's icon and word, the temperature, the wind as the vane's readout words it, then sunrise and sunset. It follows the scene: live it reads "Outside now", in replay "Outside at 12:00 PM" with that moment's reading and that day's sun times. Without a recent reading only the sun times show. On a phone it wraps to two lines.
- **A weather sentence in Home's Now:** under the live sentence, in the muted color, "Outside it's 62°F and cloudy; sunset at 4:54 PM." (or the next sunrise after sunset), adding "gusts to 53 mph" when the wind is notable, wider than a phone only. Left out without a recent reading. On a phone it stays one line and Now's gaps tighten so the first screen still reaches Today's first figure.
- **The replay's weather readings carry the temperature and weather code**, so the band can show a replayed moment.
- **Condition words** come from the forecast card's sky labels, so the band, the sentence and the Today tile agree; a fog code the airport doesn't see doesn't read as fog, as the scene doesn't draw it.
- Units follow the viewer's region, as everywhere else (display-units, unchanged).

Mockups: "Outside now mockups" canvas (https://claude.ai/artifact/9K5tpquhLdTb6hJCcYQ5o6), Distribution B and Home phone 2.

Out of scope: the vane and its readout, the forecast card, and any other page.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `scene-weather`: the Outside band under Distribution's scene, live and in replay.
- `day-intervals`: each replay weather reading carries its temperature and weather code.
- `home-story`: Now gains a weather sentence.

## Impact

- **Code:** `components/scene/distribution.tsx` (the band's place), a new band component beside it, `components/scene/use-site-data.ts` and `components/scene/live-weather.ts` (the live temperature and code), `lib/intervals/intervals.ts` and `lib/scene/weather.ts` (replay readings), `components/home/now.tsx` and `lib/home/` (the sentence), reusing `skyOf` (`components/solar/sky.ts`), `windText` (`lib/scene/weather.ts`), `sunTimes` (`lib/scene/sun.ts`) and the forecast card's degree conversion.
- **Depends on:** anton's `weather-in-live-status` deployed first; before it, the live band and sentence show as without a reading.
- **Database:** none; reads columns anton already stores.
