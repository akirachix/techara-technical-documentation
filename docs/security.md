# Security

This page describes security controls visible in the supplied backend and frontend source. It also records gaps that must be addressed before production use.

## Security posture

The backend implements password hashing, signed bearer tokens, role checks and organisation-scoped queries in several services. These controls are a useful baseline, but they do not amount to a complete security review. In particular, the sensor-device routes currently lack user-authentication dependencies, and device-token verification for reading ingestion is not implemented in the supplied source.

## Data classification

| Data | Examples | Handling |
|---|---|---|
| Account credentials | Passwords, password hashes, JWTs | Never log or expose; store password hashes only |
| Personal information | Names, email addresses, phone numbers | Limit access to authorised users and avoid unnecessary disclosure |
| Business information | Business name/type, owner contact, operating hours | Organisation-scoped access; treat as commercially sensitive |
| Site information | Inverter/battery values, baseline demand, solar profiles, tariff | Restrict to the owning organisation |
| Metering data | Voltage, current, power, energy and timestamps | Treat as operationally sensitive; preserve provenance and access controls |
| Device credentials | Raw installation token and stored hash | Raw token is a secret; never commit or log it |

## Authentication

The backend's `core/security.py` uses JWT HS256. The signing secret is read from `JWT_SECRET`; the application raises an error if it is missing. `ACCESS_TOKEN_MINUTES` controls token lifetime and defaults to 60 minutes.

Passwords are handled by the authentication service using the password-hashing library declared in the backend dependencies (`pwdlib[argon2]`). The login endpoint returns a bearer access token. `core/dependencies.py` validates the token, resolves the user from its `sub` claim and rejects missing, invalid, expired or inactive accounts.

A user with `must_change_password` set is blocked from role-protected operations until the password-change flow is completed.

## Authorisation and tenant isolation

The backend roles are:
- `operator`
- `field_agent`

Scenario and site-profile endpoints are operator-only. Business operations and selected site/assignment operations allow both roles. Meter removal is field-agent-only.

Services generally query resources using the authenticated user's `organisation_id`. Meter installation checks that the selected device and business belong to the same organisation. This tenant boundary must be preserved in every new repository query and service operation; never trust a client-supplied organisation ID when an authenticated user context is available.

## Known security gap: sensor-device routes

In the supplied `routers/sensor_devices.py`, register/list/status routes do not declare `get_current_user` or `require_roles` dependencies. Registration accepts organisation and registering-user information through its request schema, while listing/status operations accept an organisation ID as a request parameter.

This permits callers to attempt cross-organisation operations unless protected elsewhere by deployment infrastructure. No such protection is visible in the supplied router. Before production:
1. Require an authenticated user on all device-management routes.
2. Derive `organisation_id` and `registered_by` from the authenticated user, not the request body/query string.
3. Apply explicit role permissions.
4. Add tests proving one organisation cannot access another organisation's devices.
5. Review the change with the team before deployment.

## Input validation

Pydantic schemas validate field types, lengths, ranges and nested structures. SQLAlchemy models also define database constraints for important invariants, including unique business names per site, valid operating days, positive site-profile values, valid state-of-charge ordering and reading constraints.

Validation should occur at more than one boundary: request schema, service/business rules and database constraints. Do not rely on frontend validation as a security control.

## Device security

Meter assignment generates a random URL-safe token and stores its SHA-256 hash. The raw token is returned in the assignment-creation response and is not part of the normal assignment read schema.

However, the supplied backend does not include a device-ingestion endpoint or code that verifies a presented device token. TLS enforcement, token rotation/revocation and device request replay protection are also not demonstrated in the supplied source. These are required design tasks before device telemetry can be treated as authenticated.

## Secrets and deployment

- Keep `JWT_SECRET` and database credentials in the hosting provider's environment configuration.
- Never commit `.env` files, database dumps containing real personal data, access tokens or raw device tokens.
- Do not expose server-only `BACKEND_URL` values to browser code.
- Review use of `NEXT_PUBLIC_API_URL`; values with this prefix are public to the browser bundle.
- Rotate secrets if they are exposed.
- Use separate secrets and databases for development, test and production.

## Data protection and privacy

The platform may process personal information and commercially sensitive operational data. The team should map data collection and retention, provide an appropriate privacy notice, limit access, define deletion/correction processes and assess obligations under applicable Zambian data-protection law. This page is technical documentation, not legal advice. Obtain a qualified legal review before making compliance claims.

## Logging and incident response

Logs should capture request IDs, timestamps, endpoint names, outcome codes and relevant non-sensitive diagnostic context. Do not log passwords, bearer tokens, raw device tokens or full personal/business payloads unnecessarily.

For a suspected incident:
1. Restrict affected credentials or accounts.
2. Preserve relevant logs and deployment metadata.
3. Identify affected organisations and records.
4. Rotate exposed secrets and invalidate affected tokens where possible.
5. Patch the root cause and add regression tests.
6. Notify responsible project/security owners and follow the applicable legal and contractual notification process.

## Production readiness checklist

- [ ] Protect sensor-device management routes with authentication and organisation scoping.
- [ ] Implement and test device-token verification before accepting readings.
- [ ] Enforce HTTPS/TLS at the public edge.
- [ ] Store secrets only in deployment secret stores.
- [ ] Review CORS, trusted hosts and proxy settings.
- [ ] Add rate limiting and abuse monitoring to public authentication endpoints.
- [ ] Confirm password reset, account recovery and token revocation behaviour.
- [ ] Define data retention, backup and restore procedures.
- [ ] Conduct dependency, access-control and application security reviews.
