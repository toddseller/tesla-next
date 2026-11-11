# Design

## Context

Solar, Impact and True-Up share one `RangeControls` (`components/solar/range-controls.tsx`): a `PresetGroup` and a dates button opening shadcn's `Calendar` (react-day-picker 10) in range mode inside a `Popover`. Picking is already two clicks, in either order, and the popover already overlays the page. Three things are wider or looser than this change wants:

- the trigger writes the range with `datesLabel(range, "short")`, 272 px on All time;
- `lastPickable()` allows days up to two years past the viewer's own today;
- the calendar shows one month, opening on the range's start.

Widths measured on teslasolar.report's Impact page on All time at 1680 px: heading 74, Readings switch 241, presets 550, dates button 272, gaps 12 + 2 × 8, available 1136. Each page already gets the site's `today` from the server.

## Goals / Non-Goals

**Goals:**
- Impact's header stays one row from 1024 px wide on every preset.
- One picker for all three pages, bounded by the site's first day and today.

**Non-Goals:**
- Moving the Readings switch; the 750 to 1000 px wrap is accepted.
- The single-day pickers in `day-panel.tsx` and `replay-bar.tsx`, whose date label is the readout between their step buttons.
- `parseRange` and the API's 732-day limit: they serve presets that end in the future and typed addresses.

## Decisions

### The trigger is an icon; its dates move to its name

The button keeps its `PopoverTrigger`, its `CalendarDays` icon and `min-h-11`, and becomes `size-11` with no text. `aria-label` and `title` read `Choose dates, ${datesLabel(range, "short")}`. The dates stay visible in each page's card heading, so the label only repeated them.

When no preset in `presets` or `earlier` holds the range, it takes the selected look of `presetStyle(true)` (the secondary fill and the red underline). It reuses `holds`, which `PresetGroup` already uses. It is a popover trigger, so it carries `aria-expanded` from Radix and no `aria-pressed`; the dates in its name say what is shown.

*Alternative:* keep a short label ("Custom") on the icon. It would bring back width the header needs, and the phone menu already says "Custom".

### The site's today, passed in

`RangeControls` takes `today` (a `YYYY-MM-DD` string) from its page, which all three already hold. The calendar gets `disabled={{ before: toDate(FIRST_DAY), after: toDate(today) }}`, `startMonth={toDate(FIRST_DAY)}` and `endMonth={toDate(today)}`, so the month arrows stop at both ends. The calendar's own `today`, which it highlights, is the same date, so a visitor west of the site doesn't see one day highlighted and another as the last pickable. `lastPickable` and its comment go: the viewer's clock no longer matters.

*Alternative:* `siteToday()` inside the component. It reads the clock during render, which can disagree with the server's render around midnight; the prop is the value the page's presets already use.

### Two months from 640 px, read when the picker opens

`numberOfMonths` is 2 when `matchMedia("(min-width: 640px)")` matches, otherwise 1, read in the open handler and kept in state. The popover's content only renders while open, so the server and first client render never depend on it, and there is no listener: resizing with the picker open is rare, and reopening picks the new count. Where `matchMedia` is missing (jsdom), one month.

CSS can't do this: the calendar's months already stack below `md`, and hiding one of two months with CSS leaves either October 2021 or the current month out of reach, because `endMonth` stops the right-hand month and `startMonth` the left-hand one.

### Opening on the end month

`defaultMonth` is the range's end month, or today's when the range ends later, minus `numberOfMonths - 1` months. react-day-picker clamps the opening month into `startMonth`..`endMonth` for the number of months shown, which puts October 2021 first for ranges ending there. The clamp is checked by a test rather than trusted.

### Days after today keep the range fill

On a preset that runs past today (This year, True-up year), the days after today keep the range's fill with muted dates, so the range reads as running to its end; the calendar's default fades the whole disabled cell, fill included, so the range looked as if it stopped at today. `RangeControls` passes `classNames.disabled` that keeps `opacity-50` for disabled days outside the range and, for a selected disabled day, drops the fade and mutes its date. Days before 2021-10-10 and after today outside the range still fade as before.

*Alternative:* the default fade. Chosen against on the mockup.

The class lifts the fade from both the day's cell and its button, because shadcn's `Button` fades a disabled button on its own; the dates are muted to 70% to match the mockup's grey.

### The picker's selection is controlled

The calendar takes `onSelect` in place of `onDayClick`. react-day-picker treats `selected` as controlled only when `onSelect` is given; with `onDayClick` alone it kept its own range, so the first pick on October's range drew October 1 to 10 instead of the picked day alone. Found on the branch container; the bug predates this change, which made it visible by saying "Pick an end day".

### The hint

A polite live region under the calendar, so a screen reader announces the change, reading "Pick a start day" while `first` is null and "Pick an end day" after it. `first` already exists for the two-click pick.

## Risks / Trade-offs

- [1024 px leaves about 23 px spare on Impact (937 of 960)] → a test can't measure it; the branch container check measures the row at 1024 px on every preset, and a longer preset label later would need the same check.
- [The `disabled` override reaches into shadcn's day styling, whose range classes sit on the day's button] → a test pins the class on a disabled day inside the range and on one outside it; the branch container check looks at This year's November.
- [`today` goes stale if a page stays open past midnight] → the presets built from the same `today` are just as stale, and a navigation renders a new one.
- [An icon-only button is less discoverable than dates] → the tooltip and the selected look on a custom range; the phone's menu still says "Custom".

## Mockups

On the canvas https://claude.ai/artifact/TcFYt9Kmb4zozATD13UCMY, approved 2026-11-11: the Impact header now and with the icon at 1280 and 1024 px, the icon's two states with its tooltip, the picker's two months on a past range, after the first pick and on This year, and the phone with one month. Of the two ways to show days after today inside This year, "the range fill kept" was chosen.

## Results

On a branch container on onyx reading production read-only, 2026-11-11, measured with Playwright:

- At 1280 and 1024 px, Impact, Solar and True-Up keep the heading and controls on one row on every preset, and the first card stays put when a preset brings the readings switch. At 900 px Impact wraps on This year and All time, as accepted.
- The picker opens on September and October 2026 for October's range, October and November 2026 for This year, and November 2026 alone at 390 px, beside the presets menu.
- On This year the days after November 11 keep the range fill with muted dates; on All time, which ends today, they fade.
- Picking October 10 shows it alone with "Pick an end day"; picking October 20 then goes to `start=2026-10-10&end=2026-10-20`.
- The icon's name reads "Choose dates, Oct 10, 2021 – Nov 11, 2026" on All time.
- No CSP violation or page error.

## Migration Plan

Nothing stored or routed changes. Release with a `v*` tag as usual; rollback is the previous tag.
