# Kirmya Structured Logging & PII Redaction Engine

## 1. Canonical Log Format (JSON)
```json
{
  "timestamp": "2026-08-27T19:06:00Z",
  "level": "INFO",
  "service": "kirmya-backend",
  "environment": "production",
  "request_id": "req-9842a1",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "event": "job.application.submitted",
  "job_id": "847291",
  "duration_ms": 28.4
}
```

---

## 2. Redacted Fields Policy
The logging middleware automatically scrubs keys matching `password`, `token`, `secret`, `ssn`, `cookie`, `authorization`, and `resume_body`.
