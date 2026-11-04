# Security

How GridFit protects accounts, data and devices, and the security considerations that remain before production deployment.

## Security posture

GridFit implements several application-level security controls in its backend:

- Passwords are hashed using `pwdlib`'s recommended password-hashing configuration.
- User sessions use signed JSON Web Tokens (JWT).
- Backend dependencies enforce authentication and role-based access on protected routes.
- Business, site, scenario and meter-assignment operations apply organisation-scoped access checks.
- Request data is validated through Pydantic schemas.

These controls do not mean that every part of the application is production-ready. In particular, the inspected sensor-device routes do not show explicit authentication dependencies. Deployment security, frontend authentication integration and device authentication also require further verification.

## Data classification

GridFit handles several categories of information:

| Data category | Examples | Security consideration |
|---|---|---|
| Personal information | User names, email addresses and phone numbers | Restrict access to authorised users |
| Account credentials | Password hashes and authentication tokens | Never expose passwords or secrets in responses or logs |
| Organisation information | Organisation records and ownership relationships | Enforce organisation-level access boundaries |
| Business information | Business details, equipment and operating schedules | Restrict access to authorised organisation members |
| Energy and metering information | Readings, device records and meter assignments | Protect data integrity and access |
| Assessment information | Scenarios, feasibility results and simulation metrics | Preserve the relationship between results and their input data |

This classification is a practical documentation guide, not a completed formal data-classification policy.

## Authentication

GridFit's backend provides signup, login and password-change operations through the authentication router.

### Account registration

The signup process:

- Accepts user names, email, organisation name and password.
- Validates the supplied fields through the authentication schema.
- Creates an organisation and an operator account.
- Hashes the password before storing it.
- Rejects duplicate email addresses and organisation names.

The signup service assigns the `OPERATOR` role. Although the signup schema contains a role field, the inspected service implementation assigns the operator role directly.

### Login

Users can log in using an email address or phone number and a password. The backend rejects invalid credentials and inactive accounts.

### Password storage

The authentication service uses `PasswordHash.recommended()` from `pwdlib`. Passwords are hashed before storage; the application does not need to store users' original passwords.

### Access tokens

The backend uses signed JWT access tokens with the `HS256` algorithm. The token includes:

- `sub`: the user ID
- `role`: the user's role
- `org`: the organisation ID
- `exp`: the token expiry time

The default access-token lifetime is 60 minutes. It can be changed using `ACCESS_TOKEN_MINUTES`.

The `JWT_SECRET` environment variable is required to sign and verify tokens. The backend raises an error if it is not configured.

### Password changes

The password-change operation verifies the current password, rejects a new password that matches the current one, and stores a hash of the new password.

Users marked as requiring a password change are blocked from role-protected operations until they change their password.

## Authorisation

GridFit defines two application roles:

| Role | Intended responsibility |
|---|---|
| `OPERATOR` | Manage organisation sites and oversee business assessments |
| `FIELD_AGENT` | Capture business and metering information in the field |

The backend uses role dependencies to restrict selected operations. For example, site creation and updates are operator-only, while business operations are available to both defined roles.

### Organisation scoping

The inspected business, site, scenario and meter-assignment services use the authenticated user's organisation context when accessing relevant records.

Business creation checks that the selected site belongs to the user's organisation. Field agents have an additional restriction when updating businesses: they can update only businesses they logged, and only while those businesses remain prospective.

### Sensor-device access consideration

The inspected sensor-device routes accept an `organisation_id` in request parameters or request data and do not show an explicit `get_current_user` or role dependency.

This differs from the organisation-scoped access pattern used by other services. The device endpoints should be reviewed and protected using authenticated organisation context before production use. A client-supplied organisation ID should not be treated as proof of authorisation.

## Input validation

The backend uses Pydantic schemas to validate request data before it reaches application services.

Authentication schemas, for example, define required fields and length limits for names, identifiers and passwords. Other resource schemas validate data used by business, site, device, assignment and scenario operations.

The frontend also contains form handling and validation logic. However, frontend validation is not a substitute for backend validation because requests can be sent without using the frontend.

## Device security

The backend includes helper functions for generating random device tokens and hashing device tokens using SHA-256.

However, the inspected source does not establish a complete device-authentication flow that uses these helpers to authenticate incoming device requests. The sensor-device routes also do not show explicit authentication dependencies.

Before production deployment, the device workflow should establish how devices receive credentials, authenticate requests, rotate or revoke credentials, and associate each device with an authorised organisation.

Transport security should also be configured for deployed device and API communication. No application-level HTTPS enforcement was identified in the inspected Python source; deployment and reverse-proxy configuration must be checked separately.

## Secrets management

The backend reads its JWT signing secret from the `JWT_SECRET` environment variable. Token lifetime is configurable through `ACCESS_TOKEN_MINUTES`.

Security requirements:

- Keep signing keys, database credentials and other secrets outside source control.
- Do not commit real `.env` files or credentials.
- Use separate secrets for development, testing and production.
- Restrict access to production environment variables.
- Rotate secrets if they are exposed or compromised.

The inspected source confirms the JWT environment-variable configuration. The production secrets-management process must be verified in the deployment environment.

## Data protection

GridFit may process personal information, organisation records and business-related operational data.

The Zambia Data Protection Act, 2021 is relevant when determining how personal data should be collected, used, stored, accessed and retained. This documentation does not establish that GridFit has completed a legal compliance assessment or meets every applicable requirement.

Before production use, the project should review:

- The purpose and lawful basis for collecting personal information.
- User notices and consent requirements, where applicable.
- Data minimisation and retention periods.
- Access, correction and deletion processes.
- Data sharing and third-party service arrangements.
- Appropriate technical and organisational safeguards.
- Procedures for handling personal-data incidents.

Legal and regulatory requirements should be confirmed with qualified guidance.

## Incident response

The inspected backend includes exception handlers and some diagnostic output. A complete incident-response policy or centralised security-monitoring process was not established from the inspected source.

A production incident process should include:

1. Identify and record the suspected incident.
2. Restrict affected accounts, tokens, devices or services where necessary.
3. Preserve relevant logs and evidence.
4. Investigate the cause and determine which data or services were affected.
5. Restore secure operation and rotate compromised credentials.
6. Assess notification and reporting obligations.
7. Record corrective actions to reduce the chance of recurrence.

Diagnostic output should be reviewed before production use. In particular, avoid logging passwords, access tokens, signing secrets or unnecessary personal information. Use structured logging with appropriate access and retention controls.

## Summary

GridFit's backend implements password hashing, JWT-based user authentication, role checks and organisation-scoped access in several core services.

The following items require further verification or implementation before production deployment:

- Add and test authenticated organisation-scoped access for sensor-device endpoints.
- Confirm the complete device-token authentication lifecycle.
- Verify HTTPS and CORS configuration in the deployment environment.
- Confirm production secrets storage and rotation procedures.
- Review logging, monitoring, backups and incident-response procedures.
- Complete a data-protection review against applicable legal requirements.
- Integrate and test frontend authentication with the backend.

Security should be reassessed as the application, device workflow and deployment environment evolve.
