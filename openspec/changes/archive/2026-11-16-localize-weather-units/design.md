# Design

## Context

See proposal.md for why and the delta specs for the behavior. What shapes the approach:

- Everything is stored metric: `weather_sample.temperature` and `solar_forecast.temperature_max` and `temperature_min` in °C, the 10 m wind in km/h.
- Two places convert for display, both fixed to US units. `forecastCard()` in `lib/forecast.ts` turns °C into whole °F on the server, for the page and `/api/forecast` alike. `windText()` in `lib/scene/weather.ts` turns km/h into mph on the client, for the vane in `components/scene/live-scene.tsx`.
- The forecast-temperatures change ruled out °C as a non-goal ("the house reads °F"). This change reverses that for viewers elsewhere; the house's own browser still gets °F.
- Every page renders per request (`dynamic = "force-dynamic"` in the root layout), so the server can read each request's headers. The Distribution scene renders on the server and hydrates (`components/scene/hydration.test.tsx`), so the vane's text must come out the same in both.
- `components/count-up.tsx` already passes a value to deep client components through a React context.

## Goals / Non-Goals

**Goals:**
- One place that maps a request to units, and one value the server and the browser both read, so no page can hydrate with different units.

**Non-Goals:**
- Reading `navigator.language` or any device setting in the browser.
- `Intl` number formatting. The readout stays English text, so "29 km/h" is a template string like "18 mph" is today.

## Decisions

### `unitsFor(acceptLanguage)` in `lib/units.ts`

It returns `{ temperature: "F" | "C", wind: "mph" | "km/h" }`. It splits the header on commas, drops each entry's `;q=`, and takes the region of the first tag that has one, read with `new Intl.Locale(tag).region` inside a try, since `*` and malformed tags throw. No region gives `{ "F", "mph" }`. Two `Set`s of region codes hold the °F and mph lists (display-units spec).

Entries are taken in the order sent rather than sorted by `q`: browsers send them in descending order already, and sorting adds code for no real header.

Alternative: `new Intl.Locale(tag).maximize().region`, which guesses `de` to DE. It was set aside because the decision was that no region means US units; a bare language rarely comes first without its regional form after it (Firefox sends `fr,fr-FR`), and the scan for the first region covers that.

### Units through a context, filled in the root layout

`app/layout.tsx` calls `headers()` and wraps its children in a client `UnitsProvider` holding `unitsFor(...)`. `components/solar/forecast.tsx` and the vane read it with `useUnits()`. The value is in the served HTML's props, so hydration and later reloads keep it.

Alternative: pass units as props from each page. The vane is three components below the Distribution page and the tiles two below the Solar page, so props would thread through components that don't use them. The layout is the one place every page passes through.

### °C from the card, converted at display

`forecastCard()` stops converting: `today.temperature`, `high` and `low` carry °C as stored, unrounded. The tiles convert and round once with the viewer's unit (`Math.round(c * 9 / 5 + 32)` or `Math.round(c)`). Rounding °C in the card and converting after would round twice and can land a degree off.

`/api/forecast` returns the same °C, so the reload after midnight needs no units of its own: the page's context converts it.

Alternative: pass units into `forecastCard()` and keep whole degrees in the API. Both the page and the route would then read headers, and the vane needs the context anyway, so it would be two ways of carrying one value.

### `windText(speed, gusts, direction, unit)`

The fourth argument picks the factor and the label: 0.621371 and "mph", or 1 and "km/h". Calm stays `isCalm()` in km/h against 2 mph, so it reads Calm at the same wind for every viewer; the drift, rain and shake code keeps km/h and does not take the unit.

## Risks / Trade-offs

- [An `en-US` browser outside the US gets °F and mph] → Accepted with choosing A (auto only); a switch can be added later on top of the same context.
- [The layout reading headers] → Already per request; `app/layout.test.tsx` mocks `next/headers` alongside its other mocks.
- [`/api/forecast` changes unit] → The Solar page is its only reader, and it ships in the same release.

## Migration Plan

Release as usual. Rollback is the previous release; nothing is stored.
