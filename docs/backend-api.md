# Backend / API

The GridFit backend provides the application services behind organisation management, mini-grid site configuration, business registration, meter installation, reading collection and feasibility assessment.

It is implemented as a **FastAPI application** backed by PostgreSQL. Its architecture separates HTTP routing, request validation, business workflows, database access and the rules engine.

<div class="grid cards" markdown>

-   **Application**

    ---

    FastAPI · Python

    `GridFit API` · v0.1.0

-   **Persistence**

    ---

    PostgreSQL

    SQLAlchemy ORM

-   **Security**

    ---

    JWT bearer authentication

    Operator and field-agent roles

-   **Assessment**

    ---

    Rules-based feasibility checks

    Battery and energy calculations

</div>

---

## 01 · Backend architecture

### Application structure

### Application entry point

The following excerpt is taken from `main.py` in the uploaded backend checkout. It shows the actual routers registered by the application.

```python
from fastapi import FastAPI

from core.handlers import register_exception_handlers
from routers import (
    businesses,
    meter_assignments,
    scenarios,
    sensor_devices,
    site_profiles,
    sites,
)
from routers.auth import router as auth_router

app = FastAPI(title="GridFit API")
register_exception_handlers(app)

app.include_router(auth_router)
app.include_router(meter_assignments.router)
app.include_router(sensor_devices.router)
app.include_router(scenarios.router)
app.include_router(businesses.router)
app.include_router(sites.router)
app.include_router(site_profiles.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
```

The application entry point is `main.py`. It creates the FastAPI instance, configures CORS, exposes the root and health-check routes, and registers the feature routers.

The consolidated reference implementation is organised into the following layers:

| Layer | Directory / file | Responsibility |
|---|---|---|
| Application | `main.py` | Creates the API and registers routers |
| Routers | `routers/` | Defines HTTP endpoints and access dependencies |
| Schemas | `schemas/` | Validates request data and structures responses |
| Services | `services/` | Coordinates application workflows and business rules |
| Repositories | `repositories/` | Reads and writes database records |
| Models | `models/` | Defines SQLAlchemy entities and relationships |
| Core | `core/` | Configuration, security, errors and local-time utilities |
| Rules engine | `engine/` | Performs energy, battery and feasibility calculations |
| Tests | `tests/` | Exercises API behaviour, workflows and calculations |

### Request processing

The router handles the HTTP interface, while services coordinate workflows and repositories handle persistence. The rules engine is used by scenario assessment rather than placing calculation logic inside route handlers.

### Feature integration

The reference backend combines five feature contributions:

| Integration order | Feature area | Main responsibilities |
|---|---|---|
| 01 | Accounts and users | Authentication, organisation and user management |
| 02 | Sites | Site records, technical profiles and CSV imports |
| 03 | Businesses and decisions | Business registration, measured profiles and decisions |
| 04 | Meters and readings | Device registration, installation, ingestion and alerts |
| 05 | Rules engine and scenarios | Feasibility checks, simulation and scenario results |

This is the documented integration order used by the team. The consolidated `complete-reference/` directory brings the contributions together for comparison and local execution.

---

## 02 · Runtime and configuration

### Technology stack

| Component | Implementation |
|---|---|
| API framework | FastAPI |
| Data validation | Pydantic |
| ORM | SQLAlchemy |
| Database | PostgreSQL |
| Authentication | PyJWT |
| Password hashing | `pwdlib` recommended password hasher |
| Testing | Pytest and FastAPI TestClient |
| Code quality | Ruff |
| API specification | FastAPI OpenAPI documentation |

### Application configuration

### Database engine and session factory

The database module reads `DATABASE_URL`, normalises it and creates the SQLAlchemy engine. SQLite connections receive the compatibility functions shown below.

```python
DATABASE_URL = normalize_database_url(os.getenv("DATABASE_URL"))

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set.")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

if DATABASE_URL.startswith("sqlite"):

    @event.listens_for(engine, "connect")
    def _sqlite_setup(dbapi_conn, _):
        dbapi_conn.create_function("gen_random_uuid", 0, lambda: uuid.uuid4().hex)
        dbapi_conn.create_function(
            "now", 0, lambda: datetime.now(timezone.utc).isoformat()
        )


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


```

