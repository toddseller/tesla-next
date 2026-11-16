# Proposal

## Why

The site shows temperatures in °F and the vane's wind in mph to every visitor, wherever they are. Someone browsing from Germany or Canada reads units they don't use. The browser already says where its viewer is through its preferred languages, so the site can pick each viewer's units without asking.

## What Changes

- **Each page picks its units from the browser's region.** The server reads the region from the request's `Accept-Language` (the first listed language that names one) and picks temperature and wind units separately: °F where Fahrenheit is in everyday use, mph where wind is given in mph, so a British viewer gets °C with mph.
- **No region means US units.** A header with no region in it (a plain `en`) or no header at all gives °F and mph, as the site shows today.
- **The Solar forecast card's temperatures follow the viewer's unit.** Still whole degrees with a bare "°", so only the number changes.
- **The vane's readout follows the viewer's wind unit**, as "29 km/h, gusts 56 km/h, from SW" in km/h. Calm stays below 2 mph (about 3 km/h).
- `/api/forecast` returns its temperatures in °C as stored, unrounded, and the page converts and rounds them for the viewer.

Out of scope: a units switch in the page, other locale formatting (dates, number separators, language), and the wind used for cloud drift, rain slant, the vane's shake and the backup page's wind labels, none of which show a number.

## Capabilities

### New Capabilities
- `display-units`: how the site picks each viewer's temperature and wind units from the browser's region.

### Modified Capabilities
- `solar-forecast`: Temperatures on the tiles are in the viewer's unit rather than always Fahrenheit.
- `scene-weather`: the Wind readout is in the viewer's wind unit rather than always mph.

## Impact

- New `lib/units.ts` (region to units) and a small client context the root layout fills from the request's headers.
- `lib/forecast.ts`: `forecastCard` stops converting to °F; `components/solar/forecast.tsx` converts at display.
- `lib/scene/weather.ts` (`windText`) takes the wind unit; `components/scene/live-scene.tsx` passes it.
- `/api/forecast`'s temperature fields change from whole °F to °C; the Solar page is their only reader.
- Tests: `lib/forecast.test.ts`, `lib/scene/weather.test.ts`, `components/solar/forecast.test.tsx`, `app/api/forecast/route.test.ts`, and page tests that render the card or the vane.
- No change to layout or styling, so no mockups. No new dependency, env var or version pin.
