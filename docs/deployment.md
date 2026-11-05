# Deployment

This page explains how the GridFit backend and frontend are prepared, checked and released, how their runtime configuration is supplied, and how to verify a deployment. It distinguishes the deployment automation present in the supplied repositories from details that still need confirmation from the deployment owner.

The supplied backend repository contains a Heroku deployment workflow. The supplied frontend repository contains continuous-integration workflows for checks and builds, but no frontend deployment workflow was present in the inspected archive. Do not assume that the frontend is automatically released when the backend is deployed.

## 1. What runs where

| Part | Technology | Runtime or hosting evidence | Deployment evidence | Details |
|---|---|---|---|---|
| Backend API | FastAPI, Python 3.11 | Heroku-oriented `Procfile` is present | GitHub Actions workflow deploys `main` to Heroku | Backend repository |
| Database | SQLAlchemy; database engine selected by `DATABASE_URL` | SQLite is used in CI tests; production database provider is not confirmed by the inspected source | Alembic migrations are configured, but the deploy workflow does not run a migration command | Backend repository |
| Web application | Next.js 16, React 19 | Local Next.js server and backend proxy are configured | CI runs checks and a production build; no frontend deployment workflow was present | Frontend repository |
| Field experience | Next.js routes within the frontend application | Delivered as part of the web application | Same frontend release process; no separate mobile package is present in the inspected frontend source | Frontend repository |
| Documentation site | MkDocs Material | Local build produces the `site/` directory | No documentation publishing workflow was present in the inspected documentation configuration | Documentation repository |

The backend `Procfile` starts Uvicorn on the port provided by the hosting platform:

```procfile
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

The existence of a Heroku workflow confirms the intended backend deployment target in the supplied source. It does not confirm the current production app name, public URL, database add-on, or whether the production environment has already been configured.

### External services and dependencies

The supplied application source demonstrates these runtime boundaries:

| Service or dependency | Used for | Configuration |
|---|---|---|
| Relational database | Persistent application records | `DATABASE_URL` |
| Backend API | Authentication, business, site, scenario and meter-assignment operations | Backend service URL |
| Next.js server | Serves the web application and proxies selected requests to FastAPI | `BACKEND_URL` |
| Browser-side API helper | Calls the configured API base URL | `NEXT_PUBLIC_API_URL` in the JavaScript helper; TypeScript helper defaults to `/backend` |

No active production SMS, email, MQTT, cloud telemetry, map-tile or external AI provider integration is established by the inspected deployment files. Do not add these to a production service inventory without confirming their implementation and configuration.

### How the parts connect

The backend exposes the FastAPI application and a `/health` endpoint. The frontend is a Next.js application. Its server-side API route reads `BACKEND_URL` and forwards requests to the backend. The frontend also contains browser-side API helpers: one uses `NEXT_PUBLIC_API_URL` with a `http://localhost:8000` fallback, while the TypeScript helper defaults to `/backend`. `next.config.ts` rewrites `/backend/:path*` to `http://127.0.0.1:8000/:path*`.

These different API configuration paths must be reviewed together when preparing a production frontend. Confirm which helper each page imports and ensure that no production browser request falls back to a developer's localhost address.

## 2. Environments

| Setting | Local development / CI | Production |
|---|---|---|
| Backend process | Run locally with Uvicorn | Heroku-oriented `Procfile` and backend deploy workflow |
| Backend address | `http://localhost:8000` in the backend README | `HEROKU_APP_URL` is required by the deployment workflow; actual value is configured in GitHub environment |
| Database | CI sets `DATABASE_URL` to `sqlite://`; local development requires `DATABASE_URL` | Provider and connection value must be configured by the deployment owner |
| JWT signing key | CI uses a test-only `JWT_SECRET` | Production `JWT_SECRET` must be set outside source control |
| Frontend server | `npm run dev`, normally on port 3000 | Hosting platform and public URL are not identified in the inspected frontend repository |
| Frontend-to-backend URL | Local rewrite targets `127.0.0.1:8000` | Configure `BACKEND_URL` and review browser-side API base configuration |
| Automated checks | Self-hosted runner labelled `classroom-ci` | Backend deploy job also uses `self-hosted, classroom-ci` |
| Staging | No separate staging configuration was identified in the inspected workflow files | Confirm whether a staging environment exists before treating production as the first deployment target |

The backend workflow requires a GitHub Actions environment named `production`. The frontend workflow runs checks on pushes to `develop`, `main` and `project-setup`, and on pull requests targeting `develop` or `main`.

## 3. Environment variables

