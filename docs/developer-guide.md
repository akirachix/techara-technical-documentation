# Developer Guide

This guide describes the repository conventions and repeatable workflow for contributing to GridFit.

## Repository boundaries

GridFit is split across at least three codebases:
- Backend: FastAPI application, SQLAlchemy models, migrations, services, repositories, engine and tests.
- Frontend: Next.js operator and field interface.
- Technical documentation: MkDocs Material site.
- The informational website is a separate Vite/React project and should be documented/deployed independently.

Make changes in the repository that owns the relevant behaviour. A UI-only change should not silently redefine an API contract; an API change should include schema, service, repository and test updates as appropriate.

## Backend structure and standards

Use the existing layers:

1. Router: HTTP path, method, dependency and response schema.
2. Schema: Pydantic input/output validation.
3. Service: business rules, permission-aware orchestration and transaction handling.
4. Repository: database reads/writes.
5. Model: SQLAlchemy mapping and database constraints.
6. Engine: pure calculation logic where practical.

Keep route functions thin. Use UUIDs consistently for entity identifiers. Keep organisation scoping in repository/service calls. Prefer explicit enums for persisted status/outcome values. Add a migration whenever a model change affects the database schema.

## Frontend standards

- Use the App Router structure already present under `app/`.
- Reuse shared components from `components/shared/`.
- Keep route-specific styles in CSS Modules where the project already does so.
- Use the existing API helpers in `lib/` rather than duplicating fetch behaviour.
- Keep server-only environment variables out of client components.
- Provide loading, empty, error and validation states.
- Do not treat mock data as a backend integration.

## Testing

Backend:

```bash
uv run pytest
uv run pytest --cov
uv run ruff check .
```

Add tests for:
- Happy paths.
- Invalid payloads and boundary values.
- Missing/expired authentication.
- Role restrictions.
- Cross-organisation access attempts.
- Duplicate/unique constraint conflicts.
- Database transaction rollback.
- Assessment edge cases and missing data.

Frontend:

```bash
npm run lint
npm run format:check
npm run build
npm test
```

The current test script permits zero tests. Add actual tests for critical components and workflows before relying on the test command as a quality gate.

Documentation:

```bash
mkdocs build --strict
```

## Git workflow

Recommended contribution flow:

1. Update your local default branch.
2. Create a focused branch, for example `feature/business-profile` or `docs/metering-contract`.
3. Make one coherent change.
4. Run relevant tests and linters.
5. Review the diff for unrelated files, generated files, secrets and database dumps.
6. Push the branch and open a pull request.
7. Explain the behaviour change, tests run, screenshots/API examples and any migration impact.
8. Request peer review and resolve comments before merge.

Never merge a teammate's entire feature branch just to obtain one dependency. Coordinate the required merge order or rebase on the shared integration branch.

## Commit messages

Use short imperative messages that identify the change, for example:

- `docs: document meter reading model`
- `feat: scope device registration to organisation`
- `test: cover cross-organisation assignment access`
- `fix: reject duplicate open meter assignments`

Follow any stricter commit-title rules enforced by the repository's GitHub Actions.

## Ownership and coordination

The frontend README records the initial work split:
- Emma: shared UI and authentication screens.
- Gift: overview, sites and import data.
- Gabrielle: prospects, fit check and compare sites.
- Nikki: field home and business logging process.
- Sharon: field businesses, metering UI, My Meters, profile and operator settings.

Treat this as a historical contribution map, not a permanent code-ownership or approval policy. Confirm current maintainers before assigning reviews.

## Common problems

| Problem | Resolution |
|---|---|
| `JWT_SECRET` missing | Set a local secret in the environment; never commit it. |
| Database schema mismatch | Check Alembic revision and apply reviewed migrations. |
| 401 response | Check bearer token presence, expiry, signature secret and active user status. |
| 403 response | Check role and `must_change_password` state. |
| 404 for a valid-looking UUID | The record may not belong to the authenticated user's organisation. |
| Assignment returns 409 | Device/business may already have an open assignment, or the device may not be active. |
| Business profile rejected | Confirm readings exist and meet `min_observed_days`. |
| Frontend appears to save but loses data on refresh | The current README describes mock/in-memory state; verify live persistence integration. |
| `npm test` passes without running tests | The script includes `--passWithNoTests`; add test files and verify the runner discovers them. |
| Docs build fails | Run `mkdocs build --strict`, check navigation paths and Markdown code fences. |
