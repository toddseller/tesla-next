# Design

## Context

Every range change goes through `router.push` from `next/navigation`. After a push, Next.js scrolls to the top unless the call passes `{ scroll: false }`. Two navigations on these pages already pass it: the readings switch (`components/readings-switch.tsx`) and Impact's backup year (`components/impact/impact-page.tsx`). The range controls (`RangeControls`, shared by Solar, Impact and True-Up) and Solar's period bars call `router.push` with the address alone.

## Goals / Non-Goals

**Goals:**
- Range changes and period drill-ins leave the scroll position alone, the same way the readings switch already does.

**Non-Goals:**
- Scrolling the chart into view, or restoring a position of our own on Back. The browser and Next.js keep doing what they do now.
- Changing the day view's open, or its day-to-day `replace`.

## Decisions

- **Pass `{ scroll: false }` where each page calls `router.push`**, rather than in `RangeControls`. The component only calls `onRange`; the pages own the navigation, and the readings switch and backup year set the option at the call site too. Alternative: make `RangeControls` navigate by itself. That moves routing into a shared component and changes three pages' wiring for no gain.
- **Keep `push`, not `replace`.** Back to the previous range is in the spec ("Back to the year") and the new requirement keeps it.
- **No scroll-to-chart.** Staying put is the smallest change and matches what the reader expects from the readings switch beside the presets.

## Risks / Trade-offs

- [The new range's content is shorter than the old one (a monthly chart becoming daily bars, or fewer cards on Impact), so the browser can't stay at the same offset] → It clamps to the page's new bottom, which still shows the chart. Check this in the browser on a short window.
- [jsdom can't show scrolling] → The tests pin the option passed to `router.push`; the browser check on a short window confirms the page stays put.

## Results

On a branch container on onyx reading production read-only, 2026-11-11, in headless Chromium at 1280 by 700 px:

- Solar, scrolled to "Solar by date range" (y 745): This year, picked dates (October 5 to 20) and the October 2026 bar each kept y 745; Back returned to This year at y 745. The October 14 bar opened the day view at y 0. On teslasolar.report, the same This year click went from 745 to 0.
- Impact and True-Up, scrolled until the presets reach the top of the window (y 85 and 89): This year and picked dates on Impact, and '25 - '26, Earlier '22 - '23 and picked dates on True-Up, each kept the position.
- No console errors or CSP violations.

Playwright's `click()` scrolls its target into view first, so a check scrolled past a page's presets measures Playwright, not the page; the presets are scrolled to the top of the window before each click instead.