Settings are defined in `core/config.py`. Pydantic Settings loads values from a `.env` file and environment variables. Unrecognised settings are ignored.

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql+psycopg2://postgres:postgres@localhost:5432/gridfit` | PostgreSQL connection string |
| `JWT_SECRET` | Development placeholder | Secret used to sign access tokens |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_MINUTES` | `720` | Access-token lifetime in minutes |
| `METER_OFFLINE_AFTER_HOURS` | `6` | Offline threshold used by meter status logic |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Permitted frontend origins |

**Production configuration:** Replace the development JWT secret with a strong, private secret. Do not commit `.env` files or expose credentials in source control. Configure the production database URL and permitted CORS origins for the deployed frontend.

### Local development

The backend repository README documents the following workflow:

1. Install the Python dependencies using the repository's `uv` configuration.
2. Create the development and test PostgreSQL databases.
3. Run the seed script to initialise the application with demonstration data.
4. Start the FastAPI development server.

The README lists these commands:

```bash
uv pip install -r pyproject.toml
uv pip install httpx2 pytest-cov

createdb gridfit
createdb gridfit_test

python seed.py
uvicorn main:app --reload
```

**Repository setup note:** The consolidated `complete-reference/` directory does not contain `pyproject.toml` or a dependency lock file. The commands above are the workflow documented by the parent repository, not a verified standalone installation procedure for that directory. Confirm that the dependency manifest is present in the runnable backend repository before using the installation command.

The default database URL points to a local PostgreSQL database named `gridfit`. The seed script creates the schema through SQLAlchemy metadata and inserts demonstration records.

Once the server is running, the API documentation is available at:

- `http://localhost:8000/docs` — interactive Swagger UI.
- `http://localhost:8000/openapi.json` — OpenAPI specification.
- `http://localhost:8000/` — root service response.
- `http://localhost:8000/health` — health check.

The root route returns:

```json
{
  "status": "ok",
  "service": "gridfit-api"
}
```

The health route returns:

```json
{
  "status": "ok"
}
```

---

## 03 · Authentication and access control

GridFit uses bearer JWT authentication for user-facing protected endpoints. Authentication and role checks are implemented through dependencies in `dependencies.py`.

### User authentication lifecycle

### JWT claims and lifetime

### Token creation

The JWT payload includes the user ID, role, organisation ID and expiry. The signing secret is required from the environment.

```python
def create_access_token(user_id, role, organisation_id, expires_minutes=None):
    expire = datetime.now(UTC) + timedelta(
        minutes=expires_minutes if expires_minutes is not None else get_token_minutes()
    )
    payload = {
        "sub": str(user_id),
        "role": role,
        "org": str(organisation_id),
        "exp": expire,
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=ALGORITHM)


```

The access token contains:

| Claim | Meaning |
|---|---|
| `sub` | User ID |
| `org` | Organisation ID |
| `role` | User role |
| `exp` | Token expiration time |

The default signing algorithm is HS256, and the default token lifetime is 720 minutes.

Protected requests use:

```http
Authorization: Bearer <access_token>
```

### Roles and dependencies

### Password-change and role guards

These dependencies enforce the temporary-password requirement before checking the user's role.

```python
def require_password_changed(
    current_user: User = Depends(get_current_user),
):
    if current_user.must_change_password:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must change your temporary password before continuing.",
        )

    return current_user


```

| Dependency | Access rule |
|---|---|
| `TemporaryUser` | Valid, active authenticated user; permits password-change workflow |
| `CurrentUser` | Authenticated user who has completed the required password change |
| `Operator` | Authenticated operator |
| `FieldAgent` | Authenticated field agent |

A user with a temporary password can access the endpoints that permit the password-change workflow. Ordinary protected routes reject the user until the password has been changed.

The role dependencies enforce the distinction between operator and field-agent operations. The endpoint reference below identifies the required access level for each route.

### Password and device-token protection

- User passwords are hashed using `pwdlib`'s recommended password hasher.
- Temporary passwords are generated using Python's secure random generator.
- Meter device tokens are generated using `secrets.token_urlsafe(32)`.
- Device tokens are stored as SHA-256 hashes.
- Token comparisons use `hmac.compare_digest`.

