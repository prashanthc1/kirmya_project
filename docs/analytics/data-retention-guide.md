# Kirmya Analytics Data Retention & Purging Lifecycle Guide

## 1. Analytics Data Retention Policies
- **Raw Event Retention**: Raw event logs are preserved for 90 days before automated purging.
- **Daily Aggregates**: Pre-aggregated metrics and cohort summaries are retained permanently for longitudinal reporting.
- **Automated Cleanup Worker**: Background job triggers weekly cleanup of expired raw event rows.
