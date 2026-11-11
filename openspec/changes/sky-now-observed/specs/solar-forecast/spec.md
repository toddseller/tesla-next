# Spec Delta

## MODIFIED Requirements

### Requirement: The sky now
Today's sky now SHALL be the sky the Distribution scene draws from the latest reading: its cloud cover, with the airport's observed low cloud in place of the model's when the reading has it. Under 25% cover SHALL read Sunny now, under 75% Partly cloudy now, and from 75% Cloudy now. A fog code SHALL read Fog now only when that cover is 100%. Rain, snow and thunderstorm codes SHALL read as the sky's groups with "now". Between sunset and sunrise, Sunny SHALL read Clear and Partly cloudy keep its name, with moon icons.

#### Scenario: The model's few clouds under the airport's clear sky
- **WHEN** the latest reading, at 10 AM, has code 1 and 21% low cloud from the model, and the airport reports no low cloud
- **THEN** today's tile reads Sunny now with the sun icon, as the Distribution page draws a clear sky

#### Scenario: Scattered cloud at the airport
- **WHEN** the airport reports scattered low cloud, 44%, at midday
- **THEN** today's tile reads Partly cloudy now

#### Scenario: The marine layer
- **WHEN** the airport reports broken or overcast low cloud, 75% or more, at 9 AM
- **THEN** today's tile reads Cloudy now

#### Scenario: Fog now
- **WHEN** the latest reading, in daylight, is code 45 with no airport report
- **THEN** today's tile reads Fog now

#### Scenario: The model's fog under a clear airport
- **WHEN** the latest reading is code 45 and the airport reports no low cloud
- **THEN** today's tile reads Sunny now

#### Scenario: Rain now
- **WHEN** the latest reading is code 61
- **THEN** today's tile reads Rain now

#### Scenario: A clear night
- **WHEN** the latest reading at 9 PM has 5% cover
- **THEN** today's tile reads Clear now with the moon icon
