# Kirmya Completion Certificates & Credential Verification Manual

## 1. Verifiable Certificate Architecture
- **Cryptographic Hash Verification**: Issued certificates feature a unique SHA-256 identifier verifiable via public endpoints (`/certificates/verify/:id`).
- **Tamper-Proof Integrity**: Certificate records are immutably signed and timestamped in PostgreSQL upon full learning path completion.
- **Profile Integration**: Users can toggle public display of verified certificates on their professional career identity page.
