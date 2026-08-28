# Kirmya Database Hardening & Least-Privilege Role Architecture Manual

## 1. Database Access Controls & Encryption
- **Encrypted Database Transport**: Mandatory `sslmode=verify-full` ensures all database client connections are encrypted in transit.
- **Principle of Least Privilege**: Application database roles are barred from executing schema-altering DDL statements in production.
- **Continuous Connection Pooling**: `pgxpool` with strict idle connection timeouts prevents connection exhaustion attacks.
