# QA Process

This page describes how GridFit is tested, how developers run the available checks, and how automated quality gates are applied before changes are merged.

## Test strategy

GridFit uses backend automated tests, database constraint tests, API tests, frontend tooling checks and GitHub Actions pull-request validation.

The test strategy covers:

- **Unit and service tests:** Validate individual application operations and business rules.
- **API tests:** Verify endpoint behaviour, request validation, response codes and access restrictions.
- **Database tests:** Verify model relationships, constraints and data integrity.
- **Rules-engine tests:** Check feasibility calculations, assessment outcomes and edge cases.
- **Frontend checks:** Provide test, lint, formatting and production-build commands.

Tests should verify both successful operations and expected failures, including invalid input, missing records, duplicate records and unauthorised access.

## Backend testing

The backend uses:

| Tool | Purpose |
|---|---|
| Pytest | Automated test execution |
| pytest-cov | Test coverage reporting |
| Ruff | Python linting and formatting |
| SQLite | Database used by the CI test workflow |
| FastAPI TestClient | API-level test execution |

Test discovery is configured in `pyproject.toml`:

- Test directory: `tests/`
- Test file naming: `test_*.py`
- Python path: project root

### Running backend tests

From the backend repository:

```bash
cd ~/techara-backend
uv run --no-sync pytest --cov --cov-report=term-missing
uv run --no-sync pytest tests/test_business.py
uv run --no-sync pytest tests/api/
### Coverage reporting

Coverage measures application source code while excluding tests and the virtual environment.

The latest recorded backend test run completed with **297 passing tests and 96% code coverage**. One Starlette deprecation warning was reported.

## Backend test coverage

The existing test suite includes:

| Area | Test coverage |
|---|---|
| Authentication and users | Authentication and user operations |
| Businesses | Creation, listing, details, updates and profiles |
| Sites | Creation, retrieval, listing and updates |
| Site profiles | Profile operations and imports |
| Scenarios | Creation, listing, updates, deletion and comparison |
| Meter assignments | Assignment creation and removal |
| Sensor devices | Registration, duplicate serials and status filtering |
| Readings | Measurement validation and database constraints |
| Rules engine | Feasibility checks and evaluation |
| Authorisation | Protected API operations and role restrictions |


```

## Postman and API verification

No exported Postman collection was identified in the inspected backend repository. The database files containing `postman` in their names are not exported Postman collections.

The FastAPI application provides interactive API documentation through:

- `/docs`
- `/openapi.json`

Developers can use `/docs` to inspect endpoints, request schemas, parameters and responses while the backend is running.

API verification should include:

1. Successful requests using valid data.
2. Missing and invalid request fields.
3. Requests for records that do not exist.
4. Duplicate record and assignment attempts.
5. Requests made by users with insufficient permissions.
6. Organisation-level data isolation.
7. Expected error responses and status codes.

A maintained Postman collection should be added when one is available and verified.


## Frontend testing

The GridFit frontend uses Next.js, React, TypeScript and Vitest.

The following scripts are defined in `package.json`:

| Check | Command |
|---|---|
| Development server | `npm run dev` |
| Production build | `npm run build` |
| Linting | `npm run lint` |
| Formatting | `npm run format:check` |
| Automated tests | `npm test` |

Run frontend checks from the frontend repository:

```bash
cd ~/techara-frontend
npm install
npm test
npm run lint
npm run format:check
npm run build

```

### Frontend testing status

Vitest is listed as a development dependency, and the test script uses `vitest run --passWithNoTests`.

Inspection did not identify test files using the standard `.test.ts`, `.test.tsx`, `.spec.ts` or `.spec.tsx` naming patterns. No `vitest.config.*` or `vite.config.*` file was found at the inspected project depth.

Because `--passWithNoTests` allows the command to succeed when no tests are collected, a successful test command must not be interpreted as evidence of frontend test coverage.

Dedicated tests should be introduced for business registration, equipment capture, meter installation, dashboard interactions, form validation and API integration.


## Continuous integration

The backend repository uses GitHub Actions to automate quality checks.

The main workflows are:

| Workflow | Responsibility |
|---|---|
| `ci.yml` | Reusable backend test and coverage workflow |
| `pr-checks.yml` | Pull-request requirements, linting, formatting and CI gate |
| `deploy.yml` | Deployment workflow |

### Backend CI workflow

The reusable CI workflow:

- Runs on a self-hosted runner labelled `classroom-ci`.
- Uses the Python version specified in `.python-version`.
- Installs dependencies with `uv`.
- Uses SQLite for the test database.
- Runs Pytest with coverage and missing-line reporting.

The CI workflow uses `workflow_call`, meaning it is invoked by another workflow rather than independently triggered by every push.

### Pull-request quality gate

Pull requests targeting `main` or `develop` trigger `pr-checks.yml`.

The workflow validates:

- A descriptive pull-request title.
- A sufficiently detailed description.
- Evidence of testing.
- Updated tests when application Python files change, unless an approved `no-tests-needed` exception is documented.
- Ruff lint checks.
- Ruff formatting checks.
- Backend tests and coverage.

A final gate requires the preceding checks to succeed. The workflow also posts or updates a pull-request checklist and requires peer review before merging.

### Pull-request expectations

Before requesting review:

1. Explain what changed and why.
2. Describe the tests and checks performed.
3. Add or update tests for application changes.
4. Resolve lint and formatting failures.
5. Confirm that automated checks pass.
6. Request peer review before merging.


## Known QA gaps

The following areas require further verification or implementation:

- Frontend automated test files and meaningful test coverage.
- A maintained and exported Postman collection.
- A complete physical-device-to-backend reading-ingestion test workflow.
- Authentication and organisation-scoping tests for sensor-device endpoints.
- Verification of device-token authentication during reading ingestion.
- Current lint and formatting status across the complete backend repository.

QA status should be updated as these capabilities are implemented and tested.

## Related documentation

- [Backend API](backend-api.md)
- [Rules Engine](rules-engine.md)
- [Security](security.md)
- [Metering Device](metering-device.md)
- [Developer Guide](developer-guide.md)

