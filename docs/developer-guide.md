# Developer Guide

## A practical handbook for developers working across the GridFit platform

**Project:** GridFit — mini-grid business feasibility and decision-support platform

**Document type:** Shared developer workflow and integration handbook

**Audience:** New developers, current contributors, reviewers, QA testers and maintainers

**Companion documents:** `Backend / API`, `Frontend Web`, `Field App`, `Rules Engine`, `Metering Device`, `Security`, `Deployment` and `QA Process`

> **How to use this guide:** Read the relevant technical page first for the component's technology, folder layout, installation commands, configuration and implementation details. This guide intentionally avoids repeating every setup instruction. It explains how to work safely across the platform, coordinate changes between components, verify behavior and hand work over to another developer.

> **Evidence note:** Existing implementation statements are based on the GridFit source and documentation inspected for this project. The workflows, templates and checklists below are recommended engineering practices; they are not claims that the team already uses a formal process for every item. Where a capability is incomplete or not verified, this guide says so explicitly.

---

## 1. Start by understanding the whole user journey

GridFit helps mini-grid operators assess whether productive-use businesses and their electrical equipment are suitable for available electricity capacity. The platform brings together information about sites, business demand, equipment, meter assignments and rules-based feasibility assessments.

A feature can work in one part of GridFit and still fail for the person using the platform. A business form may accept information in the frontend, for example, while the backend rejects the request, the record is saved under the wrong organisation, or the operator cannot retrieve it afterwards.

The important product journey is:

1. An operator or field agent accesses the GridFit application.
2. A business and its operating context are recorded.
3. Equipment and estimated electrical demand are captured.
4. A site and its available capacity assumptions provide the assessment context.
5. Where supported, a meter is assigned to the business.
6. Meter readings may provide operational evidence when an authenticated ingestion capability is available.
7. The rules engine evaluates the supplied business and site information.
8. An authorised user reviews the outcome and supporting checks.
9. Operators use the result as decision support when considering productive-use connections.

This is a **product-level journey**, not a claim that every stage is fully automated or currently integrated in every deployed environment. In particular, meter assignment, physical device communication and reading ingestion must be treated as separate implementation stages. A meter assignment record does not prove that live telemetry is being received.

### What this means for a developer

When changing a feature, ask:

- **Where does the information begin?** In the operator interface, field application, backend, or rules engine?
- **Who uses it next?** An operator, field agent, service, or another part of the application?
- **What must remain true?** The correct organisation, site, business, device and user must remain associated.
- **What could fail between steps?** Invalid input, expired authentication, missing records, incorrect organisation scope, unavailable API, or incomplete device integration.
- **What proves the feature works?** A meaningful test of the actual behavior, not only a successful page render.

**Example:** Adding a new equipment category is not complete when the option appears in a dropdown. Confirm that the frontend submits the intended value, the backend schema accepts it, the service stores it, and the rules engine handles it correctly or explicitly reports that it is unsupported.

---

## 2. Find the correct source of truth before writing code

GridFit has separate repositories and documentation pages for its backend, frontend, rules engine and technical documentation. A design, screenshot or old README may describe intended behavior that differs from the current implementation.

Use this order when deciding what a feature should do:

1. **Approved requirement or task:** Explains the intended user behavior and acceptance criteria.
2. **Current backend route, schema and service:** Shows what the API accepts, validates and returns.
3. **Current frontend implementation:** Shows how the interface currently uses the API or local state.
4. **Rules-engine implementation and tests:** Show how assessment inputs and outcomes are calculated.
5. **Current automated tests:** Show behavior that has been checked by the available test suite.
6. **Designs and documentation:** Explain intended presentation and product context, but may lag behind code.
7. **Team clarification:** Resolves conflicts that remain.

This is a recommended decision process, not an existing formal GridFit policy.

### When two sources disagree

Do not silently choose one version. Record:

- The two conflicting statements.
- The files, routes, schemas or screens involved.
- Which behavior is currently implemented.
- Which behavior the product owner expects.
- What needs to change and how it will be tested.

