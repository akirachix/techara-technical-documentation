# Metering Device

This page documents the metering concepts and the backend data contract found in the supplied GridFit source. It distinguishes the proposed hardware design from implemented software. The supplied backend archive contains sensor-device, meter-assignment and reading database models, but it does **not** contain device firmware or an HTTP/MQTT reading-ingestion endpoint.

## Purpose

The purpose of metering is to build an evidence-based picture of a business's electricity demand. Owner estimates and equipment nameplates are useful context, but they do not necessarily describe the actual timing, average load, peak demand or daily energy use. Time-stamped observations can be grouped into hourly profiles and compared with a mini-grid site's operating limits.

The backend's business-profile service uses persisted readings to derive:
- 24 hourly average power values (`average_kw`);
- 24 hourly peak power values (`peak_kw`);
- observed-day count and reading count;
- first and last measurement timestamps;
- energy derived from the cumulative energy counter.

A site profile sets `min_observed_days`. Scenario creation rejects a business profile that does not meet this minimum.

!!! warning "Measurement is not approval"
    Meter data supports a technical assessment; it does not by itself certify wiring, establish legal compliance, approve a new connection or guarantee that the mini-grid can serve the load safely.

## Hardware concept and current status

The original design notes identify the following proposed components:

| Component | Intended role | Status in supplied software archive |
|---|---|---|
| ESP32 | Microcontroller for measurement collection and communications | Proposed; no firmware source supplied |
| SIM800C | Cellular/GPRS communications module | Proposed; no firmware/configuration supplied |
| PZEM-004T-100A | AC electrical measurement module | Proposed; no calibration or test evidence supplied |
| CT clamp | Current sensing around a conductor | Proposed; wiring and safety validation not supplied |
| BS1363 plug/socket | Physical connection concept shown in early design notes | Proposed; suitability depends on the actual installation and electrical design |
| Enclosure | Mechanical/electrical protection | No verified enclosure drawings or certification supplied |

The parts list is not a validated bill of materials. Before building or installing hardware, a qualified electrical professional must verify voltage/current ratings, isolation, fusing, conductor sizing, enclosure rating, strain relief, earthing, thermal behaviour and local electrical requirements. Do not use the table as a wiring instruction.

## Wiring and enclosure

No verified Cirkit wiring diagram, schematic, PCB design, enclosure CAD file, product certification or installation photographs were present in the supplied source archives. These assets should be added to `docs/assets/` only after the hardware team approves them.

A future hardware release should include:
- A revision-controlled schematic and wiring diagram.
- Exact part numbers and rated operating ranges.
- Isolation and over-current protection details.
- Enclosure material, dimensions and ingress-protection rating.
- Calibration procedure and measurement uncertainty.
- Bench-test results across representative loads.
- Installation and maintenance instructions reviewed by a qualified person.

## Firmware flow

A conceptual firmware lifecycle would be:

1. Power-on and initialise the measurement interface.
2. Check sensor/module status and obtain a valid measurement.
3. Attach a device identifier and a trustworthy measurement timestamp.
4. Persist readings locally if the communications link is unavailable.
5. Transmit using an authenticated, encrypted transport.
6. Retry safely without duplicating previously accepted readings.
7. Report device health and recover from sensor/network faults.

**This is a proposed workflow, not implemented firmware.** No ESP32 source, SIM800C modem driver, retry queue, local buffer format, sampling interval or firmware release process was included in the supplied archives.

## Reading data model

The SQLAlchemy `Reading` model maps to the `reading` table. It contains the following columns:

| Field | Type | Meaning |
|---|---|---|
| `reading_id` | Integer, primary key | Database-generated reading identifier |
| `assignment_id` | UUID, foreign key | Meter installation/assignment that produced the reading |
| `business_id` | UUID, foreign key | Business associated with the assignment |
| `measured_at` | Timezone-aware datetime | Time the measurement was taken |
| `received_at` | Timezone-aware datetime | Time the database received/persisted the record; server default is current time |
| `voltage_v` | Numeric(6,2) | Voltage in volts |
| `current_a` | Numeric(7,3) | Current in amperes |
| `power_w` | Numeric(9,2) | Active power in watts |
| `energy_total_kwh` | Numeric(12,4) | Cumulative energy counter in kilowatt-hours |

The database enforces:
- Voltage between 0 and 300 V.
- Current greater than or equal to zero.
- Power greater than or equal to zero.
- Cumulative energy greater than or equal to zero.
- One reading per assignment and measurement timestamp.
- A composite foreign key pairing `assignment_id` with `business_id`, preventing a reading from claiming a different business from the assignment.

These are database constraints, not a complete device payload validator. The supplied code does not specify the external JSON field names, API route, authentication header, sampling cadence or message acknowledgement protocol.

## Example logical reading record

The following illustrates the values represented by the database model. It is **not** a currently supported request body and there is no supplied endpoint to POST it to.

```json
{
  "assignment_id": "00000000-0000-0000-0000-000000000001",
  "business_id": "00000000-0000-0000-0000-000000000002",
  "measured_at": "2026-11-04T10:15:00Z",
  "voltage_v": 230.50,
  "current_a": 4.125,
  "power_w": 920.00,
  "energy_total_kwh": 123.4567
}
```

