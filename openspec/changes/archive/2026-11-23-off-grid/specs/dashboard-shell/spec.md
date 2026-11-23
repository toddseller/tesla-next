## ADDED Requirements

### Requirement: An address that isn't a page
An address that isn't one of the site's pages SHALL answer 404 with a page inside the site's top bar and footer, on the dark field, never the framework's default. It SHALL have the h1 "You've gone off-grid", as large as the Pick a day heading below it, then a sentence naming the address asked for, like "/nope isn't a page on the site, so nothing is flowing here.", then the home page's Pick a day control, then a link back to the home page. Its title SHALL be "Not found · Tesla Solar Report".

#### Scenario: A mistyped address
- **WHEN** a visitor opens `/nope`
- **THEN** the response is a 404, the page reads "You've gone off-grid" and "/nope isn't a page on the site, so nothing is flowing here.", with Pick a day and a link home below, inside the usual top bar and footer

#### Scenario: A light-mode browser
- **WHEN** a visitor whose system prefers light mode opens `/nope`
- **THEN** the page is on the dark field like every other page

#### Scenario: Picking a day from it
- **WHEN** the visitor picks Random day on the 404 page
- **THEN** Solar's day view for that day opens
