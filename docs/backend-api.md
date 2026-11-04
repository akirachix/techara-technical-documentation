# Backend API

The GridFit backend provides the API and application services used to manage organisations, sites, businesses, metering information and assessment scenarios.

## API overview

GridFit uses **FastAPI** to expose REST-style HTTP endpoints. The application is created in `main.py` with the title `GridFit API`.

The backend uses SQLAlchemy for database access and Pydantic schemas for request validation and response serialization.

The application registers these router groups:

- Authentication
- Businesses
- Sites
- Site profiles
- Sensor devices
- Meter assignments
- Scenarios

A health endpoint is also registered at `GET /health`.

## Hosted API

A production API URL has not been confirmed in the supplied backend configuration.

The supplied Postman collection uses the following local development address:

`http://127.0.0.1:8000`

When the application is running, FastAPI provides interactive API documentation at `/docs` and an OpenAPI specification at `/openapi.json`.

## Prerequisites

The backend development environment requires:

- Python
- pip
- Git
- Access to the configured database
- The backend repository and its dependency files
- The environment variables required by the application

Use the Python version and database configuration specified by the backend repository. Local development settings should not automatically be treated as production settings.

## Architecture layers

The backend separates HTTP handling, validation, business logic and database access.

| Layer | Responsibility |
|---|---|
| `main.py` | Creates the FastAPI application and registers routers and exception handlers. |
| Routers | Define HTTP endpoints, dependencies and response models. |
| Schemas | Validate incoming data and define response structures. |
| Services | Implement application and business logic. |
| Repositories | Encapsulate database queries and persistence operations. |
| Models | Represent database entities using SQLAlchemy. |
| Core | Contains shared application functionality, including roles, dependencies and exception handling. |
| Database | Provides database sessions to application components. |

The router layer delegates application operations to services instead of implementing all business logic directly inside endpoint functions.

## API conventions

The supplied Postman collection documents the following conventions:

| Convention | Description |
|---|---|
| Local base URL | `http://127.0.0.1:8000` |
| Request format | JSON |
| Response format | JSON |
| Authentication | Bearer token for authenticated requests |
| Correlation header | `X-Correlation-ID` |
| Resource identifiers | UUIDs are used by several resource routes. |

### HTTP status codes

The business and site creation endpoints return `201 Created` when a resource is created successfully.

Other response status codes depend on the endpoint operation and its validation, authentication and error-handling rules.

### Authentication

Authenticated requests use a Bearer token in the HTTP `Authorization` header:

`Authorization: Bearer <access-token>`

The exact authentication requirements should be checked against each endpoint's dependencies and the generated OpenAPI specification.

### Error handling

The application registers custom exception handlers through `register_exception_handlers(app)` in `main.py`.

Refer to the backend exception-handler implementation for the exact error response structure and status-code mapping.

## Endpoint reference

The following endpoints are confirmed in the inspected backend router definitions.

### Health

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Returns the API health status. |

### Businesses

Base path: `/businesses`

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/businesses` | Create a business. |
| GET | `/businesses` | List businesses. |
| GET | `/businesses/{business_id}` | Retrieve a business. |
| PATCH | `/businesses/{business_id}` | Update a business. |
| GET | `/businesses/{business_id}/profile` | Retrieve a business profile. |

### Sites

Base path: `/sites`

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/sites` | Create a site. |
| GET | `/sites` | List sites. |
| GET | `/sites/{site_id}` | Retrieve a site. |
| PATCH | `/sites/{site_id}` | Update a site. |
| GET | `/sites/{site_id}/spare-capacity` | Retrieve site spare-capacity information. |

### Sensor devices

Base path: `/devices`

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/devices` | Register a sensor device. |
| GET | `/devices` | List sensor devices. |
| PATCH | `/devices/{device_id}/status` | Update a device status. |

The device listing endpoint accepts an `organisation_id` query parameter and an optional `status` parameter.

The status-update endpoint also requires `organisation_id`.

### Meter assignments

Base path: `/assignments`

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/assignments` | Create a meter assignment. |
| GET | `/assignments` | List meter assignments. |
| GET | `/assignments/{assignment_id}` | Retrieve an assignment. |
| POST | `/assignments/{assignment_id}/remove` | Remove an assignment. |