---

## 04 · API endpoint reference

All paths below are relative to the API root. Access labels describe the dependencies declared in the consolidated reference routers.

### Authentication

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/auth/signup` | Public | Create an organisation and initial account |
| POST | `/auth/login` | Public | Authenticate a user |
| POST | `/auth/change-password` | TemporaryUser | Change a temporary password |
| GET | `/auth/me` | TemporaryUser | Retrieve the current user's account |

### Users and organisation

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/users` | Operator | List organisation users |
| POST | `/users` | Operator | Create a user |
| PATCH | `/users/me` | CurrentUser | Update the current user's profile |
| POST | `/users/{user_id}/deactivate` | Operator | Deactivate a user |
| GET | `/organisation` | CurrentUser | Retrieve organisation details |
| PATCH | `/organisation` | Operator | Update organisation details |

### Sites and site profiles

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/sites/suggested-settings` | Operator | Retrieve suggested profile settings |
| POST | `/sites` | Operator | Create a site |
| GET | `/sites` | CurrentUser | List accessible sites |
| GET | `/sites/{site_id}` | CurrentUser | Retrieve a site |
| PATCH | `/sites/{site_id}` | Operator | Update site details |
| GET | `/sites/{site_id}/profiles` | Operator | List site profiles |
| POST | `/sites/{site_id}/profiles` | Operator | Create a site profile |
| GET | `/sites/{site_id}/profiles/current` | Operator | Retrieve the current profile |
| GET | `/sites/{site_id}/spare-capacity` | Operator | Calculate spare capacity |
| POST | `/sites/{site_id}/import` | Operator | Import site monitoring data from CSV |

The CSV import endpoint accepts a multipart file and form fields for the timestamp, load and solar columns. The `timestamps_in` field accepts `local` or `utc`, with `local` as its default.

### Businesses and decisions

### Business creation service

This excerpt demonstrates organisation-scoped site lookup, duplicate-name checking and construction of the business record.

```python
    def create_business(self, db, data, current_user):
        site = site_repository.get_for_organisation(
            db,
            data.site_id,
            current_user.organisation_id,
        )

        if site is None:
            raise NotFoundError("Site not found")

        if business_repository.get_by_name(db, site.site_id, data.business_name):
            raise ConflictError(
                f"Business '{data.business_name}' already exists at this site."
            )

        business = Business(
            site_id=site.site_id,
            logged_by=current_user.user_id,
            business_name=data.business_name,
            business_type=data.business_type,
            owner_first_name=data.owner_first_name,
            owner_last_name=data.owner_last_name,
            owner_phone=data.owner_phone,
            operating_hours=data.operating_hours,
            days_per_month=data.days_per_month,
            startup_power_kw=data.startup_power_kw,
            startup_duration_s=data.startup_duration_s,
            startup_data_label=data.startup_data_label,
        )

        try:
            return business_repository.create(db, business)
        except IntegrityError:
            db.rollback()
            existing = business_repository.get_by_name(
                db, data.site_id, data.business_name
            )
            if existing:
                raise ConflictError(
                    f"Business '{data.business_name}' already exists at this site."
                )
            raise

```

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/businesses` | CurrentUser | Register a business |
| GET | `/businesses` | CurrentUser | List businesses; supports optional filters |
| GET | `/businesses/{business_id}` | CurrentUser | Retrieve a business |
| PATCH | `/businesses/{business_id}` | CurrentUser | Update business information |
| POST | `/businesses/{business_id}/status` | Operator | Update business connection status |
| GET | `/businesses/{business_id}/profile` | CurrentUser | Retrieve a measured business profile |
| PUT | `/scenarios/{scenario_id}/businesses/{business_id}/decision` | Operator | Record a business decision |

The business listing supports optional `site_id`, `connection_status` and `mine` query parameters.

