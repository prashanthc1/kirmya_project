# Kirmya Analytics Event Schema & Validation Specifications

## 1. Event Payload Schema Structure
- **Core Envelope**:
  - `event_id`: UUIDv4 string.
  - `event_name`: String matching registered domain event keys.
  - `actor_id`: UUIDv4 string of authenticated initiator.
  - `entity_type`: Resource type name (e.g. `job`, `application`, `community`).
  - `entity_id`: UUIDv4 string of target entity.
  - `timestamp`: UTC ISO8601 string.
  - `metadata`: JSON payload (maximum size 64KB, sanitized of secrets/PII).
