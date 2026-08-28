# Kirmya Messaging Security & Attachment Defense Guide

## 1. Secure Attachments & Anti-Phishing Controls
- **Attachment Size & MIME Integrity**: Strict 10MB limit; validated against binary magic numbers to prevent malicious executable execution.
- **Pre-Signed S3/MinIO URLs**: Download URLs expire after 15 minutes and require valid session credentials.
- **Link Sanitization**: Hyperlinks in message payloads are scanned for known phishing and credential-theft domains.
