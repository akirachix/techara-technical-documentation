# Rules Engine

The GridFit backend contains a deterministic Python assessment engine in `engine/`. It evaluates a set of businesses against a selected site profile and returns check-level results plus a simulation trace.

## Inputs

A scenario references:

- A specific `SiteProfile` and therefore a profile version.
- One or more business IDs (1–20 per scenario).
- Initial stored battery energy in kWh.
- Solar-day type: `average` or `low_sun` (default is `low_sun`).
- Assessment period from 1 to 31 days.

The service prepares each business from its stored readings. It builds 24 hourly average-kW and peak-kW arrays, checks observed-day coverage, and includes operating hours, days per month and startup information. Each business must meet the site's `min_observed_days` setting.

The site profile includes inverter continuous and surge ratings, surge duration, battery capacity, minimum/maximum state of charge, charge/discharge efficiencies, maximum charge/discharge power, tariff, 24-hour baseline demand, average/low-sun solar arrays and assessment settings.

## Assessment checks

### 1. Power

The engine adds the site's baseline demand to each selected business's hourly peak demand. It finds the worst combined hour and compares that value with the inverter's continuous rating.

- Missing continuous inverter rating produces `unknown`.
- Demand above the rating produces `fail`.
- Demand below the rating passes, but is marked within margin when it exceeds the configured safety-margin boundary.

### 2. Startup

For each business with startup information, the engine estimates the worst relevant operating hour using site baseline and the average demand of the other businesses, then adds that business's startup power. It compares the result with inverter surge power and, when available, compares startup duration with the inverter's surge-duration limit.

- Missing business startup power or missing inverter surge rating can produce `unknown`.
- Exceeding surge power or duration produces `fail`.
- A passing value close to the surge limit is flagged within margin.
- If surge duration is absent, duration is not compared.

### 3. Energy

The engine compares the hourly business/site demand profile with the selected solar profile. It calculates solar surplus and deficit, then estimates energy deliverable from surplus after charge and discharge efficiency losses.

- If daily demand has no deficit outside solar production, the check passes.
- If the deficit exceeds deliverable surplus energy, the check fails.
- A passing result can still be flagged within the configured safety margin.

### 4. Battery

The simulation compares the site without the new businesses to the site with the selected businesses over the requested period. It evaluates additional unserved energy, the configured tolerance, the lowest stored energy and the reserve level.

The battery check fails when additional unserved energy exceeds the configured tolerance. Otherwise it passes and can flag when the lowest stored energy falls below the configured reserve level.

## Result aggregation

Individual checks use `pass`, `fail` or `unknown`, and include a reason, numeric details, margin information and any causing business IDs. The scenario response stores:

- `outcome`
- `limiting_check`
- `check_results`
- `metrics`
- `simulation_trace`
- `input_snapshot`
- `data_label`
- `lowest_stored_kwh`
- `monthly_revenue` and `revenue_basis` when calculated

The outcome enum values are `feasible`, `conditionally_feasible` and `not_feasible`. The engine's evaluator is the source of truth for how the check statuses are combined. A missing or unknown input should never be silently interpreted as a verified pass.

## Reasons and operator interpretation

The reason strings are generated alongside each check. They explain the binding constraint, the calculated value, the limit and (where relevant) the hour or energy deficit. `causing_business_ids` helps identify which included business loads contributed to a failing check.

An operator should review:
1. Which check is limiting.
2. Whether a check is unknown because required data is absent.
3. Whether a passing check is inside a safety margin.
4. Whether inputs are observed, user-entered, estimated or simulated.
5. Whether the profile version and scenario assumptions still reflect current site conditions.

## Comparing sites

`POST /scenarios/compare-sites` accepts 2–5 site IDs and 1–20 business IDs. It uses each site's latest profile, derives starting stored energy from the requested initial state-of-charge percentage (or the midpoint of the allowed range when omitted), and runs one scenario per site. The response is a list of scenario summaries that can be ranked by the backend.

## Tunable settings

The profile schema validates:

| Setting | Meaning / validation |
|---|---|
| `reserve_factor` | 0–1 fraction used in the battery reserve calculation |
| `safety_margin` | 0–0.5 margin used by power/startup/energy checks |
| `unserved_energy_tolerance_kwh` | Non-negative additional unserved-energy tolerance |
| `night_start_hour`, `night_end_hour` | Hour indices from 0 to 23 |
| `min_observed_days` | 1–60 observed days required for a business profile |

These values are technical assumptions, not universal engineering standards. The operator must use values appropriate to the specific site and have them reviewed by qualified personnel.

## Worked example (illustrative only)

Assume a site's continuous inverter rating is 20 kW, baseline demand at its worst hour is 8 kW, and a candidate business adds a measured peak of 9 kW in that same hour. Combined peak demand is 17 kW. With a 10% safety margin, the threshold is 18 kW, so this simplified power check passes outside the margin. If the combined peak were 19 kW, the check would fail because it exceeds the 20 kW rating? No: 19 kW remains below 20 kW, but is inside the 10% margin and therefore passes with a warning. A value greater than 20 kW fails. This example demonstrates only the continuous-power check; it is not a complete scenario result.
