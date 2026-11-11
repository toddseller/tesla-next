# Proposal

## Why

The True-Up Tracker shows its figures and its Payback timeline all at once. The Payback card's timeline is a story: when solar paid for itself, where today is, when the whole system is projected to, and when the Powerwalls' warranty ends. Told in order, it reads as one, rather than as four dots at once. Two mockups on the motion prototype canvas (https://claude.ai/artifact/JmyaCrFweA1QgW57o5VJA9) were approved on 2026-11-11:
- "True-Up streaming in", option B: the figures count up;
- "The Payback card's story", chosen at 6.0 s across the track, 900 ms at each mark, even travel, "Land" and "Grow, solar most". A first build at 2.4 s and 600 ms felt too fast.

They were first planned as part of streaming the page (`true-up-streaming`). After `payback-cache` the page takes about 35 ms of server work, so streaming would hide nothing noticeable and was dropped. The motion stands on its own.

On a phone, the timeline's line is solar up to today and grey after it, losing the dashed projection to the whole-system year that the desktop draws.

## What Changes

- **The figures count up when the page is first viewed.** The tiles' and the savings card's amounts (kWh, dollars, percentages) count up from zero over 400 ms, easing out.
  - Calendar years, like the Payback card's, show as they are.
  - The real figures are in the page for screen readers from the start.
  - A reload on new totals, or a new range, doesn't count again.
  - With reduced motion the figures show at once.
- **The Payback card tells its story when it scrolls into view.** On desktop the card sits below the fold, so a story started on page load was mostly over before anyone saw it. Its timeline starts as the grey track. The line then draws at an even pace that would cross the whole track in 6 s, stopping 900 ms at each mark while the mark lands:
  - solid to solar's paid-back year;
  - on to Today;
  - dashed to the whole system's year;
  - then the Powerwall warranty.

  A mark lands as its dot pops in with a slight overshoot and one soft ring, its connector draws up, and its label fades in while growing past its size and settling back; "Solar paid back" swells most. The phone tells the same story down its steps. It plays once, shows complete under reduced motion, and shows complete without JavaScript.
- **The month solar paid back.** Once "Solar paid back" has landed, its month fades in, like "Jun '25". On wider screens it goes under the label, the connector drawn up to the label shrinking down to make room; on a phone it goes beside the label. A projected payback stays a year. This loosens, on purpose, the rule that the payback route and page show years only: the month is shown by choice, knowing it narrows how closely the cost can be worked out from the published savings.
- **The phone's timeline gains the dashed projection** from Today to the whole-system year, so desktop and phone draw the same line in different directions.
- **The bars' uncover reveals smoothly.** The site's `motion-uncover` (Solar's forecast, Patterns, Impact, the savings card) has shown nothing for half its 450 ms, then the whole bar; it now uncovers across its whole time, as specified.
- **Impact's bars move to a new range.** Solar offset's bars and the Home car charging section drew in again from zero on each new range, while the self-powered ring moved to its new shares. Now Solar offset's bars grow or shrink from their old lengths, the car charging ring moves like the other, and each car's split moves its sources to their new stretches; their kWh and the energy offset roll. A car new to the range uncovers as it first shows.
- **Unchanged:** every figure, the cards' order and size, the reloads, and the chart's and savings bar's draw-ins.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-motion`: Impact's Solar offset bars, car charging ring and car splits, and their figures, move to a new range's instead of drawing in again. True-Up's amounts count up from zero on the page's first view, the one place a figure starts from zero. The Payback card's timeline tells its story, replacing the rule that the payback track never moves.
- `system-payback`: the route and the card give the month solar paid back, beside the years; the phone's timeline gains the dashed projection.

## Impact

- **Code:**
  - A small count-up figure next to `components/rolling.tsx`, using `useTween`.
  - `components/true-up/tiles.tsx` and `savings-card.tsx` (the figures).
  - `components/true-up/payback-card.tsx` (the story, the month and the phone's dashed rail).
  - `lib/true-up/payback.ts` (solar's month).
  - `CLAUDE.md` and `README.md` (the privacy rule's wording).
  - `app/motion.css` (the story's keyframes, the reduced-motion block, and `motion-uncover`'s end shape).
  - `components/impact/sections.tsx`, `car-charging.tsx` and `impact-page.tsx` (Solar offset's bars, the car charging section), and `components/solar/forecast.tsx` (its fill's `--hidden`, and the `hidden` helper they share).
  - Their tests.
- **Mockups:** the motion prototype canvas, boards "True-Up streaming in" (option B) and "The Payback card's story".
- **Data, routes and the page's loading:** unchanged.