**Example conflict:** A design shows a device as “online”, but the backend only supports device registration and status updates and does not yet expose a verified telemetry ingestion path. Do not present the UI state as proof that live readings are arriving. Confirm the intended device-status definition with the backend and metering owners.

### Keep a small integration note for each feature

Use this note when a change touches more than one component:

```text
Feature:
Owner:
User role:
Entry screen or API:
Frontend file(s):
Backend route(s):
Request fields:
Response fields:
Organisation/site/business scope:
Rules-engine impact:
Authentication and role requirements:
Empty state:
Error state:
Related tests:
Open questions:
```

This is a recommended working note. Fill in only the fields that apply.

---

## 3. How the frontend, backend and rules engine coordinate

A GridFit feature may cross several layers. The frontend collects and presents information, the backend validates and persists records, and the rules engine evaluates supported inputs. The actual dependency must be checked for each feature.

### 3.1 One change may affect several components

| Example change | Frontend impact | Backend impact | Rules-engine impact |
|---|---|---|---|
| Add an equipment type | Update selection and display | Validate and persist the value | Define how its demand is represented |
| Change business operating hours | Update form and summary | Validate and store the values | Confirm how operating hours affect demand |
| Add a site-profile assumption | Add or update the relevant input | Add schema, persistence and retrieval support | Use the assumption only if the engine supports it |
| Change an assessment result field | Update result display and types | Return the documented field consistently | Confirm the field's calculation and meaning |
| Add meter assignment metadata | Update installation interface if needed | Validate assignment and ownership | Use readings only if the engine has a verified supported input |
| Change organisation access rules | Update visible actions where appropriate | Enforce access at the API and service layer | Ensure assessment records remain scoped correctly |

The table describes possible dependencies. Inspect the actual implementation before treating a column as affected.

### 3.2 Do not guess API fields

Before implementing an API call:

1. Open the backend router and request/response schema.
2. Record the exact HTTP method and route.
3. Record required and optional fields.
4. Check whether the endpoint requires a bearer token.
5. Check role restrictions and organisation scoping.
6. Confirm successful response structure and status code.
7. Confirm expected validation and authorization errors.
8. Try the request in an approved development or test environment.
9. Update frontend types or request helpers to match the actual contract.
10. Add or update tests for the integration.

A field name in a Figma screen or frontend mock object is not proof that the backend accepts or returns that field.

### 3.3 Changes to an existing API contract

Recommended compatibility practices:

- Prefer adding optional fields before removing existing fields.
- Update consumers and tests before removing a field that is still in use.
- Do not change a field's meaning without updating its documentation.
- Treat changes to identifiers, enums, dates and nested objects as potentially breaking.
- Notify the frontend and backend contributors when a shared contract changes.
- Keep request and response examples aligned with the actual schema.

---

## 4. Trace one business record from entry to assessment

A useful onboarding and debugging exercise is to trace a business record through the application.

### Stage A — Business information is entered

Check the selected site, business details, operating hours, connection status and any other required fields.

**Question:** Does the submitted information match what the user reviewed before saving?

### Stage B — The frontend sends the request

Inspect the request method, URL, headers and payload in the browser Network panel or the relevant API helper.

**Question:** Did the frontend send the intended fields to the correct backend environment?

### Stage C — The backend validates and processes it

Inspect the route, Pydantic schema, service and repository behavior. Confirm that the backend derives organisation scope from the authenticated user where required.

**Question:** Did the API create the record under the correct organisation and site?

### Stage D — The record can be retrieved

Use an authorised request to retrieve the business and inspect its returned fields.

**Question:** Does the returned record have the expected identifier, organisation, site and values?

### Stage E — Equipment and assessment context are correct

If the workflow includes equipment or a feasibility assessment, confirm that the equipment and site-profile inputs used by the engine are the intended records.

**Question:** Is the assessment based on the values the user entered, or on stale, default or mock data?

### A simple trace sheet