The assignment listing endpoint supports these optional query parameters:

- `business_id`
- `device_id`
- `open_only` (defaults to `false`)

## Role-based access control

GridFit uses role-based access control to restrict selected operations.

The inspected router definitions show the following permissions:

| Resource | Operation | Required role |
|---|---|---|
| Businesses | Create, list, retrieve and update | All roles |
| Business profiles | Retrieve profile | All roles |
| Sites | Create | Operator |
| Sites | List and retrieve | All roles |
| Sites | Update | Operator |
| Sites | View spare capacity | Operator |
| Meter assignments | Create, list and retrieve | All roles |
| Meter assignments | Remove | Field agent |

### Sensor-device permissions

The inspected sensor-device router does not show explicit role dependencies on its listed endpoints. Its access-control requirements should be verified against the authentication dependencies and security configuration before production deployment.

### Organisation-level access

Business and site operations use organisation context to scope access to resources. The backend services and repositories should enforce these boundaries when retrieving or modifying organisation-owned records.

## Data models

GridFit uses SQLAlchemy models to represent its core application data.

The ten identified entities are:

| Entity | Purpose |
|---|---|
| Organisation | Represents an organisation using GridFit. |
| User | Stores user account information and organisation membership. |
| Site | Represents a mini-grid site being managed or assessed. |
| Site profile | Stores site capacity and operational profile information. |
| Business | Represents a productive-use business registered on a site. |
| Sensor device | Represents a metering or monitoring device. |
| Meter assignment | Links a sensor device to a business for metering. |
| Reading | Stores recorded metering measurements. |
| Scenario | Represents a feasibility assessment scenario. |
| Scenario business | Associates businesses with assessment scenarios. |

### Data relationships

The entities work together to support organisation management, site registration, business onboarding, metering and scenario assessment.

Organisation and user records provide the organisational context for application access. Sites and site profiles describe the electricity supply context. Businesses, sensor devices, meter assignments and readings support the collection of business-level electricity information. Scenarios and scenario-business records support feasibility assessment workflows.

## Testing

GridFit backend testing uses pytest for automated tests. Shared fixtures are defined in `conftest.py`.

### Running automated tests

Run backend tests from the backend repository, not the documentation repository.

Activate the backend virtual environment, install the dependencies specified by the backend project, and execute:

`pytest`

For more detailed output, execute:

`pytest -v`

### API testing

A Postman collection is available for manually testing the API.

The collection includes health-check and business-operation requests. Authenticated requests use Bearer-token authentication.

Recommended API test coverage includes:

- Resource creation and retrieval
- Request validation
- Resource updates
- Authentication and authorisation
- Organisation-level access boundaries
- Meter assignment operations
- Scenario assessment workflows

Test results should be reviewed before release. The existence of test files does not establish that all tests pass.

## Code standards and project structure

The backend follows a layered application structure that separates routing, validation, business logic and database operations.

The main implementation conventions are:

- **Routers:** Define HTTP methods, endpoint paths, dependencies and response models.
- **Schemas:** Define request validation and response structures.
- **Services:** Handle application workflows and business rules.
- **Repositories:** Encapsulate database queries and persistence.
- **Models:** Represent database entities.
- **Core:** Provides shared dependencies, role definitions and exception handling.

### Development practices

- Keep endpoint handlers focused on HTTP request and response handling.
- Place business logic in the appropriate service layer.
- Use schemas to validate incoming data.
- Keep database queries within repository or data-access components.
- Apply organisation-level access restrictions consistently.
- Add or update tests when introducing or changing functionality.
- Use focused feature branches and pull requests for code changes.

## Deployment

The production deployment environment and hosting provider have not been confirmed in the supplied backend configuration.

Before deployment:

1. Configure the production database connection.
2. Set all required environment variables and secrets.
3. Apply the database migrations using the project's migration process.
4. Configure the production API server and network access.
5. Verify authentication and organisation-level access controls.
6. Run the automated test suite.
7. Verify the health endpoint and API documentation.
8. Review application logs and error handling.

The local development server should not be treated as a production deployment.

