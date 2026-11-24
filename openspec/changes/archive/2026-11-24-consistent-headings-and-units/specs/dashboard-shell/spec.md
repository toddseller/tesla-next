## MODIFIED Requirements

### Requirement: The dashboard's design system
Every page SHALL use one dark design system: a near-black background (`#0E1116`), raised panels (`#151A21`) with a fine border (`#232831`), light text (`#E6E8EB`) and muted gray labels (`#9AA3AD`). Text SHALL be set in IBM Plex Sans and figures in IBM Plex Mono, both served by the site itself; a figure is any measured or computed number, kWh, kW, percentages and dollars alike. Every card's heading SHALL be a section label: Plex Sans at 14 pixels, weight 500, uppercase with 0.06em tracking, in the muted gray. Tesla red (`#E82127`) SHALL mark the current page and indicators, and SHALL NOT be used for text smaller than 24 pixels, because it falls short of 4.5:1 contrast on the background. The Distribution house scene and the Solar day view's sections keep their own styling.

#### Scenario: Fonts load from the site
- **WHEN** any page loads
- **THEN** its text is IBM Plex Sans, its figures IBM Plex Mono, and the browser makes no request to fonts.googleapis.com or fonts.gstatic.com

#### Scenario: Text is readable
- **WHEN** any text on a page is checked against its background
- **THEN** it has at least 4.5:1 contrast, or at least 3:1 when it is 24 pixels or larger

#### Scenario: One heading style across cards
- **WHEN** True-Up shows its tiles, cycle chart, billing cycles, savings and Payback cards, and Impact its Backup card
- **THEN** each card's heading is a section label like Impact's Self Powered and Solar's Solar forecast, and Backup's year still follows its middle dot

#### Scenario: Dollars in mono
- **WHEN** True-Up's savings card shows the Powerwalls' dollars, their breakdown and the what-if figure
- **THEN** each dollar figure is in IBM Plex Mono and its label in IBM Plex Sans
