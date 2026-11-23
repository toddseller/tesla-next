## Context

Three readouts that make the reader infer what the site knows. Each fix replaces a drawn or implied fact with words, in the place the reader already looks.

## Decisions

- **The direction is the GRID label's third line,** the small gray note the car's label uses for its reading's age, so the label stays as wide as before. On one line, "10.4 kW · from PG&E" grows leftward from GRID's right-aligned edge into POWERWALL's label on a 295 pixel stage (the scene's overlap test caught it); as a note it only grows downward, clear of POWERWALL. The direction follows the label's own rounding: whenever the value shows above "0 kW" (0.05 kW), not the 0.1 kW at which the scene draws a flowing wire, so a value never appears without its direction.
- **Now's sentence adds export to its first clause** only when the grid is exporting at 0.05 kW or more ("Solar supplies the house and sends 1.2 kW to PG&E."). Import already reads as "the grid" supplying the house.
- **Today's difference is made minus expected by the same moment,** the forecast's own made and expected by now, each to one decimal, as the Solar page's forecast panel compares them. The day's running total, the lead figure, can be minutes newer, so subtracting it would let Home say ahead while Solar says behind. A difference that rounds to 0.0 reads "on the forecast" rather than ahead or behind by nothing.
- **The savings key follows the bar.** When the Powerwalls cost money, the bar has two parts, paid and saved, so the key names those two; solar's own saving and the Powerwalls' cost move into the line under "Saved". When the Powerwalls saved money, the bar has a solar part and a Powerwalls part, and the key keeps "Solar saved" for it.
