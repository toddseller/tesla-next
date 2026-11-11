# Proposal

## Why

Every chart on the site appears all at once and every live figure jumps. Twelve `isAnimationActive={false}` settings turned off recharts' animation, because the 5-minute reloads would replay it from zero. The owner wants subtle motion with a purpose. Motion should show what changed: a chart drawing in when you open it or pick a new range, a figure moving from its old value to its new one, and a day sliding the way you stepped. It must never replay on a reload. The rules were worked out on a prototype (https://claude.ai/artifact/JmyaCrFweA1QgW57o5VJA9) and the owner has chosen each timing.

## What Changes

- **Enter** (450 ms, ease-out, staggered 15 ms per item with a 200 ms cap). Charts draw in on first view and when the viewer changes what is shown (a range, a day, a preset). A reload of the same view never redraws.
  - Columns rise from the zero line.
  - Horizontal bars uncover from the left with clip-path, a stacked bar as one piece.
  - Impact's rings sweep round from the top.
  - Top Ten's timeline dots fade and grow in.
  - True-Up's cycle chart draws in.
- **Estimate first.** Where a chart shows an estimate next to what happened, the estimate draws first at an even pace. The actual starts when the estimate is halfway across.
  - The day view's Solar chart: the expected line takes 600 ms, and the flows draw in over 600 ms from 300 ms.
  - The forecast card's Today bar and Today by hour columns follow the same rule.
- **Day steps.** A new day's content slides 24 px the way the viewer went: 150 ms out, 250 ms in. The stepper stays still. The new day's chart then draws in, estimate first.
- **Tween** (400 ms, ease-out). A live value moves from its old figure to its new one.
  - The top bar's Powerwall charge.
  - Today's column on the range chart and the Today bar as totals arrive.
  - Total Generated on a day step.
  - Impact's ring slices and percentages on a range change.
- **Live dot.** It sends out one soft ring with each live status.
- **Still things.** The payback track and Distribution's house scene keep their motion as it is today.
- **Reduce motion.** Under the viewer's "reduce motion" setting, all of the above is off: everything shows its final state at once.
- **Guardrails.** Motion never changes layout: it uses transform, opacity and clip-path, plus SVG stroke and recharts' own reveal. The real figure is in the page from the start for screen readers. No motion library is added.

## Capabilities

### New Capabilities
- `site-motion`: how the site's charts and figures move. It covers the enter, tween, day-step and estimate-first rules, the live dot's ring, when motion never plays (reloads) and reduce motion. Each page's spec keeps what it shows; this one says how it arrives.

### Modified Capabilities
None. No page's content or behavior changes, only how it appears.

## Impact

- **Shared pieces:**
  - A small motion stylesheet with the keyframes and timings, imported by `app/globals.css`.
  - A `useTween` hook for rolling figures.
  - A first-view and change key, so charts know when to draw.
- **Solar:**
  - `components/solar/day-view.tsx`: the Solar chart's draw order and the Total Generated roll.
  - `components/solar/day-panel.tsx`: the day slide.
  - `components/solar/range-chart.tsx`: enter, and the tween of today's column.
  - `components/solar/forecast.tsx`: the Today bar and the hour columns.
- **Impact:** `components/impact/sections.tsx` (ring, section bars), `car-charging.tsx` and `backup-section.tsx`.
- **Patterns:** `components/patterns/always-on.tsx` and `powerwall-use.tsx`. The house use heat grid stays still.
- **Top Ten:** `components/top-ten/timeline.tsx`.
- **True-Up:** `components/true-up/cycle-chart.tsx` and `savings-card.tsx`.
- **Top bar:** `components/top-bar.tsx`, for the charge tween and the dot's ring.
- **Tests:** their tests.
- **Rendering and performance:** no change to server rendering, the CSP or data loading. The animations run in the browser after hydration, so first paint and LCP are unchanged. CLS must stay 0.
- **Out of scope:** page changes between top-bar tabs. That is the separate change `page-transitions`.
