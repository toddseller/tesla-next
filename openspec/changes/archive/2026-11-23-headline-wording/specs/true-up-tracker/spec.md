## MODIFIED Requirements

### Requirement: A past year's headline
For a finished year whose amount due is known, and the year before's too, the headline SHALL give the amount in whole dollars against the year before's: "'25 - '26 ended owing $768 at the true-up, $213 more than '24 - '25." It SHALL read "less than" for a smaller amount and "the same as" for an equal one, "ended with nothing due" when nothing was due, and "after nothing due in <year before>" when only the year before owed nothing. Without both amounts there SHALL be no headline.

#### Scenario: '25 - '26
- **WHEN** '25 - '26 is shown, owing $767.73, and '24 - '25 owed $554.83
- **THEN** the headline reads "'25 - '26 ended owing $768 at the true-up, $213 more than '24 - '25."

#### Scenario: Less than the year before
- **WHEN** '26 - '27 is shown owing $500.00, and '25 - '26 owed $767.73
- **THEN** the headline reads "'26 - '27 ended owing $500 at the true-up, $268 less than '25 - '26."

#### Scenario: Nothing due
- **WHEN** '26 - '27 is shown with nothing due, and '25 - '26 owed $767.73
- **THEN** the headline reads "'26 - '27 ended with nothing due at the true-up, $768 less than '25 - '26."

#### Scenario: The year before unknown
- **WHEN** '23 - '24 is shown, and '22 - '23's amount isn't known
- **THEN** the page has no headline

#### Scenario: After a year with nothing due
- **WHEN** '24 - '25 is shown, owing $554.83, and '23 - '24 owed nothing
- **THEN** the headline reads "'24 - '25 ended owing $555 at the true-up, after nothing due in '23 - '24."
