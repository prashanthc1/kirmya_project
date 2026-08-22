# Kirmya Password Policy & Storage Security

## 1. Password Policy Specifications
- **Minimum Length**: 12 characters (supports long passphrases up to 128 characters).
- **Composition Standard**: Must contain a mix of uppercase letters, lowercase letters, numbers, and special symbols.
- **Breach Checking**: Evaluated against known compromised password dictionaries.
- **Zero Arbitrary Rules**: Does not force arbitrary monthly password expiration cycles that encourage weak variations.

---

## 2. Password Hashing & Transparent Rehashing
- **Primary Hash Algorithm**: Bcrypt with work factor cost `12`.
- **Transparent Rehashing**: When a user logs in, the backend checks if the stored password hash cost is below cost `12`. If so, it transparently re-hashes the validated password and updates PostgreSQL.
