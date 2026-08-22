# Kirmya Environment Strategy & Isolation Architecture

## 1. Environment Tiers

| Environment | Purpose | Database | Redis / Search | Deployment Trigger | Secrets Source |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Local** | Developer work & quick testing | Local Docker / Mock | Docker Compose | Developer Workstation | `.env` |
| **Test (CI)** | Automated PR quality validation | Isolated Test DB / Ephemeral | In-memory mocks | PR creation / push | GitHub Actions Secrets |
| **Staging** | Pre-release verification | `kirmya_staging` DB | Staging Redis instance | Commit to `main` | Cloud Secret Manager (Staging) |
| **Production** | Live production platform | `kirmya_prod` Cluster | Production Redis (AOF + password) | Manual Release Approval | Cloud Secret Manager (Prod) |

---

## 2. Environment Isolation Rules

1. **Zero Cross-Environment Access**: Test and staging environments are physically and logically blocked from connecting to production database endpoints or production Redis nodes.
2. **Dedicated Test Accounts**: Production smoke testing uses dedicated synthetic test accounts (`smoke_test_prod@kirmya.test`). Test accounts cannot perform destructive bulk operations.
3. **Secret Hygiene**: Production encryption keys, JWT signing keys, and database passwords exist exclusively in production secret vaults and are never exposed in logs or build artifacts.
