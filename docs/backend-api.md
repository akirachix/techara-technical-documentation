# Backend / API

The backend is a FastAPI application. Its entry point is `main.py`, which registers authentication, meter-assignment, sensor-device, scenario, business, site and site-profile routers.

## API overview

- **Framework:** FastAPI.
- **Validation/serialisation:** Pydantic v2 schemas.
- **ORM:** SQLAlchemy 2.x.
- **Migrations:** Alembic.
- **Authentication:** bearer JWTs signed with HS256.
- **Database support:** SQLAlchemy configuration and model types support PostgreSQL and SQLite in the supplied code.
- **Health check:** `GET /health`, returning `{"status":"ok"}`.
- **Interactive API docs:** FastAPI normally exposes `/docs` and `/openapi.json` unless disabled by deployment configuration.

No production API base URL is specified in the supplied source archive. Confirm the deployed Heroku URL and Swagger URL from the team's current Heroku application settings before publishing them here.

## Prerequisites

- Python 3.11 or later (`pyproject.toml` specifies `>=3.11`; `.python-version` pins the project runtime).
- `uv` or another compatible Python environment/package installer.
- PostgreSQL for a production-like deployment, or SQLite for local/test use.
- Environment configuration including `JWT_SECRET` and a database URL as required by `database.py` and deployment settings.

## Local setup

From the backend repository root:

```bash
# Install uv if it is not already available, then:
uv sync --all-groups

# Set required local configuration in your shell or an ignored .env file.
export JWT_SECRET='replace-with-a-long-random-secret'

# Apply migrations.
uv run alembic upgrade head

# Start the API.
uv run uvicorn main:app --reload
```

Open `http://127.0.0.1:8000/docs` for the local OpenAPI interface. The exact database environment variable name is defined by the backend's database URL configuration; check `core/database_url.py` and `database.py` rather than assuming a name.

## Architecture layers

| Layer | Location | Purpose |
|---|---|---|
| Application | `main.py` | Creates FastAPI app, registers handlers and routers, exposes health check |
| Routers | `routers/` | HTTP methods, paths, dependencies and response models |
| Schemas | `schemas/` | Pydantic request/response validation |
| Services | `services/` | Business workflows and transaction coordination |
| Repositories | `repositories/` | Database queries and persistence |
| Models | `models/` | SQLAlchemy tables, relationships and constraints |
| Core | `core/` | JWT security, roles, database URL, defaults and exception handling |
| Engine | `engine/` | Hourly profiles, checks, simulation and spare-capacity calculations |
| Migrations | `migrations/` | Alembic schema history |
| Tests | `tests/` | Pytest test suite and fixtures |

## Authentication and API conventions

Protected routes use:

```http
Authorization: Bearer <access_token>
```

A successful login returns `access_token` and `token_type: "bearer"`. The JWT includes the user ID in `sub`, the role in `role`, the organisation ID in `org`, and an expiry in `exp`. The default access-token lifetime is 60 minutes unless `ACCESS_TOKEN_MINUTES` is configured.

Pydantic schemas reject malformed values before service execution. The application registers custom exception handlers in `core/handlers.py`; consult those handlers for the exact error response envelope. Typical HTTP semantics include 200 for reads/updates, 201 for creation, 204 for deletion, 401 for missing/invalid authentication, 403 for role/password restrictions, 404 for missing or out-of-scope resources, 409 for conflicts and 422 for schema validation.

## Endpoint groups

The following paths are relative to the API root.

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/auth/signup` | Public | Create an organisation and initial user according to signup rules |
| POST | `/auth/login` | Public | Authenticate using identifier and password |
| PATCH | `/auth/change-password` | Authenticated | Change the current user's password |
| POST | `/businesses` | Operator or field agent | Create a business |
| GET | `/businesses` | Operator or field agent | List organisation businesses |
| GET | `/businesses/{business_id}` | Operator or field agent | Retrieve a business |
| PATCH | `/businesses/{business_id}` | Operator or field agent | Update business details |
| GET | `/businesses/{business_id}/profile` | Operator or field agent | Retrieve derived business load profile |
| POST | `/sites` | Operator | Create a site |
| GET | `/sites` | Operator or field agent | List sites |
| GET | `/sites/{site_id}` | Operator or field agent | Retrieve a site |
| PATCH | `/sites/{site_id}` | Operator | Update a site |
| GET | `/sites/{site_id}/spare-capacity` | Operator | Retrieve calculated spare-capacity information |
| POST | `/sites/{site_id}/profiles` | Operator | Create a versioned site profile |
| GET | `/sites/{site_id}/profiles` | Operator | List site profiles |
| GET | `/sites/{site_id}/profiles/latest` | Operator | Retrieve latest site profile |
| POST | `/sites/{site_id}/profiles/import` | Operator | Parse a monitoring CSV export |
| POST | `/devices` | No user dependency visible in current router | Register a sensor device; review security section |
| GET | `/devices` | No user dependency visible in current router | List devices by supplied organisation ID |
| PATCH | `/devices/{device_id}/status` | No user dependency visible in current router | Change device status |
| POST | `/assignments` | Operator or field agent | Install a meter on a business |
| GET | `/assignments` | Operator or field agent | List assignments; optional business/device/open filters |
| GET | `/assignments/{assignment_id}` | Operator or field agent | Retrieve assignment |
| POST | `/assignments/{assignment_id}/remove` | Field agent | Remove a meter; request must confirm buffer upload |
| POST | `/scenarios` | Operator | Run a scenario |
| POST | `/scenarios/compare-sites` | Operator | Compare selected businesses across sites |
| GET | `/scenarios` | Operator | List/filter scenarios |
| GET | `/scenarios/{scenario_id}` | Operator | Retrieve scenario details |
| PATCH | `/scenarios/{scenario_id}` | Operator | Rename a scenario |
| DELETE | `/scenarios/{scenario_id}` | Operator | Delete a scenario |
| GET | `/health` | Public | Health check |

The sensor-device router currently has no authentication dependency in its route definitions and accepts `organisation_id`/`registered_by` from request data or query parameters. This is a security gap, not a recommended public API design. See [Security](security.md).

## Important data models

| Entity | Role |
|---|---|
| Organisation | Tenant boundary for users, sites and devices |
| User | Operator or field agent account |
| Site | Mini-grid location owned by an organisation |
| SiteProfile | Versioned technical and operational assumptions for a site |
| Business | SME load and operating information |
| SensorDevice | Registered metering device and status |
| MeterAssignment | Association between one device and one business over an installation period |
| Reading | Time-stamped electrical measurements associated with an assignment/business |
| Scenario | Assessment inputs, outcome, check results and simulation output |
| ScenarioBusiness | Business membership and recorded pursue/not-pursue decision |

## Reading ingestion status

The `reading` table/model exists and defines fields and database constraints, but the supplied backend source has no `/readings` router, public ingestion schema, or service for accepting device measurements. Do not use the existence of the model as evidence that live telemetry is being received. The current business-profile service reads persisted readings; a separate ingestion implementation is required to populate them.

## Testing and standards

Run:

```bash
uv run pytest
uv run pytest --cov
uv run ruff check .
```

The project uses pytest, pytest-cov and Ruff. The exact CI workflow is defined under `.github/workflows/` in the backend repository. Keep routers thin, validate inputs in Pydantic schemas, place workflow logic in services and database queries in repositories. Add tests for both successful behaviour and permission/validation failures.

## Deployment

The team has identified Heroku as the backend hosting platform. The exact app name, configured environment variables, database add-on and release pipeline must be confirmed from the live Heroku settings and repository deployment workflow. See [Deployment](deployment.md).