`received_at` is populated by the database and is not listed as a required client-supplied value in the model. The UUIDs above are illustrative placeholders only.

## Transmission and backend ingestion status

The backend has:
- `SensorDevice` records with organisation, serial number, status and registering-user references.
- `MeterAssignment` records connecting a device to a business, with installation/removal timestamps and a stored device-token hash.
- A helper to generate a random URL-safe device token and hash it with SHA-256.
- A `Reading` model and business-profile queries that consume readings.

The supplied backend does **not** have:
- A `/readings` or telemetry-ingestion router.
- A Pydantic reading-ingestion request schema.
- A service/repository method for accepting and persisting new readings from a device.
- A device-token verification dependency or request-signature verification flow.
- An MQTT broker integration.
- A firmware project or verified HTTPS/GPRS transport implementation.

Therefore, the data model can describe readings already in the database, but the end-to-end transmission path is incomplete in the supplied code. Do not state that GSM/GPRS or MQTT transmission is live.

## Device assignment and token lifecycle

`POST /assignments` accepts `device_id` and `business_id`. The service:
1. Finds the device within the authenticated user's organisation.
2. Finds the business within the same organisation.
3. Requires the device status to be `active`.
4. Rejects a device that already has an open assignment.
5. Rejects a business that already has an open assignment.
6. Generates a random token and stores its SHA-256 hash on the assignment.
7. Returns the raw token in the creation response.

The raw token is not included in `MeterAssignmentRead`. Treat it as a one-time credential: display it only at installation time, transfer it through a secure channel, never log it, and never commit it to source control. A future ingestion service must compare a presented token securely against the stored hash and enforce TLS. That verification is not present in the supplied implementation.

Meter removal is a separate field-agent-only operation. The request schema requires `buffer_uploaded_confirmed: true`; the backend trusts this confirmation and does not inspect a physical device buffer.

## Sampling interval and timestamp policy

No sampling frequency is defined in the supplied firmware or backend contract. The system should not document a fixed interval until the hardware and backend teams agree on it and test the resulting data volume.

For a production ingestion design, specify:
- Whether `measured_at` is generated by the device or synchronised from a trusted time source.
- Timezone handling (store UTC instants; render in the site's configured timezone).
- Maximum allowed clock drift and handling for missing/invalid timestamps.
- Duplicate delivery and idempotency behaviour.
- Maximum accepted measurement age and future-time tolerance.
- Counter reset/rollover behaviour for `energy_total_kwh`.
- Validation and rejection rules for physically implausible readings.

## Limitations

- The model records AC voltage, current, power and cumulative energy; it does not by itself establish power factor, frequency, phase information or waveform quality.
- Database bounds are not a calibration specification or accuracy guarantee.
- The model does not contain a device-side sequence number or explicit quality/status flag.
- A cumulative energy counter needs a defined reset/rollover policy before reliable energy deltas can be interpreted.
- The data model does not define a sampling interval.
- The supplied project does not prove that the proposed components have been assembled, calibrated, certified or deployed.
- Meter readings cannot replace a qualified electrical inspection.

## Installation workflow

The backend-supported software workflow is:
1. Register a sensor device.
2. Create a business record.
3. Create an assignment using the device and business IDs.
4. Securely transfer the one-time token to the device provisioning process (provisioning tooling is not included in the supplied source).
5. Confirm the physical installation and electrical safety independently.
6. Verify telemetry only after an ingestion endpoint and device firmware are implemented and tested.

Do not mark an installation as transmitting merely because an assignment record exists.

## Troubleshooting guide

| Symptom | Checks |
|---|---|
| Device cannot be assigned | Confirm device and business exist in the same organisation, device status is `active`, and neither has an open assignment. |
| Duplicate assignment conflict | Check whether the device or business already has an assignment with `removed_at IS NULL`. |
| Token is no longer visible | The raw token is returned only by the assignment creation response; it is not returned by normal read endpoints. Re-provision using an approved process rather than retrieving a stored raw token. |
| Reading violates constraints | Check voltage range, non-negative current/power/energy, timestamp uniqueness and assignment/business pairing. |
| Business profile has insufficient observations | Check persisted readings and the site's `min_observed_days` setting. |
| No readings arrive | The supplied backend has no ingestion route or firmware; confirm those components have since been implemented before debugging network connectivity. |
| Removal cannot be completed | The API requires `buffer_uploaded_confirmed: true`; confirm the intended data-handling procedure before making that assertion. |

## Release checklist for a production meter

- [ ] Hardware schematic and BOM reviewed by a qualified electrical professional.
- [ ] Calibration method and accuracy evidence recorded.
- [ ] Firmware source and versioned release process available.
- [ ] Device identity and token provisioning documented.
- [ ] Authenticated TLS transport implemented and tested.
- [ ] Reading-ingestion API, schema and token verification implemented.
- [ ] Idempotency, retry and offline-buffer behaviour tested.
- [ ] Clock synchronisation and energy-counter reset policy defined.
- [ ] Device health, fault and retirement behaviour defined.
- [ ] Field installation and safe isolation procedure approved.
