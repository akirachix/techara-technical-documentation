# Deployment

This page describes the deployment workflows and configuration identified in the GridFit repositories. It distinguishes confirmed deployment automation from infrastructure whose hosting configuration has not yet been verified.

## Deployment architecture

GridFit has separate deployment workflows for the backend API and the documentation site.

| Component | Deployment platform | Deployment workflow |
|---|---|---|
| Backend API | Heroku | Backend repository |
| Technical documentation | GitHub Pages | Documentation repository |
| Frontend application | Not confirmed | No deployment configuration identified |
| Database | Not confirmed | Configured through `DATABASE_URL` |

The backend and documentation deployments are automated through GitHub Actions. The frontend hosting provider and database hosting arrangement require separate confirmation.

## Backend deployment

The backend repository contains `.github/workflows/deploy.yml`.

### Deployment trigger

The workflow runs when:

- Code is pushed to the `main` branch.
- A maintainer manually starts the workflow using `workflow_dispatch`.

### Deployment process

The workflow performs these steps:

1. Runs the reusable backend CI workflow to verify the `main` branch.
2. Checks that the required Heroku configuration is available.
3. Checks out the source code.
4. Sets up the Python version specified in `.python-version`.
5. Packages the source code into an archive.
6. Uploads the source to the Heroku Platform API.
7. Starts a Heroku build and waits for its result.
8. Checks the deployed application using its `/health` endpoint.

Deployment runs on the self-hosted `classroom-ci` runner.

### Deployment requirements

The GitHub Actions production environment must contain:

| Configuration name | GitHub configuration type | Purpose |
|---|---|---|
| `HEROKU_API_KEY` | Secret | Authenticates requests to the Heroku Platform API |
| `HEROKU_EMAIL` | Secret | Required by the workflow's configuration check |
| `HEROKU_APP_NAME` | Environment variable | Identifies the Heroku application |
| `HEROKU_APP_URL` | Environment variable | Provides the deployed application URL for health verification |

The workflow fails before deployment if any required configuration is missing.

## Frontend deployment

The frontend is built with Next.js. Its package scripts include:

- `npm run build` to create a production build.
- `npm run start` to start the production server.
- `npm run lint` to run ESLint.

The frontend source references `NEXT_PUBLIC_API_URL` for its API configuration.

No Vercel, Netlify, Docker, or other frontend deployment configuration was identified in the inspected frontend repository. The production hosting provider, deployment trigger, and live frontend URL therefore remain unconfirmed.

## Database

The backend reads its database connection configuration from `DATABASE_URL`.

The actual production database provider, database name, backup schedule, retention policy, and recovery process were not established by the inspected deployment workflow.

These details should be confirmed with the deployment administrator before being documented as production infrastructure.

## Metering device deployment

The inspected backend deployment workflow deploys the API application. It does not build or flash metering-device firmware.

The device hardware and firmware deployment process remains separate from the confirmed Heroku deployment workflow. Physical-device telemetry ingestion has not been confirmed as an implemented backend capability.

## How components communicate

The frontend configuration references `NEXT_PUBLIC_API_URL`, which identifies the API base URL used by the frontend.

The backend deployment workflow verifies the deployed API through:

`/health`

The actual production frontend URL, API URL, and end-to-end production connectivity should be confirmed before being recorded as verified deployment endpoints.

## Environment variables

The following variable names were identified in the inspected source code and deployment configuration.

### Backend application

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Database connection configuration |
| `JWT_SECRET` | Secret used for JWT signing |
| `ACCESS_TOKEN_MINUTES` | Access-token lifetime configuration |

### Frontend application

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL referenced by the frontend |

### Heroku deployment

| Variable | Purpose |
|---|---|
| `HEROKU_API_KEY` | Heroku API authentication |
| `HEROKU_EMAIL` | Heroku configuration check |
| `HEROKU_APP_NAME` | Target Heroku application |
| `HEROKU_APP_URL` | URL used for deployment health verification |

Secret values must be stored in the appropriate GitHub Actions secrets or deployment environment configuration. They must never be committed to the repository or included in documentation.

## CI/CD

### Backend

The backend repository contains three workflows:

- `ci.yml` — reusable continuous-integration workflow that installs dependencies and runs Pytest with coverage.
- `pr-checks.yml` — validates pull-request requirements, runs Ruff checks, and invokes CI.
- `deploy.yml` — verifies the main branch, deploys to Heroku, and checks the health endpoint.

The deployment workflow depends on the reusable CI workflow succeeding.

### Documentation

The documentation repository contains `.github/workflows/deploy.yml`.

It runs on pushes to `main` and manual workflow dispatch. Its steps are:

1. Check out the documentation repository.
2. Set up Python 3.11.
3. Install dependencies from `requirements.txt`.
4. Build the documentation using `mkdocs build --strict`.
5. Upload the generated `site` directory as a GitHub Pages artifact.
6. Deploy the artifact to the GitHub Pages environment.

### Deployment verification

After a deployment, verify:

- The backend workflow completes successfully.
- The Heroku build reports a successful status.
- The backend `/health` endpoint responds successfully.
- The documentation workflow completes successfully.
- The published documentation site is accessible.

Frontend deployment and production database verification require confirmation of their respective hosting arrangements.
