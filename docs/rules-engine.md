# Rules Engine

The GridFit rules engine evaluates whether a proposed business load can be supported by a mini-grid site. It combines site capacity, business demand, equipment startup requirements, solar availability and battery behaviour to produce a feasibility outcome.

The engine uses deterministic rules and energy simulation. It does not use an AI or machine-learning prediction model.

## Assessment inputs

An assessment uses the following information:

| Input | Description |
|---|---|
| Site baseline demand | The site's existing hourly electricity demand in kW. |
| Solar profile | The selected average or low-sun hourly solar generation profile. |
| Inverter ratings | Continuous power and surge power limits, including surge duration where available. |
| Battery configuration | Nominal capacity, minimum and maximum state of charge, charge and discharge efficiencies, and power limits. |
| Business demand | Each business's hourly average and peak demand profiles. |
| Startup requirements | Equipment startup power and startup duration, where provided. |
| Operating hours | The business's configured operating schedule. |
| Initial stored energy | The battery energy at the beginning of the assessment. |
| Assessment period | The number of days simulated. |
| Tariff | The site's configured electricity tariff, used for the revenue estimate. |

### Business profile readiness

The scenario service builds business profiles from meter readings. It checks the observed reading days against the site's configured `min_observed_days` setting.

A business that does not meet this minimum is excluded from assessment, and the scenario request is rejected with a validation error. The service also prevents the same business from being included more than once in a scenario.

The profile builder calculates hourly average and peak demand from readings, using the business operating schedule and site timezone.

## Assessment process

The evaluator runs four checks in a fixed order:

1. Power
2. Startup
3. Energy
4. Battery

It also runs two simulations for the selected assessment period:

- **Without the proposed businesses:** the existing site baseline demand.
- **With the proposed businesses:** the baseline demand plus the businesses' hourly average demand.

The difference between these simulations helps identify additional unserved energy caused by the proposed load.

## The four checks

### 1. Power check

The power check evaluates the combined hourly peak demand against the inverter's continuous power rating.

It combines the site's baseline demand with the peak demand of the proposed businesses, hour by hour, and identifies the hour with the highest combined peak.

- **Pass:** The combined peak does not exceed the inverter's continuous rating.
- **Fail:** The combined peak exceeds the continuous rating.
- **Unknown:** The continuous inverter rating is missing.

A passing result can still be marked `within_margin` when the peak is close to the inverter limit. The configured safety margin determines this threshold.

### 2. Startup check

The startup check evaluates whether business equipment can start while the site and other businesses are already drawing power.

For each business, the engine adds its startup power requirement to the background running load during its operating hours. It then compares the resulting surge against the inverter's surge rating.

Where both startup duration and inverter surge duration are available, the engine also checks whether the business startup duration exceeds the inverter's supported surge duration.

- **Pass:** The startup demand is within the available surge limits.
- **Fail:** The startup surge exceeds the inverter rating, or the startup duration exceeds the supported surge duration.
- **Unknown:** Required startup power or the inverter surge rating is missing.

If the inverter surge-duration limit is not configured, the duration comparison is not performed. The result explains this limitation.

A passing startup result may be marked `within_margin` when the surge approaches the configured safety threshold.

### 3. Energy check

The energy check compares the site's solar generation with the combined hourly demand.

It calculates:

- Hourly energy surplus when solar generation exceeds demand.
- Hourly energy deficit when demand exceeds solar generation.
- Deliverable surplus energy after accounting for battery charge and discharge efficiency.
- The energy required to cover demand during deficit hours.

The engine calculates round-trip efficiency by multiplying charge efficiency by discharge efficiency.

- **Pass:** Available deliverable solar energy can cover the calculated deficit.
- **Fail:** The calculated deficit is greater than the deliverable surplus energy.

A passing result may be marked `within_margin` when the available energy is close to the required amount.

The energy check is based on the selected solar profile and the configured efficiency values. It is not a guarantee of future generation or consumption.

### 4. Battery check

The battery check compares the simulation with proposed businesses against the baseline-only simulation.

It evaluates additional unserved energy caused by the proposed businesses, the lowest stored battery energy reached, and the configured battery reserve.

The additional unserved energy is the difference between total unserved energy with the proposed businesses and total unserved energy without them. Negative differences are treated as zero.

- **Fail:** Additional unserved energy exceeds the configured unserved-energy tolerance for the assessment period.
- **Pass:** Additional unserved energy remains within the configured tolerance.

A passing result may be marked `within_margin` if the lowest stored energy falls below the configured reserve level.

The reserve threshold is used to identify a constrained or near-reserve condition. It is not, by itself, the hard failure condition in this check.

## How the outcome is determined

Each check returns a status:

| Status | Meaning |
|---|---|
| `pass` | The check meets its configured rule. |
| `fail` | The check violates its rule. |
| `unknown` | The engine does not have enough required information to complete the check. |

The evaluator combines the four check statuses into one outcome:

| Condition | Internal outcome |
|---|---|
| At least one check fails | `not_feasible` |
| No failures, but at least one check is unknown | `conditionally_feasible` |
| No failures or unknowns, but at least one passing check is within its safety margin | `conditionally_feasible` |
| All checks pass without a within-margin condition | `feasible` |

The application may present these outcomes using YES, MAYBE and NO terminology. The internal evaluator values are `feasible`, `conditionally_feasible` and `not_feasible`.

## Limiting check

The evaluator identifies the check that most constrains the result.

When one or more checks fail, it selects the failing check with the smallest margin. If no check fails, it considers passing checks that have a numerical margin and selects the smallest one.

