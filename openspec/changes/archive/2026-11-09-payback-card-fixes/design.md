## Context

`components/true-up/payback-card.tsx` draws the desktop track and each marker separately: the track's top is 54px (centre 56px), while each marker stacks label, stem and a 14px dot whose centre lands at 51px on both label rows. The track is solar-coloured up to today and plain after it. The phone list (`sm:hidden`) is dots and text only. `TrueUpPage` renders the card last.

## Goals / Non-Goals

**Goals:** match mockup B and PhoneB on the points the owner raised and the dashed projection; move the card.

**Non-Goals:** mockup B's other differences (stems with no dot for PTO, Today and the warranty, the legend chip beside the Powerwalls' line, the 2021 to 2031 tick labels): the owner reviewed the shipped card and raised none of them. No change to what the card says.

## Decisions

- **Dots on the line by one shared constant.** The track's vertical centre and the dot's centre both come from one `LINE` offset, so they can't drift apart again; the stem length stays per row. Simpler than measuring at runtime, and testable: the test reads the track's and each dot's computed top and height from their inline styles.
- **Ring as a `box-shadow` in the card colour** (`shadow-[0_0_0_3px_var(--card)]` or the token the design system has), as mockup B does, rather than a border that would change the dot's size.
- **Dashed projection as its own segment**, from today to the whole-system marker, drawn with a `repeating-linear-gradient` of the solar token over the grey track, as mockup B draws it. Only when the whole-system year is projected and after today; when it is already paid, there is nothing to dash.
- **Phone rail per step**, as PhoneB: each step's dot column carries a 3px line that fills to the next step, solar-coloured for steps up to today and grey after, none on the last step. Today becomes a hollow grey ring like the projected whole-system dot.
- **Placement** after `SavingsCard` in `TrueUpPage`; since the savings card renders only for a single year, the card naturally follows the metering note otherwise. No new condition needed.

## Risks / Trade-offs

- [jsdom has no layout, so a test can't measure real centring] → assert the inline top/height values agree, and check the rendered page at 1280 and 375 pixels before committing.
- [The card moves above the chart, pushing the cycle chart and list down on single-year views] → the owner chose this placement (option A).

## Migration Plan

Release as usual; the card's data and the costs file are untouched, so rollback is the previous image.

## Rollout

Released as v2026.11.09.4 on 2026-11-09; the Deploy workflow and its health check passed.

- At desktop width (1680 pixels, as the browser window wouldn't shrink to 1280) on teslasolar.report, each of the four dots' centres measured 0 pixels from the line's, and the line is dashed from today to 2028. On This year the card follows the savings card; on All time it follows the tiles; both before the chart. No console errors, no sideways scrolling.
- At 375 pixels (headless Chromium) the rail joins 2021 to 2031, in solar's colour through 2025 to today and grey after, with today a hollow ring and the card after the savings card.
