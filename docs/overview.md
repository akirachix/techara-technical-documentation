# Introducing GridFit

GridFit is a business-load assessment and decision-support platform for mini-grid operators. It helps operators understand whether a prospective small or medium-sized enterprise (SME) can be supported by the available electricity capacity at an existing mini-grid site.

By bringing site information, business operating patterns and electricity-demand evidence into one assessment workflow, GridFit makes it easier to examine a proposed connection using consistent inputs and explainable checks.

The platform is being developed in the context of mini-grid operations in Zambia. Its central purpose is to support more informed decisions about productive electricity use.

---

## The challenge: matching business demand with available electricity

Mini-grid operators need to understand two things before assessing a new business connection: how much electricity a site can make available, and how the proposed business will use it.

That is not always straightforward. A business may know its monthly electricity estimate but may not know its peak demand, daily consumption pattern, motor-starting requirements or evening usage.

These details matter. A monthly estimate can hide short periods of high demand. At the same time, a mini-grid may have electricity capacity that could support productive business activity if the additional load is understood properly.

GridFit brings these two sides together: the technical profile of the mini-grid and the demand profile of the business.

## The GridFit approach

GridFit organises the assessment around a site and the businesses being considered for that site.

The site profile describes the available energy system and its operating context. This can include inverter limits, battery characteristics, solar information, baseline demand and other operating settings.

The business profile describes how a prospective business operates and the electricity its equipment requires. Where readings are available, the backend can use persisted meter data to derive hourly averages and peaks.

An operator can then run a scenario using a selected site-profile version, starting battery-energy value, solar-day selection, assessment period and set of businesses.

The result is a structured assessment with an outcome, individual check results, metrics, a limiting check and a simulation trace.

## Who uses GridFit

GridFit supports three main groups of users.

**Mini-grid operators**

Operators manage mini-grid sites and their technical profiles. They can run scenarios, compare sites, review assessment results and record whether to pursue or not pursue a business connection.

**Field agents**

Field agents support the collection of business information. Their workflows include registering businesses and recording operating and equipment details, as well as supporting meter-installation activities.

**Technical administrators and developers**

This group configures, maintains, tests and supports the software and its deployment.

The backend defines `operator` and `field_agent` roles. Site-profile and scenario operations are restricted to operators, while several business and site read operations support both roles.

## How the workflow works

GridFit connects six stages into one assessment process.

### 01 — Set up a mini-grid site

An operator creates a site and records its technical profile. Relevant information includes inverter limits, battery characteristics, solar and baseline-demand profiles, tariffs and operating settings.

### 02 — Register a business

A field agent or operator records the business, contact details, operating hours, days of operation, equipment information and any available startup-load information.

### 03 — Associate metering evidence

A meter assignment links a registered sensor device to a business. The database includes a model for storing readings, which can support later business-demand profiling.

### 04 — Build the business demand profile

The backend business service can group persisted readings into local hourly averages and peaks. It also checks whether the minimum configured number of observed days has been reached.

### 05 — Run an assessment

An operator selects the site-profile version, starting battery-energy value, solar-day selection, assessment period and businesses to include in a scenario.

### 06 — Review the results and record a decision

The assessment returns an outcome, limiting check, metrics, check-level results, simulation trace and a snapshot of the inputs used.

The operator can record a `pursue` or `not_pursue` decision against a business in the scenario and add a decision note.

## What the platform provides

GridFit's backend brings together several capabilities:

- **Organisation-scoped records:** users, sites, businesses, sensor devices and meter assignments are scoped to organisations.
- **Versioned site profiles:** site technical information can be maintained through profile versions.
- **Monitoring-data imports:** CSV monitoring exports can be imported to derive baseline-demand and solar profiles.
- **Business demand profiling:** persisted meter readings can be used to generate business demand profiles.
- **Rules-based assessment:** deterministic checks evaluate power, startup, energy and battery constraints.
- **Scenario management:** operators can create, compare, list, rename and delete scenarios.
- **Decision recording:** operators can record pursue or not-pursue decisions for businesses in a scenario.

These capabilities are intended to make the assessment process more structured and its results easier to review.