Only variable names and purposes are documented here. Actual secrets and production values must be stored in the relevant deployment environment and must never be committed to Git.

### Backend

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | SQLAlchemy database connection. The application raises an error if it is missing. |
| `JWT_SECRET` | Yes for token creation and validation | Signs and verifies access tokens. The supplied source checks that it exists but does not enforce a minimum length. |
| `ACCESS_TOKEN_MINUTES` | No | Access-token lifetime in minutes; defaults to `60`. |

The backend CI workflow supplies `DATABASE_URL="sqlite://"` and a test-only `JWT_SECRET`. These are test values, not production configuration.

### Backend deployment workflow

The GitHub Actions `production` environment must contain:

| Kind | Name | Purpose |
|---|---|---|
| Secret | `HEROKU_API_KEY` | Authenticates deployment requests to Heroku |
| Secret | `HEROKU_EMAIL` | Required by the workflow's configuration check |
| Variable | `HEROKU_APP_NAME` | Identifies the Heroku application |
| Variable | `HEROKU_APP_URL` | Public application URL used by the post-deployment health check |

The workflow fails before deployment if any of these values is missing. Restrict the production environment to the intended release branch and protect access to its secrets.

### Web application

| Variable | Required | Purpose |
|---|---|---|
| `BACKEND_URL` | Yes for server-side proxy and login routes | Backend API base URL used by Next.js server routes |
| `NEXT_PUBLIC_API_URL` | Depends on the browser-side helper in use | Public API base URL read by `lib/api.js`; defaults to `http://localhost:8000` when unset |

`NEXT_PUBLIC_` variables are exposed to browser-side code. They must not contain secrets. The TypeScript API helper defaults to `/backend`, and `next.config.ts` currently rewrites that path to `http://127.0.0.1:8000`; verify and replace the development target for production if that helper is used in the deployed build.

## 4. Backend: build and release

### How the backend is started

The backend declares Python `3.11` in `.python-version`. Its dependencies are defined in `pyproject.toml`, and the Heroku-oriented `Procfile` starts the FastAPI application with Uvicorn using the platform-provided `$PORT`.

For local development, the backend README documents:

```bash
uv venv
uv pip install -r pyproject.toml --group dev
uv run --no-sync uvicorn main:app --reload
```

The API is then available locally at `http://localhost:8000`. The `/health` endpoint can be used for a basic process check.

### Pull-request checks

The backend `pr-checks.yml` workflow runs for pull requests targeting `main` or `develop`. It validates the pull-request description and testing evidence, runs Ruff lint and formatting checks, calls the reusable test workflow, and requires all required stages to succeed at the PR gate.

The reusable `ci.yml` workflow runs pytest with coverage. Both workflows use the self-hosted runner labels:

```yaml
runs-on: [self-hosted, classroom-ci]
```

The CI workflow installs dependencies from `pyproject.toml`, then runs:

```bash
uv run --no-sync pytest --cov --cov-report=term-missing
```

The backend README also documents these local checks:

```bash
uv run --no-sync ruff check .
uv run --no-sync ruff format --check .
uv run --no-sync pytest --cov --cov-report=term-missing
```

The team should keep using the configured self-hosted runner. The inspected workflow does not use GitHub-hosted `ubuntu-latest` runners.

### Release trigger and deployment

The backend `deploy.yml` workflow is configured for pushes to `main` and manual workflow dispatch. The deploy job is restricted to `refs/heads/main`.

The release sequence defined in the workflow is:

1. Run the reusable CI workflow against `main`.
2. Check that `HEROKU_API_KEY`, `HEROKU_EMAIL`, `HEROKU_APP_NAME` and `HEROKU_APP_URL` are configured.
3. Check out the `main` branch on the self-hosted `classroom-ci` runner.
4. Package the repository source and submit it to the Heroku Platform API.
5. Wait for the Heroku build to finish and fail the job if the build does not succeed.
6. Request the configured `HEROKU_APP_URL/health` endpoint and retry if the request fails.

The workflow uses the Heroku Platform API directly; its comment states that the runner does not need the Heroku CLI or Git installed for the deployment operation.

### Database migrations

Alembic is configured in `alembic.ini` and `migrations/env.py`. The migration environment reads `DATABASE_URL` and raises an error if it is not set.

However, the supplied `Procfile` only starts Uvicorn, and the supplied `deploy.yml` does not run `alembic upgrade head`. Therefore, automatic migration execution during deployment is not established by the inspected workflow. Before releasing a schema change, the team must agree on and document the migration procedure, backup expectations and rollback approach. Do not assume that a Heroku release automatically updates the database schema.

