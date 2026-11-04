# Overview

## Product definition

GridFit is a mini-grid business-load assessment and decision-support platform. It helps an operator evaluate whether one or more small and medium-sized enterprise (SME) loads can be supported by an existing mini-grid site under a defined site profile and operating scenario. It combines site-level generation, inverter and battery information with business operating hours and measured or otherwise labelled demand data. The backend produces a repeatable assessment, check-level explanations, metrics and a simulation trace.

GridFit is intended to make connection discussions more evidence-led. It is not a substitute for a licensed electrical engineer, a grid interconnection study or an operator's final commercial and safety approval.

## Problem addressed

Mini-grid operators need to understand both the electricity available at a site and the demand a prospective business will introduce. Business owners may not know their peak demand, daily energy use or motor-starting characteristics. A single monthly energy estimate can conceal short high-power events or evening demand. Conversely, a mini-grid may have capacity that is not being used productively.

GridFit structures information about site capacity and business demand so that an operator can compare the two consistently. The platform's value depends on the quality, recency and provenance of the input data. A result based on estimated values is not equivalent to one based on a sufficiently long period of observed readings.

## Target users

| User | Main tasks represented in the application/API |
|---|---|
| Mini-grid operator | Create and manage sites, maintain site profiles, run scenarios, compare sites, review outcomes and record decisions. |
| Field agent | Log businesses, record operating/equipment information and support meter installation workflows. |
| Technical administrator/developer | Configure the service, maintain data and deploy or test the software. |

The backend defines two user roles: `operator` and `field_agent`. Operator-only access is applied to site-profile and scenario operations. Several business and site read operations allow both roles.

## Core workflow

1. **Set up the site.** An operator creates a site and records its technical profile: inverter limits, battery characteristics, solar profile, baseline demand, tariff, operating settings and data labels.
2. **Record a business.** A field agent or operator records the business, owner contact details, operating hours, days per month and optional startup-load information.
3. **Collect load evidence.** A meter assignment associates a registered sensor device with a business. The database includes a reading model. The current backend archive does not expose a reading-ingestion API or device firmware, so end-to-end telemetry collection must not be assumed to be operational.
4. **Build the business profile.** The business service groups readings into local hourly averages and peaks and checks whether the configured minimum number of observed days has been reached.
5. **Run an assessment.** An operator runs a scenario using a site-profile version, a starting battery-energy value, a solar-day selection, a period and a set of businesses.
6. **Review and decide.** The result includes an outcome, limiting check, metrics, check results, a simulation trace and a snapshot of the inputs. Scenario-business records can store a `pursue` or `not_pursue` decision and its note.

## Key capabilities in the backend

- Organisation-scoped users, sites, businesses, sensor devices and meter assignments.
- Versioned site profiles.
- Import of monitoring CSV exports to derive baseline-demand and solar profiles.
- Business profile generation from persisted meter readings.
- Deterministic power, startup, energy and battery checks.
- Scenario creation, site comparison, scenario listing, renaming and deletion.
- Recording a decision against a business in a scenario.

The frontend contains operator and field routes for the corresponding workflows, but its README explicitly describes the frontend as a mock-data prototype not yet connected to the backend. Do not represent every screen action as a live API integration.

## What GridFit does not do

- It does not use AI or machine learning for the fit assessment. The backend assessment is deterministic Python logic.
- It does not control generation, inverters, batteries, meters or customer loads.
- It does not automatically approve a connection or guarantee revenue, safety, reliability or profitability.
- It does not design or size a new mini-grid.
- It does not automatically change a business's operating hours to make a load fit.
- It does not establish that a proposed hardware design is certified or electrically safe.
- It does not currently provide a verified end-to-end device-to-cloud telemetry implementation in the supplied backend/frontend source archives.

## Interpretation of outcomes

The API outcome enum currently contains `feasible`, `conditionally_feasible` and `not_feasible`. The user interface may express these as YES / MAYBE / NO, but the API enum values are the canonical backend values. A feasible result is only as reliable as its inputs and assumptions. A conditional result needs operator review of the flagged margins or missing information. A not-feasible result identifies one or more constraints that fail under the selected scenario.