### Meters, installations and readings

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/meters` | Operator | Register a meter |
| GET | `/meters` | CurrentUser | List meters |
| PATCH | `/meters/{device_id}/status` | Operator | Update meter status |
| POST | `/installs` | FieldAgent | Install a meter on a business |
| GET | `/installs` | CurrentUser | List meter installations |
| POST | `/installs/{assignment_id}/remove` | FieldAgent | Remove an installed meter |
| POST | `/readings` | Device-token validation | Submit a batch of readings |
| GET | `/alerts/meters` | CurrentUser | Retrieve meter alerts |

The installations listing supports an optional `only_open` boolean filter.

### Scenarios and feasibility assessment

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/scenarios` | Operator | Run a feasibility scenario |
| GET | `/scenarios` | Operator | List scenarios; supports optional `site_id` |
| GET | `/scenarios/{scenario_id}` | Operator | Retrieve scenario details |
| DELETE | `/scenarios/{scenario_id}` | Operator | Delete a scenario |

### System endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/` | Public | Confirm the service is responding |
| GET | `/health` | Public | Health check |

---

## 05 · Meter readings and ingestion

> **Current-checkout note:** The uploaded `main.py` does not register a readings router. The following implementation excerpt is from the meter-assignment service, which is registered under `/assignments`.

### Meter installation and device-token handling

The service generates a random device token, stores its hash on the assignment and returns the raw token once in the creation response.

```python
        token = generate_device_token()
        assignment = MeterAssignment(
            device_id=device.device_id,
            business_id=business.business_id,
            device_token_hash=hash_device_token(token),
            installed_by=current_user.user_id,
        )

        try:
            assignment = meter_assignment_repository.create(db, assignment)
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=409,
                detail="Device or business already has an open meter installed",
            )

        return MeterAssignmentCreated(
            **MeterAssignmentRead.model_validate(assignment).model_dump(),
            device_token=token,
        )

```

Reading ingestion is a separate security flow from normal user authentication.

The `/readings` route does not declare a JWT user dependency. Instead, the ingestion service validates the submitted device token against the hash associated with the meter's installation assignment.

### Reading submission

The request body uses the `ReadingBatch` schema. It contains a `readings` array with a minimum of one and a maximum of 1,000 readings.

Each reading includes:

| Field | Description |
|---|---|
| `device_serial` | Registered meter serial number |
| `device_token` | Device authentication token |
| `measured_at` | Timezone-aware measurement timestamp |
| `voltage_v` | Voltage measurement |
| `current_a` | Current measurement |
| `power_w` | Power measurement |
| `energy_total_kwh` | Cumulative energy counter |

### Reading validation checks

### Measurement validation rules

| Measurement | Rule |
|---|---|
| Voltage | Must be between 0 and 300 V inclusive |
| Current | Must be non-negative |
| Power | Must be non-negative |
| Energy counter | Must be non-negative |
| Device serial | Must match a registered device |
| Installation period | Measurement timestamp must fall within an installation window |
| Device token | Must match the stored installation token hash |

Duplicate detection uses the combination of installation assignment and measurement timestamp. A duplicate is counted rather than inserted again.

### Ingestion response

The `IngestResult` response reports:

- `accepted`: number of readings inserted.
- `duplicates`: number of duplicate readings detected.
- `rejected`: rejected readings, each with its batch index and reason.

The service commits accepted readings after processing the batch.

**Integration note:** The reading endpoint uses device-token validation, not the ordinary user JWT dependency. Device credentials should therefore be treated as secrets and protected in transit.

---

## 06 · Data model

### Feasibility outcome selection

The current evaluator checks power, startup, energy and battery results in a fixed order. A failed check produces `not_feasible`; unknown or within-margin checks produce `conditionally_feasible`.

```python
def decide_outcome(results):
    statuses = [results[name]["status"] for name in CHECK_ORDER]
    if FAIL in statuses:
        return "not_feasible"
    if UNKNOWN in statuses or any(
        results[name]["within_margin"] for name in CHECK_ORDER
    ):
        return "conditionally_feasible"
    return "feasible"


```

The SQLAlchemy models describe the relationships between organisations, users, sites, businesses, meters, measurements and scenarios.

| Entity | Responsibility |
|---|---|
| Organisation | Tenant boundary for application data |
| User | Operator and field-agent accounts |
| Site | Mini-grid location belonging to an organisation |
| SiteProfile | Versioned technical and operational site assumptions |
| Business | Productive-use business registered against a site |
| SensorDevice | Registered meter and device status |
| MeterAssignment | Connects a meter to a business during an installation period |
| Reading | Time-stamped electrical measurements |
| Scenario | Stores feasibility inputs, results and simulation output |
| ScenarioBusiness | Links businesses to scenarios and records decisions |

