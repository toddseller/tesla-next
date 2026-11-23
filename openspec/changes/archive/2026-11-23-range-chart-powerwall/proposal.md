# Proposal

## Why

The Solar page's range chart stacks solar and grid and marks the house's use, but leaves out the Powerwalls. A day's use always equals its solar, plus its grid, plus what the Powerwalls gave beyond what they took, so a day that drew down a charge from the day before shows its house mark floating above the bar, as if the house used energy from nowhere. October 2026 has many such days (October 9: 22.5 kWh solar and 10.0 grid against 44.4 used; the Powerwalls gave the other 11.9).

## What Changes

- **A Powerwall section in each bar.** Each bar gains the Powerwalls' net for its day or period: house use minus solar minus grid. Above zero it stacks on top of solar and positive grid, so a day that drew down the Powerwalls reaches its house mark. Below zero it stacks under negative grid, for a day that stored more than it gave back, as grid export already does.
- **Legend, details and note.** The legend names Powerwall between Grid and House. A bar's details show its Powerwall value, signed as grid's is. The note under the chart becomes "Below zero: more energy sent to the grid than taken from it, or more stored in the Powerwalls than they gave back that day."
- **`/api/range` items gain `powerwall`.**
- Mockups: "Solar Powerwall mockups" (https://claude.ai/artifact/AbmgNy97Na2cSDDHcxqizg), October 2026 at 1440 and 390.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `solar-range-chart`: bar values, bar shape and labels, bar details and range data gain the Powerwall.

## Impact

- `lib/range.ts` (the Powerwall figure on daily and period items), `lib/solar/bars.ts` (the series and stack ends), `components/solar/range-chart.tsx` (section, legend, details, note, value axis), with their tests.
- Out of scope: the days strip under a day view (solar only, unchanged), Home's charts, and showing the Powerwalls' gross charge and discharge.
