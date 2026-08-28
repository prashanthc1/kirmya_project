# Kirmya Administrative Audit Logging & Forensics Manual

## 1. Immutable Audit Trail Architecture
- **Append-Only Logging**: Admin mutations, permissions adjustments, content removals, and data export events are written to append-only PostgreSQL tables.
- **Forensic Querying**: Search audit trails by Actor ID, Action Type, Target Resource ID, IP Address, and timestamp window.
- **Tamper Resistance**: Audit logs are shielded from modification or casual administrative deletion.