If there is no suitable check to identify, the limiting check is left empty.

## Data quality labels

GridFit tracks the quality of the data used in an assessment.

The evaluator recognises these labels:

| Label | Relative data quality rank |
|---|---:|
| `observed` | 1 |
| `user_entered` | 2 |
| `estimated` | 3 |
| `simulated` | 4 |

The overall assessment label is the weakest label among the site baseline, solar and battery data, business profile data and any supplied startup data labels.

This means an assessment using a mixture of observed and estimated inputs is identified by its weakest input label rather than being presented as entirely observed.

## Simulation behaviour

The simulation models battery charging and discharging over the assessment period.

For each hour:

- When solar generation exceeds demand, the surplus can charge the battery, subject to the maximum charge power and available battery capacity.
- When demand exceeds solar generation, the battery can discharge, subject to the maximum discharge power and available stored energy.
- Energy that cannot be stored is recorded as curtailed energy.
- Demand that cannot be supplied is recorded as unserved energy.

The simulation tracks stored energy, unserved energy and curtailed energy for each hour.

The configured minimum and maximum state-of-charge values determine the usable battery range. Charge and discharge efficiencies are applied when calculating changes in stored energy.

The engine repeats the selected 24-hour solar and demand profiles for each day of the assessment period. It therefore represents a repeated profile scenario, not a forecast of changing weather or demand from day to day.

## Assessment metrics

The evaluator returns additional metrics to support interpretation:

| Metric | Description |
|---|---|
| Extra unserved energy | Additional unserved energy associated with the proposed businesses. |
| Shortfall hours | Hours in which unserved energy is higher with the proposed load than in the baseline simulation. |
| Surplus absorbed | Reduction in curtailed energy after adding the proposed businesses. |
| Utilisation before | Calculated solar utilisation before adding the proposed load. |
| Utilisation after | Calculated solar utilisation after adding the proposed load. |
| Monthly energy | Estimated energy used as the basis for the revenue calculation. |
| Planned monthly energy | Monthly energy calculated from the business demand profiles. |
| Lowest stored energy | Lowest battery energy reached during the simulation. |

### Revenue basis

The engine calculates planned monthly energy from each business's daily energy profile and configured operating days per month.

If additional unserved energy occurs, the engine adjusts the planned energy using an estimated delivered share. The revenue calculation then uses this delivered-energy estimate and the site's tariff.

The result records whether revenue is based on `planned` or `delivered` energy. It is an assessment estimate, not a guarantee of actual revenue.

## Comparing sites

GridFit supports comparing selected sites using the same set of proposed businesses.

The scenario service:

1. Retrieves the latest available site profile for each selected site.
2. Determines the initial stored battery energy for each profile using the requested state-of-charge percentage, or the midpoint of the configured state-of-charge range when no percentage is supplied.
3. Loads the selected businesses and their observed profiles.
4. Runs an independent assessment for each site.
5. Saves the resulting scenarios.
6. Returns the scenarios in ranked order.

A site comparison is therefore a set of separate assessments, each using that site's profile and battery configuration.

### Ranking order

Scenarios are ranked using the following priorities:

1. Feasibility outcome: `feasible` ranks ahead of `conditionally_feasible`, which ranks ahead of `not_feasible`.
2. Monthly revenue: higher values rank ahead of lower values within the same outcome.
3. Lowest stored battery energy: higher values rank ahead of lower values when the previous criteria are equal.

This ranking supports comparison; it does not replace an operator's technical or commercial review.

## Scenario records and traceability

When a scenario is created, GridFit stores the assessment outcome, check results, limiting check, revenue estimate, revenue basis, lowest stored energy, data quality label and calculated metrics.

The scenario also stores a snapshot of its input site profile and business data, together with the profile version and simulation trace.

The simulation trace records hourly stored energy, unserved energy and curtailed energy for the simulations with and without the proposed businesses.

This allows the saved result to retain the inputs and calculations used at the time of assessment.

## Rule settings

The engine uses configurable settings, including:

| Setting | Purpose |
|---|---|
| `safety_margin` | Defines when a passing check is considered close to its limit. |
| `reserve_factor` | Helps determine the battery reserve threshold used by the battery check. |
| `unserved_energy_tolerance_kwh` | Sets the tolerated additional unserved energy per day, scaled by the assessment period. |
| `min_observed_days` | Sets the minimum observed reading days required for a business profile. |
| `night_start_hour` and `night_end_hour` | Define the configured night period used by related assessment logic. |

The actual values are supplied through the site's rule settings. The evaluator also uses technical values from the site profile, such as inverter ratings, battery capacity, state-of-charge limits and efficiency.

## Worked example

Consider a proposed business whose demand is added to an existing mini-grid site.

1. GridFit retrieves the site's selected profile and checks that the business has enough observed reading days.
2. The engine prepares the business's hourly average and peak demand profiles.
3. The power check compares combined peak demand with the inverter's continuous rating.
4. The startup check evaluates equipment startup demand against the inverter's surge capability.
5. The energy check compares hourly demand with the selected solar profile and deliverable surplus energy.
6. The battery check compares the baseline simulation with the simulation that includes the proposed business.
7. The evaluator combines the four statuses, identifies a limiting check where possible and calculates the assessment metrics.
8. The scenario service saves the result together with its input snapshot and simulation trace.

The final outcome depends on the actual site profile, business readings, equipment requirements, configured settings and selected solar day type. No universal YES, MAYBE or NO result can be assigned without those inputs.
