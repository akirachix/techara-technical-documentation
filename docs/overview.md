# Overview

This page introduces GridFit, the problem it addresses, its intended users and the main workflows supported by the platform.

## Product definition

GridFit is a mini-grid business feasibility and decision-support platform. It helps mini-grid operators assess whether a prospective small or medium-sized enterprise (SME) can be supported by a mini-grid site.

The platform brings together business information, electrical equipment requirements, metering data, site capacity information and configurable assessment parameters. It uses these inputs to produce feasibility outcomes that help operators evaluate prospective connections and compare alternatives.

GridFit is intended to support operational decision-making. Its assessment results do not replace electrical engineering judgement, site inspections or the operator's responsibility to approve a connection.

## Problem statement

Mini-grid operators need to understand whether new business connections can be supported by the electricity capacity available at their sites.

A business may have equipment with different power requirements, operating schedules and patterns of electricity consumption. Assessing a prospective connection using only an estimated total demand can leave important details unexamined.

At the same time, operators need to make practical decisions about which businesses to assess, which sites may be suitable and what constraints could affect a proposed connection.

GridFit addresses this decision-support problem by organising business and site information, supporting metering workflows and evaluating prospective business demand against available site information.

The wider context includes two related challenges:

- **SME electricity reliability:** Businesses that depend on electricity need power that is sufficiently available and reliable for their operations.
- **Mini-grid capacity utilisation:** Operators need better information about existing capacity and prospective demand when evaluating additional productive-use customers.

> **Research note:** Quantitative claims about load shedding, SME losses, mini-grid utilisation or national electricity access should be supported by referenced research before publication. This documentation does not assign unsupported statistics to these challenges.

## Target users

### Mini-grid operators

Operators use GridFit to manage and assess prospective business connections.

Their activities include:

- Reviewing registered businesses.
- Reviewing business equipment and available load information.
- Managing mini-grid sites and site profiles.
- Reviewing fit-check results.
- Comparing a business across available sites.
- Creating and reviewing assessment scenarios.
- Recording decisions about prospective businesses.
- Managing metering devices and assignments.

### Field operators

Field operators support the collection of information from businesses and the installation of meters.

Their activities include:

- Registering a prospective business.
- Recording business equipment.
- Capturing information required for assessment.
- Installing or assigning a metering device.
- Reviewing assigned businesses and meters.

The field workflow is designed to support data collection close to the business being assessed.

## Key features

### 1. Business registration

The field workflow captures prospective business information so that the operator can review and assess the business.

### 2. Equipment recording

Equipment information helps describe the electrical demand associated with a business. The recorded equipment information contributes to the assessment inputs.

### 3. Metering and business profiles

GridFit includes sensor-device and meter-assignment management, together with reading and business-profile functionality. Metering data can be used to build a profile of observed business demand.

The availability and completeness of a profile depend on the readings collected for the assigned device.

### 4. Fit checks

The rules engine evaluates a business against a selected site's available information and assessment constraints. The result is presented as a feasibility outcome with supporting checks.

See [Rules Engine](rules-engine.md) for the assessment process.

### 5. Site comparison

Operators can compare the assessment of a business across different sites. This helps identify how the same business performs under different site conditions.

### 6. Scenario management and decisions

GridFit supports the creation and review of assessment scenarios. Operators can use scenario results to support decisions about prospective businesses.

Scenario records provide a way to revisit assessment inputs and outcomes.

## How GridFit works

The high-level workflow connects field data collection with operator assessment.

1. **Register a business:** A field operator records a prospective business and its relevant details.
2. **Record equipment:** The field operator captures the equipment associated with the business.
3. **Install or assign a meter:** A metering device is assigned to the business so readings can be collected.
4. **Build a business profile:** Available readings are used to describe observed electricity demand.
5. **Run a fit check:** The operator assesses the business against a selected mini-grid site.
6. **Review the outcome:** GridFit presents the assessment outcome and the checks contributing to it.
7. **Compare and decide:** The operator can compare sites, review scenarios and record a decision.

The exact information available at each step depends on the completeness of the business record, site profile and metering data.

## Related documentation

- [Architecture](architecture.md)
- [Backend / API](backend-api.md)
- [Rules Engine](rules-engine.md)
- [Frontend Web](frontend-web.md)
- [Field App](field-app.md)
- [Metering Device](metering-device.md)
