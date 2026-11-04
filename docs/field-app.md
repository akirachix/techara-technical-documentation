# Field App

The field interface is intended for field agents who visit businesses, collect operating/equipment information and support meter installation.

## Overview

The frontend includes dedicated field routes and shared field layout/components. The intended workflow is designed for use on a phone or tablet while visiting a business. The current frontend README identifies the app as a mock-data prototype; verify API integration and persistence before relying on it for field operations.

## Routes and workflow

1. `/field/login` — field-agent sign-in demonstration.
2. `/field/home` — field home screen.
3. `/field/log` — begin logging a business.
4. `/field/log/equipment` — record equipment and load information.
5. `/field/log/meter` — enter meter-related details.
6. `/field/businesses` and `/field/businesses/[id]` — review recorded businesses.
7. `/field/meters` — review meters.
8. `/field/profile` — profile information.
9. `/field/change-password` — change-password screen.

The field workflow should capture the business identity, owner contact, business type, operating hours, operating days and equipment/startup information required by the backend business schema. Confirm field labels and required fields against the current screen implementation before changing the API contract.

## Meter installation in the backend

The backend supports `POST /assignments` for users with either the `operator` or `field_agent` role. The request contains `device_id` and `business_id`. The service checks that both records belong to the current user's organisation, that the device is active and that neither the device nor the business already has an open assignment.

The response includes assignment metadata and a raw `device_token`. The token is returned when the assignment is created; it is not returned by the normal assignment read schema. Treat it as a one-time secret and deliver/store it securely. The current source does not show a device firmware process that consumes this token.

Meter removal uses `POST /assignments/{assignment_id}/remove`. The endpoint is field-agent-only and requires `{"buffer_uploaded_confirmed": true}`. The service marks the assignment removed; it does not itself verify an upload to a device buffer.

## PWA and offline behaviour

The repository contains a web app manifest and app icons. The README explicitly states that a service worker has not yet been implemented. Therefore:
- Installation metadata exists, but full offline support is not implemented.
- Do not promise offline form submission or background synchronisation.
- Changes held only in browser memory may be lost on refresh.
- Field teams should confirm connectivity and server persistence before treating a record as safely submitted.

## Field operating guidance

- Confirm the correct site and business before saving.
- Use consistent local time and operating-hour conventions.
- Distinguish owner-entered or estimated startup data from observed meter data.
- Do not represent a meter as transmitting until a successful reading path is verified.
- Keep device tokens private; do not put them in screenshots, chat messages or public issue reports.
- If a removal workflow is used, confirm that any required local data has actually been transferred before acknowledging the confirmation.

## Troubleshooting

| Symptom | Check |
|---|---|
| Login works with arbitrary credentials | This is prototype mock behaviour; do not use it as production authentication. |
| A record disappears after refresh | The README describes in-memory mock state. Verify whether the current page is connected to a persistent API. |
| A page does not work offline | No service worker is present in the supplied project; use a network connection. |
| Meter is listed but no readings appear | Device registration/assignment records do not prove telemetry ingestion. Confirm the ingestion service exists and is deployed. |
| A request is rejected | Check required fields, UUIDs, user role, organisation scope and API response details. |
