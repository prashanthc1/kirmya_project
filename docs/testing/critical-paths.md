# Kirmya Critical Path Testing Matrix

| Critical User Flow | Modules Covered | Automated Test Types | Primary Verification |
| :--- | :--- | :--- | :--- |
| **Authentication & MFA** | Auth, Security, Verification | Unit, API, Component, E2E | `security_service_test.go`, `security.test.tsx` |
| **Job Discovery & Application** | Jobs, Applications, Candidate Search | Unit, Integration, API, Form | `applications_service_test.go`, Vitest |
| **Networking & Messaging** | Networking, Messaging, Communities | Unit, Integration, PubSub | `messaging_service_test.go`, `community.test.tsx` |
| **Trust & Safety / Moderation** | Trust & Safety, Admin, Security | Unit, Integration, API, Form | `trust_safety_service_test.go`, `trust-safety.test.tsx` |
| **Data Rights & Legal Holds** | Compliance, Privacy, Audit | Unit, Integration, Data Export | `compliance_service_test.go`, `privacy.test.tsx` |
| **Disaster Recovery & Vault** | Backup, System Health, Admin | Unit, Integration, Snapshot | `backup_service_test.go`, `backups.test.tsx` |
| **System Observability** | System Health, Telemetry, Admin | Unit, Metric, Trace | `health_service_test.go`, `observability.test.tsx` |
