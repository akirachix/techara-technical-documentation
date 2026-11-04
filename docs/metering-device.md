# Metering Device

GridFit's proposed metering device is intended to measure a business's electrical load and provide measurement data for business energy profiling and feasibility assessments.

**Implementation status:** The backend contains sensor-device registration, meter assignments and a reading data model. A complete physical-device-to-backend reading transmission workflow has not been confirmed.

## Purpose

Self-reported equipment demand helps estimate a business's expected electricity consumption, but it may not represent its actual operating load.

Metering is intended to provide measured electrical data that can support:

- Understanding actual business consumption.
- Comparing measured load with declared equipment demand.
- Building business energy profiles.
- Improving the evidence available for site and business feasibility assessments.

Measured readings should complement, not automatically replace, equipment information and engineering review.

## Components

The current documentation identifies the following proposed hardware components:

| Component | Intended role |
|---|---|
| ESP32 | Microcontroller for device operation and data processing |
| SIM800C | Proposed GSM/GPRS communication module |
| PZEM-004T-100A | Proposed electrical measurement module |
| CT clamp | Current measurement component |
| BS1363 plug/socket | Proposed electrical connection interface |
| Enclosure | Physical housing and protection for the electronics |

> **Design status:**
> These components describe the proposed hardware design. Their final specifications, compatibility, procurement status and assembled-device validation have not been established by the inspected backend source.


## Wiring

The wiring design should document the connections between the ESP32, measurement module, communication module and power supply.

A verified Cirkit wiring diagram has not been included in the inspected software source. Add the approved wiring diagram here once the hardware team provides it.

Electrical wiring and mains-voltage connections must be reviewed and tested by a qualified person before physical deployment.

## Enclosure

The enclosure is intended to house and protect the metering electronics while allowing the required electrical and communication connections.

The original documentation outline identifies 3D-printed enclosure renders and photographs as expected design assets. These should be added when approved renders or photographs are available.

## Firmware flow

The proposed firmware workflow is:

1. **Boot:** Initialise the microcontroller and connected measurement hardware.
2. **Initialise:** Configure the measurement module and communication interface.
3. **Read:** Collect electrical measurements from the measurement module.
4. **Validate:** Check that readings are available and within expected ranges.
5. **Prepare:** Add the measurement timestamp and device identification.
6. **Transmit:** Send the prepared reading through the configured communication channel.
7. **Recover:** Handle communication failures and retry according to the firmware design.

This describes the intended firmware sequence. The firmware source, retry strategy and deployed device behaviour have not been verified.

## Reading payload

The backend reading model defines the following measurement fields:

| Field | Meaning |
|---|---|
| `measured_at` | Time the measurement was taken |
| `received_at` | Time the backend record was received |
| `voltage_v` | Voltage in volts |
| `current_a` | Current in amperes |
| `power_w` | Electrical power in watts |
| `energy_total_kwh` | Cumulative energy in kilowatt-hours |

The reading record also contains an assignment ID and business ID to associate the measurement with the relevant installation.

### Data validation

The database enforces these measurement constraints:

- Voltage must be between 0 and 300 V.
- Current must be non-negative.
- Power must be non-negative.
- Cumulative energy must be non-negative.
- The same assignment cannot have duplicate readings with the same measurement timestamp.
- A reading's business must match the business associated with its meter assignment.

The inspected source does not specify a transmission interval or a complete incoming reading payload schema.

## Transmission

The proposed hardware design identifies the SIM800C as the GSM/GPRS communication component.

However, the inspected backend does not currently expose a confirmed reading-ingestion route or a service that receives and saves readings from the physical device.

Therefore, GSM/GPRS transmission to the GridFit backend should be treated as a planned integration rather than a verified working capability.

## Device authentication

When a meter assignment is created, the backend:

1. Generates a device token.
2. Hashes the token before storing it in the assignment record.
3. Returns the raw token in the assignment creation response.
4. Stores the token hash rather than the raw token.

The raw token should be captured securely when the assignment is created because the response is the point at which it is provided.

### Implementation limitations

The inspected backend does not yet demonstrate:

- An endpoint that accepts incoming readings from a metering device.
- Verification of a submitted device token when receiving readings.
- A complete device-token rotation or revocation workflow.
- Confirmed HTTPS enforcement for device communication.

Before physical deployment, the ingestion workflow must validate the device token, protect it during transmission using HTTPS, and reject readings from unauthorised or inactive assignments.

## Limitations

The current implementation has important boundaries:

- The listed hardware components are proposed; assembled-device validation has not been confirmed.
- No verified wiring diagram, enclosure validation or measurement accuracy specification has been provided.
- The backend has a reading data model, but no confirmed reading-ingestion API or service.
- A complete physical-device-to-backend telemetry workflow has not been demonstrated.
- GSM/GPRS transmission is a proposed communication approach, not a verified integration.
- The reading model's database constraints do not establish the accuracy of the physical measurements.

These limitations should be resolved and tested before the device is treated as a production-ready metering solution.

## Installation

The backend supports a meter-assignment workflow that links a registered device to a business.

### Backend assignment workflow

1. Register the sensor device under an organisation.
2. Select the business that will receive the meter.
3. Submit a meter assignment using the device ID and business ID.
4. The backend checks that both records belong to the current user's organisation.
5. The backend checks that the device is active.
6. The backend prevents a device or business from having another open assignment.
7. The backend creates the assignment and returns a device token.

The field application includes an install-meter screen in its documented workflow. Its complete integration with the backend assignment endpoint has not been confirmed.

### Removing an assignment

The backend provides a removal operation for an existing assignment. The removal request requires confirmation that buffered readings have been uploaded.

Physical installation and electrical connections must be carried out or reviewed by a qualified person. Follow the approved hardware and electrical safety procedures.

## Troubleshooting

| Problem | Backend behaviour or recommended check |
|---|---|
| Device serial already exists | Registration returns a conflict response (409). Check the serial number. |
| Device or business cannot be found | Assignment creation returns not found (404). Verify the IDs and organisation. |
| Device is inactive | Assignment creation is rejected (409). Check the device status. |
| Device already has an open assignment | Assignment creation is rejected (409). Review existing assignments. |
| Business already has an open assignment | Assignment creation is rejected (409). Review the business's current meter assignment. |
| Reading has an invalid measurement | Database constraints reject values outside the permitted ranges. |
| Duplicate reading timestamp | The database rejects duplicate timestamps for the same assignment. |

Because a complete reading-ingestion workflow has not been confirmed, communication failures, transmission retries and device-side diagnostics cannot yet be documented as implemented features.