### First-time backend environment setup

The repository README describes creating a Heroku application, enabling the Python buildpack, and configuring the GitHub `production` environment. The deployment workflow also expects the app name and URL to exist before it runs.

Before enabling production deployment:

1. Create or identify the approved Heroku application.
2. Confirm the Python buildpack and supported deployment method for that app.
3. Create the GitHub Actions environment named `production`.
4. Add the required secrets and variables listed in section 3.
5. Configure the backend's runtime `DATABASE_URL` and `JWT_SECRET` on the hosting platform.
6. Confirm the database has the expected schema and that migrations have been applied using the agreed migration procedure.
7. Run the deployment workflow on `main`.
8. Verify the deployed `/health` endpoint and perform an authenticated application smoke test.

The backend README mentions runtime dependency preparation for Heroku, but the inspected `deploy.yml` does not show an explicit step that generates a `requirements.txt`. Verify that the current Heroku build succeeds with the committed deployment workflow before treating this procedure as fully validated.

## 5. Web application: build and release

### Local build

The frontend uses Next.js and defines the following npm scripts:

```bash
npm ci
npm run lint
npm run format:check
npm test
npm run build
npm start
```

For local development:

```bash
npm install
npm run dev
```

The development server normally runs at `http://localhost:3000`.

### Continuous integration

The frontend `ci.yaml` workflow runs on pushes to `develop`, `main` and `project-setup`, and on pull requests targeting `develop` or `main`. It uses the self-hosted `classroom-ci` runner and performs the following checks:

1. Set up Node.js 22.
2. Install dependencies with `npm ci`.
3. Run `npm run format:check`.
4. Run `npm run lint`.
5. Run `npm test`.
6. Run `npm run build`.

A separate `pr-ready-check.yml` workflow checks that the pull request's Ready for Review checklist is complete before review.

### Production release status

No frontend deployment workflow, production hosting provider, production URL or release trigger was present in the supplied frontend archive. The CI workflow proves that the application is checked and built; it does not publish the application.

Before documenting or performing a frontend production release, confirm:

- the approved hosting platform and production URL;
- the branch or tag that triggers deployment;
- where `BACKEND_URL` and any public API configuration are set;
- how the platform builds and starts the Next.js application;
- how logs and deployment history are accessed;
- who owns rollback and production approval.

Do not infer that the frontend is deployed to Heroku merely because the backend uses a Heroku deployment workflow.

## 6. Field application release

The field experience is implemented as routes inside the Next.js frontend repository. The inspected source does not contain a separate Flutter application or Android APK build process. It therefore follows the web application's build and release path rather than a separate mobile release procedure.

The frontend repository README describes the field experience as part of the same application. Confirm the final production URL and field-agent access path with the frontend deployment owner before distributing it to users.

## 7. Health checks

The backend exposes a public `GET /health` endpoint:

```python
@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
```

The backend deployment workflow calls this endpoint after the Heroku build succeeds:

```bash
curl --fail --location --retry 5 --retry-all-errors --retry-delay 5 \
  --connect-timeout 10 --max-time 30 \
  "${HEROKU_APP_URL%/}/health"
```

| Check | Expected result | What it verifies |
|---|---|---|
| `GET /health` | HTTP success with `{"status":"ok"}` | API process responds |
| Backend startup | Uvicorn starts without configuration errors | Required runtime configuration is present |
| Login | Valid test account can authenticate | Authentication route and database access work together |
| Protected API request | Valid token succeeds; missing/invalid token is rejected | Bearer-token validation and route protection |
| Core workflow | Create or retrieve an authorised business/meter record | Database operations and organisation scoping work for the tested path |
| Frontend page load | Next.js application responds | Frontend hosting and application startup work |
| Frontend-to-backend request | Request reaches the configured backend | Proxy/API base URL is correct |

`/health` only returns a static status value. It does not perform a database, migration, frontend, or external-service health check. A successful health response must therefore be followed by application-level smoke tests.

## 8. Logging and monitoring

The inspected source and workflow establish that GitHub Actions displays build and deployment output, and that the backend has a basic `/health` endpoint. They do not establish a complete production logging or monitoring platform.

| Area | Evidence in supplied repositories | Operational action |
|---|---|---|
| Backend build and deployment logs | GitHub Actions deployment job streams the Heroku build output | Retain access to workflow runs and hosting-platform logs |
| Backend runtime logs | Uvicorn is the process started by the `Procfile` | Confirm where production stdout/stderr is retained and who can access it |
| Frontend logs | No production hosting provider or log destination documented | Confirm log access with the frontend deployment owner |
| Health monitoring | Deployment workflow calls `/health` once after deployment | Add ongoing uptime monitoring if required by the service owner |
| Error monitoring and alerting | No central monitoring or alerting configuration found in supplied archives | Define ownership, alert thresholds and incident escalation |
| Audit trail | No complete central audit/monitoring deployment is established by the inspected configuration | Confirm application audit requirements separately in Security |

