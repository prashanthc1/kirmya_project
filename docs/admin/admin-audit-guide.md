# Kirmya Administrative Audit Log Inspection & Forensics Guide

## 1. Audit Trail Querying & Tamper Resistance
- **Append-Only Immutability**: Administrative action records are written to append-only tables that block UPDATE and DELETE queries.
- **Structured Metadata**: Logs capture Actor ID, Action Name, Target Resource, Prior State, New State, Justification Reason, and Timestamp.
- **Forensic Filtering**: Multi-field search enables instant discovery of all mutations performed by a specific administrator.
