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

### Requirement: Energy in kWh or MWh
Every page SHALL read an energy figure of 1,000 kWh or more in MWh, to one decimal place with thousands separators, and a figure below 1,000 kWh in kWh at the precision its place gives it. The rule SHALL hold wherever the figure shows: in a figure, a sentence, a tooltip and a screen reader's label. True-Up's billing cycle rows SHALL stay in kWh, as PG&E's bill prints them, so each row can be checked against the bill. True-Up's net tile's imported and exported SHALL take the net's unit.

#### Scenario: A billing cycle past 1,000 kWh
- **WHEN** a billing cycle nets 1,125.1 kWh imported
- **THEN** its row reads 1,125.1 imported and PG&E net 1,125 kWh, as the bill does

#### Scenario: Below 1,000 kWh
- **WHEN** a range's solar total is 999.9 kWh
- **THEN** its figure reads 999.9 kWh

#### Scenario: From 1,000 kWh
- **WHEN** a figure is 1,000 kWh
- **THEN** it reads 1.0 MWh

#### Scenario: The same total on two pages
- **WHEN** solar's all-time total is 75,660 kWh
- **THEN** Home's Since 2021 and Impact's Solar Offset both read it as 75.7 MWh

#### Scenario: A large total in a sentence
- **WHEN** the Solar page shows All time with 75,660 kWh of solar
- **THEN** its lead sentence reads "Solar has generated 75.7 MWh" with the figure in mono

### Requirement: One unit to an axis or a list
A chart's energy axis SHALL read every tick in MWh when its top tick is 1,000 kWh or more, and in kWh otherwise. A list of energy figures (a ranking, rows by year, or the two ends of a range) SHALL read every figure in the unit its largest takes. One axis or list SHALL never mix the two.

#### Scenario: An axis past 1,000 kWh
- **WHEN** Since 2021's axis runs from 0 to 80,000 kWh in steps of 20,000
- **THEN** its ticks read 0, 20, 40, 60 and 80 with MWh on the top tick

#### Scenario: An axis under 1,000 kWh
- **WHEN** the Solar range chart's axis for a month of days tops out at 60 kWh
- **THEN** its ticks stay in kWh

#### Scenario: A ranking that crosses 1,000 kWh
- **WHEN** Top Ten's months sent to PG&E rank 1,204.3 kWh first and 987.6 kWh second
- **THEN** the list reads 1.2 MWh and 1.0 MWh, both in MWh

#### Scenario: Rows by year
- **WHEN** Patterns' Powerwall rows read 412 kWh out in 2021 and 3,030 kWh in 2025
- **THEN** the rows read 0.4 MWh and 3.0 MWh

### Requirement: One unit to a power axis
A chart's power axis SHALL read every tick in kW when its top tick is 1,000 W or more, and in W otherwise, with the unit on the top tick only. One axis SHALL never mix the two.

#### Scenario: An axis topped at 1 kW
- **WHEN** Patterns' "The last 12 months" axis runs from 0 to 1,000 W
- **THEN** its ticks read 1 kW, 0.5 and 0

#### Scenario: An axis topped at 1.5 kW
- **WHEN** the axis runs from 0 to 1,500 W
- **THEN** its ticks read 1.5 kW, 0.75 and 0

### Requirement: The net tile's pair in the net's unit
The imported and exported totals under True-Up's net tile SHALL read in the unit the net takes, so the pair never mixes kWh and MWh. The tile's peak and off-peak nets SHALL each keep their own unit, so a small peak net never reads 0.0 MWh.

#### Scenario: Imports past 1,000 kWh under a kWh net
- **WHEN** True-Up's net tile reads 725.2 kWh imported, from 1,174.0 kWh imported and 448.8 kWh exported
- **THEN** it reads Imported 1,174.0 kWh · Exported 448.8 kWh

#### Scenario: A small peak net under an MWh net
- **WHEN** the net tile reads 2.4 MWh imported, with 413.4 kWh imported in peak hours and 2,030.1 kWh off-peak
- **THEN** it reads Peak 413.4 kWh imported · Off-peak 2.0 MWh imported
