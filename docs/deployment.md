# Deployment

The team has identified Heroku for the backend, Vercel for the Next.js frontend and GitHub Pages for this MkDocs documentation site. The exact production project names, URLs, database add-on and environment settings must be verified in the respective hosting dashboards.

## Deployment architecture

| Component | Hosting target | Deployment evidence / note |
|---|---|---|
| FastAPI backend | Heroku | Confirm app name, release command and configured database from Heroku |
| Next.js frontend | Vercel | Confirm project, production domain and environment variables from Vercel |
| MkDocs documentation | GitHub Pages | Repository workflow publishes the documentation site |
| Informational website | Separate Vite/React project | Confirm its hosting target independently; do not assume it shares the Next.js deployment |
| Database | PostgreSQL is supported by the backend | Actual production provider/add-on is not established by the supplied source archive |

## Backend deployment (Heroku)

The backend repository includes a `Procfile`. Review it and the repository's deployment workflow before changing the start command. A typical ASGI process runs Uvicorn against `main:app`; use the command committed in the project rather than maintaining a second undocumented command.

Required production configuration includes:
- `JWT_SECRET` — strong, randomly generated signing secret.
- Database connection configuration used by `core/database_url.py`.
- `ACCESS_TOKEN_MINUTES` — optional; defaults to 60 minutes.
- Any provider-specific port binding expected by the Procfile/runtime.

Before release:
1. Confirm the Heroku app and connected database.
2. Configure secrets through Heroku Config Vars.
3. Confirm the Python runtime and dependency lockfile.
4. Run migrations using the release process approved by the team.
5. Deploy and verify `GET /health`.
6. Open the deployed `/docs` endpoint only if public API documentation is intended to be exposed.
7. Review logs for startup and database errors without printing secrets.

Do not run destructive schema changes manually against production. Back up the database and review Alembic migration behaviour before release.

## Frontend deployment (Vercel)

The frontend is a Next.js App Router project. Its package scripts include `build`, `start`, `lint` and formatting commands. The source references `BACKEND_URL` and `NEXT_PUBLIC_API_URL`; confirm which is used in each route and configure the correct value in Vercel.

- Server-only backend origins and credentials must not be exposed to the browser.
- Variables prefixed with `NEXT_PUBLIC_` are public.
- Preview and production environments should use the intended API environment.
- Verify authentication, API proxying, route refreshes and error states after deployment.

## Database and migrations

SQLAlchemy models use UUIDs, JSON/JSONB variants and relational constraints. Alembic manages schema changes. PostgreSQL is the intended production-class relational database, while SQLite is used in tests/local development in parts of the project.

The actual production database provider and add-on are not confirmed by the supplied files. Record the provider, plan, backup policy and connection variable name after checking the live Heroku configuration. Never publish connection strings.

## Documentation deployment

The documentation repository uses MkDocs Material. Its `mkdocs.yml` defines the navigation and theme. The GitHub Pages workflow is located under `.github/workflows/`.

Local validation:

```bash
python -m pip install -r requirements.txt
mkdocs build --strict
mkdocs serve
```

The production documentation URL is:

`https://akirachix.github.io/techara-technical-documentation/`

## Environment variables

| Variable | Used for | Exposure |
|---|---|---|
| `JWT_SECRET` | Backend JWT signing | Secret; backend only |
| `ACCESS_TOKEN_MINUTES` | Backend access-token lifetime; default 60 | Backend configuration |
| Database URL variable | SQLAlchemy database connection; exact name is defined in backend config | Secret; backend only |
| `BACKEND_URL` | Frontend server-side backend origin | Server-only unless code explicitly exposes it |
| `NEXT_PUBLIC_API_URL` | Public frontend API URL/configuration where referenced | Public browser value |

Set values in the hosting platform. Do not put actual values in documentation, source control or screenshots.

## CI/CD and release controls

The documentation repository includes a GitHub Pages workflow. The backend archive includes GitHub Actions workflow files and project configuration for pytest/Ruff checks; inspect the current workflow on the backend default branch for exact triggers and runner labels. The frontend package includes lint/build/test scripts and Husky/lint-staged hooks, but a successful local command is not evidence that a hosted deployment has completed.

For each release, record:
- Source commit SHA.
- Build/test result.
- Migration version.
- Deployment environment and time.
- Health-check result.
- Rollback procedure and responsible owner.

## Rollback

If a release causes a regression:
1. Stop further releases.
2. Identify whether the issue is application code, configuration or a database migration.
3. Re-deploy the last known-good application build where safe.
4. Do not blindly downgrade a migration that may have altered or deleted data.
5. Restore from a verified backup only under the team's incident procedure.
6. Add a regression test and document the incident.
