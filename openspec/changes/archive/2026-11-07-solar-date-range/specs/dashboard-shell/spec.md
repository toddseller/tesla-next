# Spec Delta

## MODIFIED Requirements

### Requirement: One color per energy flow
Wherever a page shows energy by flow, each flow SHALL keep one color, the Tesla app's colors that anton-tesla-api-ws's day views use: solar amber (`#F7B500`), home blue (`#3E6AE1`), Powerwall green (`#31B76B`), grid gray (`#8E8E93`) and vehicle red (`#E8474F`). Filled areas use the same colors, translucent. The Distribution page's house scene keeps its own styling.

#### Scenario: The same flow on two pages
- **WHEN** a viewer sees solar on one page and then on another
- **THEN** it is amber on both

#### Scenario: The house on the Solar page
- **WHEN** a viewer sees house use in the range chart and home use in the day view
- **THEN** both are the same blue, `#3E6AE1`