## Understanding assessment results

The backend defines three assessment outcomes.

**Feasible**

The business load passes the configured checks under the selected scenario.

**Conditionally feasible**

The assessment identifies conditions, flagged margins or missing information that require further operator review.

**Not feasible**

One or more constraints fail under the selected scenario.

The user interface may express these outcomes as YES, MAYBE and NO. The API values remain `feasible`, `conditionally_feasible` and `not_feasible`.

An assessment is only as reliable as the information and assumptions used to produce it. A result based on estimated demand should not be treated as equivalent to one based on a sufficient period of observed readings.

## Implementation status and evidence boundaries

The following implementation-status table reflects the current source evidence from the actual backend and frontend repositories, not just the documentation narrative.

| Component | Status | Evidence basis | Notes |
|---|---|---|---|
| Backend | Verified | `techara-backend/main.py`, `database.py`, `core/security.py`, `services/` | Real FastAPI backend, route registration, DB config, JWT and assignment logic are present. |
| Frontend Web | Prototype / Mock | `techara-frontend/README.md`, `app/providers.js`, `app/(auth)/login/page.js` | The frontend is described as mock-data and in-memory state; it is not a verified live backend-integrated application. |
| Field App | Prototype / Mock | `techara-frontend/README.md`, `app/providers.js` | Field workflows are demo-oriented and not proven as persistent backend operations. |
| Authentication | Verified | `techara-backend/core/dependencies.py`, `techara-backend/tests/test_auth.py` | JWT bearer auth and role checks are implemented for protected backend routes. |
| Meter Assignment | Verified | `techara-backend/services/meter_assignment_service.py`, `routers/meter_assignments.py` | Active-device and open-assignment checks are enforced in source. |
| Device Telemetry | Partially Verified | `techara-backend/models/reading.py`, `models/meter_assignment.py` | Data model exists, but no verified end-to-end firmware/telemetry ingestion path is present in the inspected implementations. |
| Security | Partially Verified | `techara-backend/core/dependencies.py`, `routers/sensor_devices.py` | Core auth exists, but the sensor-device routes remain a known security gap and must be remediated before production. |
| Deployment | Partially Verified | backend/frontend GitHub workflows and deployment files | CI and backend deployment automation exist, but production hosting remains unverified. |

The backend contains the site, business, metering data-model and scenario-assessment capabilities described above.

The frontend contains operator and field routes representing the corresponding workflows. Its README describes it as a mock-data prototype that is not yet connected to the backend. A screen or interaction in that prototype should therefore not be interpreted as proof that the corresponding operation is integrated with a live API.

The supplied backend archive includes a meter-reading data model, but does not establish a complete operational device-to-cloud workflow: a reading-ingestion API and device firmware are not present in the supplied implementation evidence.

These distinctions are important when interpreting the current state of the platform.

## Working assumptions and responsible use

GridFit is a decision-support tool. Its assessments help operators examine a business load against a defined site profile and scenario; they do not replace engineering judgement, a formal interconnection study or the operator's final commercial and safety approval.

The quality, recency and provenance of site and business inputs affect the usefulness of the result. Missing information and estimated values should be considered during review, particularly when an assessment is conditional.

## Explore the technical documentation

Continue with the sections below to understand how GridFit is designed and implemented.

- [Architecture](architecture.md) — system structure and component relationships.
- [Backend / API](backend-api.md) — services, endpoints, data models and handling.
- [Rules Engine](rules-engine.md) — assessment logic, checks and outcomes.
- [Frontend Web](frontend-web.md) — operator-facing web application.
- [Field App](field-app.md) — field-agent workflows and screens.
- [Metering Device](metering-device.md) — device, assignment and reading implementation.
- [Security](security.md) — authentication, authorisation and data protection.
- [Deployment](deployment.md) — environment configuration and deployment.
- [QA Process](qa-process.md) — testing and quality assurance.
- [Developer Guide](developer-guide.md) — contribution workflow and conventions.
- [Brand Guideline](brand-guideline.md) — GridFit visual identity.
- [Glossary](glossary.md) — project terminology.
