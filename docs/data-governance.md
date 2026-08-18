# Kirmya Data Governance Framework

## Overview
The Kirmya Data Governance module establishes data cataloging, classification, automated data retention policies, dry-run purge evaluation, vendor risk management (third-party processors), cross-border data transfer controls, and automated data quality checks.

## Data Catalog & Classification Levels

All stored data assets are registered in `data_inventory_items` with assigned sensitivity classifications:

| Level | Classification | Description | Examples | Handling Rules |
|---|---|---|---|---|
| **L1** | Public | Freely accessible public platform data | Job posts, public company profiles | No encryption required at rest |
| **L2** | Internal | Operational metadata & aggregated stats | Daily search rollups, system metrics | Internal access only |
| **L3** | Confidential | Non-public business and candidate data | Resume drafts, job applications, messages | Encrypted in transit & at rest |
| **L4** | Restricted / PII | Personally Identifiable Information & Secrets | Password hashes, MFA secrets, email addresses, phone numbers | Strict RBAC, field-level encryption, audit-logged access |

## Retention Policies & Purging Mechanics

### Retention Rules
- Custom retention periods (in days) are assigned per data domain (e.g., job applications: 730 days, search history: 90 days, security audit logs: 365 days).
- Policies support `auto_purge_enabled` flags for scheduled maintenance tasks.

### Dry-Run Mechanics (`RunRetentionPayload` & `DryRunResult`)
- Administrators can trigger a retention evaluation in **Dry-Run Mode** (`dry_run: true`).
- During dry-run execution:
  1. The system scans records older than the target retention period.
  2. The system checks active legal holds (`IsUserUnderLegalHold`) and counts shielded records (`LegalHoldShieldedCount`).
  3. The system calculates `PurgeableCount` and sample record IDs without mutating or deleting database records.
- In live execution mode (`dry_run: false`), eligible records not shielded by legal hold are permanently purged or anonymized.

## Third-Party Processors & Cross-Border Transfers
- Vendor register (`third_party_processors`) tracks data processing agreements (DPAs), sub-processor dependencies, security certifications (SOC 2, ISO 27001), risk ratings, and audit schedules.
- `cross_border_transfer_controls` records cross-border transfer mechanisms (Standard Contractual Clauses - SCCs, EU-US Data Privacy Framework) and Data Transfer Impact Assessments (DTIAs).

## Automated Data Quality Checks
- Periodic checks (`data_quality_checks`) monitor target tables for:
  - **Completeness**: Checking for missing mandatory PII attributes.
  - **Accuracy & Format**: Validating schema adherence and regex constraint compliance.
  - **Freshness**: Detecting stale queue workers, orphaned records, or stagnant audit tables.
