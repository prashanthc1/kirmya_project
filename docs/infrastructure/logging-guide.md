# Kirmya Structured JSON Logging & Log Redaction Manual

## 1. Structured Logging Standards
- **Structured JSON Format**: Logs emitted with uniform fields: `timestamp`, `level`, `service`, `environment`, `trace_id`, `request_id`, and `message`.
- **Automatic PII Redaction**: Regex-based middleware masks authorization tokens, email addresses, and passwords in log streams.
- **Log Retention**: Application logs stored for 30 days in centralized search clusters before automated lifecycle archival.
