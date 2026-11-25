## ADDED Requirements

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

## MODIFIED Requirements

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