| Checkpoint | What to record | Pass condition |
|---|---|---|
| Form entry | Selected site and entered business values | Values match user input |
| API request | Method, route and payload | Request matches backend contract |
| Backend response | Status code and business ID | Backend confirms the expected result |
| Database/service | Organisation and site association | Record is scoped correctly |
| Retrieval | Returned business fields | Retrieved record matches saved values |
| Assessment | Inputs and result/checks | Outcome reflects supported inputs |

Do not put real passwords, bearer tokens or sensitive personal contact details into shared test notes.

---

## 5. Work with identifiers and organisation boundaries carefully

GridFit contains several related records: organisations, users, sites, site profiles, businesses, sensor devices, meter assignments, readings and scenarios. Their identifiers are not interchangeable.

### Rules to follow

- Treat organisation, site, business, device, assignment and scenario IDs as distinct identifiers.
- Keep identifiers in the type required by the API contract.
- Do not create a fake ID for a real API request.
- Do not derive a record ID from its display name.
- Do not use an array index as a permanent identifier.
- Confirm that the same record is referenced across request, response and UI state.
- If a record is missing, show an appropriate empty or error state instead of substituting another record.

### Organisation scope

Organisation boundaries are a core part of GridFit authorization. Backend services should use the authenticated user's organisation when reading or changing organisation-owned records. Do not trust a client-supplied `organisation_id` when the authenticated principal can provide that context.

When adding a repository method or service operation, ask:

1. Which organisation owns the record?
2. Is the organisation derived from the authenticated user?
3. Is the parent record (such as a site or business) also checked against that organisation?
4. Can a user retrieve or modify another organisation's record by changing an ID?
5. Is the cross-organisation case covered by an automated test?

The sensor-device management routes have previously been identified as an implementation gap because the inspected router accepted organisation-related values from the client without the same route-level authentication pattern used elsewhere. Check the current branch before assuming this gap has been resolved.

---

## 6. Keep rules-engine behavior explicit

GridFit is a **rules-based decision-support platform**, not an AI/ML system. Do not describe its feasibility calculations as artificial intelligence.

When changing an assessment feature, identify:

- The input fields used by the calculation.
- The source of each input.
- Any units and conversion rules.
- Required assumptions and default values.
- The checks performed.
- The outcome classifications.
- The limiting check, where applicable.
- The information shown to the user.
- The cases where the engine cannot produce a reliable result.

### Do not hide missing data

A missing value is not automatically zero. For example, no recorded energy reading is different from a measured value of zero energy. Do not silently convert missing site, battery, equipment or metering values into meaningful measurements unless the rules-engine contract explicitly defines that behavior.

### Test calculation changes at more than one level

- Unit-test the changed calculation with controlled inputs.
- Test boundary values and missing inputs.
- Test the service or API path that supplies the calculation inputs.
- Confirm that the frontend displays the returned classification and checks correctly.
- Compare results against an approved expected example.

A passing UI test with a mocked assessment response does not prove that the rules engine calculation is correct.

---

## 7. Metering and device integration: separate assignment from telemetry

GridFit models sensor devices, meter assignments and readings. These concepts represent different stages of the metering capability.

- **Device registration** records a device in the application.
- **Meter assignment** associates a device with a business for an installation period.
- **Device credentials** identify or authenticate a device where verification is implemented.
- **Reading ingestion** receives and validates measurements from a device.
- **Reading history** makes stored measurements available for later use.

Do not treat one stage as proof that the others are complete.

The inspected backend implementation includes meter-assignment token generation and storage of a token hash. However, the supplied application version did not establish a complete authenticated reading-ingestion endpoint that verifies device tokens and stores incoming telemetry. Confirm the current backend branch before documenting or testing this as a working end-to-end feature.

### When working on metering

Check:

1. Is the device registered and active?
2. Does the device belong to the same organisation as the business?
3. Is the assignment active and associated with the intended business?
4. Is the installation credential handled as a secret?
5. Does a reading-ingestion route exist in the current backend?
6. Does that route verify the device credential?
7. Are units, timestamps and duplicate submissions validated?
8. Can the reading be retrieved using the correct assignment and business?

