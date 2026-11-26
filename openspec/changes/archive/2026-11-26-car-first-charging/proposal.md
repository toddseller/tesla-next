# Proposal

## Why

A car on Charge on Solar sometimes shows a grid-colored cable in the live scene while Tesla's app credits the same charge to solar. On Nov 26 at 10:08 (solar 4.5 kW, home 5.2 kW, car 1.2 kW, grid importing 2.0 kW) the scene gave all of solar to the house and the grid to the car. History splits the same charging in proportion to the home's sources, a third answer. The site should tell one story, and it should be the one the app tells.

Which source feeds the car is bookkeeping: the Wall Connector and the car measure only their own power, and the Charge on Solar setting can't be read. So the rule applies to every car, with no per-car setting.

## What Changes

- The live scene serves the car before the house from every source. Solar's order becomes Powerwall, car, home, grid; the Powerwall's becomes car, home, grid; the grid's becomes car, home, Powerwall.
- History takes each interval's charging from the home flows in the same order: solar to home first, then Powerwall to home, then grid to home, in place of the proportional split.
- Replay lists a source's flows in the scene's new order, so a replayed flow keeps its live lane.
- Past percentages change on read, with no backfill: daytime charges move toward solar in the Solar day view, the Distribution replay and Impact's Home car charging section. Charges with a single source, like the Star Destroyer's pre-dawn grid charge, don't change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `live-flow-scene`: "Flow assignment" puts the car before the house in every source's order.
- `day-intervals`: "Charging is attributed to energy sources" fills charging from the home flows in order (solar, Powerwall, grid) instead of in proportion.

`car-charging` and the Solar day view already defer to "Charging is attributed to energy sources", so their requirements don't change.

## Impact

- `lib/scene/live-scene.ts`: `DESTINATIONS`.
- `lib/intervals/intervals.ts`: `intervalWh`, the one place history splits charging; the intervals route, replay, the Solar day view and `lib/car-charging.ts` all read it.
- `lib/scene/replay.ts`: the `FLOWS` order.
- `lib/car-charging.ts` caches finished days per process; the deploy that ships this clears the cache, so nothing else is needed.
- No schema, API shape or dependency changes.
