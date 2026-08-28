# Kirmya Resume Management, Versioning & Storage Manual

## 1. Multi-Version Resume Management
- **Targeted Resumes**: Candidates can maintain distinct resume variants tailored for specific job domains.
- **Pre-Signed S3 Access**: Resume downloads require authenticated access and use short-lived URLs (15-minute TTL).
- **MIME & Malware Scanning**: Uploaded PDF/DOCX files undergo binary header validation and security scanning.
