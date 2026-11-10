# Design

## Context

See proposal.md for why, and the two spec deltas for the behavior. What shapes the approach:

- **The day view's state.** `components/solar/day-view.tsx`'s `DayView` holds the chosen view, and `DayPanel` renders it unkeyed. So the view tab already survives a new day and a reload of the same day (the Solar page's `useReload` swaps `day` in place).
- **The chart.** `PowerChart` draws a recharts `ComposedChart` over the day's records, with `minute` (0 to 1435) on a numeric x-axis. It is remounted per view and per vehicle-data case (`key`). Off-grid and storm watch spans are drawn with `ReferenceArea`, and `ChartTooltip` shows a step's details on hover or touch.
- **The figures.** Headlines, breakdowns and the Grid view's net line all come from `viewSummary(viewKey, totals)` in `lib/solar/day-views.ts`, where `totals` is the day's kWh per flow (`dayIntervals` sums each interval's Wh, then divides by 1,000).
- **The data.** Records carry each flow as `<flow>_kw`, rounded to 0.01 kW. Summing those per step was measured against the true Wh for six flows over the 30 days to 2026-11-09: off by up to 0.015 kWh a day, enough to show a different 0.1 kWh on 11 of 180 day-and-flow totals.

## Goals / Non-Goals

**Goals:**
- One way of working out figures for the day and for a span: the same `viewSummary`, fed different totals.

**Non-Goals:**
- A span in the address or across days.
- Changing the tooltip, the axes or the views' flows.

## Decisions

### Wh per record, unrounded

`dayIntervals` adds `<flow>_wh` to each record beside `<flow>_kw`: the same value it already adds into `totalWh`, kept unrounded. Summing a span's records in time order then adds the same numbers in the same order as the day's total, so a whole-day span matches it to the last digit. Records with no stored energy (battery-only or charging-only times) keep null, as their kW does.

Alternative: send nothing new and sum the rounded kW. It disagrees with the headline at 0.1 kWh too often (Context). Another alternative: totals for a span from the server. It would cost a request per drag for figures the page already holds.

### The span in the day view, tied to its date

`DayView` keeps `span: { date, from, to } | null`, with `from` and `to` in minutes (`to` the end of the last step, so a whole day is 0 to 1440). It applies only while `date` is the open day's. A reload of the same day keeps it, and another day drops it, without keying `DayView` by day, which would also reset the chosen view.

`spanTotals(records, from, to)` in `lib/solar/day-views.ts` sums each flow's `_wh` over records with `from <= minute < to`, in kWh, the same shape as `day.totals`. The summary is then `viewSummary(viewKey, spanTotals(...))`.

### Dragging with pointer events on the chart's box

`SpanArea` wraps the power chart, and its pointer events map the pointer's x to a 5-minute step: the plot is the box's width less the 56-pixel value axis on its right. Pressing notes the step. Moving to another step sets the span live, from the earlier step's start to the later one's end. A press and release on one step is a click, and selects nothing. Shading is one more `ReferenceArea` in the foreground at 7%, with a line at each edge, apart from the off-grid and storm watch shading.

Pointer events cover mouse and finger with one set of handlers, and tests can drive them in jsdom, where recharts can't report the step under the pointer because nothing is laid out. That replaces the first plan of using recharts' mouse and touch callbacks.

### Touch: a toggle

A Select toggle (`aria-pressed`) shows only for a coarse pointer, with Tailwind's `pointer-coarse:` variant. A press counts for a mouse's main button always, and for a finger or pen only while Select is on. While Select is on, the box takes `touch-none`, so a drag isn't taken as a scroll. When a drag that selected a span ends, Select turns off, so the next touch reads values again. The controls (the span's pill, the hint and Select) show only where a power chart is drawn, so the Vehicle view on a day without car data doesn't offer a drag it can't take.

### Day and span figures by width

Each headline renders the day's figure and, when there is a span, the span's. Tailwind classes pick what shows:
- **640 pixels and up:** the day's figure, with the span's under it (`max-sm:hidden` on the pair).
- **Under 640 pixels:** the span's figure alone (`sm:hidden`).

The breakdowns do the same: from 640 pixels a second kWh column, and under 640 pixels rows built from the span's summary, with its own shares. The net line follows the headlines. Both versions are in the page, so resizing needs no state.

## Risks / Trade-offs

- [Touching with Select on also moves recharts' tooltip] → It shows the step under the finger while dragging, which helps more than it hurts. Checked in a phone-sized browser in task 5.2.
- [A drag on a touch laptop with a mouse] → It works as a mouse drag. The toggle only shows for a coarse pointer.
- [`/api/intervals` grows by ten numbers a record] → About 2,900 numbers a day. The Distribution page ignores them. Measured in task 4.2.

## Migration Plan

Nothing to migrate: the API only adds fields. Release, then check the span totals on teslasolar.report against the day's intervals. Rollback is the previous release.

## Mockups

On the "Day Span Mockups" canvas (https://claude.ai/artifact/URpXxP65nxgtB9W1VwmK4k), the owner approved both frames as drawn on 2026-11-10:
- **The span:** a neutral light band with edge lines, named in a pill ("Selected 4:00 PM to 12:00 AM") with Clear. From 640 pixels a hint says to drag for another span.
- **From 640 pixels:** the span's figures sit under each headline and after the net line, and the breakdowns gain a tinted span column headed by its times.
- **On a phone:** the pill and the Select toggle share a row above the headlines. The headlines, net line and breakdowns show only the span's figures, and the breakdowns are labelled with the span's times. Exported From reads dashes when its total is 0.0, as now.

## Results

A throwaway branch container on onyx against production, 2026-11-10, with November 9, 2026's `/api/intervals`:
- **The span:** 4:00 PM to 12:00 AM summed to 8.669 kWh imported (8.7) and 0.0 exported, matching the hand calculation behind the proposal.
- **The whole day:** each flow's records added up exactly (`===`) to the day's totals: 22.187 kWh imported and 16.602 exported.
- **Size:** the answer grew from 128,734 to 197,899 bytes raw, and from 5,687 to 7,136 bytes gzipped (`gzip -9`), which is how visitors get it through Cloudflare. That's about 1.4 KB more a day. On a day without car charging the Wh are whole numbers; split charging intervals carry fractions.
- The branch answered the day in 0.14 s.

`yarn build && yarn start` against the local preview database, which holds production's intervals for November 9, driven in headless Chrome:
- **1280 wide, mouse:** dragging from 4:00 PM past the end of the day selected "4:00 PM to 12:00 AM". The page matched the chosen mockup: headlines with the span's 8.7 and 0.0 under the day's, a span column, and the net line with the span's 8.7. The Select toggle was hidden, and nothing scrolled sideways.
- **375 wide, touch emulation (`(pointer: coarse)` true):**
  - A finger drag with Select off selected nothing.
  - With Select on, a real touch drag (Chrome's `Input.dispatchTouchEvent`) selected the span, and Select turned itself off.
  - The span's figures replaced the day's, and the hint was hidden: computed `display: none`, with the toggle `flex`.
  - Nothing scrolled sideways.
- **Edge lines:** the first build didn't draw them, because a Tailwind `stroke-` class on recharts' `ReferenceLine` didn't apply. An explicit `stroke` did.
- **A full-page screenshot misleads:** it drops touch emulation while it captures, so it shows the desktop's hint and no toggle. Check touch layouts with a viewport screenshot.
- **The tooltip:** after the touch drag, recharts' tooltip stayed on the last step, as a tap on the chart already leaves it today.

At the archive, adding the Wh to "Day intervals API" pushed that requirement past strict validation's 500 characters. So the Wh became a requirement of its own, "Each flow's energy", added beside it, and "Day intervals API" is unchanged. The `day-intervals` spec's two other long-requirement warnings predate this change.
