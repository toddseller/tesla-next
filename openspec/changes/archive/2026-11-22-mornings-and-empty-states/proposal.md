# Proposal

## Why

The live critique found that a visitor arriving in the morning, or on a phone, meets the site's weakest data first: the home page's Today chart is mostly empty forecast until late morning, Impact opens on "Today", which reads 0% everywhere until the panels make something, and on a phone Distribution's scene ends halfway down the screen with nothing under it. A neighbour weighing solar who arrives at 8 AM may conclude the system does nothing.

## What Changes

- **A morning sentence on Today.** Until most of the day's expected solar is under way, the home page's Today chapter says, above its chart, when the sun rose and when most of the day's expected solar will come: "Sunrise 6:58 AM. Most of today's 22.6 kWh is expected between 10 AM and 3 PM." It goes once that window begins.
- **Impact opens on yesterday until today has made solar.** With no range in the address, Impact shows yesterday while today's solar so far reads 0.0 kWh, and today from the first tenth of a kWh. The address, the presets and every other default stay as they are; "Today" in the presets still shows today at any time.
- **Today's totals under Distribution's scene on a phone.** Below 640 pixels, under the scene and its replay controls, Distribution shows "Today so far": today's six totals as the home page's Today shows them (solar made, used by the house, the car, from the grid, sent to PG&E, the Powerwalls in and out), with a link to today on the Solar page. They reload with each totals event. Wider screens, where the scene fills the window, are unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `home-story`: a new requirement, Today's morning sentence.
- `impact-report`: Default and invalid ranges opens on yesterday until today has made solar.
- `live-flow-scene`: a new requirement, today's totals under the scene on a phone.

## Impact

- `components/home/today.tsx` (the sentence, from the forecast card's hours and `sunTimes` in `lib/scene/sun.ts`), with a pure helper for the window in `lib/home/today.ts`.
- `app/impact/page.tsx` (the default range, from today's `impactFigures`).
- `app/distribution/page.tsx` (today's `dayIntervals`, served with the page), `components/scene/distribution.tsx`, and the totals grid shared with Today (moved out of `components/home/today.tsx`).
