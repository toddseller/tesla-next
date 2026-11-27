## ADDED Requirements

### Requirement: Now says the weather outside
Under the live sentence, in the muted color, the Now chapter SHALL say the live temperature and condition, then the next sunset or sunrise: "Outside it's 62°F and cloudy; sunset at 4:54 PM." Wider than a phone, it SHALL add the gusts after the condition when they reach 40 km/h. It SHALL be left out without a recent reading or temperature, or while the live status is stale, and change with each live status.

#### Scenario: A cloudy morning
- **WHEN** at 10:19 AM the live data carries 16.7 °C and an overcast code, for a US viewer
- **THEN** the sentence reads "Outside it's 62°F and cloudy; sunset at 4:54 PM."

#### Scenario: After sunset
- **WHEN** at 9:40 PM the live reading is 12.2 °C and clear
- **THEN** the sentence reads "Outside it's 54°F and clear; sunrise at 7:04 AM.", giving the next morning's sunrise

#### Scenario: A windy afternoon on a laptop
- **WHEN** a 1024-pixel-wide window shows a reading of 13.4 °C, overcast, with gusts of 86 km/h, before sunset
- **THEN** the sentence reads "Outside it's 56°F and cloudy, gusts to 53 mph; sunset at 5:37 PM."

#### Scenario: The same wind on a phone
- **WHEN** a 390-pixel-wide screen shows that reading
- **THEN** the sentence leaves the gusts out and stays on one line

#### Scenario: No recent reading
- **WHEN** the live data carries no temperature
- **THEN** Now shows only its live sentence

#### Scenario: A stale status
- **WHEN** the latest live status is 5 minutes old and carries a temperature
- **THEN** Now shows "No live update since" its time, and no weather sentence

### Requirement: The weather sentence keeps the first screen
Below 768 pixels the weather sentence SHALL NOT move the Today chapter lower than it sits without it: Now's gaps, and the space above Today, tighten by the sentence's height.

#### Scenario: Opening on a phone with the weather
- **WHEN** a visitor opens `/` on a 390 by 844 screen while the live data carries a temperature, and again with the same live sentence and no weather sentence
- **THEN** today's solar so far starts no more than 2 pixels lower with the weather sentence than without it
