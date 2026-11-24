# Design

## Context

See proposal.md, Why. The Backup picker is the shared `PresetGroup` fed by `backupPresets` in `lib/backup-years.ts`; the label is the only thing that says which year "This year" means.

## Goals / Non-Goals

**Goals:** one meaning for each preset name on the Impact page.

**Non-Goals:** trimming or grouping the page's header controls (the critique's other half of this finding; this change relabels only); True-Up's own picker, whose "This year" sits on a page where every year is a true-up year.

## Decisions

- **"True-up year", not "'26 - '27".** The page's presets already call this span True-up year, so the same words mean the same span in both places. Naming the year itself on the button was the alternative, set aside for matching words. The heading still names the exact year ("Backup · '26 - '27"), and a stepped button reads its year, as before.
- **Only the label changes.** The shared picker builds the arrows' tooltip from the label, so "Back to true-up year" follows with no code of its own.

## Risks / Trade-offs

- [Two "True-up year" buttons on one page, one for the page's range and one for Backup] → they mean the same span, which is the point; each sits in its own labelled group.
