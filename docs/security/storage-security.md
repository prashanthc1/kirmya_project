# Kirmya Object Storage Security & Pre-Signed URL Architecture Manual

## 1. Storage Isolation & Pre-Signed Access
- **Private-by-Default Buckets**: Object storage buckets block all public anonymous read and write operations.
- **Expiring Pre-Signed URLs**: Document access links expire within 5 minutes and require authenticated caller authorization prior to generation.
- **KMS Envelope Encryption**: All stored objects are encrypted server-side with AES-256 KMS customer-managed keys.
