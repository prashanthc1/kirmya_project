# Kirmya Account Deletion & Right-to-be-Forgotten Pipeline Manual

## 1. Account Erasure & Cascading Anonymization
- **Deletion Verification**: Requires explicit password re-authentication and multi-step confirmation.
- **Cascading Scrubbing**: Redacts personal profile entries, stored resumes, and direct messages across all persistent clusters.
- **Search De-Indexing**: Automatically triggers deletion events in OpenSearch and PostgreSQL trigram full-text indices.
