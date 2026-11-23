# Design

## Context

Both pages build their lead from two functions in `lib/solar/ranges.ts`. `comparedDays(range, today)` picks the year-earlier days: a longer range reaching today stops both sides at yesterday, a range starting today gets none, and a lone day, today included, is compared with that whole date. `rangeNames(range, today)` names the range ("in November so far", "today", "from Nov 1 to Nov 23"). `solarLead` in `lib/lead.ts` already gives the total alone when there is nothing to compare; `impactLead` returns null instead, and the Impact page then shows no sentence.

## Goals / Non-Goals

**Goals:** no lead compares a part-day with a whole day, every range under way says so, and every Impact range has a lead with a figure.

**Non-Goals:** a same-time-last-year figure for today, and any wording change beyond solar's verb.

## Decisions

- **`comparedDays` gives a range starting today no comparison, a lone today included.** One condition in the shared function covers both pages, and matches what Solar's spec already says. A lone past day keeps its whole-date comparison. Alternative: drop the comparison only in `impactLead`. Rejected: Solar's lone today has the same fault.
- **A range reaching today that no preset names is named "since <its first day>"**, from `datesLabel` of the first day alone. That covers All time and custom ranges, which have no data after today to show anyway, and reads as under way without "so far". The lone day under way becomes "today so far"; the week, month and year names keep their "so far".
- **`solarLead` picks its verb from the range:** "has generated" when the range includes today (`rangeIncludes`), "generated" otherwise. "Generated" over the site's "made" and the proposed "produced" because Impact's offset and Top Ten's solar day already say it, and every on-screen "made" (Home's Today and Since 2021, the forecast card, Distribution's today-so-far panel) becomes "generated" with it, so the site uses one word. Spec text that describes data rather than quoting the screen ("after the panels have made 0.4 kWh") keeps its wording.
- **`impactLead` gives the share alone when `before` is null,** as `solarLead` does with its total, so `ImpactPage` always has a sentence. A lone past day keeps its own "; this day last year was" form.

## Risks / Trade-offs

- [Impact's default view loses the today-against-last-year line] → Accepted by choice (option 2 in exploration); yesterday and longer ranges keep their comparisons, and a same-time comparison from the 5-minute data can follow as its own change.
- [A custom range that ends in the future but includes today reads "since" its start] → Accepted: the days after today have no figures, so the sentence is about the days up to now either way.
