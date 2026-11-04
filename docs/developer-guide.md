# Developer Guide

This guide explains how to set up, navigate, test and contribute to the GridFit codebase. It is intended for developers joining the project and existing team members maintaining its services.

## Development environment

### Backend prerequisites

The backend requires:

- Python 3.11 or newer.
- [uv](https://docs.astral.sh/uv/) for environment and dependency management.
- Git.
- Access to the configured development database.

The backend dependencies and tool configuration are defined in `pyproject.toml`.


## Backend setup

Clone the backend repository and enter its directory:

    git clone <backend-repository-url>
    cd techara-backend

Create the environment and install dependencies:

    uv venv
    uv pip install -r pyproject.toml --group dev

Start the development server:

    uv run --no-sync uvicorn main:app --reload

The API is available at `http://localhost:8000`. Its useful endpoints are `/health`, `/docs` and `/openapi.json`.

## Environment configuration

Store local configuration in `.env` where required. Never commit credentials, access tokens, database passwords or production secrets. Keep local, test and production configuration separate. Consult the backend README and configuration implementation for the required variables.

## Project structure and code standards

The backend follows a layered structure:

| Directory | Responsibility |
|---|---|
| `core/` | Shared configuration, security, dependencies and exception handling |
| `engine/` | Feasibility checks, evaluation and simulation |
| `models/` | SQLAlchemy database models |
| `repositories/` | Database queries and persistence operations |
| `routers/` | FastAPI endpoint definitions |
| `schemas/` | Request and response validation |
| `services/` | Application and business logic |
| `migrations/` | Alembic database migrations |
| `tests/` | Automated backend tests |

### Global code standards

- Keep API route handlers focused on HTTP concerns.
- Put business logic in service modules.
- Use repositories for database access.
- Use Pydantic schemas to validate request and response data.
- Keep database models and API schemas separate.
- Preserve organisation-level data boundaries when accessing resources.
- Add or update tests when changing application behaviour.
- Avoid committing generated files, local databases, credentials or environment files.

### Testing conventions

The backend uses pytest. Test configuration is defined in `pyproject.toml`, with test discovery rooted at `tests/`.

| Test location | Coverage area |
|---|---|
| `tests/api/` | API endpoints, request validation and access guards |
| `tests/engine/` | Feasibility rules and engine behaviour |
| `tests/` | Authentication, models, services and other backend modules |

Run the automated test suite with coverage:

    uv run --no-sync pytest --cov --cov-report=term-missing

Run tests without coverage:

    uv run --no-sync pytest

Run a specific test module:

    uv run --no-sync pytest tests/test_health.py

### Linting and formatting

Ruff is used for linting and formatting. Run these checks before submitting changes:

    uv run --no-sync ruff check .
    uv run --no-sync ruff format --check .

Apply automatic formatting with:

    uv run --no-sync ruff format .

The configured line length is 88 characters and the Ruff target is Python 3.11.

## Git workflow

The repository history shows feature development in separate branches and integration through pull requests. The current team history uses `develop` as its integration branch. The starter README also describes a `main`-based workflow, so confirm the target branch with the team before opening a pull request.

Recommended branch naming patterns observed in the repository include:

| Change type | Example |
|---|---|
| Feature | `feature/business-create` |
| Feature (short form) | `feat/business-endpoints` |
| Bug fix | `fix/heroku-postgres-url` |
| Documentation | `docs/gridfit-documentation` |

A typical contribution sequence is:

1. Update the intended base branch.
2. Create a branch for the specific change.
3. Implement the change and add or update tests.
4. Run the test, lint and formatting checks.
5. Commit and push the branch.
6. Open a pull request with a clear description and testing evidence.
7. Address review feedback and merge through the agreed team process.

### Commit messages

The Git history contains conventional prefixes such as `feat`, `fix`, `test`, `style` and `refactor`.

Use a concise format:

    type: short description

Examples:

    feat: add business profile endpoint
    fix: handle legacy database URLs
    test: cover meter assignment validation
    docs: update GridFit developer guide

Describe the actual change rather than using vague messages such as `updates` or `final changes`.

## Ownership and collaboration

The codebase is divided into backend areas such as authentication, businesses, sites, meter assignments, sensor devices, site profiles and scenarios. The Git branch history also reflects feature-based contributions.

Individual maintainer assignments are not established by the repository structure alone. Confirm current ownership, reviewers and handover responsibilities with the project team before changing shared modules.

When changing a shared service, schema, model or API contract, check for dependent routers, frontend consumers and tests before merging.

## Common problems and troubleshooting

| Problem | Likely cause | Recommended action |
|---|---|---|
| Python version error | Python version is below the project requirement | Use Python 3.11 or newer. |
| Missing dependency | Project dependencies have not been installed | Run `uv pip install -r pyproject.toml --group dev` from the backend repository. |
| Wrong virtual environment | Another repository virtual environment is active | Change to the backend repository and activate or run its own environment. |
| Database connection failure | Incorrect database URL or unavailable database | Check local environment configuration and database availability. |
| Migration failure | Migration history or database schema is inconsistent | Inspect Alembic migration history before applying or repairing migrations. |
| API returns 401 or 403 | Missing, invalid or insufficient credentials or permissions | Check the access token, user role and organisation context. |
| Ruff reports a syntax error | Invalid Python syntax in a source or migration file | Inspect the reported file and line, correct the syntax, then rerun Ruff. |
| Tests fail | A regression, invalid fixture or environment issue | Read the failing assertion and traceback, then reproduce the test individually. |
| API documentation is unavailable | Server failed to start or the wrong URL is being used | Check server output and confirm the API is running on the expected port. |

### Before submitting changes

Use this checklist before opening or updating a pull request:

- [ ] Confirm the intended base branch with the team.
- [ ] Keep the change focused on the assigned feature or fix.
- [ ] Update tests for changed behaviour.
- [ ] Run the backend test suite.
- [ ] Run Ruff lint and formatting checks.
- [ ] Check database migrations where applicable.
- [ ] Review the diff for credentials, local databases and generated files.
- [ ] Include testing evidence in the pull request description.

## Related documentation

- [Backend API](backend-api.md)
- [Architecture](architecture.md)
- [Rules engine](rules-engine.md)
- [Frontend web application](frontend-web.md)
- [Field application](field-app.md)
- [Security](security.md)
- [Deployment](deployment.md)
