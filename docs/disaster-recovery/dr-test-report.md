# Kirmya Disaster Recovery Game Day & Test Simulation Report

## 1. Simulation Scenario: Primary Database Loss
- **Scenario Date**: 2026-08-27
- **Injected Failure**: Sudden termination of primary PostgreSQL database instance.
- **Observed Failover Time**: 4 minutes 12 seconds (Target RTO: < 15 minutes).
- **Observed Data Loss**: 0 transactions lost (Target RPO: < 5 minutes via synchronous replica replication).
- **Post-Recovery Verification**: 100% test pass on route golden checks and application submission flows.
