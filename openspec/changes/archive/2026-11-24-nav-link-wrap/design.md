# Design

## Context

The top bar is one wrapping flex row: brand, the links' nav (`flex-1 flex-nowrap`), then the live status. The nav keeps its links on one row, but each link may still break its name, so when room runs short the browser shrinks the nav by wrapping "True-Up" and "Top Ten" before it moves the live status down. The SOLAR and HOME readings show from 1440 pixels (`max-[1440px]:hidden`).

Measured on the live site at 1920 pixels: 32-pixel side padding, 24-pixel gaps, the brand 177 pixels, the seven links 535 pixels unwrapped, and the live status 641 pixels with STORM WATCH and both readings. That totals about 1,464 pixels. At 768 the brand and links need about 798 pixels.

## Goals / Non-Goals

**Goals:** no link name breaks at any width from 640 up.

**Non-Goals:** keeping the bar on one row at 1440 during a storm watch or outage; changing the pill's contents.

## Decisions

- **Keep each link's name on one line (`whitespace-nowrap` on the nav links).** The nav's smallest width becomes the links' full width, so the bar's existing wrap moves the live status, and below about 800 pixels the links too, to the next row, as the spec already allows. Alternative: hide the readings below 1536. Rejected by choice: the 1440 laptop keeps SOLAR and HOME, and a two-row bar only appears while an extra pill shows.
- **Leave the 1440 breakpoint as it is.** Without an extra pill the bar fits at 1440 (about 1,350 pixels).

## Risks / Trade-offs

- [The bar is two rows at 1440 during a storm watch or outage, and the page content sits about 50 pixels lower] → It happens only while the extra pill shows, and the 1024 layout already looks like this.
- [jsdom lays nothing out, so a unit test can only pin the class] → A rendered check at 768, 1024, 1440 (with and without an extra pill) and 1536 confirms the layout.