Do not invent MQTT topics, payload fields or live hardware behavior unless the current device and backend implementation confirms them.

---

## 8. A testing strategy that proves the right things

Do not measure quality only by counting passed tests. A large number of unit tests does not automatically prove that a user can complete a full workflow across the frontend, API, database and rules engine.

### 8.1 Test levels

| Level | Main question | Typical GridFit approach |
|---|---|---|
| Unit | Does one function or calculation behave correctly? | Pytest for backend and rules-engine functions |
| API | Does an endpoint validate and respond correctly? | Pytest API tests or controlled API requests |
| Service/integration | Do services and repositories work together? | Pytest with a controlled test database |
| Frontend component | Does the UI render and react correctly? | Vitest and the frontend's configured component tooling |
| Browser workflow | Can a user complete the web workflow? | Browser automation if configured for the current branch |
| Cross-component integration | Does data travel correctly between frontend and backend? | Coordinated test environment |
| Manual field verification | Can a field user complete the intended steps on the target device? | Structured manual test |

Use the current companion pages for the exact commands and test setup. Do not assume a tool is configured simply because it is listed as a possible testing approach.

### 8.2 What mocks can prove

Mocked data can help test:

- Form validation and navigation.
- Loading, success, empty and error states.
- Display of known response fields.
- Request payload construction.
- Local calculations that are intentionally isolated.

Mocks cannot prove:

- The real backend accepts the request.
- Authentication and authorization are configured correctly.
- Data is persisted in the intended organisation.
- The rules engine uses the correct production inputs.
- Physical devices are sending authenticated readings.

### 8.3 What real integration tests must prove

In an approved test environment:

- A valid authenticated request reaches the backend.
- The backend validates the request and applies role checks.
- The record is created or retrieved under the correct organisation.
- The frontend handles the real response structure.
- Invalid and unauthorized requests fail safely.
- Related records remain linked by their real identifiers.
- A rules-engine result can be reproduced from the tested inputs.

### 8.4 Suggested GridFit acceptance scenarios

| Scenario | Expected evidence |
|---|---|
| Anonymous user calls a protected endpoint | Request is rejected |
| User with insufficient role attempts an operator-only action | Request is rejected |
| User requests a record from another organisation | Record is not disclosed or modified |
| Operator creates a business for an owned site | Business is associated with the correct organisation and site |
| Field agent updates a permitted business | Only an allowed record can be changed |
| Invalid equipment or site input is submitted | Validation error is returned |
| Assessment receives missing required inputs | Limitation or validation outcome is explicit |
| Assessment uses a known input set | Expected checks and outcome are returned |
| Meter is assigned to a business | Assignment and ownership checks succeed |
| Unauthenticated caller accesses device management | Access is rejected once the route is secured |
| Device submits a reading without a valid credential | Ingestion endpoint rejects it once implemented |
| Frontend API request fails | User sees a useful error, not a false success |

This is a proposed acceptance matrix, not a claim that every scenario has already passed.

---

## 9. How to write a useful bug report

A good bug report lets another developer reproduce the problem without guessing.

Use this template:

```text
Title:
Component: Frontend / Backend / Rules Engine / Metering / Documentation
Environment: Local / Test / Production
User role:
Feature:
Expected result:
Actual result:
Steps to reproduce:
Request method and route:
Response status and safe error detail:
Relevant record IDs (test data only):
Screenshot or test report:
First seen:
Severity:
Possible cause (if known):
```

### Example: business appears under the wrong site

**Expected:** A newly created business is associated with the site selected by the user and belongs to the user's organisation.

**Actual:** The business appears under a different site or cannot be retrieved from the expected site view.

**How to investigate:**

1. Record the test user's organisation ID and selected site ID.
2. Inspect the request payload and route.
3. Inspect the authenticated user's organisation context.
4. Check the service and repository query.
5. Retrieve the created business using an authorised request.
6. Add a regression test for the ownership and site association.

