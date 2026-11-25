# Design

## Context

In `components/home/year.tsx` the chapter is a grid: the chart's `figure`, then a side column holding the chart's explanation, the day card (hint, readout with previous and next buttons, "Open the day") and the year's shares. From `md` the grid has two columns and the side column is `md:sticky md:top-6 md:self-start`. Below `md` the grid is one column, so the whole side column, readout included, falls under the chart. The chart is capped at `50svh` below `sm`.

## Goals / Non-Goals

**Goals:**
- Below `md`, the explanation and the day card come before the chart; the shares stay after it.

**Non-Goals:**
- Making the readout sticky on a phone. With the chart at most half the screen and the card right above it, both fit on a 390 by 844 screen; a sticky bar would cover page content while scrolling.
- Any change at `md` and up.

## Decisions

- **Reorder with CSS, not by moving markup.** The side column gets `max-md:contents`, so below `md` its three children become items of the chapter's grid, and the explanation and the day card get `max-md:-order-1`, which puts them ahead of the `figure` while keeping their own order. From `md` the column is a normal sticky block as now. Moving the card in the DOM instead would split the side column, which the sticky layout needs as one element, or render the card twice.
- **The chart's half-height cap moves from `sm` to `md`.** It was `max-sm:max-h-[50svh]`; from 640 to 767 pixels the full-width chart (24:40) is taller than the screen, so with the readout above it a tap near the chart's foot would leave the readout off screen (on a 744 by 1133 tablet the chart would be about 1100 pixels tall). Capping it at `max-md` makes the cap and the reorder switch at the same width. Found in the review.
- **The explanation goes up with the card.** It says what the chart is ("Every day of the year, top to bottom..."), so it reads best before it, and the card's hint ("tap a day") then sits right over the chart. The shares are about the year, not the chart, and stay below.
- **Tests check the classes,** as the sticky test does: jsdom has no layout, so the test asserts `max-md:contents` on the column and `max-md:-order-1` on the explanation and the card, and the real check is the 390 by 844 look in the browser.

## Risks / Trade-offs

- [Below `md`, focus order differs from the visual order: Tab reaches the chart before the day buttons drawn above it] → The chart then the buttons that step it is still a meaningful order (WCAG 2.4.3 asks for meaning, not visual match), and it is the order the wide layout already has.
- [`display: contents` can drop an element's role for assistive technology] → The side column is a plain `div` with no role or label, so nothing is lost.
