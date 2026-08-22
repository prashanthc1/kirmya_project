# Kirmya Data Governance & Architecture Documentation

Welcome to the Data Architecture, Data Governance, PII Protection, Data Lifecycle, and Privacy Operations documentation for Kirmya.

## Documentation Index

- [`data-audit.md`](data-audit.md): Database schema overview, constraints, and audit analysis.
- [`data-domains.md`](data-domains.md): Domain definitions, owners, primary tables, and APIs.
- [`data-classification.md`](data-classification.md): Sensitivity tiers (Public, Private, Sensitive, Highly Sensitive).
- [`data-lineage.md`](data-lineage.md): End-to-end data lifecycle flow mapping.
- [`retention-policy.md`](retention-policy.md): Domain retention schedules and legal hold overrides.
- [`deletion-policy.md`](deletion-policy.md): Account deletion workflow, grace period, and anonymization.
- [`export-policy.md`](export-policy.md): User DSAR data export contents and security controls.
- [`data-quality.md`](data-quality.md): Automated data quality checks and search synchronization rules.
- [`data-access.md`](data-access.md): RBAC data access controls, least privilege, and masking.
- [`developer-guidelines.md`](developer-guidelines.md): Developer data governance rules and logging hygiene.

## Admin Governance Dashboards

- `/admin/data-governance`: Data domain catalog, retention status, DSR queue, and anonymization jobs.
- `/admin/compliance`: Privacy risk matrix, legal holds desk, access reviews, and compliance overview.