Avoid reports such as “the API is broken”. State which request or user action failed and what was expected.

---

## 10. Debug problems from the outside inward

Use a consistent sequence instead of changing several files at once.

### If a frontend screen is blank

1. Check the browser console.
2. Check the browser Network panel.
3. Identify the first failing request.
4. Confirm the request URL and environment.
5. Inspect the frontend API helper or proxy route.
6. Check the backend response and status code.
7. Confirm that the UI expects fields actually returned by the API.

### If a business or site record cannot be retrieved

1. Confirm the record exists in the test database.
2. Record its actual ID and organisation.
3. Confirm the authenticated user and role.
4. Check the route's authentication and role dependencies.
5. Inspect the service/repository organisation filter.
6. Compare the API response with the expected record.
7. Check whether the frontend is using a stale ID or mock record.

### If a rules-engine result is unexpected

1. Record the exact input values and units.
2. Check which site profile and business records were used.
3. Run the relevant calculation test with the same inputs.
4. Inspect the individual checks and limiting condition.
5. Compare the output with an approved expected result.
6. Confirm the frontend is displaying the current response, not a previous result.

### If meter readings do not appear

1. Confirm the device and meter assignment records exist.
2. Confirm the assignment is active and linked to the intended business.
3. Verify whether a reading-ingestion endpoint exists in the current branch.
4. If implemented, inspect its authentication and validation behavior.
5. Check the persisted reading and its assignment/business relationship.
6. Do not assume that device registration or assignment means telemetry is being received.

---

## 11. A safe Git and pull-request workflow

Use the team's approved repository branches and contribution instructions. The following is a recommended workflow; confirm branch protections and review requirements in the current repository before relying on them.

### Before starting

1. Move into the repository you intend to change.
2. Check the current branch and working tree.
3. Fetch or review the latest approved base branch.
4. Read the issue and relevant technical documentation.
5. Identify affected routes, schemas, services, screens and tests.
6. Create a focused feature branch from the agreed base.

Useful inspection commands:

```bash
git status --short
git branch --show-current
git branch -a
git log --oneline -5
```

### During implementation

- Keep the change limited to the task.
- Avoid mixing unrelated backend and frontend changes into one pull request unless the feature genuinely requires coordinated changes.
- Do not overwrite another contributor's work.
- Do not merge a teammate's entire branch just to obtain one dependency; coordinate the required files or agreed merge order.
- Do not hard-code production credentials.
- Add or update tests for the behavior being changed.
- Update the relevant documentation when routes, schemas, environment variables or workflows change.

### Before opening a pull request

- Review the complete diff against the agreed base branch.
- Check staged and unstaged files.
- Run the relevant lint, format and test commands from the component guide.
- Confirm that unrelated files are not included.
- Record what passed and what was not run.
- Explain any dependency on another branch or unfinished endpoint.
- Check that no secret, token or personal test data is included.

### Suggested pull-request template

```text
## What changed
Describe the feature or fix.

## Why
Explain the user or technical problem.

## Components affected
Frontend / Backend / Rules Engine / Metering / Documentation

## API or data-model impact
List route, schema or migration changes, if any.

## How it was tested
List commands, scenarios and results.

## Dependencies
List required branches, endpoints or other work.

## Known limitations
State what is not yet implemented or verified.

## Reviewer notes
Explain what needs special attention.
```

A pull request should not claim end-to-end completion if it only ran isolated unit tests or mocked frontend tests.

---

## 12. How to review another developer's code

Review more than whether the code compiles.

### Correctness

- Does the implementation match the requirement?
- Are identifiers and relationships handled correctly?
- Are missing, invalid and boundary values handled?
- Does the change preserve existing workflows?
- Are units and assumptions clear in rules-engine changes?

### Integration

- Does the frontend request match the backend contract?
- Are response types accurate?
- Are service and repository responsibilities respected?
- Does the change affect another component?
- Is a migration or environment change required?

### Security and data integrity

