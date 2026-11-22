# Design

## Context

See proposal.md for why. The figures that disagree come from three places: `forecastCard` (`lib/forecast.ts`) rounds a day's hours up to a whole kWh while the Solar day view rounds the same hours to the nearest (`components/solar/day-view.tsx`) and the home page shows their tenth; the house's use comes either from Tesla's daily `total_house_usage` (car included, through `lib/range.ts`'s `house` and `lib/impact.ts`) or from the day view's home flows, from which `lib/intervals/intervals.ts` moves the measured car charging; outage lengths go through `duration()` (`lib/backup-figures.ts`) on Impact and the Payback card but through hours to a tenth on Top Ten and the home page.

## Goals / Non-Goals

**Goals:** one rounding for a day's expected kWh, one way to read an outage's length, and a label wherever the house's use includes or leaves out the car.

**Non-Goals:** recalculating any house figure to take the car out (days before the car's data was recorded can't be split); changing how Top Ten ranks; changing any figure's source.

## Decisions

- **Expected kWh to a tenth, from one place.** `forecastCard`'s day expected becomes the hours' sum rounded to a tenth, and the daily model's figure is rounded to a tenth too, so every caller gets the same number and only formats it. The round-up existed so a whole-kWh tile could never read below "expected by now"; with both to a tenth, the hours' sum can't be below their part that has passed. The Solar day view keeps summing its own `expected` hours (they are the same hours) and shows the sum to a tenth; its percentage is unchanged, as it already divides by the unrounded sum.
- **Labels, not recalculation, for the house.** A car-inclusive figure keeps "Home" or "House" and adds "car included" where the label is shown (Impact's Solar Offset bar, the range chart's legend and details, the home page's shares heading and Since 2021's line name). A car-excluded figure says "car apart": the home page's "used by the house, car apart" and the day view's "Total Usage, car apart" on days with car data. Days without car data keep "Total Usage", since their home flows still hold the charging.
- **`duration()` for every outage length.** The home page's Records and Top Ten pass an outage's hours to `duration(hours * 3600)`. Top Ten keeps each outage's exact hours, so its minutes match Impact's, and ranks by them rounded to a tenth, so the order doesn't move; its timeline's axis reads in days and hours too, and a #1 that reads the same as #2 says it is tied. The Records chart's outage axis labels its ticks with `duration()` too, the other tabs keeping `tenthTick`.
- **Whole dollars that add up on the savings card.** The card's figures are each rounded on their own today, so "solar saved, less the Powerwalls' cost" can be a dollar off the saving above it. The card keeps its saving as the rounded no-system cost less the rounded paid ($6,694 − $1,118 = $5,576 for '25 - '26), and shows the Powerwalls' amount as rounded solar saved less that saving ($5,727 − $5,576 = $151, where the exact figure is $151.51 and rounds alone to $152). Every shown dollar then adds up: paid plus saved is the no-system cost, and solar saved less the Powerwalls' cost is the saving. When the Powerwalls cost money, the key's solar line reads "Solar saved $5,727, less the Powerwalls' $151"; when they saved money, the key's Powerwalls amount comes from the same subtraction and nothing else changes. The savings model's own figures, which payback uses, are untouched.
- **VPP tile before its season.** `vppText` returns "Not started" with "2027 season, runs May 1 to October 31" when today is before the season's May 1 and nothing is marked; after May 1 with nothing marked it keeps "$0, no events marked yet".

## Risks / Trade-offs

- [The Solar tile's figure gains a decimal and is a little wider] → the tile has room at 375 px for "31.4 kWh expected"; checked in the phone screenshots.
- [The Powerwalls' shown amount can differ by a dollar from that amount rounded alone] → it is the only way all the card's whole dollars add up; the savings model and payback keep the exact figure.
- [An outage under a minute reads in seconds] → `duration()` already handles it, as Impact shows.
