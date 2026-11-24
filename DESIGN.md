---
name: Tesla Solar Report
description: One home's solar and Powerwalls, read like an instrument panel in the dark.
colors:
  night-sky: "#0E1116"
  slate-card: "#151A21"
  raised-slate: "#1A1F27"
  hairline: "#232831"
  control-edge: "#2B313B"
  moonlight: "#E6E8EB"
  dusk-gray: "#9AA3AD"
  tesla-red: "#E82127"
  alert-coral: "#F87171"
  solar: "#F7B500"
  home: "#3E6AE1"
  powerwall: "#31B76B"
  grid: "#8E8E93"
  vehicle: "#E8474F"
typography:
  chapter-word:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "112px"
    fontWeight: 600
    lineHeight: 0.9
    letterSpacing: "-0.04em"
  chapter-word-phone:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "64px"
    fontWeight: 600
    lineHeight: 0.9
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
  figure:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1
  lede:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
  section-label:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    letterSpacing: "0.06em"
  body:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.43
  reading:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 400
  label:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
  axis:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
rounded:
  swatch: "2px"
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  page-x-phone: "16px"
  page-x: "32px"
components:
  card:
    backgroundColor: "{colors.slate-card}"
    textColor: "{colors.moonlight}"
    rounded: "{rounded.lg}"
    padding: "16px"
  card-wide:
    backgroundColor: "{colors.slate-card}"
    rounded: "{rounded.lg}"
    padding: "24px"
  segmented-group:
    backgroundColor: "{colors.slate-card}"
    rounded: "{rounded.lg}"
    padding: "3px"
  segment:
    textColor: "{colors.dusk-gray}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "40px"
  segment-selected:
    backgroundColor: "{colors.raised-slate}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "40px"
  nav-link:
    textColor: "{colors.dusk-gray}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "44px"
  nav-link-current:
    backgroundColor: "{colors.raised-slate}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "44px"
  button-save:
    backgroundColor: "{colors.moonlight}"
    textColor: "{colors.night-sky}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-outline:
    textColor: "{colors.moonlight}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  input:
    textColor: "{colors.moonlight}"
    typography: "{typography.reading}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "36px"
  status-pill:
    textColor: "{colors.moonlight}"
    typography: "{typography.reading}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
---

# Design System: Tesla Solar Report

## Overview

**Creative North Star: "The Instrument Panel"**

The site is a panel of readouts for one home's energy system. It sits beside the Tesla app in spirit: the same five flow colors, Tesla red as the single accent, a dark field that lets live figures glow. Every surface is a gauge or a log; nothing is there to sell.

Density is moderate and technical. Figures are set in IBM Plex Mono so digits line up and changing values don't jitter; labels, headings and prose are IBM Plex Sans. Structure comes from hairline borders and two tonal steps above the page, not from decoration. Color is reserved for meaning: a flow's color always names that flow, and red marks the current selection, an outage, or a mark that must be found at once.

There is one theme, dark, because the Distribution house scene is dark and every page matches it. The scene keeps its own styling; this system frames it.

**Key Characteristics:**
- One dark theme; no light mode.
- Mono figures, sans everything else.
- Five fixed flow colors, the Tesla app's, used identically on every page.
- Tesla red as a marker, never as a surface or as body text.
- Flat bordered cards on a darker page.
- Controls stay quiet so the figures lead.

## Colors

A cool near-black field with two slate steps above it, light gray text, and color spent only on energy flows and the red marker.