Do not claim that automated uptime monitoring, a SIEM, alerting or a production dashboard is active unless the deployment environment confirms it.

## 9. Rollback and recovery

The supplied backend deployment workflow does not document an automated rollback command or database restore process. The following actions are operational requirements to agree with the deployment owner, not verified automated capabilities.

| Situation | Required response |
|---|---|
| Backend release fails before the new build is deployed | Inspect the failed GitHub Actions and Heroku build output; keep the previous known-good release in service if the platform does so |
| Backend release succeeds but the API fails smoke tests | Stop further releases, identify the last known-good application release and follow the hosting platform's approved rollback procedure |
| A release includes a database schema change | Treat code rollback and schema rollback as separate operations; use a reviewed forward or reverse migration plan |
| Database records are lost or corrupted | Follow the database provider's verified backup and restore procedure; the supplied source does not identify a configured backup service |
| `JWT_SECRET` is exposed | Replace the secret in the production environment and assess the impact on existing access tokens |
| Frontend release is broken | Use the hosting platform's known-good deployment rollback process; the platform and process must first be confirmed |

Before production use, document who can approve rollback, where backups are stored, how frequently they are taken, the recovery-point and recovery-time expectations, and when the last restore test was completed.

## 10. Known limitations

| Limitation | Effect |
|---|---|
| Frontend deployment platform and release workflow are not documented in the supplied frontend repository | The frontend CI build must not be mistaken for a production deployment |
| Backend production app values are stored outside the repository | The actual app name, public URL and configured secrets cannot be confirmed from source alone |
| No separate staging environment was identified in the inspected workflow files | The team must confirm where release candidates are validated before production |
| Backend deployment workflow does not run Alembic migrations | Schema changes need a separately agreed migration procedure |
| Backend README and deploy workflow differ on runtime dependency preparation | Validate the actual Heroku build path before relying on the README procedure |
| Frontend API helpers use different base-URL defaults | Confirm which helper is used and prevent production requests from targeting localhost |
| `/health` is a static process check | It does not prove database connectivity or end-to-end application readiness |
| No production backup, restore or monitoring configuration was identified | Recovery and ongoing operational monitoring need explicit ownership |

## 11. Documentation site

The documentation repository is built locally with MkDocs:

```bash
mkdocs build --strict
```

The generated static site is written to the `site/` directory. For local review, run:

```bash
mkdocs serve
```

The inspected documentation configuration establishes the local build and preview commands. It does not establish a configured production documentation host or an automated publishing workflow. Confirm the intended publishing platform, repository branch, deployment permissions and site URL before describing documentation publishing as automated.

## Implementation status

The deployment documentation reflects the following verified status based on the inspected repositories:

| Component | Status | Evidence basis | Notes |
|---|---|---|---|
| Backend CI | Verified | backend GitHub workflow files | CI and lint/test/build processes exist. |
| Backend deployment automation | Verified | backend deploy workflow | Heroku deployment automation is configured in the source repo. |
| Frontend CI | Verified | frontend GitHub workflow files | Formatting, lint, test and build checks are configured. |
| Frontend production hosting | Not Evidenced | frontend source and workflow inspection | No production hosting workflow or provider is present in the inspected frontend source. |
| Backend production hosting | Partially Verified | Heroku deploy workflow | The target platform is documented, but the live production environment itself is not verified in this workspace. |
| Documentation publishing | Not Evidenced | documentation repo inspection | No automated docs hosting workflow was identified in the provided repo. |

This page therefore distinguishes between automation that exists in source and hosting or release status that still requires external confirmation. Do not treat GitHub Actions success as proof of production readiness.

## Summary

GridFit's supplied backend repository includes a Heroku-oriented release workflow that runs CI on `main`, deploys through the Heroku Platform API and checks `/health`. Backend CI and frontend CI both use the self-hosted `classroom-ci` runner. The frontend workflow verifies formatting, linting, tests and a production build, but the inspected frontend source does not include a deployment workflow or identify a hosting provider.

The main deployment items to resolve are the frontend hosting and release process, production environment values, database migration execution, database backup and restore ownership, and ongoing health/log monitoring. Until these are confirmed, document them as outstanding deployment decisions rather than completed production capabilities.