- Are authentication and role checks enforced at the backend boundary?
- Is organisation scope derived from the authenticated user where required?
- Are secrets and tokens kept out of logs?
- Are device credentials handled safely?
- Can the change expose another organisation's records?

### Testing

- Are the tests meaningful?
- Are success and failure paths covered?
- Does a mocked test make a claim it cannot support?
- Is there a test for the relevant authorization boundary?
- Can the behavior be verified manually?

### Maintainability

- Are names and responsibilities clear?
- Is logic placed in the appropriate layer?
- Are errors understandable and actionable?
- Is duplicated logic being introduced?
- Is documentation updated with the code?

---

## 13. Test environments and test data

Keep **production data**, **test-environment data** and **mock fixtures** separate.

### Production data

Real information used by the deployed platform. Do not modify or delete it to make a test pass.

### Test-environment data

Records created in an approved non-production environment. Use known test accounts and test organisations, and follow agreed cleanup rules.

### Mock fixtures

Synthetic request or response objects used by a test runner. They help test isolated UI and service behavior without contacting the real service.

### Recommended fixture rules

- Use obvious labels such as `TEST_BUSINESS` or `SYNTHETIC_SITE`.
- Keep fixtures deterministic.
- Use only fields supported by the actual API contract.
- Include empty, invalid and boundary examples.
- Do not reuse production credentials.
- Do not use mock data to claim a live integration is working.
- Do not present simulated readings as measurements from physical hardware.

---

## 14. Managing dependencies between contributors

A feature may be blocked even when one developer's code is ready. For example, a frontend screen may depend on a backend endpoint or schema that is still being implemented.

Use a small dependency register:

| Item | Owner | Dependency | State | Next action |
|---|---|---|---|---|
| Example: equipment form integration | Frontend contributor | Confirmed equipment request schema | Awaiting confirmation | Review backend schema |
| Example: site-profile update | Backend contributor | Agreed validation rules | In progress | Add service and API tests |
| Example: live meter readings | Metering contributor | Authenticated ingestion endpoint | Not verified | Confirm implementation and device contract |

These are examples, not actual project statuses.

### When blocked

Do not invent endpoints or response fields to keep moving. You can continue isolated UI work with clearly labelled fixtures, but record the integration as unfinished until the real contract is available and tested.

---

## 15. Handover checklist for another developer

When you finish a feature, leave enough information for someone else to continue.

A useful handover answers:

1. What user or technical problem was addressed?
2. Which repository, branch and files changed?
3. Which API routes and schemas are involved?
4. Which roles and organisation boundaries are affected?
5. What is implemented and verified?
6. What is incomplete or still mocked?
7. Which tests were run?
8. Which tests were not run, and why?
9. What configuration or environment is required?
10. What should the next developer do first?

### Suggested handover format

```text
Feature:
Repository / branch / PR:
Current status:
Implemented:
API dependencies:
Data-model or migration changes:
Tests passed:
Tests not run:
Known limitations:
Manual verification steps:
Next action:
```

This is especially important when a feature depends on another contributor's branch or a backend endpoint that is not yet available.

---

## 16. Release readiness: a shared checklist

Before releasing a change that affects more than one GridFit component, confirm the following.

### User experience

- The intended role can complete the task.
- Empty, loading and error states are understandable.
- A failure does not appear to be a success.
- The interface does not imply that simulated functionality is live.

### Integration

- Frontend and backend use compatible contracts.
- Backend permissions match the expected roles.
- Organisation and record relationships remain correct.
- Rules-engine inputs and outputs are understood.
- Metering claims match the implemented device and ingestion capabilities.

### Data integrity

- Missing values are not silently converted into meaningful measurements.
- Units and timestamps are preserved.
- Retries do not create unintended duplicate records.
- Records remain associated with the correct organisation and parent entity.
- Sensitive data is not leaked through logs or test reports.

### Verification

- Relevant unit and API tests pass.
- Relevant frontend checks pass.
- Cross-component integration is checked where required.
- Known limitations are documented.
- The release notes state what was and was not verified.