### Main relationships

The models use PostgreSQL-specific UUID and JSONB types. PostgreSQL is therefore the documented database target for the consolidated implementation.

---

## 07 · Testing and quality assurance

The backend uses Pytest and FastAPI's `TestClient` for API and workflow testing. The test suite covers authentication, users, sites, CSV import, businesses, decisions, meters, readings, the rules engine and scenarios.

### Test database

The test configuration reads `TEST_DATABASE_URL` and assigns it to `DATABASE_URL` before importing the application database module.

Its default is:

```text
postgresql+psycopg2://postgres:postgres@localhost:5432/gridfit_test
```

The test fixtures create the database schema before the test session and truncate tables between tests. At the end of the session, they drop the schema.

**Warning:** Run the test suite only against a dedicated test database. The test fixture is destructive and must never be pointed at production or a database containing data that needs to be retained.

### Quality checks

The contributor READMEs document these checks:

```bash
ruff check .
ruff format --check .
pytest
```

For coverage reporting, the repository README also documents installing `pytest-cov` and running:

```bash
pytest --cov
```

The team README reports 64 passing tests after the five feature contributions were integrated. This is a recorded integration result, not a live test result for every subsequent code revision.

---

## 08 · Implementation notes and boundaries

### Battery simulation

The simulation processes each hour of each simulated day. Solar surplus charges the battery within its limits; a deficit discharges it and records any unmet demand.

```python
def simulate(load_kw, solar_kw, limits, initial_stored, days):
    stored = min(max(initial_stored, limits["min_stored"]), limits["max_stored"])
    stored_trace = []
    unserved_trace = []
    curtailed_trace = []
    lowest = stored
    for _ in range(days):
        for hour in range(24):
            net = solar_kw[hour] - load_kw[hour]
            unserved = 0.0
            curtailed = 0.0
            if net >= 0:
                room = (limits["max_stored"] - stored) / limits["charge_efficiency"]
                charge_in = max(min(net, limits["max_charge_kw"], room), 0.0)
                stored += charge_in * limits["charge_efficiency"]
                curtailed = net - charge_in
            else:
                need = -net
                available = (stored - limits["min_stored"]) * limits[
                    "discharge_efficiency"
                ]
                discharge_out = max(
                    min(need, limits["max_discharge_kw"], available), 0.0
                )
                stored -= discharge_out / limits["discharge_efficiency"]
                unserved = need - discharge_out
            lowest = min(lowest, stored)
            stored_trace.append(round(stored, 4))
            unserved_trace.append(round(unserved, 4))
            curtailed_trace.append(round(curtailed, 4))
    return {
        "stored_kwh": stored_trace,
        "unserved_kwh": unserved_trace,
        "curtailed_kwh": curtailed_trace,
        "total_unserved_kwh": round(sum(unserved_trace), 4),
        "total_curtailed_kwh": round(sum(curtailed_trace), 4),
        "lowest_stored_kwh": round(lowest, 4),
    }
```

The following details are important when integrating the frontend or extending the backend.

### Database initialisation

The reference seed script uses SQLAlchemy `Base.metadata.create_all(engine)` to create tables before inserting demonstration data. The inspected reference implementation does not include an Alembic configuration or migration directory.

### Reading ingestion

The reading model and ingestion service are implemented. Device-token validation, installation-window checks, measurement validation and duplicate detection are present in the reference code.

### Notifications

The repository includes `services/notifier.py`, described in the team documentation as the integration point for future SMS or email delivery. Do not assume that a complete external notification provider is configured.

### Meter alerts

`GET /alerts/meters` calculates meter alert information for the application. The team documentation states that a separate notification table is not used for these alerts.

### Deployment

The reference source inspected here does not establish a verified production API URL, deployment environment, release pipeline or production database configuration. Obtain those details from the maintained deployment configuration before publishing production connection information.

---

## Related documentation

- [System Architecture](architecture.md)
- [Security](security.md)
- [Deployment](deployment.md)
