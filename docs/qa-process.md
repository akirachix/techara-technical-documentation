# QA Process

GridFit requires tests at API, data, rules-engine, frontend and deployment boundaries. A passing unit-test suite does not prove that a meter is safe, a device is transmitting or a deployed frontend is connected to the production API.

## Test strategy

| Layer | Main objective | Recommended evidence |
|---|---|---|
| Schemas | Reject invalid payloads and boundary values | Pydantic validation tests |
| Services/repositories | Enforce business rules and organisation scope | Pytest with isolated database fixtures |
| Database | Enforce foreign keys, uniqueness and check constraints | Migration/integration tests |
| Rules engine | Produce correct deterministic results | Unit tests for each check and aggregation |
| API | Verify status codes, auth and response shape | FastAPI TestClient/httpx |
| Frontend | Verify forms, routes, error states and key interactions | Vitest/component tests and browser smoke tests |
| Hardware | Verify measurement accuracy and safe operation | Calibrated bench tests and qualified electrical review |
| Deployment | Verify runtime config and service health | Smoke tests against deployed environments |

## Running backend tests

From the backend repository root:

```bash
uv sync --all-groups
uv run pytest
uv run pytest -q
uv run pytest --cov
uv run ruff check .
```

Use the project's fixtures and test database configuration. Do not run destructive tests against production data.

## Important backend test cases

### Authentication and access control

- Missing, malformed, expired and invalid-signature JWTs return 401.
- Inactive users are rejected.
- Users who must change their password cannot access protected role routes.
- Operator-only endpoints reject field agents.
- Field-agent-only meter removal rejects operators.
- Organisation A cannot retrieve or modify Organisation B's sites, businesses, devices, assignments or scenarios.

### Meter assignments and readings

- Only active devices can be installed.
- A device cannot have two open assignments.
- A business cannot have two open assignments.
- Assignment creation returns a raw token once and persists only its hash.
- Removal is rejected when already removed.
- Reading constraints reject invalid voltage and negative measurements.
- Duplicate assignment/timestamp readings are rejected.
- Reading business ID must match the assignment's business ID.

The supplied code includes model constraints and assignment service behaviour. It does not include a reading-ingestion route, so end-to-end ingestion tests must be added when that feature is implemented.

### Site profiles and rules engine

- 24 hourly values are required for baseline and each solar profile.
- Solar and baseline values cannot be negative.
- State-of-charge minimum must be lower than maximum.
- Charge/discharge efficiencies must be greater than zero and no more than one.
- Missing inverter continuous/surge values produce the documented unknown results.
- Power above the inverter limit fails.
- Startup duration and surge-power limits are tested independently.
- Energy deficit and battery unserved-energy tolerance are tested at, below and above boundaries.
- Missing/insufficient observed days prevents scenario creation.
- Site comparisons require 2–5 distinct site IDs.

## Frontend QA

The frontend `package.json` declares:

```bash
npm run lint
npm run format:check
npm run build
npm test
```

The test command is `vitest run --passWithNoTests`; zero discovered tests will not fail the command. The frontend README describes mock data and in-memory state, so manually verify what is genuinely persisted and what is demonstration-only.

Suggested manual checks:
- Responsive layouts at desktop and narrow mobile widths.
- Keyboard navigation and visible focus.
- Required-field and invalid-field feedback.
- Loading, empty and error states.
- Browser refresh behaviour.
- Session expiry and logout when real authentication is integrated.
- Operator/field-agent role boundaries.
- API failure and network-loss handling.

## Meter hardware QA

Before any field deployment:
- Verify electrical isolation, protection and enclosure safety with a qualified professional.
- Compare voltage/current/power/energy readings against a calibrated reference instrument.
- Test representative resistive and motor loads.
- Verify timestamp accuracy and cumulative energy counter behaviour.
- Test communication loss, retry, buffering, duplicate delivery and recovery.
- Confirm device credentials cannot be reused across organisations or assignments.

No hardware calibration report or firmware test evidence was included in the supplied archives.

## CI and release checks

The backend repository contains GitHub Actions workflows and configuration for pytest/Ruff checks. Review the active workflow definitions for exact branch triggers and runner configuration. The docs repository has a GitHub Pages workflow. The frontend has local scripts and Husky hooks; confirm any additional Vercel build checks in the Vercel project.

A release is not complete until the build succeeds, migrations are reviewed/applied, health checks pass and the key user workflows are smoke-tested.