### Operations

- Required configuration exists in the target environment.
- The release owner is known.
- The team knows where to find logs.
- A rollback or corrective plan exists for important changes.

This is a recommended checklist, not evidence that every item is automated.

---

## 17. Common misunderstandings to avoid

**“The page loads, so the feature works.”**

A page can render while its API request fails. Test the user action and the returned result.

**“The API returned 200, so the data is correct.”**

A successful response does not prove that the record belongs to the intended organisation or that the calculation used the correct inputs.

**“A registered device is sending readings.”**

Device registration, meter assignment and authenticated reading ingestion are separate capabilities.

**“A mocked assessment proves the rules engine works.”**

A mock proves that the interface can handle a sample response. It does not prove the real calculation.

**“No reading means zero consumption.”**

Missing data and a measured zero are different states.

**“The frontend hides the action, so it is secure.”**

Authorization must be enforced by the backend.

**“The feature is done because the code was merged.”**

A feature is ready only when its intended behavior and relevant dependencies have been verified.

---

## 18. A practical first-week plan for a new developer

### Day 1 — Understand the product

Read the Overview, Architecture and the component guide relevant to your assignment. Identify the user role, main workflow and the boundaries between frontend, backend and rules engine.

### Day 2 — Trace one existing feature

Choose a small feature such as retrieving a site or creating a business. Find its UI, request helper, backend route, schema, service and tests. Record the actual request and response.

### Day 3 — Run the existing checks

Follow the Backend / API or Frontend Web guide for the exact installation and test commands. Learn which tests use mocks and which require a real environment.

### Day 4 — Make a small, safe change

Choose a focused bug or improvement. Add a relevant test, verify the behavior locally and review the diff.

### Day 5 — Prepare a complete handover

Open a focused pull request. Explain the change, affected components, tests run, known limitations and remaining dependencies.

This is a suggested onboarding plan and can be adapted to the team's schedule.

---

## 19. Quick reference: where to look next

| Need | Read or inspect |
|---|---|
| Product purpose, users and workflow | **Overview** |
| System components and boundaries | **Architecture** |
| Backend routes, schemas, models and setup | **Backend / API** |
| Assessment inputs, checks and outcomes | **Rules Engine** |
| Operator web application, setup and testing | **Frontend Web** |
| Field-agent screens and workflow | **Field App** |
| Device registration, assignments and readings | **Metering Device** |
| Authentication, authorization and known gaps | **Security** |
| Hosting, CI/CD and release procedures | **Deployment** |
| Automated and manual verification | **QA Process** |
| Terminology | **Glossary** |

Use the companion documents for exact commands, paths and configuration. This guide is the shared workflow reference, not a replacement for component-specific instructions.

---

## 20. Information to confirm as the platform evolves

Update this guide when the team confirms changes to:

1. **Repository ownership and branch policy:** Approved base branches, branch protections, reviewers and merge order.
2. **API contracts:** Exact route paths, schemas, status codes and role requirements.
3. **Frontend integration status:** Which screens use live backend data and which remain mock-driven or simulated.
4. **Rules-engine contracts:** Supported inputs, assumptions, classifications and expected outputs.
5. **Metering implementation:** Device protocol, credential verification, reading-ingestion endpoint, payload and validation rules.
6. **Test environments:** Approved development and staging services, test accounts and database setup.
7. **Release ownership:** Who approves, deploys, monitors and rolls back each component.

Do not add production URLs, credentials or claims of completed functionality without confirmation from the responsible repository or service owner.

---

## Final note

The component guides explain **how each part of GridFit is built**. This shared Developer Guide explains **how developers work across those parts**: finding the source of truth, coordinating API and UI changes, preserving organisation boundaries, testing meaningful workflows, reviewing code and handing work over safely.

The central rule is simple:

**Do not call a feature complete because one screen, endpoint or calculation works in isolation. Confirm that the intended user can complete the supported workflow, that records and calculations remain correct, and that incomplete integrations are clearly identified.**
