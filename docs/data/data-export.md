# Kirmya Machine-Readable Data Export (DSAR) Architecture

## 1. Asynchronous Export Generation
- **Supported Formats**: Structured JSON archive (`kirmya_export_<user_id>_<timestamp>.json`).
- **Export Scope**: Profile history, saved jobs, application timelines, connection rosters, and direct message transcripts.
- **Delivery Security**: Encrypted ZIP archive delivered via 24-hour temporary pre-signed URL with email download notification.