### Primary
- **Tesla Red** (#E82127): the selection underline on the current tab and segment (a 2px inset line along the bottom), the outage dot and pill border, chart markers. Below 4.5:1 on the dark field.

### Neutral
- **Night Sky** (#0E1116): the page background behind everything.
- **Slate Card** (#151A21): cards, popovers, segmented control trays.
- **Raised Slate** (#1A1F27): the selected segment, the current nav tab, hover fills in menus.
- **Hairline** (#232831): every border and divider at rest.
- **Control Edge** (#2B313B): borders of interactive things (segmented trays, inputs, pills, the menu button); inputs fill with it at 30%.
- **Moonlight** (#E6E8EB): body and figure text; also the light Save button's fill.
- **Dusk Gray** (#9AA3AD): secondary text, section labels, unselected tabs, focus ring color (at 50%).
- **Alert Coral** (#F87171): invalid fields and destructive states.

### Flow colors
Tesla app colors, each bound to one flow on every page, every chart and legend swatch:
- **Solar** (#F7B500), also the storm-watch pill.
- **Home** (#3E6AE1). The Patterns page's house-use heat scale runs seven steps from #213C86 for the least use to #D4E1FA for the most, with Home as the third, so the scale reads as the house. Heavier use is lighter, as brighter means more on Home's year chart, so the busiest hours stand out on the dark card.
- **Powerwall** (#31B76B), also the live dot.
- **Grid** (#8E8E93).
- **Vehicle** (#E8474F).

### Named Rules
**The One Flow, One Color Rule.** A flow's color means that flow and nothing else. Never reuse Solar yellow for a warning or Powerwall green for "success" outside a flow, the live dot excepted.

**The Red Marker Rule.** Tesla Red is for marks, indicators and text of 24px or more. Body text, button labels and fills behind text use Moonlight or white instead; that is why Save is light, not red.

## Typography

**Display Font:** none, except the home page's chapter words; everywhere else the largest type is a figure.
**Body Font:** IBM Plex Sans (with ui-sans-serif, system-ui), weights 400, 500, 600.
**Label/Mono Font:** IBM Plex Mono (with ui-monospace), weights 400, 500.

**Character:** Plex is an engineered family, which suits a panel: the sans is plain and legible, the mono gives readouts the look of a meter.

### Hierarchy
- **Chapter word** (600, 112px desktop, 64px phone, -0.04em): the home page's one-word chapter headings (Now, Today, the year, Records, Habits, Since 2021), so the story's chapters tell apart at a glance. Home page only.
- **Headline** (600, 22px): the page's h1 ("Impact", "Top Ten", "Solar by date range"). Pick a day, the heading that ends the home page, is a larger 28px, the Figure size in sans.
- **Lead sentence** (500, 18 to 22px): the home page's few sentences that carry a chapter: the intro (18px, 20px from 768px), Now's sentence (20px, 22px from 768px), Since 2021's sentence (20px).
- **Figure** (Mono 600, 28px on wide screens and 20 to 26px on phones): kWh, dollars, kW, percentages.
  - **Lead figure** (34 to 56px): a page's or chapter's one leading figure: home Today's kWh 40px, Habits' 30px, Impact's ring percentages 52px, Top Ten's #1 56px, the Solar day view's 36px, whose subtitle and units beside the figures are 16px (as ported from anton-tesla-api-ws).
  - **Secondary figure** (15 to 24px): figures beside a chart or under a lead one: the home chapters' 24px figures, True-Up's savings figures and Today's three-day forecast (18px), the Payback card's years (15px).
- **Lede** (400, or 500 as a heading or readout, 15px): the supporting sentence under a home chapter's figures, a small heading inside a card ("The last 12 months"), the top bar's links, the year chapter's day readout.
- **Section label** (500, 14px, 0.06em tracking, uppercase, Dusk Gray): every card's h2 ("Solar forecast", "Always-on load", "Backup", "Payback", True-Up's tiles), admin's sections included. Only the Distribution scene and the Solar day view's ported sections keep their own.
- **Body** (400, 14px): controls, table rows, prose.
- **Reading** (Mono 400, 13px): the live status line, notes under charts, input text.
- **Label** (600, 11px): the smallest marks: Top Ten's "this year" tag and the ranks inside its timeline dots. The Solar day panel's day numbers are 11px too, in Mono 400.
- **Axis** (Mono 400, 12px): chart axes; Patterns' grids drop to 11px below 640px, where 24 hours share a phone's width. The footer and admin's field hints use the same 12px, in sans.

### Named Rules
**The Chapter Word Rule.** Oversized words head the home page's chapters and nothing else. A chapter word takes its chapter's flow color only when the chapter is about that flow (Today and the year in Solar amber, Habits in Home blue); otherwise Moonlight. "Now" is Moonlight, because it is about every flow.

**The Mono Means Measured Rule.** A number that was measured or computed is set in Plex Mono; words around it are in Plex Sans. A date in running prose stays sans.

**The MWh Rule.** Energy of 1,000 kWh or more reads in MWh to one decimal (75.7 MWh), on every page; below that it stays in kWh. An axis takes its unit from its top tick, and a list (a ranking, rows by year, a projection's two ends) from its largest figure, so neither mixes the two. True-Up's billing cycle rows stay in kWh, as PG&E's bill prints them. `energy` and `energyAxis` in `lib/units.ts` apply it.

## Layout

A single column inside a 1200px container, padded 16px on phones and 32px from 640px up, with the top bar and footer running full width on hairline borders. Pages stack cards with 16 to 24px gaps; cards pad 16px on phones and 24px from 640px. Two-up grids appear inside cards, not across the page.

Breakpoints: 640px moves the page links from a menu button onto the bar and widens padding; 1440px brings the solar and home readings into the top bar's live pill (they hide below it so the bar never wraps). Touch targets for navigation are 44px tall; segmented choices are 40px.

Spacing steps on a 4px base: 4, 8, 12, 16, 20, 24px, with 6 and 10px in tight clusters (pills, legend swatches).

## Elevation & Depth

The system is flat today: depth is two tonal steps (Night Sky page, Slate Card, Raised Slate) plus hairline borders. The only shadow belongs to things that float over the page, the popover and the page menu (a large, 45% black shadow). This is the current state, not a fixed rule; future work may add depth where it helps a reading.

### Shadow Vocabulary
- **Float** (`box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.45), 0 8px 10px -6px rgb(0 0 0 / 0.45)`): popovers, the page menu.
- **Selection line** (`box-shadow: inset 0 -2px 0 #E82127`): not depth but a marker; the current tab and segment.

## Shapes

Gently rounded rectangles throughout: cards and segmented trays at 10px, controls and tabs at 8px, small chips at 6px, legend swatches at 2px, pills and dots fully round. Borders are 1px; dashed lines mark something other than a reading: guide lines, last year's comparison, the test-mode pill and the what-if simulation.

## Components

### Buttons
Quiet and restrained: buttons appear mainly on `/admin`.
- **Shape:** 8px radius.
- **Save:** Moonlight fill, Night Sky text, 36px tall, 16px sides, 14px medium. Light rather than red under the Red Marker Rule.
- **Outline:** Control Edge border, 30% Control Edge fill, 32px tall, 13px medium; hover deepens the fill to 50%.
- **Focus:** a 3px ring of Dusk Gray at 50%. **Disabled:** 50% opacity.

### Segmented controls
The site's main control: readings (Tesla or PG&E), day views, range presets, VPP filters.
- **Tray:** Slate Card fill, Control Edge border, 10px radius, 3px inner padding, 2px between segments; full width on phones.
- **Segment:** 40px tall, 14px sides, 14px medium, Dusk Gray; hover to Moonlight.
- **Selected:** Raised Slate fill, white text, the 2px Tesla Red selection line along its bottom.

### Cards / Containers
- **Corner Style:** 10px.
- **Background:** Slate Card on Night Sky.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1px Hairline.
- **Internal Padding:** 16px, 24px from 640px; content stacked with 16 to 24px gaps, led by a section label.

### Inputs / Fields
- **Style:** 36px tall, 8px radius, Control Edge border, 30% Control Edge fill, Plex Mono 14px, placeholder in Dusk Gray at 60%.
- **Focus:** border to Dusk Gray plus the 3px ring.
- **Error:** Alert Coral border with a 3px Alert Coral ring at 20%.

### Navigation
- **Top bar:** the sun-behind-the-T icon (24px) and "Tesla Solar Report" in sans 600 with wide tracking, then the six page links, then the live status.
- **Links:** 14px, Dusk Gray, hover to Moonlight; the current page gets Raised Slate fill, white text and the selection line, which glides between tabs as a view transition.
- **Phone (below 640px):** a 44px menu button (three bars that animate) opens a popover of the same links at 15px.
- **Doorway links:** a link from a chapter or card into the page that holds more ("Every top ten", "Today, hour by hour") is a 44px outlined button, Input border on a faint Input fill, 14px medium, with a 16px arrow after its words that nudges right on hover. Bold text alone reads as a caption, never as a link.
- **Hinted terms:** a term a newcomer won't know (true-up, NEM, VPP, storm watch) keeps its sentence's type and gets a dotted underline in Dusk Gray, offset below the text. Tapping, clicking or focusing it opens a popover on the card surface, 13px, with the term's one or two sentences from `lib/terms.ts`. It never navigates, so it never looks like a doorway link. One hint per term per page, at its first appearance.

### Live status
A row in Plex Mono 13px: a Powerwall-green dot that rings once with each update (Dusk Gray when not live), the word and time, then pills. The live pill (Control Edge border, fully round) reads SOLAR, HOME and the Powerwall charge with flow-color swatches; an outage pill has a Tesla Red border and dot, a storm-watch pill is Solar-colored, a test pill is dashed.

### Motion
Charts draw in once on arrival over 450ms with `cubic-bezier(.2, .7, .2, 1)`, staggered 15ms per mark up to 200ms; changing figures count to their new value over 400ms (screen readers get the final value at once). Only transform, opacity, clip-path and SVG stroke animate. Under reduced motion everything shows in its final state at once.

## Do's and Don'ts

### Do:
- **Do** use the design tokens (`text-solar`, `bg-card`, `text-muted-foreground`), never raw hex in components.
- **Do** color every flow with its own flow color, the same on every page and chart.
- **Do** set measured figures in Plex Mono and everything else in Plex Sans.
- **Do** mark a selection with Raised Slate plus the 2px Tesla Red line at the bottom.
- **Do** build cards as Slate Card with a 1px Hairline border, 10px corners, 16/24px padding and an uppercase section label.
- **Do** keep navigation targets 44px tall and segment choices 40px.

### Don't:
- **Don't** set body text, button labels or small text in Tesla Red; it is below 4.5:1 on the dark field.
- **Don't** add a light theme.
- **Don't** reuse a flow color for an unrelated meaning.
- **Don't** restyle the Distribution house scene with this system; it keeps its own styling.
- **Don't** animate layout properties; motion stays on transform, opacity, clip-path and SVG stroke.
