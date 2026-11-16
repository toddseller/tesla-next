# display-units Specification

## Purpose
Picks the units each viewer reads temperatures and wind speeds in, from the region their browser names, so visitors from elsewhere see the units they use.

## Requirements

### Requirement: Units from the browser's region
Each page SHALL take the viewer's region from the first language in the request's `Accept-Language` that names a region, and pick temperature and wind units separately from it. Temperatures SHALL be in °F for US, PR, GU, VI, AS, MP, LR, BS, BZ, KY, PW, FM and MH, and in °C elsewhere. Wind SHALL be in mph for US, PR, GU, VI, AS, MP, GB and LR, and in km/h elsewhere.

#### Scenario: A US browser
- **WHEN** the request's `Accept-Language` is `en-US,en;q=0.9`
- **THEN** the page shows °F and mph

#### Scenario: A German browser
- **WHEN** the request's `Accept-Language` is `de-DE,de;q=0.9,en;q=0.8`
- **THEN** the page shows °C and km/h

#### Scenario: A British browser
- **WHEN** the request's `Accept-Language` is `en-GB`
- **THEN** the page shows °C and mph

#### Scenario: The region on a later language
- **WHEN** the request's `Accept-Language` is `fr,fr-FR;q=0.8,en-US;q=0.5`
- **THEN** the page shows °C and km/h, from FR

### Requirement: US units without a region
A request whose `Accept-Language` names no region, or that has none, SHALL get °F and mph.

#### Scenario: A plain language
- **WHEN** the request's `Accept-Language` is `en`
- **THEN** the page shows °F and mph

#### Scenario: No header
- **WHEN** the request has no `Accept-Language`
- **THEN** the page shows °F and mph

#### Scenario: An unreadable header
- **WHEN** the request's `Accept-Language` is `*`
- **THEN** the page shows °F and mph

### Requirement: The same units as served
The page SHALL keep the units it was served with after it loads and while it updates, without switching on the viewer's device settings.

#### Scenario: A reload of the forecast card
- **WHEN** a page served in °C reloads its forecast card
- **THEN** the card's temperatures stay in °C
